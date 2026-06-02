# 个人博客

基于 [Astro](https://astro.build) 构建的个人博客，使用 Tailwind CSS 进行样式设计，支持暗黑模式和全文搜索。

## 功能

- Markdown + MDX 内容管理
- 暗黑模式切换
- 标签分类系统
- 站内搜索
- RSS 订阅
- 响应式设计
- 代码语法高亮

## 技术栈

- **框架**: [Astro](https://astro.build)
- **样式**: [Tailwind CSS](https://tailwindcss.com)
- **内容**: Markdown + MDX
- **部署**: Vercel

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建
npm run build

# 预览
npm run preview
```

## 文章结构

```bash
src/content/blog/
├── 2024-01-01-title.md
├── 2024-01-15-another-title.md
└── ...
```

每篇文章使用 Frontmatter 声明元数据：

```yaml
---
title: "文章标题"
description: "文章描述"
date: 2024-01-01
tags: ["标签1", "标签2"]
categories: ["分类"]
featured: true
draft: false
---
```

## 部署

本项目配置了 Vercel 部署，推送到 Git 仓库后自动构建发布。

## License

MIT
