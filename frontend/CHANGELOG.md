# EchoMark 版本记录

## mvp-1.1 (2026-02-15) - PWA 支持 + 删除优化

### 新功能
- ✅ PWA 支持
  - 可安装到桌面/主屏幕
  - Service Worker 离线缓存
  - Web App Manifest 配置
- ✅ Media Session API 集成
  - 锁屏显示播客封面、标题
  - 锁屏控制按钮（播放/暂停/快进/快退）
- ✅ 自定义域名支持
  - 新增 echomark.echocoding.top 域名

### 优化
- 删除内容后立即更新 UI（无需刷新页面）
- 删除时显示加载状态（半透明 + "删除中..."）
- 终止转录后立即更新 UI
- 新增 toast 提示（删除成功/失败）

### 修复
- 修复删除内容 500 错误（清理关联的 playback_states）
- 新增 CORS 白名单支持自定义域名

### 技术改进
- 新增 vite-plugin-pwa 插件
- 新增 PWA 图标（192x192, 512x512）
- PlayerPage 集成 useCallback + Media Session API

---

## mvp-1.0 (2026-02-14) - 支持 iOS Siri 集成

### 新功能
- ✅ iOS Siri 快捷指令集成
  - 基础版：「嘿 Siri，标记」快速标记
  - 进阶版：「嘿 Siri，标记想法」标记 + 语音输入想法
- ✅ 自动暂停/续播
  - Siri 标记时自动暂停播客
  - 标记完成后自动回退 30 秒续播
- ✅ 播放状态持久化
  - 使用数据库存储播放状态（替代内存存储）
  - 支持 user_token 识别用户
- ✅ 设置页面
  - 显示用户专属 token
  - Siri 快捷指令配置指南
  - 暂停 API 和标记 API 地址

### 修复
- 修复 Vercel SPA 路由刷新 404 问题（使用 rewrites 配置）
- 修复标记失败问题（直接传递 content_id 和 timestamp）
- 修复时区显示问题（正确转换 UTC 到本地时间）
- 修复轮询依赖问题（使用 useRef 避免 effect 重建）

### 技术改进
- 数据库新增 playback_states 表
- 新增 /api/marks/pause 暂停 API
- 前端每 1.5 秒轮询检测暂停/续播信号

---

## v1.0 (2026-02-13) - 初始版本

### 功能
- 播客导入（支持小宇宙链接）
- 音频自动转录（通义听悟）
- 播放器（播放/暂停/进度条/快进快退 15 秒）
- 文稿同步高亮 + 点击跳转播放
- MARK 标记功能（记录时间戳 + 前后 2 句上下文）
- 标记列表 + 详情页
- 编辑标记想法
- 删除内容/标记
- 取消转录功能
- Toast 错误提示
