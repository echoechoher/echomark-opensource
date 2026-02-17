# EchoMark 项目总结

> 第一次从 0-1 Vibe Coding 的完整产品开发记录

## 项目概述

**EchoMark** 是一个播客标记工具，帮助用户在收听播客时快速标记精彩片段，并通过 AI 转录自动关联上下文。

### 核心功能
- 播客链接导入（支持小宇宙）
- 通义听悟 AI 转录
- 播放器 + 实时标记
- Siri 语音快捷标记
- 用户认证系统
- 数据导出备份

---

## 技术栈

### 前端
| 技术 | 用途 |
|------|------|
| React 18 | UI 框架 |
| TypeScript | 类型安全 |
| Vite | 构建工具 |
| React Router v7 | 路由管理 |
| Supabase JS | 认证客户端 |
| Sonner | Toast 通知 |
| Lucide React | 图标库 |
| Vercel | 部署平台 |

### 后端
| 技术 | 用途 |
|------|------|
| Python 3.12 | 运行时 |
| FastAPI | Web 框架 |
| SQLAlchemy | ORM |
| PostgreSQL | 数据库（Supabase） |
| 通义听悟 SDK | AI 转录 |
| httpx | 异步 HTTP 客户端 |
| Railway | 部署平台 |

### 第三方服务
| 服务 | 用途 |
|------|------|
| Supabase | 数据库 + 认证 |
| 通义听悟 | 语音转文字 |
| Vercel | 前端托管 |
| Railway | 后端托管 |

---

## 开发经验与教训

### 1. SDK 版本管理 ⚠️

**问题**：通义听悟 SDK 从 1.0.0 升级到 2.0.x 后，API 发生了变化，导致 `output_level` 参数无法通过构造函数传递。

**教训**：
- 锁定依赖版本，使用 `==` 而非 `>=`
- 升级依赖前在本地测试
- 保留旧版本代码作为参考

**解决方案**：
```python
# 旧版本（1.0.0）- 构造函数传参
transcription_param = CreateTaskRequestParametersTranscription(
    diarization_enabled=False,
    output_level=2
)

# 新版本（2.0.x）- 属性赋值
transcription_param = CreateTaskRequestParametersTranscription()
transcription_param.diarization_enabled = False
transcription_param.output_level = 2
```

### 2. JWT 认证方案选择

**问题**：最初尝试本地验证 Supabase JWT Token（使用 HS256），但 Supabase 实际使用 ES256 算法。

**教训**：
- Supabase JWT 使用 ES256，不是 HS256
- JWKS 端点需要特殊配置才能访问
- 最简单的方案是调用 Supabase API 验证 Token

**最终方案**：
```python
async def verify_token_with_supabase(token: str) -> dict:
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
            raise HTTPException(status_code=401, detail="Invalid token")
```

### 3. 环境变量管理

**问题**：硬编码敏感信息导致代码公开时有安全风险；启动时检查环境变量导致部署失败。

**教训**：
- 永远不要在代码中硬编码敏感信息
- 使用 `.env.example` 提供模板
- 环境变量检查应该延迟到实际使用时，而非模块导入时

**正确做法**：
```python
# 模块级别 - 只读取，不检查
SUPABASE_URL = os.getenv("SUPABASE_URL")

# 函数级别 - 使用时检查
async def verify_token():
    if not SUPABASE_URL:
        raise HTTPException(status_code=500, detail="Config missing")
```

### 4. 数据库迁移

**问题**：代码中添加了新字段（user_id），但数据库没有同步更新。

**教训**：
- 代码更改和数据库迁移要同步进行
- 使用 Alembic 等迁移工具管理数据库版本
- 保留迁移 SQL 脚本方便回滚

**迁移脚本示例**：
```sql
ALTER TABLE contents ADD COLUMN IF NOT EXISTS user_id VARCHAR(64);
ALTER TABLE marks ADD COLUMN IF NOT EXISTS user_id VARCHAR(64);
CREATE INDEX IF NOT EXISTS idx_contents_user_id ON contents(user_id);
```

### 5. CORS 配置

**问题**：前端调用后端 API 时出现跨域错误。

