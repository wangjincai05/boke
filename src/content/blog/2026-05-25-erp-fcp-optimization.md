---
title: 'ERP系统首屏优化：FCP从4.2s降至1.1s'
date: 2026-05-25
description: '不是所有优化都值得做——本文只讲投入产出比最高的那几刀，详解如何将ERP首屏加载时间从4.2秒优化到1.1秒'
tags: ['性能优化', 'FCP', 'Vue3', 'Vite', 'ERP']
---

> 不是所有优化都值得做——本文只讲投入产出比最高的那几刀

---

## 一、4.2s 的 ERP 首屏长什么样？

先还原问题现场。一个典型的中大型 ERP 系统（Vue3 + Vite + Element Plus + ECharts），首屏加载瀑布图大概是这样的：

```bash
0ms     ─── DNS + TCP + TLS ───────────────────────── 600ms
600ms   ─── TTFB（等后端返回 HTML）───────────────── 900ms
900ms   ─── 下载主 JS（2.4MB，未压缩）─────────────── 2400ms
2400ms  ─── 解析 + 执行 JS（主线程阻塞）───────────── 3200ms
3200ms  ─── 请求用户信息 + 菜单 + 权限接口（串行）──── 3800ms
3800ms  ─── 渲染侧边栏 + 顶栏 + Dashboard ─────────── 4200ms
         ↑ FCP = 4.2s
```

**4.2s 的 FCP 意味着**：用户点了登录后，盯着白屏 4.2 秒才能看到第一帧内容。Google 的标准是 FCP ≤ 1.8s 为"好"，4.2s 已经是"差"了。

更糟糕的是——ERP 系统的用户每天要打开几十次，4.2s × 30 次 = 每天浪费 2 分钟在等白屏。

### 1.1 诊断：钱花在哪了？

用 Lighthouse + Chrome DevTools Performance 面板跑一次，拿到以下数据：

| 指标 | 优化前 | 问题定位 |
|------|--------|----------|
| FCP | 4.2s | 主包太大 + 接口串行 |
| LCP | 5.8s | Dashboard 图表阻塞渲染 |
| TBT | 1800ms | JS 执行时间过长 |
| 主包体积 | 2.4MB | Element Plus + ECharts 全量引入 |
| 首屏 JS 体积 | 1.8MB | 路由未分割，所有页面打成一个包 |
| 首屏接口数 | 8 个 | 用户信息、菜单、权限、字典等串行请求 |
| 首屏 DOM 节点 | 3200+ | Dashboard 一次渲染所有卡片 |

**关键发现**：80% 的首屏时间花在了"不该在首屏加载的东西"上——ECharts 图表库、非首屏页面的代码、一次性加载的全量字典数据。

---

## 二、优化路线图：按投入产出比排序

不是所有优化都值得做。下面按 **投入产出比从高到低** 排序，前 4 项就占了 80% 的优化效果：

```bash
优化项                          FCP 影响     实施成本     投入产出比
───────────────────────────────────────────────────────────────
① 代码分割 + 路由懒加载         -1.4s        低(2h)       ⭐⭐⭐⭐⭐
② 接口聚合 + 分层加载           -0.8s        低(3h)       ⭐⭐⭐⭐⭐
③ 重组件异步加载（ECharts等）    -0.5s        低(1h)       ⭐⭐⭐⭐
④ 骨架屏 + 关键 CSS 内联        -0.4s        低(2h)       ⭐⭐⭐⭐
⑤ CDN + Brotli 压缩             -0.3s        中(4h)       ⭐⭐⭐
⑥ 第三方库 externals            -0.2s        低(1h)       ⭐⭐⭐
⑦ 数据缓存 + Service Worker     -0.2s*       中(4h)       ⭐⭐
⑧ 虚拟列表 + DOM 瘦身           -0.1s        中(3h)       ⭐⭐
───────────────────────────────────────────────────────────────
总计                             -3.1s → FCP ≈ 1.1s
* 二次访问时效果更显著
```

下面逐项展开。

---

## 三、① 代码分割 + 路由懒加载（-1.4s）

**这是投入产出比最高的优化，没有之一。**

### 3.1 问题：一个包打天下

