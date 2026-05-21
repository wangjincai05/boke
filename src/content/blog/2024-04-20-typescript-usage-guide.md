---
title: 'TypeScript 完整指南：从入门到类型体操'
date: 2024-04-20
description: 'TypeScript 从入门到精通，涵盖基础类型、接口、泛型、高级类型、类型体操及 tsconfig 配置等核心内容'
tags: ['TypeScript', '前端', 'JavaScript', '类型系统', '类型体操']
featured: true
---

## 1. TypeScript 简介

### 1.1 什么是 TypeScript

TypeScript 是 JavaScript 的超集，由 Microsoft 开发并于 2012 年发布。它在 JavaScript 的基础上添加了类型系统，使得代码更加健壮、易于维护。TypeScript 代码最终会被编译成纯 JavaScript，可以在任何支持 JavaScript 的环境中运行。

### 1.2 为什么选择 TypeScript

- **类型安全**：在编译阶段捕获类型错误，减少运行时错误
- **智能提示**：IDE 提供更准确的代码补全和导航
- **更好的可读性**：类型注解使代码意图更加清晰
- **现代特性**：支持最新的 ECMAScript 特性

### 1.3 环境搭建

```bash
# 安装 TypeScript
npm install -g typescript

# 验证安装
tsc -v

# 初始化项目配置
tsc --init
```

## 2. 基础类型

### 2.1 基本类型

| 类型 | 说明 |
|------|------|
| `number` | 数字类型，包括整数和浮点数 |
| `string` | 字符串类型 |
| `boolean` | 布尔类型，true 或 false |
| `array` | 数组类型 |
| `tuple` | 元组，固定长度和类型的数组 |
| `enum` | 枚举类型 |
| `any` | 任意类型，关闭类型检查 |
| `unknown` | 未知类型，类型安全的 any |
| `void` | 无返回值 |
| `null / undefined` | 空值和未定义 |
| `never` | 永不存在的值的类型 |

### 2.2 类型声明示例

```typescript
// 基本类型
let isDone: boolean = false;
let count: number = 10;
let name: string = "Alice";

// 数组
let list: number[] = [1, 2, 3];
let names: Array<string> = ["Alice", "Bob"];

// 元组
let person: [string, number] = ["Alice", 25];

// 枚举
enum Color { Red, Green, Blue }
let c: Color = Color.Green;

// unknown 类型（类型安全）
let value: unknown = 123;
if (typeof value === "string") {
    console.log(value.toUpperCase());
}
```

## 3. 接口 (Interface)

### 3.1 接口基础

```typescript
interface Person {
    name: string;
    age: number;
}

function greet(person: Person) {
    return "Hello, " + person.name;
}

let user = { name: "Alice", age: 25 };
console.log(greet(user));
```

### 3.2 可选属性与只读属性

```typescript
interface Person {
    name: string;
    age?: number;           // 可选属性
    readonly id: number;    // 只读属性
}

let person: Person = { name: "Alice", id: 1 };
person.name = "Bob";    // ✅ 可以修改
// person.id = 2;       // ❌ 错误：只读属性不能修改
```

### 3.3 接口继承

```typescript
interface Animal {
    name: string;
}

interface Dog extends Animal {
    breed: string;
}

let dog: Dog = {
    name: "Buddy",
    breed: "Golden Retriever"
};
```

## 4. 泛型 (Generics)

### 4.1 泛型基础

泛型是类型体操的基础，它允许我们编写可复用的类型定义：

```typescript
// 使用泛型 - 保留类型信息
function identity<T>(arg: T): T {
    return arg;
}

// 使用方式
let output1 = identity<string>("myString");
let output2 = identity("myString");  // 类型推断
```

### 4.2 泛型接口

```typescript
interface GenericIdentityFn<T> {
    (arg: T): T;
}

function identity<T>(arg: T): T {
    return arg;
}

let myIdentity: GenericIdentityFn<number> = identity;
```

