"""
EchoMark API Server
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers import contents_router, marks_router, auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时初始化数据库
    await init_db()
    yield
    # 关闭时清理资源（如果需要）


app = FastAPI(
    title="EchoMark API",
    description="播客标记笔记工具 API",
    version="0.1.0",
    lifespan=lifespan
)

# CORS 配置 - 允许指定的前端域名访问
# 部署时请修改为你的实际域名
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # 本地开发
        # "https://your-app.vercel.app",  # Vercel 部署域名
        # "https://your-custom-domain.com",  # 自定义域名
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth_router)
app.include_router(contents_router)
app.include_router(marks_router)


@app.get("/")
async def root():
    return {"message": "EchoMark API", "version": "0.1.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