```typescript
// ❌ 优化前：静态导入，所有页面打进主包
import Dashboard from '@/views/Dashboard/index.vue'
import OrderList from '@/views/Order/List.vue'
import OrderDetail from '@/views/Order/Detail.vue'
import UserManage from '@/views/System/User.vue'
import RoleManage from '@/views/System/Role.vue'
import ReportCenter from '@/views/Report/index.vue'
// ... 还有 40+ 个页面
```

结果：首屏加载了 2.4MB 的 JS，其中 1.6MB 是用户根本不会在首屏看到的内容。

### 3.2 方案：三层分割策略

```
第一层：路由级分割 —— 不同路由加载不同 chunk
第二层：组件级分割 —— 重组件（ECharts、编辑器）按需加载
第三层：能力级分割 —— 导出PDF、批量上传等独立 chunk
```

**路由级分割**：

```typescript
// ✅ 优化后：动态导入
const routes = [
  {
    path: '/dashboard',
    component: () => import('@/views/Dashboard/index.vue'),
  },
  {
    path: '/order/list',
    component: () => import('@/views/Order/List.vue'),
  },
  {
    path: '/order/detail',
    component: () => import('@/views/Order/Detail.vue'),
  },
  // ...
]
```

**更精细的懒加载：防闪烁 + 预加载**：

```typescript
// src/router/utils.ts
import { defineAsyncComponent, h } from 'vue'

export function lazyLoadView(importFn: () => Promise<any>, options?: { preload?: boolean }) {
  return defineAsyncComponent({
    loader: importFn,
    loadingComponent: () => h('div', { class: 'page-skeleton' }), // 轻量骨架
    delay: 200,   // 200ms 内加载完不显示 loading，避免闪烁
    timeout: 10000,
  })
}

// 路由配置
const routes = [
  {
    path: '/dashboard',
    component: lazyLoadView(() => import('@/views/Dashboard/index.vue'), {
      preload: true,  // 标记为可预加载
    }),
  },
]
```

**Vite 手动分包**：

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 框架核心（几乎不变，利于缓存）
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          // UI 库（较大但稳定）
          'vendor-ui': ['element-plus'],
          // 图表库（按需加载，不进主包）
          // 'vendor-chart': ['echarts'],  // 不在这里，走组件级懒加载
          // 工具库
          'vendor-utils': ['lodash-es', 'dayjs', 'axios'],
        },
      },
    },
  },
})
```

### 3.3 效果

| 指标 | 优化前 | 优化后 | 变化 |
|------|--------|--------|------|
| 主包体积 | 2.4MB | 680KB | -72% |
| 首屏 JS 体积 | 1.8MB | 420KB | -77% |
| JS 下载+解析时间 | 2300ms | 620ms | -73% |

---

## 四、② 接口聚合 + 分层加载（-0.8s）

### 4.1 问题：8 个接口串行排队

```bash
登录成功 →
  请求用户信息 (300ms) →
  请求菜单列表 (500ms) →
  请求权限数据 (400ms) →
  请求字典数据 (600ms) →
  请求通知消息 (200ms) →
  请求 Dashboard 统计 (800ms) →
  请求待办事项 (300ms) →
  请求公告 (200ms)
                                       总计 3300ms（含网络重叠）
```

关键问题：菜单和权限依赖用户信息返回，所以是串行的。但实际上大部分接口之间没有依赖关系。

### 4.2 方案：三层加载 + 接口聚合

**核心思路**：首屏只加载渲染必需的数据，其余延迟加载。

```bash
第一层（阻塞渲染）：用户信息 + 基础配置    → 必须等，约 300ms
第二层（渲染框架）：菜单 + 权限            → 渲染框架需要，约 500ms
第三层（填充内容）：Dashboard 统计 + 通知   → 可延迟，约 800ms
```

**后端：接口聚合**：

```typescript
// 后端新增：/api/app/init 聚合接口
// 将用户信息 + 基础配置 + 菜单 + 权限 合并为一个请求

