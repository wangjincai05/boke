---
title: 'Tailwind CSS 完整教程文档'
date: 2024-05-10
description: '基于 Tailwind CSS v3.4 的完整教程，涵盖安装配置、基础概念、响应式设计、状态变体、自定义配置及高级功能'
tags: ['CSS', 'Tailwind CSS', '前端框架', '样式']
featured: true
---

> 基于 Tailwind CSS v3.4 | 2024 年 1 月发布

---

## 第一章：Tailwind CSS 简介

### 1.1 什么是 Tailwind CSS？

Tailwind CSS 是一个**功能优先（Utility-First）**的 CSS 框架，它提供了一组低级别的工具类，让你可以直接在 HTML 中构建自定义设计，而无需编写自定义 CSS。

**核心特点：**

- **功能优先（Utility-First）**：直接使用预定义的工具类
- **高度可定制**：可以配置颜色、间距、字体等设计系统
- **响应式设计**：内置响应式断点支持
- **生产优化**：自动清除未使用的 CSS
- **性能卓越**：v4.0 版本构建速度提升 5 倍以上

### 1.2 v4.0 新特性概览

| 特性 | 说明 |
|------|------|
| 高性能引擎 | 全量构建快 5 倍，增量构建快 100 倍以上 |
| CSS 优先配置 | 直接在 CSS 中配置，无需 `tailwind.config.js` |
| 自动内容检测 | 自动发现模板文件，无需配置 content 路径 |
| 原生容器查询 | 内置 `@container` 支持，无需插件 |
| 3D 变换 | `rotate-x-*`、`rotate-y-*`、`perspective-*` 等 3D 工具类 |
| 渐变增强 | 支持角度、径向/锥形渐变、OKLCH 颜色空间 |
| `@starting-style` | CSS 原生进入/退出动画，无需 JavaScript |
| `not-*` 变体 | 排除特定条件的样式 |
| P3 色彩 | 使用 OKLCH 色彩空间，更鲜艳的颜色 |

---

## 第二章：安装与配置

### 2.1 快速开始（v4.0）

Tailwind CSS v4.0 大幅简化了安装流程，只需三个步骤：

#### 步骤 1：安装依赖

```bash
npm install tailwindcss @tailwindcss/postcss
```

#### 步骤 2：配置 PostCSS

创建或修改 `postcss.config.js` 文件：

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

#### 步骤 3：引入 Tailwind

在主 CSS 文件中添加：

```css
@import "tailwindcss";

/* 可选：自定义主题 */
@theme {
  --font-display: "Satoshi", sans-serif;
  --color-brand-500: oklch(0.84 0.18 117.33);
}
```

### 2.2 使用 Vite 插件（推荐）

对于 Vite 项目，可以使用官方插件获得更好的性能：

```ts
// vite.config.ts
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
});
```

### 2.3 框架集成

#### Next.js 集成

```js
// next.config.js
const nextConfig = {
  experimental: {
    turbo: {
      resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    },
  },
};
export default nextConfig;
```

#### React / Vue / Svelte

这些框架的集成方式类似，只需在入口 CSS 文件中引入 Tailwind 即可：

```css
/* src/index.css */
@import "tailwindcss";
```

---

## 第三章：基础概念

### 3.1 工具类命名规则

Tailwind 的工具类遵循一致的命名模式：

```bash
[属性]-[值]-[状态]

例如：
- text-xl        → font-size: 1.25rem
- bg-blue-500    → background-color: blue-500
- hover:bg-red   → hover 状态下背景变红
- md:flex        → 中等屏幕及以上显示 flex
```

### 3.2 常用工具类速查

#### 布局相关

| 类名 | CSS 属性 | 说明 |
|------|----------|------|
| `flex` | `display: flex` | 弹性布局 |
| `grid` | `display: grid` | 网格布局 |
| `block` | `display: block` | 块级元素 |
| `inline-block` | `display: inline-block` | 行内块元素 |
| `hidden` | `display: none` | 隐藏元素 |
| `justify-center` | `justify-content: center` | 主轴居中 |
| `items-center` | `align-items: center` | 交叉轴居中 |
| `flex-col` | `flex-direction: column` | 纵向排列 |
| `flex-wrap` | `flex-wrap: wrap` | 允许换行 |
| `gap-4` | `gap: 1rem` | 子元素间距 |

