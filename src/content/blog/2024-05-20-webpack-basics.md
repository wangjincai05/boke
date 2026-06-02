---
title: 'Webpack 基础入门'
date: 2024-03-05
description: 'Webpack 基础使用教程，包括安装配置、处理样式资源、图片资源、字体图标等'
tags: ['Webpack', '前端工程化', '构建工具']
series:
  name: 'Webpack 入门到精通'
  order: 1
---

## 前言

### 为什么需要打包工具？

开发时，我们会使用框架（React、Vue），ES6 模块化语法，Less/Sass 等 CSS 预处理器等语法进行开发。

这样的代码要想在浏览器运行必须经过编译成浏览器能识别的 JS、CSS 等语法，才能运行。

所以我们需要打包工具帮我们做完这些事。

除此之外，打包工具还能压缩代码、做兼容性处理、提升代码性能等。

### 有哪些打包工具？

- Grunt
- Gulp
- Parcel
- Webpack
- Rollup
- Vite

目前市面上最流行的是 Webpack，所以我们主要以 Webpack 来介绍使用打包工具。

## 基本使用

**`Webpack` 是一个静态资源打包工具。**

它会以一个或多个文件作为打包的入口，将我们整个项目所有文件编译组合成一个或多个文件输出出去。

输出的文件就是编译好的文件，就可以在浏览器端运行了。

我们将 `Webpack` 输出的文件叫做 `bundle`。

### 功能介绍

Webpack 本身功能是有限的:

- 开发模式：仅能编译 JS 中的 `ES Module` 语法
- 生产模式：能编译 JS 中的 `ES Module` 语法，还能压缩 JS 代码

### 开始使用

#### 1. 资源目录

```bash
webpack_code # 项目根目录（所有指令必须在这个目录运行）
    └── src # 项目源码目录
        ├── js # js文件目录
        │   ├── count.js
        │   └── sum.js
        └── main.js # 项目主文件
```

#### 2. 创建文件

**count.js**

```js
export default function count(x, y) {
  return x - y;
}
```

**sum.js**

```js
export default function sum(...args) {
  return args.reduce((p, c) => p + c, 0);
}
```

**main.js**

```js
import count from "./js/count";
import sum from "./js/sum";

console.log(count(2, 1));
console.log(sum(1, 2, 3, 4));
```

#### 3. 下载依赖

打开终端，来到项目根目录。运行以下指令：

- 初始化 `package.json`

```bash
npm init -y
```

此时会生成一个基础的 `package.json` 文件。

**需要注意的是 `package.json` 中 `name` 字段不能叫做 `webpack`, 否则下一步会报错**

- 下载依赖

```bash
npm i webpack webpack-cli -D
```

#### 4. 启用 Webpack

- 开发模式

```bash
npx webpack ./src/main.js --mode=development
```

- 生产模式

```bash
npx webpack ./src/main.js --mode=production
```

`npx webpack`: 是用来运行本地安装 `Webpack` 包的。

`./src/main.js`: 指定 `Webpack` 从 `main.js` 文件开始打包，不但会打包 `main.js`，还会将其依赖也一起打包进来。

`--mode=xxx`：指定模式（环境）。

#### 5. 观察输出文件

默认 `Webpack` 会将文件打包输出到 `dist` 目录下，我们查看 `dist` 目录下文件情况就好了。

## 基本配置

### 5 大核心概念

1. **entry（入口）**：指示 Webpack 从哪个文件开始打包
2. **output（输出）**：指示 Webpack 打包完的文件输出到哪里去，如何命名等
3. **loader（加载器）**：webpack 本身只能处理 js、json 等资源，其他资源需要借助 loader，Webpack 才能解析
4. **plugins（插件）**：扩展 Webpack 的功能
5. **mode（模式）**：主要由两种模式：开发模式（development）、生产模式（production）

### 准备 Webpack 配置文件

在项目根目录下新建文件：`webpack.config.js`

```js
module.exports = {
  // 入口
  entry: "",
  // 输出
  output: {},
  // 加载器
  module: {
    rules: [],
  },
  // 插件
  plugins: [],
  // 模式
  mode: "",
};
```

Webpack 是基于 Node.js 运行的，所以采用 Common.js 模块化规范。

### 修改配置文件

```js
const path = require("path");

module.exports = {
  entry: "./src/main.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "main.js",
  },
  module: {
    rules: [],
  },
  plugins: [],
  mode: "development",
};
```

## 处理样式资源

### 处理 CSS 资源

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
};
```

**安装依赖：**

```bash
npm i css-loader style-loader -D
```

### 处理 Less 资源

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.less$/,
        use: ["style-loader", "css-loader", "less-loader"],
      },
    ],
  },
};
```

### 处理 Sass/Scss 资源

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
    ],
  },
};
```

## 处理图片资源

Webpack 5 内置了图片处理功能：

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif|webp)$/,
        type: "asset",
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024,
          },
        },
        generator: {
          filename: "static/imgs/[hash:8][ext][query]",
        },
      },
    ],
  },
};
```

## 处理字体图标

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.(ttf|woff2?)$/,
        type: "asset/resource",
        generator: {
          filename: "static/media/[hash:8][ext][query]",
        },
      },
    ],
  },
};
```

## 处理 JavaScript

### ESLint 配置

```js
module.exports = {
  extends: ["eslint:recommended"],
  env: {
    node: true,
    browser: true,
  },
  parserOptions: {
    ecmaVersion: 6,
    sourceType: "module",
  },
};
```

### Babel 配置

```js
module.exports = {
  presets: ["@babel/preset-env"],
};
```

## 开发服务器

```js
module.exports = {
  devServer: {
    host: "localhost",
    port: "3000",
    open: true,
    hot: true,
  },
};
```

**安装依赖：**

```bash
npm i webpack-dev-server -D
```