// 前端调用
async function initApp() {
  // 第一层：核心数据（一个请求拿到所有阻塞渲染的数据）
  const { userInfo, config, menus, permissions } = await api.post('/api/app/init')

  // 更新 store
  userStore.setUser(userInfo)
  appStore.setConfig(config)
  menuStore.setMenus(menus)
  permissionStore.setPermissions(permissions)

  // 第二层：非阻塞数据（并行请求，不阻塞首屏渲染）
  Promise.all([
    api.get('/api/dashboard/stats'),
    api.get('/api/notifications'),
    api.get('/api/todo/list'),
  ]).then(([stats, notifications, todos]) => {
    dashboardStore.setStats(stats)
    notificationStore.setList(notifications)
    todoStore.setList(todos)
  })
}
```

**前端：分层加载策略**：

```typescript
// src/store/modules/app.ts
export const useAppStore = defineStore('app', () => {
  const appReady = ref(false)      // 核心数据就绪（可以渲染框架）
  const dataReady = ref(false)     // 完整数据就绪（可以渲染内容）

  async function initAppData() {
    // 1. 核心层：用户认证 + 基础配置（必须优先加载，阻塞渲染）
    await Promise.all([loadUserInfo(), loadBasicConfig()])

    // 2. 功能层：菜单和权限（UI 框架渲染依赖）
    await loadMenusAndPermissions()
    appReady.value = true  // ← 此刻可以渲染侧边栏+顶栏了

    // 3. 辅助层：统计数据和非关键数据（不阻塞首屏）
    loadStatisticData()      // 不 await
    loadOptionalConfigs()    // 不 await
    dataReady.value = true
  }

  return { appReady, dataReady, initAppData }
})
```

**配合 Vue3 的 Suspense**：

```vue
<!-- App.vue -->
<script setup>
import { useAppStore } from '@/store/modules/app'

const appStore = useAppStore()

onMounted(() => {
  appStore.initAppData()
})
</script>

<template>
  <div v-if="appStore.appReady" class="app-layout">
    <AppSidebar />
    <div class="app-main">
      <AppHeader />
      <!-- Dashboard 内容区：数据没到时显示骨架屏 -->
      <div v-if="appStore.dataReady">
        <router-view />
      </div>
      <DashboardSkeleton v-else />
    </div>
  </div>
  <!-- 核心数据加载中：全屏 loading -->
  <AppLoading v-else />
</template>
```

### 4.3 效果

| 指标 | 优化前 | 优化后 | 变化 |
|------|--------|--------|------|
| 首屏接口数 | 8 个串行 | 1 个聚合 + 3 个并行 | -50% 请求 |
| 首屏数据等待 | 3300ms | 800ms（聚合接口）| -76% |
| 用户可感知内容出现 | 4.2s | 1.6s | FCP 大幅改善 |

---

## 五、③ 重组件异步加载（-0.5s）

### 5.1 问题：ECharts 全量引入

ERP 的 Dashboard 页面几乎都有图表，ECharts 完整包 800KB+。问题在于——即使首屏只需要 2 个图表，也会加载整个 ECharts。

### 5.2 方案：组件级懒加载 + ECharts 按需引入

**ECharts 按需引入**：

```typescript
// src/utils/echarts.ts
// ❌ 全量引入：800KB+
// import * as echarts from 'echarts'

// ✅ 按需引入：约 200KB
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  BarChart, LineChart, PieChart,
  TitleComponent, TooltipComponent, LegendComponent, GridComponent,
  CanvasRenderer,
])

export default echarts
```

**图表组件异步加载**：

```vue
<!-- src/views/Dashboard/index.vue -->
<script setup>
import { defineAsyncComponent } from 'vue'

// ✅ 图表组件懒加载——不进主包，访问到 Dashboard 才加载
const SalesChart = defineAsyncComponent(() =>
  import('@/components/charts/SalesChart.vue')
)
const OrderChart = defineAsyncComponent(() =>
  import('@/components/charts/OrderChart.vue')
)

// ❌ 优化前：静态导入
// import SalesChart from '@/components/charts/SalesChart.vue'
// import OrderChart from '@/components/charts/OrderChart.vue'
</script>

<template>
  <div class="dashboard">
    <!-- 数据卡片：轻量，直接渲染 -->
    <StatCards />

    <!-- 图表：异步加载，先显示占位 -->
    <Suspense>
      <template #default>
        <div class="charts-grid">
          <SalesChart />
          <OrderChart />
        </div>
      </template>
      <template #fallback>
        <div class="chart-skeleton">
          <div class="skeleton-bar" />
        </div>
      </template>
    </Suspense>
  </div>
