---
title: 'Vue3 + Vitest 单元测试实战指南'
date: 2026-05-31
description: '从零开始搭建Vue3项目单元测试环境，涵盖组件测试、Composables测试、Pinia Store测试、Mock技巧、覆盖率配置与CI集成'
tags: ['Vue3', 'Vitest', '单元测试', '测试', '前端工程化']
---

# Vue3 + Vitest 单元测试实战指南

> 测试不是目的，可维护、可信心重构才是。坚持写测试，减少的不是代码量，是深夜被叫醒的概率。

## 前言：为什么选择 Vitest？

Vitest 是 Vite 原生的单元测试框架，核心优势：

- **零配置**：与 Vite 共享配置，开箱即用
- **极速**：基于 Vite 的 ESM 支持，启动速度比 Jest 快 10-100 倍
- **兼容 Jest**：API 设计与 Jest 高度兼容，迁移成本低
- **原生 ESM**：不需要 babel 转译，直接运行 TypeScript
- **内置功能丰富**：覆盖率、Mock、Snapshot、UI 界面一应俱全

> **适用场景**：Vue3 + Vite 项目。如果你用的是 Webpack + Jest，也可以迁移到 Vitest。

---

## 一、环境搭建与基础配置

### 1.1 安装依赖

```bash
npm install -D vitest @vue/test-utils @vitest/ui jsdom @vitest/coverage-v8 happy-dom
```

或者用 pnpm：

```bash
pnpm add -D vitest @vue/test-utils @vitest/ui jsdom @vitest/coverage-v8 happy-dom
```

**依赖说明**：

| 依赖 | 作用 |
|------|------|
| vitest | 测试框架核心 |
| @vue/test-utils | Vue 组件测试工具 |
| @vitest/ui | 可视化测试界面 |
| jsdom / happy-dom | 浏览器环境模拟（二选一） |
| @vitest/coverage-v8 | 覆盖率工具 |

**jsdom vs happy-dom**：

- **jsdom**：成熟稳定，但性能较慢
- **happy-dom**：性能更好，API 更现代，但某些边缘场景可能不支持

**我的建议**：优先用 happy-dom，遇到兼容问题时再切 jsdom。

### 1.2 Vitest 配置文件

创建 `vitest.config.ts`：

```typescript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    // 测试环境
    environment: 'jsdom', // 或 'happy-dom'

    // 全局 API（不需要 import describe/it/expect）
    globals: true,

    // 设置文件（全局测试配置）
    setupFiles: ['./src/test/setup.ts'],

    // 测试文件匹配模式
    include: ['src/**/*.{test,spec}.{ts,tsx}'],

    // 排除文件
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],

    // 覆盖率配置
    coverage: {
      provider: 'v8', // 或 'istanbul'
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'src/test/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts', // 入口文件不计入
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },

    // 并行执行
    pool: 'threads', // 或 'forks'
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },

    // 超时时间
    testTimeout: 10000,
    hookTimeout: 10000,
  },

  // 路径别名（与 Vite 配置保持一致）
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
```

### 1.3 全局测试设置文件

创建 `src/test/setup.ts`：

```typescript
import { vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
} as any

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any
```

