---
title: "Astro 入门指南：构建现代化静态站点"
description: "深入浅出地介绍 Astro 框架的核心概念和使用方法，帮助你快速上手构建高性能静态网站。"
date: 2024-01-15
tags: ["Astro", "前端", "静态站点"]
categories: ["前端"]
featured: true
---

## 什么是 Astro？

Astro 是一个现代化的静态站点生成器（SSG），它可以帮助你构建快速的网站，同时使用你最喜欢的 JavaScript 框架。

Astro 的核心理念是 **"默认情况下不发送 JavaScript"**。这意味着 Astro 在构建时会尽可能地将组件渲染为静态 HTML，只在必要时才加载 JavaScript。这种架构被称为 **"Islands 架构"**。

## 安装和初始化

创建一个新的 Astro 项目非常简单：

```bash
# 使用 npm
npm create astro@latest

# 使用 pnpm
pnpm create astro@latest

# 使用 yarn
yarn create astro
```

运行命令后，Astro 会引导你完成项目配置，包括选择模板、配置 TypeScript 等。

## 项目结构

一个典型的 Astro 项目结构如下：

```
my-astro-project/
├── src/
│   ├── components/    # 可复用组件
│   ├── layouts/       # 页面布局
│   ├── pages/         # 路由页面
│   ├── content/       # 内容集合
│   └── styles/        # 样式文件
├── public/            # 静态资源
└── astro.config.mjs   # Astro 配置
```

## 核心概念

### 页面（Pages）

Astro 使用基于文件的路由系统。`src/pages/` 目录下的 `.astro`、`.md`、`.mdx` 文件会自动成为路由。

### 组件（Components）

Astro 组件使用 `.astro` 扩展名，由两部分组成：

```astro
---
// 组件脚本（构建时运行）
const message = "Hello, Astro!";
---

<!-- 组件模板 -->
<h1>{message}</h1>
<p>这是一个 Astro 组件</p>
```

### 内容集合（Content Collections）

Astro 提供了强大的内容管理功能，通过内容集合来组织你的 Markdown/MDX 文件：

```typescript
import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()),
  }),
});

export const collections = { blog };
```

## 性能优化

Astro 提供多种性能优化策略：

1. **静态生成**：默认情况下页面在构建时生成静态 HTML
2. **按需水合**：只对需要交互的组件加载 JavaScript
3. **图片优化**：内置的 Image 组件自动优化图片
4. **代码分割**：自动分割 JavaScript 代码

## 总结

Astro 是构建内容驱动型网站的绝佳选择。它的 Islands 架构保证了出色的性能，同时集成了你喜爱的框架和丰富的生态系统。无论你是构建个人博客、文档站点还是营销页面，Astro 都能满足你的需求。