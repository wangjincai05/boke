---
title: 'Vue3 前端权限系统设计实战：RBAC + 动态路由 + 按钮级权限'
date: 2026-05-28
description: '基于真实项目经验，详解Vue3 + Pinia + Vue Router的完整权限系统实现，包含RBAC模型、动态路由、按钮级权限、权限缓存与刷新'
tags: ['Vue3', '权限系统', 'RBAC', '动态路由', 'Pinia']
---

> 权限系统是中大型后台管理系统的核心，本文基于真实项目经验，从零开始构建一套完整的权限系统。

## 前言：为什么需要权限系统？

权限系统的核心目的：

1. **数据安全**：防止未授权访问敏感数据和功能
2. **用户体验**：只展示用户有权限的功能，减少混淆
3. **合规要求**：满足企业审计和合规需求
4. **多租户支持**：不同租户/角色看到不同的功能

**前端权限 vs 后端权限**：

| 维度 | 前端权限 | 后端权限 |
|------|---------|---------|
| 作用 | 用户体验优化、减少无效请求 | 数据安全、最终防线 |
| 实现 | 路由守卫、按钮隐藏 | API 权限校验、数据库权限 |
| 重要性 | 重要，但不可替代后端 | 必须有，是安全底线 |

**核心原则**：前端权限只是"体验优化"，后端权限才是"安全防线"。所有敏感操作必须后端再次校验。

---

## 一、RBAC 权限模型设计

### 1.1 RBAC 基础概念

RBAC（Role-Based Access Control，基于角色的访问控制）是最常用的权限模型，核心思想：

```bash
用户 → 角色 → 权限
```

- **用户**：系统的使用者
- **角色**：权限的集合（如管理员、编辑、访客）
- **权限**：对资源的操作（如 `article:create`、`user:delete`）

### 1.2 数据模型设计

```typescript
// types/permission.ts

/**
 * 权限标识类型
 */
export type PermissionCode = string

/**
 * 角色类型
 */
export interface Role {
  id: string | number
  code: string        // 角色编码，如 'admin', 'editor'
  name: string        // 角色名称
  description?: string
  permissions?: PermissionCode[]  // 角色拥有的权限（可选，也可以从用户权限中获取）
}

/**
 * 菜单类型
 */
export enum MenuType {
  DIRECTORY = 'directory',  // 目录
  MENU = 'menu',           // 菜单
  BUTTON = 'button',       // 按钮
}

/**
 * 菜单项
 */
export interface MenuItem {
  id: string | number
  parentId?: string | number | null
  name: string              // 菜单名称
  path: string              // 路由路径
  routeName?: string        // 路由名称
  component?: string        // 组件路径
  icon?: string             // 图标
  type: MenuType            // 菜单类型
  permission?: PermissionCode  // 访问权限
  children?: MenuItem[]     // 子菜单
  hidden?: boolean          // 是否隐藏
  orderNum?: number         // 排序号
  isExternal?: boolean      // 是否外链
  url?: string              // 外链地址
}

/**
 * 用户信息
 */
export interface UserInfo {
  id: string | number
  username: string
  nickname?: string
  avatar?: string
  roles: Role[]
  permissions: PermissionCode[]  // 用户拥有的所有权限（去重）
  menus: MenuItem[]              // 用户可见的菜单树
}
```

### 1.3 RBAC0 vs RBAC1 vs RBAC2

| 模型 | 特点 | 适用场景 |
|------|------|---------|
| RBAC0 | 用户-角色-权限三层 | 绝大多数系统 |
| RBAC1 | 角色继承（角色可以有子角色） | 组织架构复杂的系统 |
| RBAC2 | 角色限制（互斥角色、基数限制） | 金融、医疗等高安全要求场景 |

**本文实现 RBAC0**，这是最常用且够用的模型。

---

## 二、动态路由实现

### 2.1 路由配置

```typescript
// router/staticRoutes.ts
import type { RouteRecordRaw } from 'vue-router'

export const staticRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: {
      title: '登录',
      hidden: true,
    },
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: {
      title: '404',
      hidden: true,
    },
  },
]

export const Layout = () => import('@/layout/index.vue')

// 404 路由单独处理，必须在最后添加
export const notFoundRoute: RouteRecordRaw = {
  path: '/:pathMatch(.*)*',
  redirect: '/404',
  meta: {
    hidden: true,
  },
}
```