### 1.4 package.json 脚本配置

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch"
  }
}
```

### 1.5 VSCode 配置

创建 `.vscode/settings.json`：

```json
{
  "vitest.enable": true,
  "vitest.rootPath": "${workspaceFolder}",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

创建 `.vscode/extensions.json`：

```json
{
  "recommendations": [
    "vitest.explorer",
    "dbaeumer.vscode-eslint"
  ]
}
```

---

## 二、组件测试：从简单到复杂

### 2.1 最简单的组件测试

```vue
<!-- components/HelloWorld.vue -->
<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <button @click="increment">Count: {{ count }}</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  msg: string
}>()

const count = ref(0)

function increment() {
  count.value++
}
</script>
```

```typescript
// components/HelloWorld.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HelloWorld from './HelloWorld.vue'

describe('HelloWorld', () => {
  it('renders message', () => {
    const msg = 'Hello Vitest'
    const wrapper = mount(HelloWorld, {
      props: { msg },
    })

    expect(wrapper.find('h1').text()).toBe(msg)
  })

  it('increments count when button clicked', async () => {
    const wrapper = mount(HelloWorld, {
      props: { msg: 'Test' },
    })

    expect(wrapper.find('button').text()).toBe('Count: 0')

    await wrapper.find('button').trigger('click')
    expect(wrapper.find('button').text()).toBe('Count: 1')
  })
})
```

### 2.2 Props 测试

```vue
<!-- components/UserCard.vue -->
<template>
  <div class="user-card">
    <h3>{{ user.name }}</h3>
    <p>{{ user.email }}</p>
    <span v-if="user.isAdmin" class="badge">管理员</span>
  </div>
</template>

<script setup lang="ts">
interface User {
  name: string
  email: string
  isAdmin: boolean
}

defineProps<{
  user: User
}>()
</script>
```

```typescript
// components/UserCard.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UserCard from './UserCard.vue'

describe('UserCard', () => {
  it('renders user information', () => {
    const user = {
      name: '张三',
      email: 'zhang@example.com',
      isAdmin: false,
    }

    const wrapper = mount(UserCard, {
      props: { user },
    })

    expect(wrapper.find('h3').text()).toBe('张三')
    expect(wrapper.find('p').text()).toBe('zhang@example.com')
  })

  it('shows admin badge for admin users', () => {
    const adminUser = {
      name: '管理员',
      email: 'admin@example.com',
      isAdmin: true,
    }

    const wrapper = mount(UserCard, {
      props: { user: adminUser },
    })

    expect(wrapper.find('.badge').exists()).toBe(true)
    expect(wrapper.find('.badge').text()).toBe('管理员')
  })

  it('does not show badge for regular users', () => {
    const regularUser = {
      name: '普通用户',
      email: 'user@example.com',
      isAdmin: false,
    }

    const wrapper = mount(UserCard, {
      props: { user: regularUser },
    })

    expect(wrapper.find('.badge').exists()).toBe(false)
  })
})
```

### 2.3 Emits 测试

```vue
<!-- components/Counter.vue -->
<template>
  <div>
    <button @click="increment">+</button>
    <span>{{ count }}</span>
    <button @click="decrement">-</button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  count: number
}>()

const emit = defineEmits<{
  increment: []
  decrement: []
  change: [value: number]
}>()

function increment() {
  emit('increment')
  emit('change', props.count + 1)
}

function decrement() {
  emit('decrement')
  emit('change', props.count - 1)
}
</script>
```

```typescript
// components/Counter.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Counter from './Counter.vue'

describe('Counter', () => {
  it('emits increment event', async () => {
    const wrapper = mount(Counter, {
      props: { count: 0 },
    })

    await wrapper.find('button:first-child').trigger('click')

    expect(wrapper.emitted('increment')).toBeTruthy()
    expect(wrapper.emitted('increment')).toHaveLength(1)
  })

  it('emits change event with new value', async () => {
    const wrapper = mount(Counter, {
      props: { count: 5 },
    })

    await wrapper.find('button:first-child').trigger('click')

    expect(wrapper.emitted('change')).toBeTruthy()
    expect(wrapper.emitted('change')?.[0]).toEqual([6])
  })

  it('emits both increment and change on click', async () => {
    const wrapper = mount(Counter, {
      props: { count: 0 },
    })

    await wrapper.find('button:first-child').trigger('click')

    expect(wrapper.emitted('increment')).toHaveLength(1)
    expect(wrapper.emitted('change')).toHaveLength(1)
  })
})
```

### 2.4 Slots 测试

```vue
<!-- components/Card.vue -->
<template>
  <div class="card">
    <div class="card-header">
      <slot name="header">
        <h3>默认标题</h3>
      </slot>
    </div>
    <div class="card-body">
      <slot>
        <p>默认内容</p>
      </slot>
    </div>
    <div class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>
```

```typescript
// components/Card.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Card from './Card.vue'

describe('Card', () => {
  it('renders default slots', () => {
    const wrapper = mount(Card)

    expect(wrapper.find('.card-header h3').text()).toBe('默认标题')
    expect(wrapper.find('.card-body p').text()).toBe('默认内容')
  })

  it('renders custom header slot', () => {
    const wrapper = mount(Card, {
      slots: {
        header: '<h2>自定义标题</h2>',
      },
    })

    expect(wrapper.find('.card-header h2').text()).toBe('自定义标题')
  })

  it('renders custom default slot', () => {
    const wrapper = mount(Card, {
      slots: {
        default: '<p>这是自定义内容</p>',
      },
    })

    expect(wrapper.find('.card-body p').text()).toBe('这是自定义内容')
  })

  it('renders multiple slots', () => {
    const wrapper = mount(Card, {
      slots: {
        header: '<h2>标题</h2>',
        default: '<p>内容</p>',
        footer: '<button>按钮</button>',
      },
    })

    expect(wrapper.find('.card-header h2').exists()).toBe(true)
    expect(wrapper.find('.card-body p').exists()).toBe(true)
    expect(wrapper.find('.card-footer button').exists()).toBe(true)
  })
})
```

### 2.5 v-model 测试

```vue
<!-- components/InputField.vue -->
<template>
  <div class="input-field">
    <label>{{ label }}</label>
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      :placeholder="placeholder"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  modelValue: string
  placeholder?: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
```

```typescript
// components/InputField.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import InputField from './InputField.vue'

describe('InputField', () => {
  it('renders label and input', () => {
    const wrapper = mount(InputField, {
      props: {
        label: '用户名',
        modelValue: '',
      },
    })

    expect(wrapper.find('label').text()).toBe('用户名')
    expect(wrapper.find('input').exists()).toBe(true)
  })

  it('binds modelValue to input', () => {
    const wrapper = mount(InputField, {
      props: {
        label: '用户名',
        modelValue: 'test',
      },
    })

    expect(wrapper.find('input').element.value).toBe('test')
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(InputField, {
      props: {
        label: '用户名',
        modelValue: '',
      },
    })

    const input = wrapper.find('input')
    await input.setValue('new value')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['new value'])
  })

  it('renders placeholder', () => {
    const wrapper = mount(InputField, {
      props: {
        label: '用户名',
        modelValue: '',
        placeholder: '请输入用户名',
      },
    })

    expect(wrapper.find('input').attributes('placeholder')).toBe('请输入用户名')
  })
})
```

### 2.6 异步组件测试

```vue
<!-- components/AsyncData.vue -->
<template>
  <div>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="data">{{ data }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const loading = ref(true)
const error = ref<string | null>(null)
const data = ref<string | null>(null)

onMounted(async () => {
  try {
    // 模拟异步数据获取
    await new Promise((resolve) => setTimeout(resolve, 100))
    data.value = '异步数据'
  } catch (e) {
    error.value = '加载失败'
  } finally {
    loading.value = false
  }
})
</script>
```

```typescript
// components/AsyncData.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AsyncData from './AsyncData.vue'

describe('AsyncData', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows loading state initially', () => {
    const wrapper = mount(AsyncData)
    expect(wrapper.find('.loading').exists()).toBe(true)
  })

  it('shows data after loading', async () => {
    const wrapper = mount(AsyncData)

    // 快进时间
    vi.advanceTimersByTime(100)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.loading').exists()).toBe(false)
    expect(wrapper.find('.data').exists()).toBe(true)
    expect(wrapper.find('.data').text()).toBe('异步数据')
  })

  it('handles error state', async () => {
    // Mock setTimeout to reject
    vi.spyOn(global, 'setTimeout').mockImplementation((fn) => {
      fn()
      return 0 as any
    })

    // 这里需要修改组件逻辑来测试错误状态
    // 实际项目中通常通过注入依赖来 mock
  })
})
```

---

## 三、Composables 测试

### 3.1 简单的 Composable 测试

```typescript
// composables/useCounter.ts
import { ref, computed } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)
  const doubled = computed(() => count.value * 2)

  function increment() {
    count.value++
  }

  function decrement() {
    count.value--
  }

  function reset() {
    count.value = initialValue
  }

  return {
    count,
    doubled,
    increment,
    decrement,
    reset,
  }
}
```

```typescript
// composables/useCounter.spec.ts
import { describe, it, expect } from 'vitest'
import { useCounter } from './useCounter'

describe('useCounter', () => {
  it('initializes with default value', () => {
    const { count } = useCounter()
    expect(count.value).toBe(0)
  })

  it('initializes with custom value', () => {
    const { count } = useCounter(5)
    expect(count.value).toBe(5)
  })

  it('increments count', () => {
    const { count, increment } = useCounter()
    increment()
    expect(count.value).toBe(1)
  })

  it('decrements count', () => {
    const { count, decrement } = useCounter(5)
    decrement()
    expect(count.value).toBe(4)
  })

  it('calculates doubled value', () => {
    const { count, doubled } = useCounter(3)
    expect(doubled.value).toBe(6)
    count.value = 5
    expect(doubled.value).toBe(10)
  })

  it('resets to initial value', () => {
    const { count, increment, reset } = useCounter(0)
    increment()
    increment()
    expect(count.value).toBe(2)
    reset()
    expect(count.value).toBe(0)
  })
})
```

### 3.2 带 Watch 的 Composable 测试

```typescript
// composables/useLocalStorage.ts
import { ref, watch } from 'vue'

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const value = ref<T>(
    () => {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : defaultValue
    }
  )

  watch(
    value,
    (newValue) => {
      if (newValue === null) {
        localStorage.removeItem(key)
      } else {
        localStorage.setItem(key, JSON.stringify(newValue))
      }
    },
    { deep: true }
  )

  function reset() {
    value.value = defaultValue
    localStorage.removeItem(key)
  }

  return { value, reset }
}
```

```typescript
// composables/useLocalStorage.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useLocalStorage } from './useLocalStorage'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
})

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('initializes with default value when not in storage', () => {
    const { value } = useLocalStorage('test-key', 'default')
    expect(value.value).toBe('default')
  })

  it('reads existing value from storage', () => {
    localStorageMock.getItem.mockReturnValueOnce('"stored"')
    const { value } = useLocalStorage('test-key', 'default')
    expect(value.value).toBe('stored')
  })

  it('saves value to storage on change', async () => {
    const { value } = useLocalStorage('test-key', 'default')
    
    // 触发 watch
    value.value = 'updated'
    await vi.waitFor(() => {})
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'test-key',
      '"updated"'
    )
  })

  it('removes item from storage when set to null', async () => {
    const { value } = useLocalStorage('test-key', 'default')
    
    value.value = null as any
    await vi.waitFor(() => {})
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key')
  })

  it('resets to default and clears storage', async () => {
    localStorageMock.getItem.mockReturnValueOnce('"old"')
    const { value, reset } = useLocalStorage('test-key', 'default')
    
    expect(value.value).toBe('old')
    
    reset()
    
    expect(value.value).toBe('default')
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key')
  })
})
```

---

## 四、Pinia Store 测试

### 4.1 Store 定义（Setup Store vs Options Store）

```typescript
// stores/cart.ts - Setup Store
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

export const useCartStore = defineStore('cart', () => {
  // State
  const items = ref<CartItem[]>([])
  const couponCode = ref<string | null>(null)

  // Getters
  const totalItems = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  )

  const totalPrice = computed(() => {
    const subtotal = items.value.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
    // 简单折扣逻辑
    if (couponCode.value === 'SAVE10') {
      return subtotal * 0.9
    }
    return subtotal
  })

  // Actions
  function addItem(item: Omit<CartItem, 'id'>) {
    const existing = items.value.find((i) => i.name === item.name)
    if (existing) {
      existing.quantity += item.quantity
    } else {
      items.value.push({
        ...item,
        id: crypto.randomUUID(),
      })
    }
  }

  function updateQuantity(itemId: string, quantity: number) {
    const item = items.value.find((i) => i.id === itemId)
    if (item) {
      item.quantity = Math.max(0, quantity)
      if (item.quantity === 0) {
        removeItem(itemId)
      }
    }
  }

  function removeItem(itemId: string) {
    const index = items.value.findIndex((i) => i.id === itemId)
    if (index > -1) {
      items.value.splice(index, 1)
    }
  }

  function applyCoupon(code: string) {
    couponCode.value = code
  }

  function clearCart() {
    items.value = []
    couponCode.value = null
  }

  return {
    items,
    couponCode,
    totalItems,
    totalPrice,
    addItem,
    updateQuantity,
    removeItem,
    applyCoupon,
    clearCart,
  }
})
```

### 4.2 独立 Store 测试（推荐）

```typescript
// stores/cart.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from './cart'

describe('useCartStore', () => {
  beforeEach(() => {
    // 创建隔离的 Pinia 实例
    setActivePinia(createPinia())
  })

  describe('State & Getters', () => {
    it('initializes with empty cart', () => {
      const cart = useCartStore()
      expect(cart.items).toEqual([])
      expect(cart.totalItems).toBe(0)
      expect(cart.totalPrice).toBe(0)
    })

    it('calculates total items correctly', () => {
      const cart = useCartStore()
      cart.items = [
        { id: '1', name: '苹果', price: 5, quantity: 2 },
        { id: '2', name: '香蕉', price: 3, quantity: 3 },
      ]
      expect(cart.totalItems).toBe(5)
    })

    it('calculates total price correctly', () => {
      const cart = useCartStore()
      cart.items = [
        { id: '1', name: '苹果', price: 5, quantity: 2 },
      ]
      expect(cart.totalPrice).toBe(10)
    })

    it('applies coupon discount', () => {
      const cart = useCartStore()
      cart.items = [{ id: '1', name: '苹果', price: 100, quantity: 1 }]
      cart.applyCoupon('SAVE10')
      expect(cart.totalPrice).toBe(90)
    })
  })

  describe('Actions', () => {
    it('adds new item', () => {
      const cart = useCartStore()
      cart.addItem({ name: '橙子', price: 8, quantity: 1 })
      
      expect(cart.items).toHaveLength(1)
      expect(cart.items[0].name).toBe('橙子')
      expect(cart.items[0].price).toBe(8)
    })

    it('increases quantity for existing item', () => {
      const cart = useCartStore()
      cart.addItem({ name: '苹果', price: 5, quantity: 1 })
      cart.addItem({ name: '苹果', price: 5, quantity: 2 })
      
      expect(cart.items).toHaveLength(1)
      expect(cart.items[0].quantity).toBe(3)
    })

    it('updates item quantity', () => {
      const cart = useCartStore()
      cart.addItem({ name: '香蕉', price: 3, quantity: 1 })
      const itemId = cart.items[0].id
      
      cart.updateQuantity(itemId, 5)
      
      expect(cart.items[0].quantity).toBe(5)
    })

    it('removes item when quantity set to 0', () => {
      const cart = useCartStore()
      cart.addItem({ name: '葡萄', price: 12, quantity: 2 })
      const itemId = cart.items[0].id
      
      cart.updateQuantity(itemId, 0)
      
      expect(cart.items).toHaveLength(0)
    })

    it('removes item directly', () => {
      const cart = useCartStore()
      cart.addItem({ name: '草莓', price: 15, quantity: 1 })
      const itemId = cart.items[0].id
      
      cart.removeItem(itemId)
      
      expect(cart.items).toHaveLength(0)
    })

    it('clears entire cart', () => {
      const cart = useCartStore()
      cart.addItem({ name: '苹果', price: 5, quantity: 1 })
      cart.addItem({ name: '香蕉', price: 3, quantity: 2 })
      cart.applyCoupon('SAVE10')
      
      cart.clearCart()
      
      expect(cart.items).toEqual([])
      expect(cart.couponCode).toBeNull()
      expect(cart.totalPrice).toBe(0)
    })
  })
})
```

---

## 五、覆盖率配置与 CI 集成

### 5.1 覆盖率配置详解

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8', // 或 'istanbul'
      reporter: ['text', 'text-summary', 'html', 'lcov', 'json'],
      reportsDirectory: './coverage',
      
      // 文件排除
      exclude: [
        'node_modules/**',
        'src/test/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts', // 入口文件不计入
      ],
      
      // 包含特定文件
      include: ['src/**/*.ts', 'src/**/*.vue'],
      
      // 阈值配置（低于会失败）
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
        
        // 每文件阈值
        perFile: true,
        100: ['**/*.util.ts'], // 工具函数要求 100%
        
        // 忽略未覆盖的文件
        allowEmptyLines: true,
        ignoreClassMethods: ['render', 'setup'],
      },
    },
  },
})
```

### 5.2 GitHub Actions 配置

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v3
        with:
          version: 9
          
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Run unit tests
        run: pnpm test:run
        
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        if: success()
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: vitest-coverage
          
      - name: Upload coverage to GitHub
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report
          path: coverage/
```

