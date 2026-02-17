# EchoMark 性能优化清单

> 最后更新: 2026-02-14

## 当前架构约束

- **数据库**: Supabase (海外 PostgreSQL)，免费方案
- **后端**: Railway (美西)
- **前端**: Vercel (全球 CDN)
- **约束原因**: 国内云数据库成本较高 (2000+ RMB/月)，当前维持 Supabase 免费方案

## 当前性能瓶颈

### 1. 数据库延迟（主要问题）
- **现状**: Supabase 服务器在海外 (ap-south-1)，每次 API 请求约 300-800ms
- **影响**: 页面加载慢，操作响应慢
- **根因**: 地理位置延迟 + 跨区网络传输

### 2. 播放状态轮询开销
- **现状**: 前端每 1.5 秒调用 2 次 API (updatePlaybackState + getPlaybackState)
- **影响**: 频繁的数据库读写，增加延迟
- **文件**: `PlayerPage.tsx:113-148`

### 3. API 请求串行
- **现状**: 部分页面需要多次 API 调用，串行执行
- **影响**: 总延迟叠加

### 4. 大型 JSON 字段传输
- **现状**: transcript 字段存储完整转录文本 (可能 100KB+)
- **影响**: 每次获取内容详情都传输大量数据

---

## 优化方案（维持 Supabase）

### 🔴 高优先级（立即可实施）

#### 1. 智能轮询频率
- **方案**: 动态调整轮询间隔，平时 3s，Siri 标记时临时加速
- **预期效果**: API 调用量减少 50%，同时保持 Siri 响应速度
- **实施难度**: 中
- **代码位置**: `PlayerPage.tsx:113-148`

**基础版（简单调整）：**
```typescript
// 将轮询间隔从 1.5s 改为 3s
const interval = setInterval(async () => { ... }, 3000);
```

**进阶版（智能轮询）：**
```typescript
// 检测到 should_pause 后，临时切换到快速轮询等待 should_resume
const [pollInterval, setPollInterval] = useState(3000);

useEffect(() => {
  const interval = setInterval(async () => {
    const state = await getPlaybackState();

    if (state.should_pause) {
      audioRef.current?.pause();
      setPollInterval(500);  // 暂停后加速轮询

      // 10秒后恢复正常轮询
      setTimeout(() => setPollInterval(3000), 10000);
    }

    if (state.should_resume) {
      // 续播后恢复正常轮询
      setPollInterval(3000);
    }
  }, pollInterval);

  return () => clearInterval(interval);
}, [pollInterval]);
```

**Siri 标记时序（3s 轮询）：**
| 步骤 | 延迟 | 说明 |
|-----|------|-----|
| 用户说「嘿 Siri 标记」 | 0s | - |
| Siri 识别 + 执行 Shortcut | ~1-2s | iOS 系统延迟 |
| 前端检测到 should_pause | 0-3s | 轮询间隔 |
| 总暂停延迟 | 1-5s | 可接受 |

#### 2. 合并播放状态 API
- **方案**: 将 `updatePlaybackState` 和 `getPlaybackState` 合并为单次请求
- **预期效果**: 每次轮询从 2 次 API 减少到 1 次
- **实施难度**: 低
- **后端改动**: 修改 `POST /api/marks/playback-state` 返回完整状态

```python
# marks.py - 修改 update_playback_state 返回完整状态
@router.post("/playback-state", response_model=PlaybackStateResponse)
async def update_playback_state(...):
    # ... 更新逻辑
    return PlaybackStateResponse(
        should_pause=...,
        should_resume=...,
        resume_from=...
    )
```

#### 3. 前端数据缓存 (React Query / SWR)
- **方案**: 使用 SWR 或 React Query 缓存 API 响应
- **预期效果**: 重复访问无需网络请求，页面切换更流畅
- **实施难度**: 中

```typescript
// 使用 SWR
import useSWR from 'swr';

function useContent(id: number) {
  return useSWR(`/api/contents/${id}`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,  // 1分钟内不重复请求
    revalidateOnReconnect: false,
  });
}

function useMarks() {
  return useSWR('/api/marks', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,  // 30秒缓存
  });
}
```

#### 4. 乐观更新 (Optimistic Updates)
- **方案**: 创建标记时先本地更新 UI，后台异步同步
- **预期效果**: 用户感知延迟从 800ms 降到 ~0ms
- **实施难度**: 中

```typescript
// 创建标记 - 乐观更新
const handleMark = async () => {
  // 1. 立即显示成功 UI
  const tempMark = { id: -1, timestamp: currentTime, ... };
  setMarks(prev => [...prev, tempMark]);
  setShowMarkDialog(true);

  // 2. 后台异步创建
  try {
    const realMark = await createMark(content.id, currentTime);
    setMarks(prev => prev.map(m => m.id === -1 ? realMark : m));
  } catch (err) {
    // 3. 失败时回滚
    setMarks(prev => prev.filter(m => m.id !== -1));
    toast.error('标记失败');
  }
};
```

### 🟡 中优先级

#### 5. 数据库索引优化
- **方案**: 为常用查询添加索引
- **预期效果**: 查询时间减少 30-50%
- **实施难度**: 低（在 Supabase 控制台执行）