**教训**：
- 开发环境需要配置 localhost
- 生产环境需要配置实际域名
- 自定义域名也需要加入白名单

**配置示例**：
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-frontend-domain.vercel.app",
        # Add your custom domain if needed
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 6. Token 有效期

**问题**：Supabase 默认 Token 有效期 1 小时，对于 Siri 快捷指令场景不够用。

**解决方案**：在 Supabase Dashboard → Authentication → Settings 中修改 JWT Expiry 为 604800（7天）。

---

## 项目结构

```
EchoMark/
├── echomark-web/                 # 前端项目
│   ├── src/
│   │   ├── components/           # React 组件
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   └── ...
│   │   ├── contexts/             # React Context
│   │   │   └── AuthContext.tsx
│   │   ├── lib/                  # 工具库
│   │   │   └── supabase.ts
│   │   ├── services/             # API 服务
│   │   │   └── api.ts
│   │   └── routes.tsx            # 路由配置
│   └── .env.example              # 环境变量模板
│
├── echomark-server/              # 后端项目
│   ├── routers/                  # API 路由
│   │   ├── auth.py
│   │   ├── contents.py
│   │   └── marks.py
│   ├── services/                 # 业务服务
│   │   └── transcription.py
│   ├── auth.py                   # 认证模块
│   ├── models.py                 # 数据模型
│   ├── database.py               # 数据库配置
│   ├── main.py                   # 应用入口
│   └── requirements.txt          # Python 依赖
│
└── EchoMark设计需求文档/          # 文档
    └── PROJECT_SUMMARY.md        # 本文件
```

---

## 部署检查清单

### Railway（后端）
- [ ] `DATABASE_URL` - Supabase PostgreSQL 连接串
- [ ] `SUPABASE_URL` - Supabase 项目 URL
- [ ] `SUPABASE_ANON_KEY` - Supabase 匿名密钥
- [ ] `TINGWU_ACCESS_KEY_ID` - 通义听悟 AK
- [ ] `TINGWU_ACCESS_KEY_SECRET` - 通义听悟 SK
- [ ] `TINGWU_APP_KEY` - 通义听悟 AppKey

### Vercel（前端）
- [ ] `VITE_SUPABASE_URL` - Supabase 项目 URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Supabase 匿名密钥
- [ ] `VITE_API_BASE` - 后端 API 地址

### Supabase
- [ ] Authentication 启用 Email 登录
- [ ] JWT Expiry 设置为合适的值（如 604800）
- [ ] 数据库表结构已创建/迁移

---

## 后续维护注意事项

### 1. 定期检查
- 依赖安全更新（npm audit / pip-audit）
- SSL 证书续期
- API 密钥轮换

### 2. 监控
- Railway / Vercel 部署日志
- Supabase 数据库使用量
- 通义听悟 API 调用量和费用

### 3. 备份
- 定期导出 Supabase 数据库
- 用户可通过设置页导出个人数据

### 4. 扩展方向
- 支持更多播客平台（Apple Podcasts、Spotify）
- 标记分享功能
- AI 总结功能
- 多语言支持

---

## Git 提交规范

```
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式（不影响功能）
refactor: 重构
perf: 性能优化
test: 测试
chore: 构建/工具
```

---

## 常用命令

```bash
# 本地开发 - 前端
cd echomark-web
npm run dev

# 本地开发 - 后端
cd echomark-server
uvicorn main:app --reload --port 8000

# 查看日志
railway logs  # Railway
vercel logs   # Vercel

# Git 操作
git add .
git commit -m "feat: 新功能描述"
git push origin main
git tag -a v1.0.0 -m "版本说明"
git push origin --tags
```

---

## 项目里程碑

| 日期 | 版本 | 内容 |
|------|------|------|
| 2025-xx-xx | v0.1.0 | 基础功能：导入、转录、播放 |
| 2025-xx-xx | v0.2.0 | Siri 快捷标记支持 |
| 2025-xx-xx | v1.0.0-mvp | 用户认证、数据隔离、生产部署 |

---

## 致谢

- **Claude** - AI 编程助手
- **Supabase** - 后端即服务
- **通义听悟** - AI 转录服务
- **Vercel & Railway** - 云平台

---

*最后更新：2025年*
