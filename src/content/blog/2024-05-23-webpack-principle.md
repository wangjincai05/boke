---
title: 'Webpack 原理深度剖析：Loader 和 Plugin 机制'
date: 2024-05-23
description: '深入理解 Webpack 的核心原理，包括 Loader 和 Plugin 的工作机制，以及如何自定义开发'
tags: ['Webpack', '原理', 'Loader', 'Plugin', '前端工程化']
---

## 介绍

本章节我们主要学习：

- Loader 原理
- 自定义常用 Loader
- Plugin 原理
- 自定义常用 Plugin

## Loader 原理

### Loader 概念

帮助 webpack 将不同类型的文件转换为 webpack 可识别的模块。

### Loader 执行顺序

#### 分类

- **pre**：前置 loader
- **normal**：普通 loader
- **inline**：内联 loader
- **post**：后置 loader

#### 执行顺序

- 4 类 loader 的执行优先级为：`pre > normal > inline > post`
- 相同优先级的 loader 执行顺序为：`从右到左，从下到上`

**示例：**

```js
// 此时loader执行顺序：loader3 - loader2 - loader1
module: {
  rules: [
    { test: /\.js$/, loader: "loader1" },
    { test: /\.js$/, loader: "loader2" },
    { test: /\.js$/, loader: "loader3" },
  ],
},
```

```js
// 此时loader执行顺序：loader1 - loader2 - loader3
module: {
  rules: [
    { enforce: "pre", test: /\.js$/, loader: "loader1" },
    { test: /\.js$/, loader: "loader2" },
    { enforce: "post", test: /\.js$/, loader: "loader3" },
  ],
},
```

### 开发一个 Loader

#### 最简单的 Loader

```js
// loaders/loader1.js
module.exports = function loader1(content) {
  console.log("hello loader");
  return content;
};
```

它接受要处理的源码作为参数，输出转换后的 JS 代码。

#### Loader 接受的参数

- `content`：源文件的内容
- `map`：SourceMap 数据
- `meta`：数据，可以是任何内容

### Loader 分类

#### 同步 Loader

```js
module.exports = function (content, map, meta) {
  return content;
};
```

使用 `this.callback` 方法更灵活：

```js
module.exports = function (content, map, meta) {
  this.callback(null, content, map, meta);
  return;
};
```

#### 异步 Loader

```js
module.exports = function (content, map, meta) {
  const callback = this.async();
  setTimeout(() => {
    callback(null, result, map, meta);
  }, 1000);
};
```

#### Raw Loader

默认情况下，资源文件会被转化为 UTF-8 字符串，然后传给 loader。通过设置 `raw` 为 `true`，loader 可以接收原始的 Buffer。

```js
module.exports = function (content) {
  return content;
};
module.exports.raw = true;
```

#### Pitching Loader

```js
module.exports = function (content) {
  return content;
};
module.exports.pitch = function (remainingRequest, precedingRequest, data) {
  console.log("do something");
};
```

Webpack 会先从左到右执行 loader 链中的每个 loader 上的 `pitch` 方法，然后再从右到左执行普通 loader 方法。

### Loader API

| 方法名 | 含义 | 用法 |
|--------|------|------|
| `this.async` | 异步回调 loader | `const callback = this.async()` |
| `this.callback` | 同步或异步调用并返回多个结果 | `this.callback(err, content, sourceMap?, meta?)` |
| `this.getOptions(schema)` | 获取 loader 的 options | `this.getOptions(schema)` |
| `this.emitFile` | 产生一个文件 | `this.emitFile(name, content, sourceMap)` |
| `this.utils.contextify` | 返回相对路径 | `this.utils.contextify(context, request)` |
| `this.utils.absolutify` | 返回绝对路径 | `this.utils.absolutify(context, request)` |

### 手写 Clean-Log-Loader

作用：用来清理 JS 代码中的 `console.log`

```js
// loaders/clean-log-loader.js
module.exports = function cleanLogLoader(content) {
  return content.replace(/console\.log\(.*\);?/g, "");
};
```

### 手写 Banner-Loader

作用：给 JS 代码添加文本注释

**loaders/banner-loader/index.js**

```js
const schema = require("./schema.json");

module.exports = function (content) {
  const options = this.getOptions(schema);
  const prefix = `/*\n * Author: ${options.author}\n */\n`;
  return `${prefix}${content}`;
};
```

**loaders/banner-loader/schema.json**

```json
{
  "type": "object",
  "properties": {
    "author": { "type": "string" }
  },
  "additionalProperties": false
}
```

### 手写 File-Loader

作用：将文件原封不动输出出去

```js
const loaderUtils = require("loader-utils");

function fileLoader(content) {
  const filename = loaderUtils.interpolateName(this, "[hash].[ext]", { content });
  this.emitFile(filename, content);
  return `export default '${filename}'`;
}

fileLoader.raw = true;
module.exports = fileLoader;
```

## Plugin 原理

### Plugin 的作用

通过插件我们可以扩展 webpack，加入自定义的构建行为，使 webpack 可以执行更广泛的任务，拥有更强的构建能力。

### Plugin 工作原理

Webpack 在编译代码过程中，会触发一系列 `Tapable` 钩子事件，插件所做的，就是找到相应的钩子，往上面挂上自己的任务，也就是注册事件。

### Webpack 内部的钩子

#### Tapable

`Tapable` 为 webpack 提供了统一的插件接口类型定义，它是 webpack 的核心功能库。