#### 间距相关

| 类名 | CSS 属性 | 说明 |
|------|----------|------|
| `p-4` | `padding: 1rem` | 四边内边距 |
| `px-6` | `padding-left/right: 1.5rem` | 水平内边距 |
| `py-2` | `padding-top/bottom: 0.5rem` | 垂直内边距 |
| `pt-4` | `padding-top: 1rem` | 上内边距 |
| `m-4` | `margin: 1rem` | 四边外边距 |
| `mx-auto` | `margin-left/right: auto` | 水平居中 |
| `mt-8` | `margin-top: 2rem` | 上边外边距 |
| `-mb-2` | `margin-bottom: -0.5rem` | 负下边距 |
| `space-x-4` | 子元素水平间距 | 水平间距（直接子元素） |
| `space-y-2` | 子元素垂直间距 | 垂直间距（直接子元素） |

> **间距比例**：`1 = 0.25rem`，例如 `p-4 = 1rem`，`m-8 = 2rem`，`gap-12 = 3rem`

#### 尺寸相关

| 类名 | CSS 属性 | 说明 |
|------|----------|------|
| `w-full` | `width: 100%` | 宽度 100% |
| `w-64` | `width: 16rem` | 固定宽度 |
| `h-screen` | `height: 100vh` | 全屏高度 |
| `max-w-md` | `max-width: 28rem` | 最大宽度（中等） |
| `min-h-0` | `min-height: 0` | 最小高度 0 |
| `size-12` | `width/height: 3rem` | 正方形尺寸 |

#### 排版相关

| 类名 | CSS 属性 | 说明 |
|------|----------|------|
| `text-sm` | `font-size: 0.875rem` | 小号文字 |
| `text-base` | `font-size: 1rem` | 基础文字 |
| `text-xl` | `font-size: 1.25rem` | 特大号文字 |
| `text-2xl` | `font-size: 1.5rem` | 双倍特大号 |
| `font-bold` | `font-weight: 700` | 粗体 |
| `font-medium` | `font-weight: 500` | 中等粗细 |
| `text-center` | `text-align: center` | 文字居中 |
| `text-blue-500` | `color: #3b82f6` | 蓝色文字 |
| `leading-relaxed` | `line-height: 1.625` | 宽松行高 |
| `tracking-wide` | `letter-spacing: 0.025em` | 宽字间距 |
| `uppercase` | `text-transform: uppercase` | 大写 |
| `truncate` | 文字溢出省略号 | 单行截断 |

#### 背景与边框

| 类名 | CSS 属性 | 说明 |
|------|----------|------|
| `bg-white` | `background-color: white` | 白色背景 |
| `bg-blue-500` | `background-color: #3b82f6` | 蓝色背景 |
| `bg-opacity-50` | 背景透明度 50% | 背景半透明 |
| `border` | `border-width: 1px` | 添加边框 |
| `border-2` | `border-width: 2px` | 2px 边框 |
| `border-blue-300` | 边框颜色 | 蓝色边框 |
| `rounded` | `border-radius: 0.25rem` | 小圆角 |
| `rounded-lg` | `border-radius: 0.5rem` | 大圆角 |
| `rounded-full` | `border-radius: 9999px` | 完全圆角 |
| `shadow` | `box-shadow` | 基础阴影 |
| `shadow-lg` | 较大阴影 | 大阴影 |
| `shadow-xl` | 更大阴影 | 超大阴影 |

#### Flexbox 速查