```typescript
// router/asyncRoutes.ts
import type { RouteRecordRaw } from 'vue-router'

export const asyncRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: {
          title: '首页',
          icon: 'Dashboard',
          permission: 'dashboard:view',
        },
      },
    ],
  },
  {
    path: '/system',
    component: () => import('@/layout/index.vue'),
    redirect: '/system/user',
    meta: {
      title: '系统管理',
      icon: 'Setting',
      permission: 'system:view',
    },
    children: [
      {
        path: '/system/user',
        name: 'SystemUser',
        component: () => import('@/views/system/user/index.vue'),
        meta: {
          title: '用户管理',
          icon: 'User',
          permission: 'system:user:view',
        },
      },
      {
        path: '/system/role',
        name: 'SystemRole',
        component: () => import('@/views/system/role/index.vue'),
        meta: {
          title: '角色管理',
          icon: 'UserFilled',
          permission: 'system:role:view',
        },
      },
      {
        path: '/system/menu',
        name: 'SystemMenu',
        component: () => import('@/views/system/menu/index.vue'),
        meta: {
          title: '菜单管理',
          icon: 'Menu',
          permission: 'system:menu:view',
        },
      },
    ],
  },
  {
    path: '/article',
    component: () => import('@/layout/index.vue'),
    redirect: '/article/list',
    meta: {
      title: '文章管理',
      icon: 'Document',
      permission: 'article:view',
    },
    children: [
      {
        path: '/article/list',
        name: 'ArticleList',
        component: () => import('@/views/article/list/index.vue'),
        meta: {
          title: '文章列表',
          icon: 'List',
          permission: 'article:list',
        },
      },
      {
        path: '/article/create',
        name: 'ArticleCreate',
        component: () => import('@/views/article/create/index.vue'),
        meta: {
          title: '新建文章',
          icon: 'Plus',
          hidden: true,
          permission: 'article:create',
        },
      },
      {
        path: '/article/edit/:id',
        name: 'ArticleEdit',
        component: () => import('@/views/article/edit/index.vue'),
        meta: {
          title: '编辑文章',
          icon: 'Edit',
          hidden: true,
          permission: 'article:edit',
        },
      },
    ],
  },
]
```

### 2.2 路由守卫实现

```typescript
// router/permission.ts
import type { Router } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'
import { staticRoutes, notFoundRoute } from './staticRoutes'
import { asyncRoutes } from './asyncRoutes'

export function setupRoutePermission(router: Router): void {
  let isRouteInitialized = false

  router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore()
    const permissionStore = usePermissionStore()

    // 1. 白名单处理
    const whiteList = ['/login', '/404', '/:pathMatch(.*)*']
    if (whiteList.includes(to.path)) {
      if (to.path === '/login' && userStore.isLoggedIn) {
        next('/dashboard')
        return
      }
      next()
      return
    }

    // 2. 未登录处理
    if (!userStore.isLoggedIn) {
      next(`/login?redirect=${to.fullPath}`)
      return
    }

    // 3. 权限数据未加载完成时的处理
    if (!userStore.userInfo?.permissions || userStore.userInfo.permissions.length === 0) {
      try {
        await userStore.fetchUserInfo()
      } catch (error) {
        console.error('获取权限失败:', error)
        next(`/login?redirect=${to.fullPath}`)
        return
      }
    }

    // 4. 动态路由初始化
    if (!isRouteInitialized) {
      const accessedRoutes = filterRoutes(asyncRoutes, userStore.permissions)
      
      // 添加动态路由
      accessedRoutes.forEach((route) => {
        router.addRoute(route)
      })
      
      // 最后添加 404 路由
      router.addRoute(notFoundRoute)
      
      isRouteInitialized = true
      
      // 重新触发一次导航，确保路由已添加
      next({ ...to, replace: true })
      return
    }

    // 5. 路由已初始化，直接放行
    next()
  })
}

/**
 * 根据权限过滤路由
 */
function filterRoutes(routes: RouteRecordRaw[], permissions: string[]): RouteRecordRaw[] {
  const filteredRoutes: RouteRecordRaw[] = []

  for (const route of routes) {
    // 检查路由是否有权限要求
    const routePermission = route.meta?.permission as string | undefined
    
    // 如果没有权限要求，或者用户有该权限，则保留该路由
    if (!routePermission || permissions.includes(routePermission)) {
      const newRoute = { ...route }
      
      // 递归处理子路由
      if (route.children && route.children.length > 0) {
        const filteredChildren = filterRoutes(route.children, permissions)
        
        // 如果子路由被过滤完了，且该路由本身没有 component，则移除该路由
        if (filteredChildren.length === 0 && !route.component) {
          continue
        }
        
        newRoute.children = filteredChildren
      }
      
      filteredRoutes.push(newRoute)
    }
  }

  return filteredRoutes
}
```

