"""
认证相关的 API 路由
"""
import os
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends
from database import get_db
from models import UserProfile

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Supabase 配置
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


class EmailByUsernameResponse(BaseModel):
    email: str


@router.get("/email-by-username/{username}", response_model=EmailByUsernameResponse)
async def get_email_by_username(
    username: str,
    db: AsyncSession = Depends(get_db)
):
    """
    根据用户名获取邮箱地址
    用于登录时将用户名转换为邮箱
    """
    # 从 user_profiles 表查询
    result = await db.execute(
        select(UserProfile).where(UserProfile.username == username)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(status_code=404, detail="用户名不存在")

    return {"email": profile.email}


class RegisterUsernameRequest(BaseModel):
    user_id: str
    username: str
    email: str


@router.post("/register-username")
async def register_username(
    request: RegisterUsernameRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    注册用户名（在 Supabase 注册成功后调用）
    将用户名和邮箱映射存储到本地数据库
    """
    # 检查用户名是否已存在
    result = await db.execute(
        select(UserProfile).where(UserProfile.username == request.username)
    )
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(status_code=400, detail="用户名已被使用")

    # 创建新的用户配置
    profile = UserProfile(
        user_id=request.user_id,
        username=request.username,
        email=request.email
    )
    db.add(profile)
    await db.commit()

    return {"message": "用户名注册成功"}


@router.get("/check-username/{username}")
async def check_username(
    username: str,
    db: AsyncSession = Depends(get_db)
):
    """
    检查用户名是否可用
    """
    result = await db.execute(
        select(UserProfile).where(UserProfile.username == username)
    )
    existing = result.scalar_one_or_none()

    return {"available": existing is None}
