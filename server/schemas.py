"""
Pydantic Schemas for API request/response
"""
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, HttpUrl
from models import TranscriptStatus, ContentType, MarkSource


# ============ Content Schemas ============

class ContentCreate(BaseModel):
    """导入内容请求"""
    url: str  # 播客链接


class TranscriptSentence(BaseModel):
    """转录句子"""
    start: int  # 开始时间（毫秒）
    end: int    # 结束时间（毫秒）
    text: str


class ContentResponse(BaseModel):
    """内容响应"""
    id: int
    type: ContentType
    title: str
    source_name: Optional[str] = None
    source_url: Optional[str] = None
    cover_url: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[int] = None
    media_url: Optional[str] = None
    transcript_status: TranscriptStatus
    marks_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class ContentDetailResponse(ContentResponse):
    """内容详情响应（包含转录文稿）"""
    transcript: Optional[List[TranscriptSentence]] = None


class ContentListResponse(BaseModel):
    """内容列表响应"""
    items: List[ContentResponse]
    total: int


# ============ Mark Schemas ============

class MarkCreate(BaseModel):
    """创建标记请求"""
    source: MarkSource = MarkSource.APP
    content_id: Optional[int] = None  # App 直接传递
    timestamp: Optional[int] = None   # 秒
    thought: Optional[str] = None     # Siri 语音输入的想法


class MarkUpdate(BaseModel):
    """更新标记请求"""
    thought: Optional[str] = None


class MarkResponse(BaseModel):
    """标记响应"""
    id: int
    content_id: int
    timestamp: Optional[int] = None
    context_before: Optional[str] = None
    context_current: Optional[str] = None
    context_after: Optional[str] = None
    thought: Optional[str] = None
    source: MarkSource
    created_at: datetime

    # 关联内容的信息（用于标记库展示）
    content_title: Optional[str] = None
    content_source_name: Optional[str] = None

    class Config:
        from_attributes = True


class MarkDetailResponse(MarkResponse):
    """标记详情响应"""
    pass


class MarkListResponse(BaseModel):
    """标记列表响应"""
    items: List[MarkResponse]
    total: int


# ============ Playback State ============

class PlaybackState(BaseModel):
    """当前播放状态（用于 Siri 标记）"""
    content_id: int
    current_time: int  # 当前播放位置（秒）


# ============ WebSocket Messages ============

class WSMessage(BaseModel):
    """WebSocket 消息"""
    type: str  # "mark_created", "playback_update", etc.
    data: Any
