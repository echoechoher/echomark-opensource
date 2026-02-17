# EchoMark 项目状态文档

> 当前版本: **mvp-done-0217**

## 一、项目概述

EchoMark 是一款播客笔记工具，让用户在收听播客时通过语音或点击快速标记精彩内容，自动截取上下文文稿，便于后续回顾。

## 二、目录结构

```
echomark-opensource/
├── frontend/                 # 前端项目 (React + Vite)
│   ├── src/
│   │   ├── components/       # React 组件
│   │   ├── services/         # API 服务
│   │   └── contexts/         # React Context
│   ├── vercel.json           # Vercel 部署配置
│   └── package.json
│
└── server/                   # 后端项目 (FastAPI + Python)
    ├── main.py               # 应用入口 + CORS 配置
    ├── database.py           # 数据库连接
    ├── models.py             # 数据模型
    ├── schemas.py            # Pydantic schemas
    ├── routers/              # API 路由
    └── services/             # 业务服务
```

## 三、技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端** | React 18 + TypeScript + Vite | SPA 应用 |
| **UI** | Tailwind CSS + Lucide Icons | 部分使用 inline styles |
| **后端** | FastAPI (Python 3.12+) | 异步 API |
| **数据库** | Supabase (PostgreSQL) | 使用 asyncpg + SQLAlchemy |
| **转录** | 阿里云通义听悟 | 音频转文字服务 |
| **前端部署** | Vercel | 自动部署 |
| **后端部署** | Railway | 自动部署 |

## 四、环境变量配置

详见各目录下的 `.env.example` 文件。

## 五、已完成功能

### 核心功能
- ✅ 播客导入 (支持小宇宙链接)
- ✅ 音频自动转录 (通义听悟)
- ✅ 转录状态轮询 (前端每 3 秒自动检查)
- ✅ 播放器 (播放/暂停/进度条/快进快退 15 秒)
- ✅ 文稿同步高亮 + 点击跳转播放
- ✅ MARK 标记功能 (记录时间戳 + 前后 2 句上下文)
- ✅ 标记列表 + 详情页
- ✅ 编辑标记想法
- ✅ 删除内容/标记
- ✅ 取消转录功能
- ✅ Toast 错误提示
- ✅ 用户账号体系（注册/登录）

### iOS Siri 集成
- ✅ iOS Shortcut 快捷指令支持
- ✅ 基础版：「嘿 Siri，标记」快速标记
- ✅ 进阶版：「嘿 Siri，标记想法」标记 + 语音输入想法
- ✅ 自动暂停播放（Siri 标记时）
- ✅ 自动续播（标记完成后回退 30 秒）
- ✅ 播放状态持久化（数据库存储，支持跨请求）

## 六、重要技术决策

### 1. Supabase Pooler 连接
使用 Transaction Pooler (端口 6543) 而非直连 (端口 5432)，需要在 SQLAlchemy 中禁用 prepared statements:
```python
connect_args={
    "statement_cache_size": 0,
    "prepared_statement_cache_size": 0,
}
```

### 2. 通义听悟主动轮询
不使用回调，采用前端轮询 → 后端查询通义听悟 API 的方式获取转录状态。

### 3. 标记上下文
标记时截取当前句子 + 前后各 2 句作为上下文。

### 4. Vercel SPA 路由
配置 `vercel.json` 使用 rewrites 将所有路由重定向到 `index.html`。

## 七、API 端点

### 标记相关
| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/api/marks` | 创建标记 |
| GET | `/api/marks` | 获取标记列表 |
| GET | `/api/marks/{id}` | 获取标记详情 |
| PUT | `/api/marks/{id}` | 更新标记 |
| DELETE | `/api/marks/{id}` | 删除标记 |
| POST | `/api/marks/pause` | 暂停播放 (Siri 用) |
| POST | `/api/marks/playback-state` | 更新播放状态 |
| GET | `/api/marks/playback-state` | 获取播放状态 |

### 内容相关
| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/api/contents` | 导入内容 |
| GET | `/api/contents` | 获取内容列表 |
| GET | `/api/contents/{id}` | 获取内容详情 |
| DELETE | `/api/contents/{id}` | 删除内容 |
| GET | `/api/contents/{id}/transcript/status` | 获取转录状态 |
| POST | `/api/contents/{id}/cancel-transcription` | 取消转录 |

## 八、待办事项

- [ ] 倍速播放功能
- [ ] 支持更多播客平台链接 (Apple Podcasts 等)

## 九、本地开发

```bash
# 前端
cd frontend
npm install
cp .env.example .env  # 配置环境变量
npm run dev   # http://localhost:3000

# 后端
cd server
pip install -r requirements.txt
cp .env.example .env  # 配置环境变量
uvicorn main:app --reload  # http://localhost:8000
```
