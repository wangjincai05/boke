# Giscus 评论系统设置指南

## 步骤 1: 准备仓库

1. 创建或使用一个公开的 GitHub 仓库
2. 确保仓库已启用 Discussions 功能：
   - 进入仓库 Settings
   - 向下滚动到 "Features" 部分
   - 勾选 "Discussions"

## 步骤 2: 安装 Giscus App

1. 访问 [https://github.com/apps/giscus](https://github.com/apps/giscus)
2. 点击 "Install" 按钮
3. 选择你的仓库（建议只选择特定仓库）
4. 完成授权

## 步骤 3: 获取配置信息

访问 [https://giscus.app/zh-CN](https://giscus.app/zh-CN)

### 填写配置表单:

1. **仓库**: `你的用户名/仓库名` (例如: `username/blog`)
2. **讨论分类**: 选择或创建一个分类（推荐 "Announcements"）
3. **页面 ↔️ Discussion 映射**: 选择 "pathname"
4. **Discussion 分类**: 选择你要使用的分类
5. **功能**: 
   - ✅ 启用主帖的反应
   - ✅ 自动加载新评论
6. **主题**: "Prefer color scheme"（跟随系统/用户选择）
7. **语言**: "zh-CN"

### 复制配置

从页面底部的 "启用 giscus" 部分，复制以下信息：

```javascript
<script>
  src="https://giscus.app/client.js"
  data-repo="username/repo"
  data-repo-id="..."
  data-category="Announcements"
  data-category-id="..."
  data-mapping="pathname"
  data-strict="0"
  data-reactions-enabled="1"
  data-emit-metadata="0"
  data-input-position="top"
  data-theme="preferred_color_scheme"
  data-lang="zh-CN"
  data-loading="lazy"
  crossorigin="anonymous"
  async
</script>
```

## 步骤 4: 更新配置文件

打开 [src/config.ts](file:///h:/data/boke/src/config.ts)，更新 `giscus` 部分：

```typescript
giscus: {
  repo: "username/repo", // 替换为你的仓库
  repoId: "..." // 粘贴你的 repoId
  category: "Announcements",
  categoryId: "..." // 粘贴你的 categoryId
  mapping: "pathname",
  reactionsEnabled: "1",
  emitMetadata: "0",
  inputPosition: "top",
  theme: "preferred_color_scheme",
  lang: "zh-CN",
  loading: "lazy",
}
```

## 步骤 5: 测试

1. 启动开发服务器：`npm run dev`
2. 访问任意文章页面
3. 检查评论是否正常加载

## 常见问题

### 评论加载失败？
- 确保仓库是公开的
- 确保 Giscus App 已正确安装
- 检查 repoId 和 categoryId 是否正确

### 如何自定义主题？
修改 `theme` 参数，支持的值：
- `preferred_color_scheme` (推荐)
- `light`
- `dark`
- `light_high_contrast`
- 更多主题见：https://giscus.app/zh-CN

### 如何禁用评论？
在文章 Frontmatter 中添加 `comments: false` 即可