---

## 六、常见踩坑与 FAQ

### 6.1 异步测试相关

**❌ 错误：直接检查未 await 的异步状态**

```typescript
// 错误写法
it('fetches data', () => {
  const wrapper = mount(AsyncComponent)
  // 此时 Promise 还未 resolve
  expect(wrapper.find('.loading').exists()).toBe(false) // 测试通过是假象
})
```

**✅ 正确写法：使用 vi.waitFor 或 await nextTick**

```typescript
// 方法 1: vi.waitFor（推荐）
it('fetches data', async () => {
  const wrapper = mount(AsyncComponent)
  
  await vi.waitFor(() => {
    expect(wrapper.find('.loading').exists()).toBe(false)
  })
})
```

### 6.2 组件挂载相关

**❌ 错误：忘记配置 Vue Router/Pinia**

```typescript
// 组件依赖 Pinia store，但不提供
const wrapper = mount(ComponentUsingStore) // 报错：getActivePinia() was called with no active Pinia instance
```

**✅ 正确：提供必要的全局配置**

```typescript
const wrapper = mount(ComponentUsingStore, {
  global: {
    plugins: [createTestingPinia()],
  },
})
```

### 6.3 DOM 更新等待

**❌ 错误：trigger 后立即断言**

```typescript
await wrapper.find('button').trigger('click')
expect(wrapper.find('.count').text()).toBe('1') // 可能还是 '0'
```

