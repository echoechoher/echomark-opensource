"""
Supabase JWT 认证模块
使用 Supabase API 验证 JWT Token
"""
import os
import httpx
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Supabase 配置
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

# HTTP Bearer token 提取器
security = HTTPBearer(auto_error=False)


class AuthUser:
    """认证用户信息"""
    def __init__(self, user_id: str, email: Optional[str] = None, username: Optional[str] = None):
        self.user_id = user_id
        self.email = email
        self.username = username


async def verify_token_with_supabase(token: str) -> dict:
    """调用 Supabase API 验证 token 并获取用户信息"""
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase configuration missing"
        )

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {token}"
            }
        )

        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> AuthUser:
    """
    从 JWT Token 中提取当前用户
    用作 FastAPI 依赖注入
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    user_data = await verify_token_with_supabase(token)

    user_id = user_data.get("id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing user ID"
        )

    email = user_data.get("email")
    user_metadata = user_data.get("user_metadata", {})
    username = user_metadata.get("username")

    return AuthUser(user_id=user_id, email=email, username=username)


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[AuthUser]:
    """
    可选的用户认证
    如果提供了 token 则验证，否则返回 None
    """
    if credentials is None:
        return None

    try:
        token = credentials.credentials
        user_data = await verify_token_with_supabase(token)

        user_id = user_data.get("id")
        if not user_id:
            return None

        email = user_data.get("email")
        user_metadata = user_data.get("user_metadata", {})
        username = user_metadata.get("username")

        return AuthUser(user_id=user_id, email=email, username=username)
    except HTTPException:
        return None