### 2.3 路由初始化

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { staticRoutes } from './staticRoutes'
import { setupRoutePermission } from './permission'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: staticRoutes,
})

// 设置路由守卫
setupRoutePermission(router)

export default router
```

---

## 三、按钮级权限实现

### 3.1 自定义 Hook 实现

```typescript
// composables/usePermission.ts
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import type { PermissionCode } from '@/types/permission'

export function usePermission() {
  const userStore = useUserStore()

  /**
   * 检查是否有指定权限
   */
  function hasPermission(permission: PermissionCode): boolean {
    const { permissions } = userStore.userInfo || {}
    if (!permissions || permissions.length === 0) {
      return false
    }
    return permissions.includes(permission)
  }

  /**
   * 检查是否有所有指定权限
   */
  function hasAllPermissions(permissions: PermissionCode[]): boolean {
    if (!permissions || permissions.length === 0) {
      return true
    }
    return permissions.every((p) => hasPermission(p))
  }

  /**
   * 检查是否有任意一个指定权限
   */
  function hasAnyPermission(permissions: PermissionCode[]): boolean {
    if (!permissions || permissions.length === 0) {
      return true
    }
    return permissions.some((p) => hasPermission(p))
  }

  /**
   * 检查是否有指定角色
   */
  function hasRole(roleCode: string): boolean {
    const { roles } = userStore.userInfo || {}
    if (!roles || roles.length === 0) {
      return false
    }
    return roles.some((role) => role.code === roleCode)
  }

  /**
   * 批量权限检查（computed 方式，性能更好）
   */
  const permissionBatch = computed(() => {
    const { permissions } = userStore.userInfo || {}
    return {
      // 文章创建
      canCreateArticle: permissions?.includes('article:create') ?? false,
      // 文章编辑
      canEditArticle: permissions?.includes('article:edit') ?? false,
      // 文章删除
      canDeleteArticle: permissions?.includes('article:delete') ?? false,
      // 用户管理
      canManageUser: permissions?.includes('system:user:manage') ?? false,
      // 角色管理
      canManageRole: permissions?.includes('system:role:manage') ?? false
    }
  })

  return {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    hasRole,
    permissionBatch
  }
}
```

**使用示例**：

```vue
<template>
  <div class="article-toolbar">
    <el-button 
      v-if="hasPermission('article:create')"
      type="primary"
      @click="handleCreate"
    >
      新建文章
    </el-button>
    
    <el-button 
      v-if="hasPermission('article:edit')"
      type="warning"
      @click="handleEdit"
    >
      编辑
    </el-button>
    
    <el-button 
      v-if="hasPermission('article:delete')"
      type="danger"
      @click="handleDelete"
    >
      删除
    </el-button>

    <!-- 批量按钮使用 computed 方式 -->
    <el-button 
      v-if="permissionBatch.canCreateArticle"
      type="success"
    >
      创建
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { usePermission } from '@/composables/usePermission'

const { hasPermission, permissionBatch } = usePermission()

const handleCreate = () => {
  // ...
}
</script>
```

### 3.2 自定义指令实现

```typescript
// directives/permission.ts
import type { Directive, DirectiveBinding } from 'vue'
import { useUserStore } from '@/stores/user'
import type { PermissionCode } from '@/types/permission'

interface PermissionDirectiveBinding extends DirectiveBinding {
  value: PermissionCode | PermissionCode[]
}