| 类名 | 说明 |
|------|------|
| `flex` | 启用 flex 布局 |
| `flex-row` | 水平排列（默认） |
| `flex-col` | 垂直排列 |
| `flex-wrap` | 允许换行 |
| `flex-1` | 占据剩余空间 |
| `justify-start` | 主轴起始对齐 |
| `justify-center` | 主轴居中 |
| `justify-between` | 两端对齐 |
| `justify-end` | 主轴末尾对齐 |
| `items-start` | 交叉轴起始 |
| `items-center` | 交叉轴居中 |
| `items-end` | 交叉轴末尾 |

#### Grid 速查

| 类名 | 说明 |
|------|------|
| `grid` | 启用 grid 布局 |
| `grid-cols-3` | 3 列网格 |
| `grid-cols-12` | 12 列网格 |
| `col-span-2` | 跨 2 列 |
| `row-span-3` | 跨 3 行 |
| `grid-rows-4` | 4 行网格 |

---

## 第四章：响应式设计

### 4.1 断点系统

Tailwind 内置了五个响应式断点：

| 断点 | 最小宽度 | CSS 媒体查询 | 适用场景 |
|------|----------|-------------|----------|
| `sm` | 640px | `@media (min-width: 640px)` | 手机横屏 |
| `md` | 768px | `@media (min-width: 768px)` | 平板电脑 |
| `lg` | 1024px | `@media (min-width: 1024px)` | 笔记本电脑 |
| `xl` | 1280px | `@media (min-width: 1280px)` | 桌面显示器 |
| `2xl` | 1536px | `@media (min-width: 1536px)` | 大显示器 |

> **设计理念**：移动优先（Mobile First）——不带前缀的类在所有尺寸生效，带前缀的类在该断点及以上生效。

### 4.2 使用示例

```html
<!-- 移动端单列，平板双列，桌面三列 -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div class="p-4 bg-white rounded shadow">卡片 1</div>
  <div class="p-4 bg-white rounded shadow">卡片 2</div>
  <div class="p-4 bg-white rounded shadow">卡片 3</div>
</div>

<!-- 响应式文字大小 -->
<h1 class="text-2xl md:text-4xl lg:text-5xl font-bold">
  响应式标题
</h1>

<!-- 移动端隐藏，桌面端显示 -->
<nav class="hidden md:flex space-x-4">
  <a href="#">首页</a>
  <a href="#">关于</a>
  <a href="#">联系</a>
</nav>

<!-- 响应式间距 -->
<div class="px-4 sm:px-6 lg:px-8">
  内容区域
</div>
```

### 4.3 深色模式

```html
<!-- 使用 dark: 前缀 -->
<div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  <h1 class="text-2xl font-bold">深色模式支持</h1>
  <p class="text-gray-600 dark:text-gray-300">自动适配深色主题</p>
</div>
```

---

## 第五章：状态变体

### 5.1 交互状态

| 变体 | 说明 |
|------|------|
| `hover:` | 鼠标悬停状态 |
| `focus:` | 获得焦点状态 |
| `focus-within:` | 子元素获得焦点 |
| `active:` | 激活状态（鼠标按下） |
| `visited:` | 已访问链接 |
| `disabled:` | 禁用状态 |
| `checked:` | 选中状态（复选框/单选框） |

### 5.2 结构伪类

| 变体 | 说明 |
|------|------|
| `first:` | 第一个子元素 |
| `last:` | 最后一个子元素 |
| `odd:` | 奇数子元素 |
| `even:` | 偶数子元素 |
| `group-hover:` | 父元素悬停时触发 |
| `peer-focus:` | 兄弟元素聚焦时触发 |

### 5.3 按钮示例

```html
<button class="
  px-6 py-3
  bg-blue-500 text-white font-semibold
  rounded-lg shadow-md
  hover:bg-blue-700 hover:shadow-lg
  focus:outline-none focus:ring-2 focus:ring-blue-400
  active:bg-blue-800 active:scale-95
  disabled:bg-gray-400 disabled:cursor-not-allowed
  transition-all duration-200
">
  点击我
</button>
```

### 5.4 卡片悬停效果

