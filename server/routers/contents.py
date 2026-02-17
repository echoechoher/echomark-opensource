"""
内容管理 API
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from database import get_db
from models import Content, ContentType, TranscriptStatus, Mark
from schemas import ContentCreate, ContentResponse, ContentDetailResponse, ContentListResponse
from services import xiaoyuzhou_parser, get_tingwu_service
from auth import get_current_user, AuthUser

router = APIRouter(prefix="/api/contents", tags=["contents"])


async def process_transcription(content_id: int, audio_url: str):
    """后台任务：处理转录"""
    from database import async_session

    try:
        tingwu = get_tingwu_service()
        task_id = tingwu.create_task(audio_url)

        # 更新任务 ID
        async with async_session() as db:
            content = await db.get(Content, content_id)
            if content:
                content.transcript_task_id = task_id
                content.transcript_status = TranscriptStatus.PROCESSING
                await db.commit()

    except Exception as e:
        async with async_session() as db:
            content = await db.get(Content, content_id)
            if content:
                content.transcript_status = TranscriptStatus.FAILED
                await db.commit()
        raise


@router.post("", response_model=ContentResponse)
async def create_content(
    data: ContentCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """
    导入内容（粘贴链接）
    """
    url = data.url.strip()

    # 判断链接类型并解析
    if xiaoyuzhou_parser.is_xiaoyuzhou_url(url):
        try:
            info = await xiaoyuzhou_parser.parse(url)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"解析链接失败: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="暂不支持该链接类型，目前仅支持小宇宙链接")

    # 创建内容记录
    content = Content(
        type=ContentType.PODCAST_EPISODE,
        user_id=current_user.user_id,
        title=info['title'],
        source_name=info['podcast_name'],
        source_url=url,
        cover_url=info['cover_url'],
        description=info['description'],
        duration=info['duration'],
        media_url=info['audio_url'],
        transcript_status=TranscriptStatus.PENDING
    )

    db.add(content)
    await db.commit()
    await db.refresh(content)

    # 后台启动转录任务
    background_tasks.add_task(process_transcription, content.id, info['audio_url'])

    return ContentResponse(
        id=content.id,
        type=content.type,
        title=content.title,
        source_name=content.source_name,
        source_url=content.source_url,
        cover_url=content.cover_url,
        description=content.description,
        duration=content.duration,
        media_url=content.media_url,
        transcript_status=content.transcript_status,
        marks_count=0,
        created_at=content.created_at
    )


@router.get("", response_model=ContentListResponse)
async def list_contents(
    db: AsyncSession = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """
    获取当前用户的内容列表
    """
    # 查询当前用户的内容及标记数量
    stmt = (
        select(Content, func.count(Mark.id).label('marks_count'))
        .outerjoin(Mark, (Mark.content_id == Content.id) & (Mark.user_id == current_user.user_id))
        .where(Content.user_id == current_user.user_id)
        .group_by(Content.id)
        .order_by(Content.created_at.desc())
    )
    result = await db.execute(stmt)
    rows = result.all()

    items = [
        ContentResponse(
            id=content.id,
            type=content.type,
            title=content.title,
            source_name=content.source_name,
            source_url=content.source_url,
            cover_url=content.cover_url,
            description=content.description,
            duration=content.duration,
            media_url=content.media_url,
            transcript_status=content.transcript_status,
            marks_count=marks_count,
            created_at=content.created_at
        )
        for content, marks_count in rows
    ]

    return ContentListResponse(items=items, total=len(items))


@router.get("/{content_id}", response_model=ContentDetailResponse)
async def get_content(
    content_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """
    获取内容详情（包含转录文稿）
    """
    content = await db.get(Content, content_id)
    if not content:
        raise HTTPException(status_code=404, detail="内容不存在")

    # 检查权限
    if content.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="无权访问此内容")

    # 获取当前用户的标记数量
    stmt = select(func.count(Mark.id)).where(
        (Mark.content_id == content_id) & (Mark.user_id == current_user.user_id)
    )
    result = await db.execute(stmt)
    marks_count = result.scalar() or 0

    return ContentDetailResponse(
        id=content.id,
        type=content.type,
        title=content.title,
        source_name=content.source_name,
        source_url=content.source_url,
        cover_url=content.cover_url,
        description=content.description,
        duration=content.duration,
        media_url=content.media_url,
        transcript_status=content.transcript_status,
        transcript=content.transcript,
        marks_count=marks_count,
        created_at=content.created_at
    )


@router.get("/{content_id}/transcript/status")
async def get_transcript_status(
    content_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """
    查询转录状态（轮询用）
    """
    content = await db.get(Content, content_id)
    if not content:
        raise HTTPException(status_code=404, detail="内容不存在")

    # 检查权限
    if content.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="无权访问此内容")

    # 如果正在处理且有任务ID，检查通义听悟任务状态
    print(f"[DEBUG] transcript_status: {content.transcript_status}, task_id: {content.transcript_task_id}")
    if content.transcript_status == TranscriptStatus.PROCESSING and content.transcript_task_id:
        try:
            tingwu = get_tingwu_service()
            status = tingwu.get_task_status(content.transcript_task_id)

            if status['status'] == 'COMPLETED' and status['result_url']:
                # 获取并解析转录结果
                sentences = await tingwu.fetch_and_parse_result(status['result_url'])
                content.transcript = sentences
                content.transcript_status = TranscriptStatus.COMPLETED
                await db.commit()

            elif status['status'] == 'FAILED':
                content.transcript_status = TranscriptStatus.FAILED
                await db.commit()

        except Exception as e:
            print(f"检查转录状态出错: {e}")  # 记录错误但不中断
            pass  # 静默处理错误，下次轮询再试

    return {
        "status": content.transcript_status.value if hasattr(content.transcript_status, 'value') else content.transcript_status,
        "task_id": content.transcript_task_id
    }


@router.delete("/{content_id}")
async def delete_content(
    content_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """
    删除内容（同时删除关联的标记和播放状态）
    """
    content = await db.get(Content, content_id)
    if not content:
        raise HTTPException(status_code=404, detail="内容不存在")

    # 检查权限
    if content.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="无权删除此内容")

    # 删除关联的标记（只删除当前用户的标记）
    from sqlalchemy import delete
    from models import PlaybackState
    await db.execute(delete(Mark).where(
        (Mark.content_id == content_id) & (Mark.user_id == current_user.user_id)
    ))

    # 删除关联的播放状态
    await db.execute(delete(PlaybackState).where(
        PlaybackState.content_id == content_id
    ))

    # 删除内容
    await db.delete(content)
    await db.commit()

    return {"status": "ok"}


@router.post("/{content_id}/cancel-transcription")
async def cancel_transcription(
    content_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """
    取消/终止转录
    """
    content = await db.get(Content, content_id)
    if not content:
        raise HTTPException(status_code=404, detail="内容不存在")

    # 检查权限
    if content.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="无权操作此内容")

    # 将状态设为已取消
    content.transcript_status = TranscriptStatus.CANCELLED
    content.transcript_task_id = None
    await db.commit()

    return {"status": "ok"}