interface PermissionDirectiveOptions {
  /** 权限标识 */
  value?: PermissionCode | PermissionCode[]
  /** 是否需要所有权限（默认：false，任意一个即可） */
  requireAll?: boolean
}

/**
 * v-permission 指令值类型
 */
export type PermissionValue = PermissionCode | PermissionCode[] | PermissionDirectiveOptions

/**
 * 权限判断核心函数
 */
function checkPermission(userPermissions: PermissionCode[] | undefined, value: PermissionValue): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false
  }

  // 处理简单字符串
  if (typeof value === 'string') {
    return userPermissions.includes(value)
  }

  // 处理数组
  if (Array.isArray(value)) {
    return value.some(p => userPermissions.includes(p))
  }

  // 处理对象配置
  if (typeof value === 'object' && 'value' in value) {
    const permValue = value.value
    const requireAll = value.requireAll ?? false
    
    if (typeof permValue === 'string') {
      return userPermissions.includes(permValue)
    }
    
    if (Array.isArray(permValue)) {
      return requireAll 
        ? permValue.every(p => userPermissions.includes(p))
        : permValue.some(p => userPermissions.includes(p))
    }
  }

  return false
}

/**
 * v-permission 指令
 * 用法：
 * v-permission="'system:user:create'"
 * v-permission="['system:user:create', 'system:user:edit']"
 * v-permission="{ value: 'system:user:create', requireAll: true }"
 */
export const permissionDirective: Directive = {
  mounted(el: HTMLElement, binding: PermissionDirectiveBinding) {
    const { value } = binding
    
    // 如果没有传值，不做限制
    if (!value) {
      return
    }

    const userStore = useUserStore()
    const { permissions } = userStore.userInfo || {}
    
    const hasPermission = checkPermission(permissions, value as PermissionValue)
    
    // 如果没有权限，移除元素或禁用元素
    if (!hasPermission) {
      // 如果指令指定了 disabled，则设置禁用样式而不是移除
      if (el.tagName === 'BUTTON' || el.tagName === 'INPUT') {
        el.setAttribute('disabled', 'true')
        el.classList.add('is-disabled')
        el.setAttribute('aria-disabled', 'true')
        // 阻止点击事件
        el.addEventListener('click', stopPropagation, true)
      } else {
        // 非表单元素直接移除
        el.parentNode?.removeChild(el)
      }
    }
  },

  updated(el: HTMLElement, binding: PermissionDirectiveBinding) {
    const { value, oldValue } = binding
    
    // 如果值没有变化，不需要更新
    if (JSON.stringify(value) === JSON.stringify(oldValue)) {
      return
    }

    const userStore = useUserStore()
    const { permissions } = userStore.userInfo || {}
    
    const hasPermission = checkPermission(permissions, value as PermissionValue)
    
    // 如果有权限但之前被移除了，需要恢复（虽然这种情况很少见）
    if (hasPermission && !el.parentNode) {
      // 这种场景比较复杂，一般不会遇到
      // 如果需要支持动态权限更新，可以在这里处理
    }
  }
}

/**
 * 阻止事件传播
 */
function stopPropagation(e: Event) {
  e.stopPropagation()
  e.preventDefault()
}

/**
 * 注册所有权限相关指令
 */
export function registerPermissionDirectives(app: import('vue').App) {
  app.directive('permission', permissionDirective)
}

// 单独导出，方便按需使用
export { permissionDirective as vPermission }
```

**指令使用示例**：

```vue
<template>
  <div class="toolbar">
    <!-- 单个权限 -->
    <el-button v-permission="'article:create'" type="primary">
      新建
    </el-button>

    <!-- 多个权限（任意一个即可） -->
    <el-button v-permission="['article:edit', 'article:manage']" type="warning">
      编辑（编辑或管理权限）
    </el-button>

    <!-- 需要所有权限 -->
    <el-button 
      v-permission="{ value: ['article:edit', 'article:delete'], requireAll: true }"
      type="danger"
    >
      删除（同时需要编辑和删除权限）
    </el-button>

    <!-- 外层容器级权限控制 -->
    <div v-permission="'article:manage'">
      <p>这是只有管理员才能看到的内容</p>
      <el-button>管理员专属按钮1</el-button>
      <el-button>管理员专属按钮2</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
