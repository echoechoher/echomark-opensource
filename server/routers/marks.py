"""
标记管理 API
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel

from database import get_db
from models import Content, Mark, MarkSource, TranscriptStatus, PlaybackState
from schemas import MarkCreate, MarkUpdate, MarkResponse, MarkListResponse
from services import get_context_by_timestamp
from auth import get_current_user, AuthUser

router = APIRouter(prefix="/api/marks", tags=["marks"])


class PlaybackStateUpdate(BaseModel):
    content_id: int
    current_time: int  # 秒


class PlaybackStateResponse(BaseModel):
    content_id: Optional[int] = None
    current_time: int = 0
    content_title: Optional[str] = None
    should_pause: bool = False
    should_resume: bool = False
    resume_from: int = 0


@router.post("/playback-state")
async def update_playback_state(
    data: PlaybackStateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """更新播放状态（前端定期调用）"""
    # 查找或创建播放状态记录
    stmt = select(PlaybackState).where(PlaybackState.user_id == current_user.user_id)
    result = await db.execute(stmt)
    state = result.scalar_one_or_none()

    if state:
        state.content_id = data.content_id
        state.current_time = data.current_time
        # 前端同步时清除标志
        state.should_pause = 0
        state.should_resume = 0
    else:
        state = PlaybackState(
            user_id=current_user.user_id,
            content_id=data.content_id,
            current_time=data.current_time
        )
        db.add(state)

    await db.commit()
    return {"status": "ok"}


@router.get("/playback-state", response_model=PlaybackStateResponse)
async def get_playback_state_api(
    db: AsyncSession = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """获取当前播放状态（供前端检查是否需要暂停/续播）"""
    stmt = select(PlaybackState).where(PlaybackState.user_id == current_user.user_id)
    result = await db.execute(stmt)
    state = result.scalar_one_or_none()

    if not state or not state.content_id:
        return PlaybackStateResponse()

    # 获取内容标题
    content = await db.get(Content, state.content_id)

    # 检查标志
    should_pause = bool(state.should_pause)
    should_resume = bool(state.should_resume)
    resume_from = state.resume_from or 0

    # 读取后清除标志
    if should_pause or should_resume:
        state.should_pause = 0
        state.should_resume = 0
        await db.commit()

    return PlaybackStateResponse(
        content_id=state.content_id,
        current_time=state.current_time,
        content_title=content.title if content else None,
        should_pause=should_pause,
        should_resume=should_resume,
        resume_from=resume_from
    )


@router.post("/pause")
async def pause_playback(
    db: AsyncSession = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """暂停播放（Siri Shortcut 在听写前调用）"""
    stmt = select(PlaybackState).where(PlaybackState.user_id == current_user.user_id)
    result = await db.execute(stmt)
    state = result.scalar_one_or_none()

    if state:
        state.should_pause = 1
        await db.commit()

    return {"status": "ok"}


@router.post("", response_model=MarkResponse)
async def create_mark(
    data: MarkCreate,
    db: AsyncSession = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """
    创建标记（Siri / App 调用）

    优先使用请求中的 content_id 和 timestamp，否则从数据库播放状态获取
    """
    state = None
    is_siri_mark = False

    # 优先使用请求中的参数
    if data.content_id is not None and data.timestamp is not None:
        content_id = data.content_id
        current_time = data.timestamp
    else:
        # Siri 调用：从数据库获取播放状态
        stmt = select(PlaybackState).where(PlaybackState.user_id == current_user.user_id)
        result = await db.execute(stmt)
        state = result.scalar_one_or_none()

        if not state or not state.content_id:
            raise HTTPException(status_code=400, detail="没有正在播放的内容")

        content_id = state.content_id
        current_time = state.current_time
        is_siri_mark = True

    # 获取内容信息
    content = await db.get(Content, content_id)
    if not content:
        raise HTTPException(status_code=404, detail="内容不存在")

    # 检查权限
    if content.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="无权在此内容上创建标记")

    # 获取上下文
    context = {'before': '', 'current': '', 'after': ''}
    if content.transcript and content.transcript_status == TranscriptStatus.COMPLETED:
        timestamp_ms = current_time * 1000
        context = get_context_by_timestamp(content.transcript, timestamp_ms, context_sentences=2)

    # 创建标记（支持直接传入 thought）
    mark = Mark(
        content_id=content_id,
        user_id=current_user.user_id,
        timestamp=current_time,
        context_before=context['before'],
        context_current=context['current'],
        context_after=context['after'],
        thought=data.thought,
        source=data.source
    )

    db.add(mark)

    # Siri 标记完成后设置续播标志（回退 30 秒）
    if is_siri_mark and state:
        state.should_resume = 1
        state.resume_from = max(0, current_time - 30)

    await db.commit()
    await db.refresh(mark)

    return MarkResponse(
        id=mark.id,
        content_id=mark.content_id,
        timestamp=mark.timestamp,
        context_before=mark.context_before,
        context_current=mark.context_current,
        context_after=mark.context_after,
        thought=mark.thought,
        source=mark.source,
        created_at=mark.created_at,
        content_title=content.title,
        content_source_name=content.source_name
    )


@router.put("/{mark_id}", response_model=MarkResponse)
async def update_mark(
    mark_id: int,
    data: MarkUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """
    更新标记（添加/修改想法）
    """
    mark = await db.get(Mark, mark_id)
    if not mark:
        raise HTTPException(status_code=404, detail="标记不存在")

    # 检查权限
    if mark.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="无权修改此标记")

    if data.thought is not None:
        mark.thought = data.thought

    await db.commit()
    await db.refresh(mark)

    # 获取关联内容信息
    content = await db.get(Content, mark.content_id)

    return MarkResponse(
        id=mark.id,
        content_id=mark.content_id,
        timestamp=mark.timestamp,
        context_before=mark.context_before,
        context_current=mark.context_current,
        context_after=mark.context_after,
        thought=mark.thought,
        source=mark.source,
        created_at=mark.created_at,
        content_title=content.title if content else None,
        content_source_name=content.source_name if content else None
    )


@router.get("", response_model=MarkListResponse)
async def list_marks(
    podcast: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """
    获取当前用户的标记列表（标记库）

    可按播客名筛选
    """
    stmt = (
        select(Mark, Content)
        .join(Content)
        .where(Mark.user_id == current_user.user_id)
        .order_by(Mark.created_at.desc())
    )

    if podcast:
        stmt = stmt.where(Content.source_name == podcast)

    result = await db.execute(stmt)
    rows = result.all()

    items = [
        MarkResponse(
            id=mark.id,
            content_id=mark.content_id,
            timestamp=mark.timestamp,
            context_before=mark.context_before,
            context_current=mark.context_current,
            context_after=mark.context_after,
            thought=mark.thought,
            source=mark.source,
            created_at=mark.created_at,
            content_title=content.title,
            content_source_name=content.source_name
        )
        for mark, content in rows
    ]

    return MarkListResponse(items=items, total=len(items))


@router.get("/{mark_id}", response_model=MarkResponse)
async def get_mark(
    mark_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """
    获取标记详情
    """
    mark = await db.get(Mark, mark_id)
    if not mark:
        raise HTTPException(status_code=404, detail="标记不存在")

    # 检查权限
    if mark.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="无权访问此标记")

    content = await db.get(Content, mark.content_id)

    return MarkResponse(
        id=mark.id,
        content_id=mark.content_id,
        timestamp=mark.timestamp,
        context_before=mark.context_before,
        context_current=mark.context_current,
        context_after=mark.context_after,
        thought=mark.thought,
        source=mark.source,
        created_at=mark.created_at,
        content_title=content.title if content else None,
        content_source_name=content.source_name if content else None
    )


@router.delete("/{mark_id}")
async def delete_mark(
    mark_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """
    删除标记
    """
    mark = await db.get(Mark, mark_id)
    if not mark:
        raise HTTPException(status_code=404, detail="标记不存在")

    # 检查权限
    if mark.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="无权删除此标记")

    await db.delete(mark)
    await db.commit()

    return {"message": "删除成功"}


@router.get("/content/{content_id}", response_model=MarkListResponse)
async def list_content_marks(
    content_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """
    获取某内容的标记列表
    """
    content = await db.get(Content, content_id)
    if not content:
        raise HTTPException(status_code=404, detail="内容不存在")

    # 检查权限
    if content.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="无权访问此内容")

    stmt = (
        select(Mark)
        .where((Mark.content_id == content_id) & (Mark.user_id == current_user.user_id))
        .order_by(Mark.timestamp)
    )
    result = await db.execute(stmt)
    marks = result.scalars().all()

    items = [
        MarkResponse(
            id=mark.id,
            content_id=mark.content_id,
            timestamp=mark.timestamp,
            context_before=mark.context_before,
            context_current=mark.context_current,
            context_after=mark.context_after,
            thought=mark.thought,
            source=mark.source,
            created_at=mark.created_at,
            content_title=content.title,
            content_source_name=content.source_name
        )
        for mark in marks
    ]

    return MarkListResponse(items=items, total=len(items))
