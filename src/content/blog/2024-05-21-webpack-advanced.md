---
title: 'Webpack 高级配置与优化'
date: 2024-03-12
description: 'Webpack 高级配置指南，包括 SourceMap、热模块替换、代码分割、缓存策略等优化手段'
tags: ['Webpack', '前端工程化', '性能优化']
---

## 介绍

本章节主要介绍 Webpack 高级配置。

所谓高级配置其实就是进行 Webpack 优化，让代码在编译/运行时性能更好。

我们会从以下角度来进行优化：

1. 提升开发体验
2. 提升打包构建速度
3. 减少代码体积
4. 优化代码运行性能

## 提升开发体验

### SourceMap

**为什么需要？**

开发时我们运行的代码是经过 webpack 编译后的，所有 CSS 和 JS 合并成了一个文件，并且多了其他代码。此时如果代码运行出错，提示的错误位置我们是看不懂的。一旦将来开发代码文件很多，那么很难去发现错误出现在哪里。

**是什么？**

SourceMap（源代码映射）是一个用来生成源代码与构建后代码一一映射的文件的方案。

它会生成一个 `xxx.map` 文件，里面包含源代码和构建后代码每一行、每一列的映射关系。

**怎么用？**

```js
module.exports = {
  mode: "development",
  devtool: "cheap-module-source-map",
};
```

生产模式建议使用 `source-map`：

```js
module.exports = {
  mode: "production",
  devtool: "source-map",
};
```

## 提升打包构建速度

### HotModuleReplacement

**为什么需要？**

开发时我们修改了其中一个模块代码，Webpack 默认会将所有模块全部重新打包编译，速度很慢。

**是什么？**

HotModuleReplacement（HMR/热模块替换）：在程序运行中，替换、添加或删除模块，而无需重新加载整个页面。

**怎么用？**

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

### OneOf

**为什么需要？**

打包时每个文件都会经过所有 loader 处理，虽然因为 `test` 正则原因实际没有处理上，但是都要过一遍，比较慢。

**是什么？**

顾名思义就是只能匹配上一个 loader，剩下的就不匹配了。

**怎么用？**

```js
module.exports = {
  module: {
    rules: [
      {
        oneOf: [
          {
            test: /\.css$/,
            use: ["style-loader", "css-loader"],
          },
          {
            test: /\.less$/,
            use: ["style-loader", "css-loader", "less-loader"],
          },
          {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: "babel-loader",
          },
        ],
      },
    ],
  },
};
```

### Include/Exclude

**为什么需要？**

开发时我们需要使用第三方的库或插件，所有文件都下载到 `node_modules` 中了。而这些文件是不需要编译可以直接使用的。

**怎么用？**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve(__dirname, "../src"),
        loader: "babel-loader",
      },
    ],
  },
};
```

### Cache

**为什么需要？**

每次打包时 JS 文件都要经过 ESLint 检查和 Babel 编译，速度比较慢。

**怎么用？**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: "babel-loader",
        options: {
          cacheDirectory: true,
          cacheCompression: false,
        },
      },
    ],
  },
  plugins: [
    new ESLintWebpackPlugin({
      cache: true,
      cacheLocation: path.resolve(__dirname, "../node_modules/.cache/.eslintcache"),
    }),
  ],
};
```

### Thread

**为什么需要？**

当项目越来越庞大时，打包速度越来越慢。

**是什么？**

多进程打包：开启电脑的多个进程同时干一件事，速度更快。

**需要注意**：请仅在特别耗时的操作中使用，因为每个进程启动就有大约为 600ms 左右开销。

**怎么用？**

```js
const os = require("os");
const threads = os.cpus().length;

module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: "thread-loader",
            options: {
              workers: threads,
            },
          },
          {
            loader: "babel-loader",
          },
        ],
      },
    ],
  },
};
```

## 减少代码体积

### Tree Shaking

**为什么需要？**

开发时我们定义了一些工具函数库，或者引用第三方工具函数库或组件库。如果没有特殊处理的话我们打包时会引入整个库，但是实际上可能我们只用上极小部分的功能。

**是什么？**

`Tree Shaking` 是一个术语，通常用于描述移除 JavaScript 中的没有使用上的代码。

**注意**：它依赖 `ES Module`。

**怎么用？**

Webpack 已经默认开启了这个功能，无需其他配置。

### Babel 优化

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: "babel-loader",
        options: {
          plugins: ["@babel/plugin-transform-runtime"],
        },
      },
    ],
  },
};
```

### Image Minimizer

**安装依赖：**

```bash
npm i image-minimizer-webpack-plugin imagemin imagemin-gifsicle imagemin-jpegtran imagemin-optipng imagemin-svgo -D
```

**配置：**

```js
module.exports = {
  optimization: {
    minimizer: [
      new ImageMinimizerPlugin({
        minimizer: {
          implementation: ImageMinimizerPlugin.imageminGenerate,
          options: {
            plugins: [
              ["gifsicle", { interlaced: true }],
              ["jpegtran", { progressive: true }],
              ["optipng", { optimizationLevel: 5 }],
              ["svgo", { plugins: ["preset-default"] }],
            ],
          },
        },
      }),
    ],
  },
};
```

## 优化代码运行性能

### Code Split

**为什么需要？**

打包代码时会将所有 JS 文件打包到一个文件中，体积太大了。

**是什么？**

代码分割（Code Split）主要做了两件事：
1. 分割文件：将打包生成的文件进行分割，生成多个 JS 文件。
2. 按需加载：需要哪个文件就加载哪个文件。

**怎么用？**

```js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: "all",
    },
    runtimeChunk: {
      name: (entrypoint) => `runtime~${entrypoint.name}`,
    },
  },
};
```

### 多入口配置

```js
module.exports = {
  entry: {
    main: "./src/main.js",
    app: "./src/app.js",
  },
  output: {
    filename: "js/[name].js",
  },
};
```

### 按需加载

```js
button.addEventListener('click', () => {
  import('./math.js').then(({ sum }) => {
    console.log(sum(1, 2, 3, 4));
  });
});
```

## 总结

通过以上优化手段，我们可以从多个维度提升 Webpack 的构建和运行性能：

1. **开发体验**：SourceMap、HMR
2. **构建速度**：OneOf、Include/Exclude、Cache、Thread
3. **代码体积**：Tree Shaking、Babel、Image Minimizer
4. **运行性能**：Code Split、按需加载