```sql
-- 在 Supabase SQL Editor 执行
CREATE INDEX IF NOT EXISTS idx_marks_content_id ON marks(content_id);
CREATE INDEX IF NOT EXISTS idx_marks_created_at ON marks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contents_created_at ON contents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_playback_states_user_token ON playback_states(user_token);
```

#### 6. 分页加载标记列表
- **方案**: 标记列表分页，每页 20 条
- **预期效果**: 初始加载数据量减少
- **实施难度**: 中

```python
# 后端
@router.get("", response_model=MarkListResponse)
async def list_marks(
    page: int = 1,
    page_size: int = 20,
    ...
):
    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)
```

#### 7. 转录文稿延迟加载
- **方案**: 内容列表不返回 transcript，仅在播放页请求
- **预期效果**: 列表 API 响应减小 90%+
- **实施难度**: 低（已实现，确认 ContentResponse 不含 transcript）

#### 8. 并行 API 请求
- **方案**: 将可并行的 API 请求用 Promise.all 包装
- **预期效果**: 总延迟从累加变为取最大值
- **代码位置**: 涉及多 API 调用的页面

```typescript
// 标记详情页 - 并行请求
const [mark, content] = await Promise.all([
  getMark(markId),
  getContent(contentId)
]);
```

### 🟢 低优先级（后期优化）

#### 9. HTTP 缓存头
- **方案**: 为静态数据 (如已完成转录的内容) 添加 Cache-Control
- **预期效果**: 浏览器缓存，减少重复请求

```python
from fastapi.responses import JSONResponse

@router.get("/{content_id}")
async def get_content(...):
    # 已完成的内容可缓存
    if content.transcript_status == 'completed':
        return JSONResponse(
            content=data,
            headers={"Cache-Control": "max-age=300"}  # 5分钟
        )
```

#### 10. WebSocket 替代轮询
- **方案**: 使用 WebSocket 实现播放状态同步和 Siri 信号
- **预期效果**: 实时性更好，减少不必要请求
- **实施难度**: 高
- **注意**: Railway 免费版对 WebSocket 支持有限

#### 11. 后端内存缓存
- **方案**: 使用 `cachetools` 缓存热点数据
- **预期效果**: 热点内容查询直接返回，不经数据库
- **实施难度**: 中

```python
from cachetools import TTLCache

# 缓存最近访问的内容（5分钟 TTL）
content_cache = TTLCache(maxsize=50, ttl=300)

async def get_content_cached(content_id: int, db):
    if content_id in content_cache:
        return content_cache[content_id]
    content = await db.get(Content, content_id)
    if content:
        content_cache[content_id] = content
    return content
```

#### 12. 图片/封面 CDN
- **方案**: 将播客封面通过 CDN 代理
- **预期效果**: 图片加载更快
- **实施**: 可使用 Cloudflare Images 或 imgproxy

#### 13. Service Worker 离线缓存
- **方案**: PWA 化，缓存静态资源和 API 响应
- **预期效果**: 离线可用，二次访问秒开

---

## 不推荐的方案

### ❌ 切换到国内数据库
- **原因**: 成本约 2000+ RMB/月（腾讯云/阿里云 PostgreSQL）
- **结论**: 当前用户规模下性价比低，Supabase 免费够用

### ❌ 完全取消播放状态轮询
- **原因**: Siri 标记功能依赖轮询检测 pause/resume 信号
- **结论**: 可降低频率，但不能完全去除

---

## 监控指标

### 需要跟踪的指标
1. **API 响应时间**: 目标 < 500ms (考虑海外数据库延迟)
2. **页面加载时间**: 目标 < 2s
3. **首次内容绘制 (FCP)**: 目标 < 1s
4. **可交互时间 (TTI)**: 目标 < 2s

### 简易监控方法
```typescript
// 前端 - 添加到 api.ts
const startTime = performance.now();
const response = await fetch(...);
console.log(`API ${url} took ${performance.now() - startTime}ms`);
```

---

## 实施顺序建议

考虑到维持 Supabase 的约束，建议实施顺序：

1. **第一阶段 (快速见效)**
   - [1] 减少轮询频率 (1.5s → 3s)
   - [2] 合并播放状态 API
   - [5] 添加数据库索引

2. **第二阶段 (用户体验提升)**
   - [3] 引入 SWR/React Query 前端缓存
   - [4] 乐观更新
   - [8] 并行 API 请求

3. **第三阶段 (按需优化)**
   - [6] 分页加载
   - [9] HTTP 缓存头
   - [11] 后端内存缓存

---

## 已实施的优化

- [x] 骨架屏加载（改善感知性能）
- [x] 关闭 SQL echo 日志 (`echo=False`)
- [x] MARK 按钮加载状态（防止重复点击）
- [x] 数据库连接池配置 (`pool_size=5, max_overflow=10`)
- [x] 禁用 prepared statements 兼容 pgbouncer
- [x] 转录文稿仅在详情 API 返回（列表不含 transcript）
- [x] 播放状态使用 useRef 避免 effect 重建
