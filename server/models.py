"""
EchoMark 数据模型
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship, DeclarativeBase
from sqlalchemy.ext.asyncio import AsyncAttrs
import enum


class Base(AsyncAttrs, DeclarativeBase):
    pass


class TranscriptStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ContentType(str, enum.Enum):
    PODCAST_EPISODE = "podcast_episode"
    # 未来扩展
    # ARTICLE = "article"
    # TWEET = "tweet"
    # VIDEO = "video"


class Content(Base):
    """
    内容表 - 通用内容模型，支持多种内容类型
    MVP 阶段只有 podcast_episode
    """
    __tablename__ = "contents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    type = Column(SQLEnum(ContentType), default=ContentType.PODCAST_EPISODE, nullable=False)

    # 用户 ID（Supabase Auth）
    user_id = Column(String(64), nullable=True, index=True)

    # 基本信息
    title = Column(String(500), nullable=False)
    source_name = Column(String(200))  # 如播客栏目名
    source_url = Column(String(1000))  # 原始链接
    cover_url = Column(String(1000))
    description = Column(Text)

    # 音视频特有
    duration = Column(Integer)  # 时长（秒）
    media_url = Column(String(1000))  # 音频/视频文件地址

    # 转录相关
    transcript = Column(JSON)  # [{ start: 0, end: 5, text: "..." }, ...]
    transcript_status = Column(
        SQLEnum(TranscriptStatus, values_callable=lambda x: [e.value for e in x]),
        default=TranscriptStatus.PENDING
    )
    transcript_task_id = Column(String(100))  # 通义听悟任务 ID

    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关联
    marks = relationship("Mark", back_populates="content", cascade="all, delete-orphan")


class MarkSource(str, enum.Enum):
    SIRI = "siri"
    APP = "app"


class Mark(Base):
    """
    标记表 - 用户的标记记录
    """
    __tablename__ = "marks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    content_id = Column(Integer, ForeignKey("contents.id"), nullable=False)

    # 用户 ID（Supabase Auth）
    user_id = Column(String(64), nullable=True, index=True)

    # 标记位置
    timestamp = Column(Integer)  # 时间戳（秒），音视频用
    position = Column(Integer)   # 文本位置，文章用（预留）

    # 上下文（按句子存储）
    context_before = Column(Text)   # 标记点之前的文字
    context_current = Column(Text)  # 标记点所在的句子
    context_after = Column(Text)    # 标记点之后的文字

    # 用户内容
    thought = Column(Text)  # 用户的想法

    # 来源
    source = Column(SQLEnum(MarkSource), default=MarkSource.APP)

    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关联
    content = relationship("Content", back_populates="marks")


class PlaybackState(Base):
    """
    播放状态表 - 存储用户当前播放状态，供 Siri 标记使用
    现在使用 user_id（Supabase Auth）代替 user_token
    """
    __tablename__ = "playback_states"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(64), unique=True, nullable=False, index=True)
    content_id = Column(Integer, ForeignKey("contents.id"), nullable=True)
    current_time = Column(Integer, default=0)  # 当前播放位置（秒）
    should_pause = Column(Integer, default=0)  # 是否需要暂停
    should_resume = Column(Integer, default=0)  # 是否需要续播
    resume_from = Column(Integer, default=0)   # 续播位置（秒）
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UserProfile(Base):
    """
    用户配置表 - 存储用户名和邮箱映射
    用于实现用户名登录（Supabase 默认只支持邮箱登录）
    """
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(64), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