### 4.3 泛型约束

```typescript
interface Lengthwise {
    length: number;
}

function loggingIdentity<T extends Lengthwise>(arg: T): T {
    console.log(arg.length);
    return arg;
}

loggingIdentity({ length: 10, value: 3 });
```

## 5. 类型操作

### 5.1 联合类型与交叉类型

```typescript
// 联合类型
function printId(id: number | string) {
    console.log("Your ID is: " + id);
}

// 交叉类型
interface ErrorHandling {
    success: boolean;
    error?: { message: string };
}

interface ArtworksData {
    artworks: { title: string }[];
}

type ArtworksResponse = ArtworksData & ErrorHandling;
```

### 5.2 类型别名

```typescript
type Point = {
    x: number;
    y: number;
};

type ID = number | string;

type StringOrNumber = string | number;
```

### 5.3 类型断言

```typescript
let someValue: unknown = "this is a string";

// as 语法（推荐）
let strLength: number = (someValue as string).length;
```

## 6. 函数

### 6.1 函数类型

```typescript
// 函数声明
function add(x: number, y: number): number {
    return x + y;
}

// 完整函数类型
let myAdd: (x: number, y: number) => number = function(
    x: number, y: number
): number {
    return x + y;
};
```

### 6.2 可选参数与默认参数

```typescript
function buildName(firstName: string, lastName?: string): string {
    if (lastName) {
        return firstName + " " + lastName;
    }
    return firstName;
}

function buildName2(firstName: string, lastName = "Smith"): string {
    return firstName + " " + lastName;
}
```

### 6.3 剩余参数

```typescript
function buildName(firstName: string, ...restOfName: string[]): string {
    return firstName + " " + restOfName.join(" ");
}

let employeeName = buildName("Joseph", "Samuel", "Lucas", "MacKinzie");
```

## 7. 类

### 7.1 类基础

```typescript
class Animal {
    name: string;
    
    constructor(name: string) {
        this.name = name;
    }
    
    move(distance: number = 0) {
        console.log(`${this.name} moved ${distance}m`);
    }
}

let dog = new Animal("Buddy");
dog.move(10);
```

### 7.2 继承

```typescript
class Dog extends Animal {
    bark() {
        console.log("Woof! Woof!");
    }
}

const dog = new Dog("Buddy");
dog.bark();
dog.move(10);
```

### 7.3 访问修饰符

```typescript
class Person {
    constructor(
        public name: string,
        private age: number,
        protected id: number
    ) {}
}
```

## 8. 高级类型

### 8.1 映射类型

```typescript
type Readonly<T> = {
    readonly [P in keyof T]: T[P];
};

type Partial<T> = {
    [P in keyof T]?: T[P];
};

interface Person {
    name: string;
    age: number;
}

type ReadonlyPerson = Readonly<Person>;
type PartialPerson = Partial<Person>;
```

### 8.2 条件类型

条件类型允许我们根据条件来创建类型：

```typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<"hello">; // true
type B = IsString<42>;      // false

type NonNullable<T> = T extends null | undefined ? never : T;

type ReturnType<T extends (...args: any) => any> = 
    T extends (...args: any) => infer R ? R : any;

function foo() {
    return { a: 1, b: 2 };
}

type FooReturn = ReturnType<typeof foo>;  // { a: number, b: number }
```

### 8.3 常用工具类型

| 工具类型 | 说明 |
|----------|------|
| `Partial<T>` | 将类型 T 的所有属性变为可选 |
| `Required<T>` | 将类型 T 的所有属性变为必选 |
| `Readonly<T>` | 将类型 T 的所有属性变为只读 |
| `Record<K, T>` | 构造键类型为 K，值类型为 T 的对象类型 |
| `Pick<T, K>` | 从类型 T 中选取属性 K |
| `Omit<T, K>` | 从类型 T 中排除属性 K |
| `Exclude<T, U>` | 从 T 中排除可赋值给 U 的类型 |
| `Extract<T, U>` | 从 T 中提取可赋值给 U 的类型 |
| `NonNullable<T>` | 从 T 中排除 null 和 undefined |
| `ReturnType<T>` | 获取函数类型的返回值类型 |
| `Parameters<T>` | 获取函数类型的参数类型元组 |