**✅ 正确：await nextTick**

```typescript
await wrapper.find('button').trigger('click')
await wrapper.vm.$nextTick()
expect(wrapper.find('.count').text()).toBe('1')
```

### 6.4 Pinia Store 测试陷阱

**❌ 错误：在不同测试间共享 store 状态**

```typescript
const store = useCartStore() // 全局 store 实例，状态会累积
```

**✅ 正确：在 beforeEach 中创建新 Pinia**

```typescript
beforeEach(() => {
  setActivePinia(createPinia()) // 每个测试都是全新状态
})
```

### 6.5 Mock 模块加载顺序

**❌ 错误：vi.mock 在导入之后**

```typescript
import { myFunction } from './module' // 先导入
vi.mock('./module', () => ({...})) // ❌ 太晚了
```

**✅ 正确：vi.mock 必须在导入之前**

```typescript
vi.mock('./module', () => ({
  myFunction: vi.fn().mockReturnValue('mocked'),
}))

import { myFunction } from './module' // 后导入
```

---

## 总结

本文覆盖了 Vue3 + Vitest 单元测试的核心场景，核心要点：

1. **配置**：Vitest 与 Vite 零配置集成，核心是 `environment: 'jsdom'` + `globals: true`
2. **组件测试**：mount vs shallowMount 选型，props/emits/slots/v-model 全覆盖
3. **Composables 测试**：直接测试函数返回值和响应式状态
4. **Pinia 测试**：Setup Store 更易测试，`createTestingPinia` 处理全局配置
5. **Mock 技巧**：`vi.fn()` 追踪调用，`vi.spyOn()` 监听方法，`vi.mock()` 模块级替换
6. **异步处理**：`vi.waitFor`、`flushPromises`、`vi.useFakeTimers()` 三大神器
7. **CI 集成**：GitHub Actions / GitLab CI 配置覆盖率上报
8. **避坑**：异步必须 await、mock 必须在 import 之前、timer mock 必须 restore

测试不是目的，可维护、可信心重构才是。坚持写测试，减少的不是代码量，是深夜被叫醒的概率。

---

**参考资料**

- [Vitest 官方文档](https://vitest.dev/)
- [Vue Test Utils 官方文档](https://test-utils.vuejs.org/)
- [Pinia Testing Guide](https://pinia.vuejs.org/cookbook/testing.html)
- [Vitest 4.0 Release](https://vitest.dev/blog/vitest-4)