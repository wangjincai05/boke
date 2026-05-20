---
title: 'Qiankun 微前端架构实战教程'
date: 2024-08-20
description: '基于实际项目演示如何使用 qiankun 构建微前端架构，包含主应用配置、子应用改造、全局状态管理和部署方案'
tags: ['微前端', 'Qiankun', 'Vue', 'React', '架构']
---

## 项目概述

本教程基于实际项目演示如何使用 qiankun 构建微前端架构。项目包含：

- **主应用 (vue-project)**: Vue 3 + TypeScript + Element Plus
- **子应用**: React、Vue、Umi 三个不同技术栈的应用

## 目录结构

```bash
qiankun/
├── vue-project/          # 主应用 (Vue 3)
├── react-app/           # React 子应用
├── vue-app/             # Vue 子应用  
├── umi-app/             # Umi 子应用
└── micro-base/          # 基础配置
```

## 一、主应用配置

### 1.1 安装依赖

```bash
npm install qiankun
```

### 1.2 主应用入口文件 (main.ts)

```typescript
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './qiankun'

import 'virtual:svg-icons-register'
import components from '@/components/index'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import '@/styles/index.scss'

const app = createApp(App)

app.use(ElementPlus)
app.use(components)
app.use(router)

app.mount('#app')
```

### 1.3 Qiankun 配置文件 (qiankun.ts)

```typescript
import { start, registerMicroApps, initGlobalState } from 'qiankun'

const apps = [
    {
        name: 'sub-react',
        entry: '//localhost:8080',
        activeRule: '/sub-react',
        container: '#sub-app'
    },
    {
        name: 'sub-vue',
        entry: '//localhost:3002',
        activeRule: '/sub-vue',
        container: '#sub-app'
    },
    {
        name: 'sub-umi',
        entry: '//localhost:3003',
        activeRule: '/sub-umi',
        container: '#sub-app'
    }
]

registerMicroApps(apps, {
    beforeLoad: [async app => console.log('before load', app.name)],
    beforeMount: [async app => console.log('before mount', app.name)],
    afterMount: [async app => console.log('after mount', app.name)]
})

const state = { count: 1 }
const actions = initGlobalState(state)

actions.onGlobalStateChange((state, prev) => {
    console.log('全局状态变化:', state, prev)
})

actions.setGlobalState(state)

start()
```

### 1.4 主应用路由配置

```typescript
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('@/views/Home.vue')
    },
    {
        path: '/sub-react/:pathMatch(.*)*',
        name: 'SubReact',
        component: () => import('@/views/SubApp.vue')
    },
    {
        path: '/sub-vue/:pathMatch(.*)*',
        name: 'SubVue',
        component: () => import('@/views/SubApp.vue')
    },
    {
        path: '/sub-umi/:pathMatch(.*)*',
        name: 'SubUmi',
        component: () => import('@/views/SubApp.vue')
    }
]

export default createRouter({
    history: createWebHistory(),
    routes
})
```

### 1.5 子应用容器组件

```vue
<template>
    <div id="sub-app"></div>
</template>

<script setup lang="ts">
</script>
```

## 二、子应用配置

### 2.1 React 子应用配置

**安装依赖**
```bash
npm install @rescripts/cli --save-dev
```

**修改 package.json**
```json
{
    "scripts": {
        "start": "rescripts start",
        "build": "rescripts build"
    }
}
```

**创建 .rescriptsrc.js**
```javascript
const { name } = require('./package')

module.exports = {
    webpack: (config) => {
        config.output.library = `${name}-[name]`
        config.output.libraryTarget = 'umd'
        config.output.globalObject = 'window'
        config.output.chunkLoadingGlobal = `webpackJsonp_${name}`
        return config
    },
    devServer: (_) => {
        const config = _
        config.headers = {
            'Access-Control-Allow-Origin': '*'
        }
        config.historyApiFallback = true
        config.hot = false
        config.liveReload = false
        return config
    }
}
```

**修改入口文件 src/index.js**
```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

let root

function render(props) {
    const { container } = props
    const dom = container ? container.querySelector('#root') : document.querySelector('#root')
    root = ReactDOM.createRoot(dom)
    root.render(<App />)
}

if (!window.__POWERED_BY_QIANKUN__) {
    render({})
}

export async function bootstrap() {
    console.log('[react16] react app bootstraped')
}

export async function mount(props) {
    console.log('[react16] props from main framework', props)
    render(props)
}

export async function unmount(props) {
    const { container } = props
    const dom = container ? container.querySelector('#root') : document.querySelector('#root')
    root && root.unmount()
}
```

### 2.2 Vue 子应用配置