## 9. 类型体操进阶

### 9.1 为什么学习类型体操

TypeScript 的类型系统非常强大，它不仅可以帮助我们在编译时捕获错误，还能通过高级类型特性来表达复杂的业务逻辑。

类型体操（Type Gymnastics）指的是利用 TypeScript 的类型系统来解决复杂类型问题的方法。掌握这些技巧可以让你写出更安全、更优雅的 TypeScript 代码。

### 9.2 实用技巧

#### 提取 Promise 类型

```typescript
type Awaited<T> = T extends Promise<infer U> ? U : T;

type R = Awaited<Promise<string>>; // string
```

#### 深度 Partial

```typescript
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
```

#### 联合类型转交叉类型

```typescript
type UnionToIntersection<T> =
  (T extends any ? (x: T) => any : never) extends (x: infer R) => any
    ? R
    : never;
```

### 9.3 实际应用场景

1. **API 响应类型推导**：从 API 路由定义自动推导响应类型
2. **表单验证**：类型安全的表单状态管理
3. **状态管理**：类型安全的状态机实现
4. **ORM 类型安全**：数据库查询的类型保证

## 10. 模块

### 10.1 导出与导入

**导出：**

```typescript
export interface StringValidator {
    isAcceptable(s: string): boolean;
}

export const numberRegexp = /^[0-9]+$/;

class ZipCodeValidator implements StringValidator {
    isAcceptable(s: string) {
        return s.length === 5 && numberRegexp.test(s);
    }
}

export { ZipCodeValidator };

// 默认导出
export default class DefaultValidator {
    isAcceptable(s: string) {
        return true;
    }
}
```

**导入：**

```typescript
import { ZipCodeValidator } from "./ZipCodeValidator";
import { ZipCodeValidator as ZCV } from "./ZipCodeValidator";
import * as validator from "./ZipCodeValidator";
import DefaultValidator from "./ZipCodeValidator";
```

## 11. tsconfig.json 配置

### 11.1 常用配置选项

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 11.2 严格模式选项

| 选项 | 说明 |
|------|------|
| `strictNullChecks` | null 和 undefined 不能赋值给其他类型 |
| `noImplicitAny` | 禁止隐式 any 类型 |
| `noImplicitThis` | 禁止隐式 this 类型 |
| `alwaysStrict` | 在严格模式下解析并输出 |

## 12. TypeScript 5.x 新特性

### 12.1 TypeScript 5.8 新特性

**返回表达式中的分支细粒度检查：**

```typescript
declare const cache: Map<any, any>;

function getUrl(urlString: string): URL {
    return cache.has(urlString) 
        ? cache.get(urlString)   // 现在会检查这个分支
        : urlString;             // 错误：string 不能赋值给 URL
}
```

**`--erasableSyntaxOnly` 选项：**

禁止包含运行时语义的 TypeScript 语法，确保代码可被擦除为纯 JavaScript。

### 12.2 TypeScript 5.9 新特性

- **简化的 tsconfig.json**：生成的配置文件更加精简
- **支持 import defer**：支持延迟导入提案
- **支持 `--module node20`**：为 Node.js 20 提供模块解析支持

## 结语

TypeScript 是现代 JavaScript 开发的重要工具，通过添加类型系统大大提高了代码的可维护性和可靠性。从基础类型到高级类型体操，掌握这些知识将使你成为更优秀的前端开发者。

### 参考资源

- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [TypeScript GitHub](https://github.com/microsoft/TypeScript)
- [TypeScript 博客](https://devblogs.microsoft.com/typescript/)