// 指令会在组件初始化时自动注册
import { vPermission } from '@/directives/permission'
</script>
```

### 3.3 权限组件封装

```vue
<!-- components/Permission/Permission.vue -->
<template>
  <slot v-if="hasPermission" />
  <slot v-else-if="$slots.fallback" name="fallback" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import type { PermissionCode } from '@/types/permission'

interface Props {
  /** 需要的权限标识 */
  code: PermissionCode | PermissionCode[]
  /** 是否需要所有权限 */
  requireAll?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  requireAll: false
})

const userStore = useUserStore()

const hasPermission = computed(() => {
  const { permissions } = userStore.userInfo || {}
  if (!permissions || permissions.length === 0) {
    return false
  }

  if (typeof props.code === 'string') {
    return permissions.includes(props.code)
  }

  if (Array.isArray(props.code)) {
    return props.requireAll
      ? props.code.every(p => permissions.includes(p))
      : props.code.some(p => permissions.includes(p))
  }

  return false
})
</script>
```

```vue
<!-- 使用示例 -->
<template>
  <div>
    <!-- 基础用法 -->
    <Permission code="article:create">
      <el-button type="primary">新建文章</el-button>
    </Permission>

    <!-- 多个权限（任意一个即可） -->
    <Permission :code="['article:edit', 'article:manage']">
      <el-button type="warning">编辑</el-button>
    </Permission>

    <!-- 需要所有权限 -->
    <Permission :code="['article:edit', 'article:delete']" :require-all="true">
      <el-button type="danger">删除</el-button>
    </Permission>

    <!-- 无权限时的兜底 -->
    <Permission code="article:delete">
      <el-button type="danger">删除</el-button>
      <template #fallback>
        <el-button type="danger" disabled>无权限</el-button>
      </template>
    </Permission>
  </div>
</template>

<script setup lang="ts">
import Permission from '@/components/Permission/Permission.vue'
</script>
```

---

## 四、菜单渲染：权限驱动的动态菜单

### 4.1 菜单数据模型

菜单渲染依赖后端返回的菜单树结构。核心是将扁平化的权限数据转换为树形结构，用于渲染侧边栏。

```typescript
// composables/useMenus.ts
import { computed, ref } from 'vue'
import type { MenuItem } from '@/types/permission'
import { useUserStore } from '@/stores/user'

/**
 * 将扁平菜单转换为树形结构
 */