**修改 vue.config.js**
```javascript
const { defineConfig } = require('@vue/cli-service')
const { name } = require('./package')

module.exports = defineConfig({
    transpileDependencies: true,
    configureWebpack: {
        output: {
            library: `${name}-[name]`,
            libraryTarget: 'umd',
            globalObject: 'window',
            chunkLoadingGlobal: `webpackJsonp_${name}`
        }
    },
    devServer: {
        port: 3002,
        headers: {
            'Access-Control-Allow-Origin': '*'
        }
    }
})
```

**修改入口文件 src/main.js**
```javascript
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

let instance = null

function render(props = {}) {
    const { container } = props
    instance = createApp(App)
    instance.use(router)
    instance.mount(container ? container.querySelector('#app') : '#app')
}

if (!window.__POWERED_BY_QIANKUN__) {
    render()
}

export async function bootstrap() {
    console.log('[vue] vue app bootstraped')
}

export async function mount(props) {
    console.log('[vue] props from main framework', props)
    render(props)
}

export async function unmount() {
    instance.unmount()
    instance._container.innerHTML = ''
    instance = null
}
```

### 2.3 Umi 子应用配置

**修改 .umirc.ts**
```typescript
import { defineConfig } from 'umi'

export default defineConfig({
    nodeModulesTransform: {
        type: 'none'
    },
    routes: [
        { path: '/', component: '@/pages/index' }
    ],
    fastRefresh: {},
    qiankun: {
        slave: {}
    },
    base: '/sub-umi/',
    publicPath: '/sub-umi/'
})
```

## 三、全局状态管理

### 3.1 主应用中使用全局状态

```typescript
import { initGlobalState } from 'qiankun'

const initialState = {
    user: { name: 'admin', token: 'xxx' },
    theme: 'light'
}

const actions = initGlobalState(initialState)

actions.onGlobalStateChange((state, prev) => {
    console.log('主应用监听到状态变化:', state, prev)
})

actions.setGlobalState({
    user: { name: 'user1', token: 'yyy' }
})
```

### 3.2 子应用中使用全局状态

```javascript
export async function mount(props) {
    const { onGlobalStateChange, setGlobalState } = props
    
    onGlobalStateChange((state, prev) => {
        console.log('子应用监听到状态变化:', state, prev)
    })
    
    setGlobalState({
        theme: 'dark'
    })
    
    render(props)
}
```

## 四、应用间通信

### 4.1 主应用向子应用传递数据

```typescript
registerMicroApps([
    {
        name: 'sub-react',
        entry: '//localhost:8080',
        activeRule: '/sub-react',
        container: '#sub-app',
        props: {
            data: { message: 'Hello from main app' },
            methods: {
                onRouteChange: (path) => {
                    console.log('子应用路由变化:', path)
                }
            }
        }
    }
])
```

### 4.2 子应用接收数据

```javascript
export async function mount(props) {
    const { data, methods } = props
    console.log('接收到主应用数据:', data)
    
    methods.onRouteChange('/sub-react/page1')
    
    render(props)
}
```

## 五、样式隔离

```typescript
start({
    sandbox: {
        strictStyleIsolation: true
    }
})
```

## 六、部署配置

### 6.1 开发环境启动

```bash
cd vue-project && npm run dev
cd react-app && npm start
cd vue-app && npm run serve
cd umi-app && npm run dev
```

### 6.2 生产环境部署

```nginx
server {
    listen 80;
    server_name example.com;
    
    location / {
        root /var/www/main-app;
        try_files $uri $uri/ /index.html;
    }
    
    location /sub-react {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
    }
    
    location /sub-vue {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
    }
    
    location /sub-umi {
        proxy_pass http://localhost:3003;
        proxy_set_header Host $host;
    }
}
```

## 七、常见问题与解决方案

### 7.1 跨域问题
```javascript
devServer: {
    headers: {
        'Access-Control-Allow-Origin': '*'
    }
}
```

### 7.2 路由问题
```javascript
const router = new VueRouter({
    mode: 'history',
    base: window.__POWERED_BY_QIANKUN__ ? '/sub-vue' : '/',
    routes
})
```

### 7.3 静态资源加载问题
```javascript
if (window.__POWERED_BY_QIANKUN__) {
    __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__
}
```

## 八、最佳实践

- **应用拆分原则**：按业务域拆分、技术栈独立、团队独立开发
- **性能优化**：预加载子应用、资源共享、缓存策略
- **错误处理**：全局错误捕获、降级处理

## 总结

通过本教程，你已经学会了：
1. 如何配置 qiankun 主应用
2. 如何改造现有应用为 qiankun 子应用
3. 应用间通信和状态管理
4. 样式隔离和部署配置
5. 常见问题的解决方案

qiankun 为微前端架构提供了完整的解决方案，让不同技术栈的应用能够无缝集成。