</template>
```

**其他重组件同理**：

```typescript
// 富文本编辑器：只在打开编辑页时加载
const RichEditor = defineAsyncComponent(() =>
  import('@/components/editor/RichEditor.vue')
)

// 大型表格导出：点击导出时才加载
const ExportDialog = defineAsyncComponent(() =>
  import('@/components/export/ExportDialog.vue')
)

// PDF 预览：打开预览时才加载
const PdfPreview = defineAsyncComponent(() =>
  import('@/components/preview/PdfPreview.vue')
)
```

### 5.3 效果

| 组件 | 全量引入 | 按需引入 | 节省 |
|------|----------|----------|------|
| ECharts | 830KB | 210KB | -75% |
| CodeMirror | 450KB | 不加载（按需） | -100% |
| xlsx (SheetJS) | 380KB | 不加载（按需） | -100% |

首屏 JS 减少约 500KB，JS 解析时间减少约 400ms。

---

## 六、④ 骨架屏 + 关键 CSS 内联（-0.4s）

### 6.1 骨架屏：让用户"感觉"更快

骨架屏不减少真实加载时间，但大幅降低感知等待时间。实测数据显示，骨架屏可减少约 40% 的感知等待时间。

**纯 CSS 骨架屏（最小体积）**：

```vue
<!-- src/components/Skeleton/DashboardSkeleton.vue -->
<template>
  <div class="dashboard-skeleton">
    <div class="stat-row">
      <div v-for="i in 4" :key="i" class="stat-card shimmer" />
    </div>
    <div class="chart-row">
      <div class="chart-card shimmer" />
      <div class="chart-card shimmer" />
    </div>
    <div class="table-card shimmer" />
  </div>
</template>