export function useMenus() {
  const userStore = useUserStore()
  const activeMenu = ref('')

  /**
   * 递归构建菜单树
   */
  const buildMenuTree = (menus: MenuItem[]): MenuItem[] => {
    // 按 parentId 分组
    const menuMap = new Map<string | number | null, MenuItem[]>()
    
    for (const menu of menus) {
      const parentId = menu.parentId ?? null
      if (!menuMap.has(parentId)) {
        menuMap.set(parentId, [])
      }
      menuMap.get(parentId)!.push(menu)
    }

    // 递归添加 children
    const addChildren = (items: MenuItem[]): MenuItem[] => {
      return items.map(item => {
        const children = menuMap.get(item.id) || []
        return {
          ...item,
          children: children.length > 0 ? addChildren(children) : undefined
        }
      })
    }

    // 获取顶级菜单
    const rootMenus = menuMap.get(null) || menuMap.get(undefined) || []
    return addChildren(rootMenus).sort((a, b) => (a.orderNum ?? 0) - (b.orderNum ?? 0))
  }

  /**
   * 获取菜单树
   */
  const menuTree = computed(() => {
    const menus = userStore.userInfo?.menus || []
    return buildMenuTree(menus)
  })

  /**
   * 获取面包屑数据
   */
  const getBreadcrumbs = (currentPath: string): MenuItem[] => {
    const result: MenuItem[] = []
    
    const findMenu = (menus: MenuItem[], path: string): MenuItem | null => {
      for (const menu of menus) {
        if (menu.path === path) {
          return menu
        }
        if (menu.children) {
          const found = findMenu(menu.children, path)
          if (found) {
            return found
          }
        }
      }
      return null
    }

    const findParentChain = (menus: MenuItem[], path: string, chain: MenuItem[] = []): MenuItem[] | null => {
      for (const menu of menus) {
        const newChain = [...chain, menu]
        if (menu.path === path) {
          return newChain
        }
        if (menu.children) {
          const result = findParentChain(menu.children, path, newChain)
          if (result) {
            return result
          }
        }
      }
      return null
    }

    return findParentChain(menuTree.value, currentPath) || []
  }

  /**
   * 查找当前激活的菜单
   */
  const findActiveMenu = (menus: MenuItem[], path: string): MenuItem | null => {
    for (const menu of menus) {
      if (menu.path === path) {
        return menu
      }
      if (menu.children) {
        const found = findActiveMenu(menu.children, path)
        if (found) {
          return found
        }
      }
    }
    return null
  }

  return {
    menuTree,
    activeMenu,
    getBreadcrumbs,
    findActiveMenu
  }
}
```

---

## 五、权限缓存与刷新：状态管理方案

### 5.1 Pinia Store 实现

```typescript
// stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo, Role, PermissionCode, MenuItem } from '@/types/permission'
import { loginApi, getUserInfoApi } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(null)

  // Getters
  const isLoggedIn = computed(() => !!token.value)

  const permissions = computed<PermissionCode[]>(() => {
    return userInfo.value?.permissions || []
  })

  const menus = computed<MenuItem[]>(() => {
    return userInfo.value?.menus || []
  })

  const roles = computed<Role[]>(() => {
    return userInfo.value?.roles || []
  })

  const isAdmin = computed(() => {
    return roles.value.some(role => role.code === 'admin')
  })

  // Actions
  
  /**
   * 用户登录
   */
  async function login(username: string, password: string) {
    try {
      const response = await loginApi({ username, password })
      const { token: newToken } = response.data
      
      token.value = newToken
      localStorage.setItem('token', newToken)
      
      // 登录成功后获取用户信息
      await fetchUserInfo()
      
      return { success: true }
    } catch (error) {
      return { success: false, error }
    }
  }

  /**
   * 获取用户信息
   */
  async function fetchUserInfo() {
    try {
      const response = await getUserInfoApi()
      userInfo.value = response.data
      
      // 权限信息也可以存储到 localStorage 作为备份
      localStorage.setItem('permissions', JSON.stringify(userInfo.value.permissions))
      localStorage.setItem('menus', JSON.stringify(userInfo.value.menus))
      
      return userInfo.value
    } catch (error) {
      console.error('获取用户信息失败:', error)
      throw error
    }
  }

  /**
   * 登出
   */
  async function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('permissions')
    localStorage.removeItem('menus')
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    permissions,
    menus,
    roles,
    isAdmin,
    login,
    fetchUserInfo,
    logout,
  }
})
```

---

## 六、实际踩坑记录

### 坑1：addRoute 后首次跳转白屏

**问题描述**：动态路由注册完成后，第一次跳转页面出现白屏，控制台没有错误。

**原因分析**：
1. `router.addRoute()` 是同步操作，但路由匹配是异步的
2. 当守卫中直接 `next(to)` 时，虽然路由已经添加，但 Vue Router 可能还没来得及更新路由表

**解决方案**：

```typescript
// ✅ 正确写法
router.beforeEach(async (to, from, next) => {
  // ... 动态添加路由
  
  // 关键：使用 replace: true，并且用完整的 to 对象
  next({ ...to, replace: true })
})
```

### 坑2：路由守卫死循环

**问题描述**：页面在登录页和目标页之间无限跳转。

**解决方案**：

```typescript
// ✅ 正确写法
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  // 白名单
  const whiteList = ['/login', '/404']
  if (whiteList.includes(to.path)) {
    // 如果已登录访问登录页，重定向到首页
    if (to.path === '/login' && userStore.isLoggedIn) {
      next('/dashboard')
      return
    }
    next()
    return
  }
  
  // 未登录处理
  if (!userStore.isLoggedIn) {
    next(`/login?redirect=${to.fullPath}`)
    return
  }
  
  next()
})
```

### 坑3：动态路由 404 匹配顺序问题

**问题描述**：动态路由注册后，访问不存在的路径没有匹配到 404 页面。

**解决方案**：

```typescript
// ✅ 方案一：确保 404 路由在最后
router.beforeEach(async (to, from, next) => {
  // ... 动态添加路由
  
  // 最后添加 404 路由
  router.addRoute(notFoundRoute)
  
  next({ ...to, replace: true })
})
```

---

## 七、总结与决策建议

### 7.1 什么场景用 RBAC0 够用，什么时候需要 RBAC1

**RBAC0 够用的场景**：
- 绝大多数企业内部管理系统
- 用户角色相对固定（员工、管理员、超级管理员）
- 权限没有层级继承需求
- 5-10 个角色左右

**需要 RBAC1（角色继承）的场景**：
- 组织架构复杂，有明显的层级关系
- 比如：集团管理员 → 区域管理员 → 门店管理员 → 店员
- 每个下级角色需要继承上级角色的权限

**我的建议**：除非你的系统有明确的角色层级需求，否则不要引入 RBAC1。过度设计会让权限系统变得复杂且难以维护。

### 7.2 动态路由 vs 全量注册 + 守卫拦截

**动态路由方案**：
- 路由根据权限动态注册
- 优点：路由表干净，只有可访问的路由
- 缺点：首次访问需要等待权限数据加载

**全量注册 + 守卫拦截方案**：
- 所有路由预先注册，守卫中判断是否有权限
- 优点：首屏加载快，路由始终可用
- 缺点：路由表可能很大，且访问不存在的路由不会触发 404

**我的建议**：
- 小型项目（20个页面以内）：全量注册 + 守卫拦截
- 中大型项目（20个页面以上）：动态路由
- **后端返回的菜单数据足够完整时，优先使用动态路由**

### 7.3 按钮权限粒度控制的建议

**不建议的做法**：
- 每个按钮都加一个独立的权限标识
- 权限粒度细到每个 API 操作

**建议的做法**：
- 权限分三层：页面权限 → 区域权限 → 操作权限
- 页面权限：控制菜单显示（已有）
- 区域权限：控制页面上某个功能区块的显示
- 操作权限：控制具体按钮的显示

---

## 八、架构设计与目录组织

### 8.1 推荐目录结构

```bash
src/
├── api/                          # API 接口
│   ├── user.ts                   # 用户相关接口
│   ├── menu.ts                   # 菜单相关接口
│   └── types.ts                  # API 响应类型
├── components/                   # 组件
│   ├── Layout/                   # 布局组件
│   ├── Permission/               # 权限相关组件
│   └── common/                   # 通用组件
├── composables/                  # Composition API Hooks
│   ├── usePermission.ts
│   └── useMenus.ts
├── directives/                   # 自定义指令
│   └── permission.ts
├── router/                       # 路由配置
│   ├── index.ts
│   ├── staticRoutes.ts
│   ├── asyncRoutes.ts
│   └── permission.ts
├── stores/                       # Pinia Store
│   ├── user.ts
│   └── permission.ts
├── types/                        # TypeScript 类型定义
│   └── permission.ts
├── utils/                        # 工具函数
│   ├── request.ts
│   └── menu.ts
├── views/                        # 页面组件
│   ├── login/
│   ├── dashboard/
│   └── ...
├── App.vue
└── main.ts
```

---

**总结**

本文基于真实项目经验，从零开始构建了一套完整的 Vue3 权限系统，核心要点：

1. **RBAC 模型**：用户-角色-权限三层结构，满足绝大多数场景
2. **动态路由**：根据权限动态注册路由，路由守卫控制访问
3. **按钮级权限**：通过自定义 Hook、指令、组件三种方式实现
4. **菜单渲染**：权限驱动的动态菜单，支持多级嵌套
5. **状态管理**：Pinia Store 管理用户信息和权限数据
6. **踩坑记录**：addRoute 白屏、守卫死循环、404 匹配顺序等常见问题

权限系统是中大型后台管理系统的核心，设计时要考虑可维护性和扩展性。不要过度设计，但也不要忽视安全性。

---

*本文基于真实项目经验，Vue3 + Pinia + Vue Router 完整实现，实测可用。*