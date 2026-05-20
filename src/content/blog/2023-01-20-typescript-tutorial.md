---
title: "TypeScript 高级技巧：类型体操入门"
description: "探索 TypeScript 的高级类型特性，从泛型到条件类型，掌握类型体操的核心技巧。"
date: 2023-06-10
tags: ["TypeScript", "前端", "编程"]
categories: ["前端"]
featured: false
---

## 为什么学习类型体操？

TypeScript 的类型系统非常强大，它不仅可以帮助我们在编译时捕获错误，还能通过高级类型特性来表达复杂的业务逻辑。

类型体操（Type Gymnastics）指的是利用 TypeScript 的类型系统来解决复杂类型问题的方法。掌握这些技巧可以让你写出更安全、更优雅的 TypeScript 代码。

## 泛型基础

泛型是类型体操的基础。它允许我们编写可复用的类型定义：

```typescript
function identity<T>(arg: T): T {
  return arg;
}

const result = identity<string>("hello");
const inferred = identity("world"); // 类型推断
```

## 条件类型

条件类型允许我们根据条件来创建类型：

```typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<"hello">; // true
type B = IsString<42>;      // false
```

## 映射类型

映射类型可以基于已有类型创建新类型：

```typescript
type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};

interface User {
  name: string;
  age: number;
}

type ReadonlyUser = Readonly<User>;
```

## 实用技巧

### 提取 Promise 类型

```typescript
type Awaited<T> = T extends Promise<infer U> ? U : T;

type R = Awaited<Promise<string>>; // string
```

### 深度 Partial

```typescript
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
```

### 联合类型转交叉类型

```typescript
type UnionToIntersection<T> =
  (T extends any ? (x: T) => any : never) extends (x: infer R) => any
    ? R
    : never;
```

## 实际应用场景

1. **API 响应类型推导**：从 API 路由定义自动推导响应类型
2. **表单验证**：类型安全的表单状态管理
3. **状态管理**：类型安全的状态机实现
4. **ORM 类型安全**：数据库查询的类型保证

## 总结

类型体操虽然入门有一定难度，但掌握后会极大地提升 TypeScript 的使用体验。建议从简单的泛型和条件类型开始，逐步深入更复杂的类型操作。