<style scoped>
.shimmer {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
```

### 6.2 关键 CSS 内联：消除渲染阻塞

**问题**：浏览器在下载并解析外部 CSS 之前不会渲染任何内容。如果 CSS 文件很大或者网络慢，FCP 会被推迟。

**方案**：把首屏渲染需要的最小 CSS 集内联到 HTML 的 `<head>` 中，其余样式异步加载。

```html
<!-- index.html -->
<head>
  <!-- 关键 CSS 内联：侧边栏 + 顶栏 + 骨架屏样式 -->
  <style>
    .app-layout { display: flex; height: 100vh; }
    .app-sidebar { width: 220px; background: #304156; }
    .app-main { flex: 1; display: flex; flex-direction: column; }
    .app-header { height: 50px; border-bottom: 1px solid #eee; }
    .shimmer { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  </style>

  <!-- 非关键 CSS 异步加载 -->
  <link rel="stylesheet" href="/assets/css/element-plus.css" media="print" onload="this.media='all'">
  <link rel="stylesheet" href="/assets/css/main.css" media="print" onload="this.media='all'">
</head>
```

`media="print" onload="this.media='all'"` 是一个经典技巧：浏览器对 `media="print"` 的样式表不阻塞渲染，加载完成后通过 JS 切换为 `all` 应用样式。

### 6.3 效果

- 骨架屏在 600ms 左右出现（TTFB 后立即可见），用户感知 FCP 提前约 2s
- 关键 CSS 内联消除了外部样式表的渲染阻塞，真实 FCP 减少约 300ms

---

## 七、⑤ CDN + Brotli 压缩（-0.3s）

### 7.1 CDN：缩短物理距离

```nginx
# nginx 配置：静态资源走 CDN
location /assets/ {
  add_header Cache-Control "public, max-age=31536000, immutable";
}

# HTML 不缓存，保证更新及时
location / {
  add_header Cache-Control "no-cache";
}
```

**带 hash 的静态资源配置 CDN**：
- JS/CSS/图片：`Cache-Control: max-age=31536000, immutable`（一年缓存，hash 变了文件名就变了）
- HTML：`Cache-Control: no-cache`（每次都检查更新）

### 7.2 Brotli 压缩

```nginx
# nginx 开启 Brotli（优先于 Gzip）
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/javascript application/json image/svg+xml;

# Gzip 作为 fallback
gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/javascript application/json image/svg+xml;
```

Brotli 比 Gzip 压缩率高 15%-25%，尤其对 JS/CSS 文本资源效果显著。

| 资源 | Gzip 后 | Brotli 后 | 节省 |
|------|---------|-----------|------|
| main.js | 420KB | 340KB | -19% |
| element-plus.css | 180KB | 140KB | -22% |
| vendor-vue.js | 95KB | 72KB | -24% |

### 7.3 Preload + Preconnect

```html
<!-- index.html -->
<head>
  <!-- 预连接 CDN 域名，提前完成 DNS + TCP + TLS -->
  <link rel="preconnect" href="https://cdn.example.com" crossorigin>

  <!-- 预加载首屏关键资源 -->
  <link rel="preload" href="/assets/js/vendor-vue.hash.js" as="script">
  <link rel="preload" href="/assets/js/main.hash.js" as="script">

  <!-- 预加载首屏字体 -->
  <link rel="preload" href="/assets/fonts/inter-400.woff2" as="font" type="font/woff2" crossorigin>

  <!-- 字体闪现问题：使用 font-display: swap -->
  <style>
    @font-face { font-family: 'Inter'; src: url('/assets/fonts/inter-400.woff2') format('woff2'); font-display: swap; }
  </style>
</head>
```

**⚠️ Preload 的坑**：只预加载首屏必需资源。预加载太多会跟首屏资源抢带宽，反而变慢。一般不超过 3-5 个。

---

## 八、⑥ 第三方库 externals（-0.2s）

### 8.1 从打包中剔除大型库

对于 Vue、Element Plus 这种全局使用的库，可以通过 CDN 加载 + externals 配置从打包中剔除：

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['vue', 'vue-router', 'pinia'],
      output: {
        globals: {
          vue: 'Vue',
          'vue-router': 'VueRouter',
          pinia: 'Pinia',
        },
      },
    },
  },
})
```

```html
<!-- index.html：从 CDN 加载 -->
<script src="https://cdn.jsdelivr.net/npm/vue@3.4/dist/vue.global.prod.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vue-router@4/dist/vue-router.global.prod.js"></script>
<script src="https://cdn.jsdelivr.net/npm/pinia@2/dist/pinia.iife.prod.js"></script>
```

**⚠️ 注意**：externals 适合"全局稳定"的库。经常发版的业务组件不建议 externals——版本不同步会导致运行时报错。

**我的建议**：只 externals Vue 全家桶 + Element Plus。ECharts 等走按需引入更合适。

---

## 九、⑦ 数据缓存 + Service Worker（二次访问 -0.2s）

### 9.1 接口数据本地缓存

ERP 中大量"字典数据"（如省市列表、行业分类、科目编码）变化频率极低，完全可以缓存到本地：

```typescript
// src/utils/cache.ts
interface CacheItem<T> {
  data: T
  expireAt: number
  version: string  // 版本号，后端更新时前端强制刷新
}

export function createCache<T>(key: string, ttl: number = 24 * 60 * 60 * 1000) {
  return {
    async get(): Promise<T | null> {
      const raw = localStorage.getItem(key)
      if (!raw) return null

      const item: CacheItem<T> = JSON.parse(raw)
      if (Date.now() > item.expireAt) {
        localStorage.removeItem(key)
        return null
      }

      const currentVersion = await getCurrentVersion()  // 检查版本
      if (item.version !== currentVersion) {
        localStorage.removeItem(key)
        return null
      }

      return item.data
    },

    set(data: T, version: string): void {
      const item: CacheItem<T> = {
        data,
        expireAt: Date.now() + ttl,
        version,
      }
      localStorage.setItem(key, JSON.stringify(item))
    },
  }
}
```

**使用**：

```typescript
// 字典数据缓存（24小时过期）
const dictCache = createCache<DictData>('erp-dict', 24 * 60 * 60 * 1000)

async function loadDictData() {
  // 先读缓存
  const cached = await dictCache.get()
  if (cached) return cached

  // 缓存未命中，请求接口
  const data = await api.get('/api/dict/all')
  dictCache.set(data, await getCurrentVersion())
  return data
}
```

### 9.2 Service Worker 离线缓存

```typescript
// public/sw.js
const CACHE_NAME = 'erp-v1'
const STATIC_CACHE = [
  '/',
  '/index.html',
  '/assets/js/vendor-vue.hash.js',
  '/assets/js/main.hash.js',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_CACHE))
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
    })
  )
})
```

**注册 Service Worker**：

```typescript
// src/main.ts
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  })
}
```

---

## 十、⑧ 虚拟列表 + DOM 瘦身（-0.1s）

### 8.1 虚拟列表：只渲染可见项

对于长列表（如订单列表、商品列表），使用虚拟列表只渲染可视区域的 DOM 节点：

```typescript
import { useVirtualList } from '@vueuse/core'

const { list, containerProps, wrapperProps } = useVirtualList(
  computed(() => orderList.value),
  { itemHeight: 60, overscan: 5 }
)
```

### 8.2 DOM 瘦身：减少节点数量

```vue
<!-- ❌ 优化前：每个卡片包含大量 DOM -->
<div class="card">
  <div class="card-header">
    <h3>标题</h3>
    <span class="badge">标签</span>
    <button>操作</button>
  </div>
  <div class="card-body">
    <p>内容...</p>
  </div>
</div>

<!-- ✅ 优化后：使用 CSS Grid 减少嵌套 -->
<div class="card">
  <h3 class="card-title">标题</h3>
  <span class="badge">标签</span>
  <button>操作</button>
  <p class="card-content">内容...</p>
</div>
```

---

## 十一、总结：优化成果与决策建议

### 11.1 最终效果

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| FCP | 4.2s | 1.1s | -74% |
| LCP | 5.8s | 1.8s | -69% |
| TBT | 1800ms | 320ms | -82% |
| 主包体积 | 2.4MB | 680KB | -72% |
| 首屏 JS | 1.8MB | 420KB | -77% |
| 首屏接口 | 8 个串行 | 1 个聚合 + 3 个并行 | -50% |

### 11.2 投入产出比排序

| 优化项 | FCP 影响 | 实施成本 | 投入产出比 | 优先级 |
|--------|----------|----------|-----------|--------|
| 代码分割 + 路由懒加载 | -1.4s | 2h | ⭐⭐⭐⭐⭐ | 1 |
| 接口聚合 + 分层加载 | -0.8s | 3h | ⭐⭐⭐⭐⭐ | 2 |
| 重组件异步加载 | -0.5s | 1h | ⭐⭐⭐⭐ | 3 |
| 骨架屏 + 关键 CSS | -0.4s | 2h | ⭐⭐⭐⭐ | 4 |
| CDN + Brotli | -0.3s | 4h | ⭐⭐⭐ | 5 |
| 第三方库 externals | -0.2s | 1h | ⭐⭐⭐ | 6 |
| 数据缓存 + SW | -0.2s* | 4h | ⭐⭐ | 7 |
| 虚拟列表 + DOM 瘦身 | -0.1s | 3h | ⭐⭐ | 8 |

### 11.3 决策建议

**必须做（前4项）**：
1. 代码分割 + 路由懒加载——投入产出比最高，2小时见效
2. 接口聚合 + 分层加载——后端配合，效果立竿见影
3. 重组件异步加载——ECharts、编辑器等按需加载
4. 骨架屏 + 关键 CSS——提升感知体验

**建议做（5-6项）**：
5. CDN + Brotli——部署时配置，一次配置长期受益
6. 第三方库 externals——适合大型稳定库

**可选做（7-8项）**：
7. 数据缓存 + Service Worker——二次访问效果明显
8. 虚拟列表 + DOM 瘦身——长列表场景必做

### 11.4 踩坑总结

1. **Preload 不要滥用**：只预加载首屏必需资源，3-5个足够
2. **externals 要谨慎**：只用于稳定库，业务组件别用
3. **骨架屏要轻量**：纯 CSS 实现，别引入额外依赖
4. **接口聚合要后端配合**：前端单方面做不了
5. **缓存要有版本控制**：后端更新时前端要能感知

---

*本文基于真实 ERP 项目优化经验，FCP 从 4.2s 降至 1.1s，实测可用。*