```js
exports.SyncHook = require("./SyncHook");
exports.SyncBailHook = require("./SyncBailHook");
exports.SyncWaterfallHook = require("./SyncWaterfallHook");
exports.SyncLoopHook = require("./SyncLoopHook");
exports.AsyncParallelHook = require("./AsyncParallelHook");
exports.AsyncParallelBailHook = require("./AsyncParallelBailHook");
exports.AsyncSeriesHook = require("./AsyncSeriesHook");
exports.AsyncSeriesBailHook = require("./AsyncSeriesBailHook");
exports.AsyncSeriesLoopHook = require("./AsyncSeriesLoopHook");
exports.AsyncSeriesWaterfallHook = require("./AsyncSeriesWaterfallHook");
```

#### 注册方法

- `tap`：注册同步钩子和异步钩子
- `tapAsync`：回调方式注册异步钩子
- `tapPromise`：Promise 方式注册异步钩子

### Plugin 构建对象

#### Compiler

compiler 对象中保存着完整的 Webpack 环境配置，每次启动 webpack 构建时它都是独一无二的。

**主要属性：**
- `compiler.options`：访问本次启动 webpack 的所有配置
- `compiler.inputFileSystem` / `compiler.outputFileSystem`：文件操作
- `compiler.hooks`：注册 tapable 钩子

#### Compilation

compilation 对象代表一次资源的构建。

**主要属性：**
- `compilation.modules`：访问所有模块
- `compilation.chunks`：访问所有代码块
- `compilation.assets`：访问本次打包生成的所有文件结果
- `compilation.hooks`：注册 tapable 钩子

### 开发一个插件

#### 最简单的插件

```js
class TestPlugin {
  constructor() {
    console.log("TestPlugin constructor()");
  }
  
  apply(compiler) {
    console.log("TestPlugin apply()");
  }
}

module.exports = TestPlugin;
```

#### 注册 Hook

```js
class TestPlugin {
  apply(compiler) {
    compiler.hooks.compile.tap("TestPlugin", (compilationParams) => {
      console.log("compiler.compile()");
    });

    compiler.hooks.make.tapAsync("TestPlugin", (compilation, callback) => {
      setTimeout(() => {
        console.log("compiler.make()");
        callback();
      }, 1000);
    });

    compiler.hooks.emit.tapPromise("TestPlugin", (compilation) => {
      return new Promise((resolve) => {
        console.log("compiler.emit()");
        resolve();
      });
    });
  }
}

module.exports = TestPlugin;
```

### BannerWebpackPlugin

**作用**：给打包输出文件添加注释

```js
class BannerWebpackPlugin {
  constructor(options = {}) {
    this.options = options;
  }

  apply(compiler) {
    const extensions = ["js", "css"];

    compiler.hooks.emit.tapAsync("BannerWebpackPlugin", (compilation, callback) => {
      const assetPaths = Object.keys(compilation.assets).filter((path) => {
        const splitted = path.split(".");
        return extensions.includes(splitted[splitted.length - 1]);
      });

      assetPaths.forEach((assetPath) => {
        const asset = compilation.assets[assetPath];
        const source = `/*\n* Author: ${this.options.author}\n*/\n${asset.source()}`;

        compilation.assets[assetPath] = {
          source() { return source; },
          size() { return source.length; },
        };
      });

      callback();
    });
  }
}

module.exports = BannerWebpackPlugin;
```

### CleanWebpackPlugin

**作用**：在 webpack 打包输出前将上次打包内容清空

```js
class CleanWebpackPlugin {
  apply(compiler) {
    const fs = compiler.outputFileSystem;

    compiler.hooks.emit.tapAsync("CleanWebpackPlugin", (compilation, callback) => {
      const outputPath = compiler.options.output.path;
      const err = this.removeFiles(fs, outputPath);
      callback(err);
    });
  }

  removeFiles(fs, path) {
    try {
      const files = fs.readdirSync(path);
      files.forEach((file) => {
        const filePath = `${path}/${file}`;
        const fileStat = fs.statSync(filePath);
        if (fileStat.isDirectory()) {
          this.removeFiles(fs, filePath);
        } else {
          fs.unlinkSync(filePath);
        }
      });
      fs.rmdirSync(path);
    } catch (e) {
      return e;
    }
  }
}

module.exports = CleanWebpackPlugin;
```

### AnalyzeWebpackPlugin

**作用**：分析 webpack 打包资源大小，并输出分析文件

```js
class AnalyzeWebpackPlugin {
  apply(compiler) {
    compiler.hooks.emit.tap("AnalyzeWebpackPlugin", (compilation) => {
      const assets = Object.entries(compilation.assets);

      let source = "# 分析打包资源大小 \n| 名称 | 大小 |\n| --- | --- |";

      assets.forEach(([filename, file]) => {
        source += `\n| ${filename} | ${file.size()} |`;
      });

      compilation.assets["analyze.md"] = {
        source() { return source; },
        size() { return source.length; },
      };
    });
  }
}

module.exports = AnalyzeWebpackPlugin;
```

## 总结

通过本章节的学习，你应该理解了：

1. **Loader 原理**：处理不同类型文件的转换工具，按顺序执行
2. **自定义 Loader**：同步、异步、Raw、Pitching 四种类型
3. **Plugin 原理**：基于 Tapable 钩子机制扩展 webpack 功能
4. **自定义 Plugin**：通过 Compiler 和 Compilation 对象操作构建过程

Loader 和 Plugin 是 Webpack 生态中最核心的扩展机制，掌握它们可以帮助你更好地理解和定制构建流程。