```html
<!-- 父元素悬停时子元素响应 -->
<div class="group">
  <div class="bg-white rounded-xl shadow-md p-6
              group-hover:shadow-xl group-hover:-translate-y-1
              transition-all duration-300">
    <h3 class="text-lg font-bold group-hover:text-blue-600 transition-colors">
      卡片标题
    </h3>
    <p class="text-gray-600 mt-2">卡片内容</p>
  </div>
</div>
```

### 5.5 表单输入框

```html
<input type="text"
  class="w-full px-4 py-2 border border-gray-300 rounded-lg
         focus:border-blue-500 focus:ring-2 focus:ring-blue-200
         placeholder:text-gray-400
         disabled:bg-gray-100 disabled:cursor-not-allowed
         transition-all duration-200"
  placeholder="请输入内容"
/>
```

---

## 第六章：自定义配置

### 6.1 CSS 优先配置（v4.0）

Tailwind CSS v4.0 引入了全新的 CSS 优先配置方式：

```css
@import "tailwindcss";

@theme {
  /* 自定义字体 */
  --font-display: "Satoshi", "sans-serif";
  --font-body: "Inter", "sans-serif";

  /* 自定义颜色 */
  --color-brand-50: oklch(0.98 0.02 120);
  --color-brand-100: oklch(0.95 0.05 120);
  --color-brand-500: oklch(0.65 0.2 120);
  --color-brand-900: oklch(0.35 0.15 120);

  /* 自定义断点 */
  --breakpoint-xs: 475px;
  --breakpoint-3xl: 1920px;

  /* 自定义间距 */
  --spacing-18: 4.5rem;

  /* 自定义动画缓动函数 */
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### 6.2 扩展默认主题

使用 `@theme` 扩展而非覆盖默认主题：

```css
@import "tailwindcss";

