"""
数据库连接配置
支持 Supabase (PostgreSQL) 和 SQLite
"""
import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import text
from dotenv import load_dotenv

from models import Base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./echomark.db")

# 根据数据库类型配置引擎
if DATABASE_URL.startswith("postgresql"):
    # Supabase/PostgreSQL 配置
    # 使用 statement_cache_size=0 禁用 prepared statements，兼容 pgbouncer
    engine = create_async_engine(
        DATABASE_URL,
        echo=False,  # 关闭 SQL 日志以提升性能
        pool_size=5,
        max_overflow=10,
        connect_args={
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0,
        }
    )
else:
    # SQLite 配置（本地开发）
    engine = create_async_engine(DATABASE_URL, echo=False)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db():
    """初始化数据库表"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 迁移：添加新列（如果不存在）
    async with engine.begin() as conn:
        try:
            await conn.execute(text(
                "ALTER TABLE playback_states ADD COLUMN IF NOT EXISTS should_pause INTEGER DEFAULT 0"
            ))
            await conn.execute(text(
                "ALTER TABLE playback_states ADD COLUMN IF NOT EXISTS should_resume INTEGER DEFAULT 0"
            ))
            await conn.execute(text(
                "ALTER TABLE playback_states ADD COLUMN IF NOT EXISTS resume_from INTEGER DEFAULT 0"
            ))
            # 新增：user_id 字段迁移
            await conn.execute(text(
                "ALTER TABLE contents ADD COLUMN IF NOT EXISTS user_id VARCHAR(64)"
            ))
            await conn.execute(text(
                "ALTER TABLE marks ADD COLUMN IF NOT EXISTS user_id VARCHAR(64)"
            ))
        except Exception:
            pass  # 列已存在或其他错误，忽略


async def get_db():
    """获取数据库会话（用于依赖注入）"""
    async with async_session() as session:
        yield session
