## Why

个人博客是记录技术心得、分享知识的核心平台。随着内容创作的增长，需要一个快速、灵活且易于维护的静态站点来展示个人内容。Astro 提供了最佳的构建速度和开发体验，完美契合个人博客的轻量级需求。

## What Changes

- 构建全新的个人博客网站，从零开始
- 使用 Astro 框架作为核心技术栈
- 集成 Markdown 内容管理系统
- 实现标签分类和文章列表功能
- 添加暗黑模式切换
- 实现站内搜索功能
- 配置 Vercel 部署

## Capabilities

### New Capabilities

- `markdown-content`: 管理和渲染 Markdown 格式的博客文章，支持代码高亮和数学公式
- `tags-and-categories`: 实现文章标签和分类系统，支持多标签和按分类筛选文章
- `dark-mode`: 提供亮色/暗色主题切换功能，使用 CSS 变量和 Tailwind CSS
- `search`: 实现基于客户端的全文搜索功能，快速定位文章内容

### Modified Capabilities

无现有能力被修改，这是全新构建。

## Impact

- 新增 Astro 项目配置和依赖
- 新增 Markdown 内容目录结构
- 新增组件库：文章列表、标签页、搜索框、主题切换按钮
- 新增页面路由：首页、文章详情页、标签/分类页面、关于页
- 新增样式系统：基于 Tailwind CSS 的响应式设计
- 配置 Vercel 部署流程和 GitHub 集成
- 依赖项：@astrojs/tailwind, @astrojs/mdx, @astrojs/sitemap, @astrojs/rss, astro-icon, lucide-react