@theme {
  /* 添加新的颜色，保留默认颜色 */
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;

  /* 扩展动画 */
  --animate-fade-in: fade-in 0.5s ease-out;
  --animate-slide-up: slide-up 0.3s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

### 6.3 使用 CSS 变量

v4.0 所有设计令牌自动导出为 CSS 变量，可在任意位置使用：

```css
@import "tailwindcss";

@theme {
  --color-primary: oklch(0.65 0.2 250);
  --color-secondary: oklch(0.6 0.2 300);
}
```

```html
<!-- 在 HTML 中使用 CSS 变量 -->
<div style="background-color: var(--color-primary);">
  使用主题变量
</div>
```

### 6.4 添加自定义源文件

```css
@import "tailwindcss";

/* 添加额外的类名扫描源 */
@source "../node_modules/@my-company/ui-lib";
@source "../shared/components";
```

---

## 第七章：高级功能

### 7.1 容器查询

v4.0 内置容器查询支持，无需插件：

```html
<!-- 定义容器 -->
<div class="@container">
  <!-- 根据容器宽度响应 -->
  <div class="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3 gap-4">
    <div>卡片 1</div>
    <div>卡片 2</div>
    <div>卡片 3</div>
  </div>
</div>

<!-- 最大宽度容器查询 -->
<div class="@container">
  <div class="flex @max-md:flex-col gap-4">
    <div>侧边栏</div>
    <div>主内容</div>
  </div>
</div>

<!-- 范围查询 -->
<div class="@container">
  <div class="flex @min-md:@max-xl:hidden">
    仅在容器宽度 md-xl 之间隐藏
  </div>
</div>
```

### 7.2 3D 变换

v4.0 新增 3D 变换工具类：

```html
<!-- 3D 卡片效果 -->
<div class="perspective-distant">
  <div class="rotate-x-12 rotate-y-6 transform-3d
              bg-white rounded-xl shadow-2xl p-8">
    <h3 class="text-xl font-bold">3D 卡片</h3>
    <p>具有 3D 透视效果的卡片</p>
  </div>
</div>
```

**可用的 3D 工具类：**

| 类名 | 说明 |
|------|------|
| `rotate-x-*` | X 轴旋转 |
| `rotate-y-*` | Y 轴旋转 |
| `rotate-z-*` | Z 轴旋转 |
| `scale-z-*` | Z 轴缩放 |
| `translate-z-*` | Z 轴平移 |
| `perspective-*` | 透视距离 |
| `perspective-origin-*` | 透视原点 |
| `transform-3d` | 启用 3D 变换 |
| `transform-style-*` | 变换样式 |
| `backface-hidden` | 隐藏背面 |

### 7.3 渐变增强

v4.0 扩展了渐变功能：

```html
<!-- 线性渐变（支持角度） -->
<div class="bg-linear-45 from-purple-500 to-pink-500 h-32">
  45度渐变
</div>

<!-- 径向渐变 -->
<div class="bg-radial from-white to-blue-500 size-32 rounded-full">
  径向渐变
</div>

<!-- 锥形渐变 -->
<div class="bg-conic from-red-500 via-yellow-500 to-red-500
            size-32 rounded-full">
  锥形渐变
</div>

<!-- 使用 OKLCH 颜色空间获得更鲜艳的渐变 -->
<div class="bg-linear-to-r/oklch from-indigo-500 to-teal-400">
  OKLCH 渐变
</div>

<!-- 渐变停止位置 -->
<div class="bg-linear-to-r from-blue-500 via-purple-500 via-75% to-pink-500">
  自定义停止位置
</div>
```

### 7.4 @starting-style 动画

v4.0 支持 CSS 原生的进入/退出动画：

```html
<div>
  <button popovertarget="my-popover">打开弹窗</button>
  <div popover id="my-popover"
       class="transition-discrete
              starting:open:opacity-0 starting:open:scale-95
              open:opacity-100 open:scale-100
              transition-all duration-200">
    弹窗内容
  </div>
</div>
```

### 7.5 not-* 变体

排除特定条件的样式：

```html
<!-- 不是 hover 状态时才显示下划线 -->
<a class="not-hover:underline" href="#">链接</a>

<!-- 不匹配 md 断点时隐藏 -->
<div class="not-md:hidden">内容</div>
```

### 7.6 动态工具值

v4.0 支持动态值，无需任意值语法：

```html
<!-- 任意列数网格 -->
<div class="grid grid-cols-15">
  15 列网格
</div>

<!-- 任意间距 -->
<div class="mt-17">
  margin-top: calc(0.25rem * 17)
</div>

<!-- 自定义 data 属性 -->
<div data-current class="opacity-75 data-current:opacity-100">
  当前状态高亮
</div>
```

---

## 第八章：最佳实践

### 8.1 组件抽象

当一组工具类重复出现时，考虑抽象为组件：

```html
<!-- ❌ 不推荐：重复的工具类 -->
<button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
  按钮 1
</button>
<button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
  按钮 2
</button>

<!-- ✅ 推荐：使用 @apply 或组件 -->
```

```css
/* CSS 文件 */
@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-blue-500 text-white rounded
           hover:bg-blue-600 transition-colors;
  }
}
```

```html
<!-- HTML -->
<button class="btn-primary">按钮 1</button>
<button class="btn-primary">按钮 2</button>
```

### 8.2 代码组织

按功能分组排列类名，提高可读性：

```html
<!-- 推荐的类名顺序 -->
<div class="
  /* 1. 布局 */
  flex flex-col items-center justify-center

  /* 2. 尺寸 */
  w-full max-w-md h-auto

  /* 3. 间距 */
  p-6 m-4 gap-4

  /* 4. 边框 */
  border border-gray-200 rounded-xl

  /* 5. 背景 */
  bg-white shadow-lg

  /* 6. 文字 */
  text-center text-gray-800

  /* 7. 状态 */
  hover:shadow-xl focus:ring-2

  /* 8. 过渡 */
  transition-all duration-300
">
  内容
</div>
```

### 8.3 性能优化建议

- **使用 Vite 插件**而非 PostCSS 获得最佳性能
- **生产构建时自动清除**未使用的 CSS（JIT 模式）
- **避免过度使用 `@apply`**，保持工具类的优势
- **使用 CSS 变量**实现动态主题切换
- **利用自动内容检测**，无需手动配置 content 路径
- **使用 `@source` 指令**添加额外的扫描源

### 8.4 常用设计模式

#### 居中容器

```html
<div class="min-h-screen flex items-center justify-center bg-gray-50">
  <div class="max-w-md w-full p-8 bg-white rounded-2xl shadow-lg">
    居中的卡片
  </div>
</div>
```

#### 导航栏

```html
<nav class="bg-white shadow-sm border-b">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-16 items-center">
      <div class="text-xl font-bold text-blue-600">Logo</div>
      <div class="hidden md:flex space-x-8">
        <a href="#" class="text-gray-600 hover:text-blue-600 transition-colors">首页</a>
        <a href="#" class="text-gray-600 hover:text-blue-600 transition-colors">关于</a>
        <a href="#" class="text-gray-600 hover:text-blue-600 transition-colors">联系</a>
      </div>
    </div>
  </div>
</nav>
```

#### 响应式网格

```html
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
    <img src="..." class="w-full h-48 object-cover" />
    <div class="p-4">
      <h3 class="font-bold text-lg">标题</h3>
      <p class="text-gray-600 mt-1">描述文字</p>
    </div>
  </div>
</div>
```

---

## 第九章：常见问题

### 9.1 如何处理动态类名？

Tailwind 无法检测动态构建的类名，应使用完整类名或 safelist：

```html
<!-- ❌ 不推荐：动态拼接 -->
<div class="text-${color}-500">动态颜色</div>

<!-- ✅ 推荐：完整类名 -->
<div class="{{ color === 'red' ? 'text-red-500' : 'text-blue-500' }}">
  动态颜色
</div>
```

### 9.2 如何添加自定义样式？

使用 `@layer` 指令添加自定义样式：

```css
@import "tailwindcss";

/* 基础层 - 重置或基础样式 */
@layer base {
  h1 {
    @apply text-2xl font-bold;
  }
}

/* 组件层 - 可复用组件 */
@layer components {
  .card {
    @apply bg-white rounded-lg shadow-md p-6;
  }
}

/* 工具层 - 自定义工具类 */
@layer utilities {
  .text-shadow {
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  }
}
```

### 9.3 如何与 CSS-in-JS 共存？

Tailwind 可以与 styled-components、emotion 等库共存：

```js
// 使用 styled-components
import styled from 'styled-components';

const Button = styled.button`
  /* Tailwind 类名 */
  ${props => props.primary && 'bg-blue-500 text-white'}

  /* 自定义样式 */
  padding: ${props => props.size === 'large' ? '1rem 2rem' : '0.5rem 1rem'};
`;
```

### 9.4 v3 升级到 v4 的主要变化

| 变化 | v3 | v4 |
|------|----|----|
| 配置方式 | `tailwind.config.js` | CSS `@theme` |
| 引入方式 | `@tailwind base/components/utilities` | `@import "tailwindcss"` |
| 内容检测 | 手动配置 `content` 数组 | 自动检测 |
| 渐变类名 | `bg-gradient-to-r` | `bg-linear-to-r` |
| 容器查询 | 需要插件 | 内置支持 |
| 颜色空间 | RGB | OKLCH（更鲜艳） |

---

## 结语

Tailwind CSS 是一个强大而灵活的 CSS 框架，它通过工具类的方式让开发者能够快速构建现代化的用户界面。v4.0 版本带来了显著的性能提升和更简洁的开发体验。

**建议的学习路径：**

1. 掌握基础工具类（布局、间距、排版）
2. 学习响应式设计和状态变体
3. 了解自定义配置和主题扩展
4. 探索高级功能（容器查询、3D 变换等）
5. 实践最佳实践，提升代码质量

**更多资源：**

- 官方文档：[https://tailwindcss.com/docs](https://tailwindcss.com/docs)
- Tailwind Play（在线编辑器）：[https://play.tailwindcss.com](https://play.tailwindcss.com)
- Tailwind UI（组件模板）：[https://tailwindui.com](https://tailwindui.com)
- 升级指南：[https://tailwindcss.com/docs/upgrade-guide](https://tailwindcss.com/docs/upgrade-guide)
