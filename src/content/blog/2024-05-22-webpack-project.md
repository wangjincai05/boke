---
title: 'Webpack 项目实战：从零搭建 React 和 Vue 脚手架'
date: 2024-03-19
description: '使用 Webpack 从零搭建 React-Cli 和 Vue-Cli 的详细配置指南'
tags: ['Webpack', 'React', 'Vue', '脚手架']
---

## 介绍

我们将使用前面所学的知识来从零开始搭建 `React-Cli` 和 `Vue-cli`。

## React 脚手架

### 开发模式配置

```js
const path = require("path");
const ESLintWebpackPlugin = require("eslint-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

const getStyleLoaders = (preProcessor) => {
  return [
    "style-loader",
    "css-loader",
    {
      loader: "postcss-loader",
      options: {
        postcssOptions: {
          plugins: ["postcss-preset-env"],
        },
      },
    },
    preProcessor,
  ].filter(Boolean);
};

module.exports = {
  entry: "./src/main.js",
  output: {
    path: undefined,
    filename: "static/js/[name].js",
    chunkFilename: "static/js/[name].chunk.js",
    assetModuleFilename: "static/js/[hash:10][ext][query]",
  },
  module: {
    rules: [
      {
        oneOf: [
          { test: /\.css$/, use: getStyleLoaders() },
          { test: /\.less$/, use: getStyleLoaders("less-loader") },
          { test: /\.s[ac]ss$/, use: getStyleLoaders("sass-loader") },
          { test: /\.styl$/, use: getStyleLoaders("stylus-loader") },
          {
            test: /\.(png|jpe?g|gif|svg)$/,
            type: "asset",
            parser: { dataUrlCondition: { maxSize: 10 * 1024 } },
          },
          { test: /\.(ttf|woff2?)$/, type: "asset/resource" },
          {
            test: /\.(jsx|js)$/,
            include: path.resolve(__dirname, "../src"),
            loader: "babel-loader",
            options: {
              cacheDirectory: true,
              cacheCompression: false,
              plugins: ["react-refresh/babel"],
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new ESLintWebpackPlugin({
      context: path.resolve(__dirname, "../src"),
      exclude: "node_modules",
      cache: true,
      cacheLocation: path.resolve(__dirname, "../node_modules/.cache/.eslintcache"),
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "../public/index.html"),
    }),
    new ReactRefreshWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "../public"),
          to: path.resolve(__dirname, "../dist"),
          globOptions: { ignore: ["**/index.html"] },
        },
      ],
    }),
  ],
  optimization: {
    splitChunks: { chunks: "all" },
    runtimeChunk: { name: (entrypoint) => `runtime~${entrypoint.name}` },
  },
  resolve: { extensions: [".jsx", ".js", ".json"] },
  devServer: {
    open: true,
    host: "localhost",
    port: 3000,
    hot: true,
    compress: true,
    historyApiFallback: true,
  },
  mode: "development",
  devtool: "cheap-module-source-map",
};
```

### 生产模式配置

```js
const path = require("path");
const ESLintWebpackPlugin = require("eslint-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserWebpackPlugin = require("terser-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

const getStyleLoaders = (preProcessor) => {
  return [
    MiniCssExtractPlugin.loader,
    "css-loader",
    {
      loader: "postcss-loader",
      options: {
        postcssOptions: {
          plugins: ["postcss-preset-env"],
        },
      },
    },
    preProcessor,
  ].filter(Boolean);
};

module.exports = {
  entry: "./src/main.js",
  output: {
    path: path.resolve(__dirname, "../dist"),
    filename: "static/js/[name].[contenthash:10].js",
    chunkFilename: "static/js/[name].[contenthash:10].chunk.js",
    assetModuleFilename: "static/js/[hash:10][ext][query]",
    clean: true,
  },
  module: {
    rules: [
      {
        oneOf: [
          { test: /\.css$/, use: getStyleLoaders() },
          { test: /\.less$/, use: getStyleLoaders("less-loader") },
          { test: /\.s[ac]ss$/, use: getStyleLoaders("sass-loader") },
          { test: /\.styl$/, use: getStyleLoaders("stylus-loader") },
          {
            test: /\.(png|jpe?g|gif|svg)$/,
            type: "asset",
            parser: { dataUrlCondition: { maxSize: 10 * 1024 } },
          },
          { test: /\.(ttf|woff2?)$/, type: "asset/resource" },
          {
            test: /\.(jsx|js)$/,
            include: path.resolve(__dirname, "../src"),
            loader: "babel-loader",
            options: { cacheDirectory: true, cacheCompression: false },
          },
        ],
      },
    ],
  },
  plugins: [
    new ESLintWebpackPlugin({
      context: path.resolve(__dirname, "../src"),
      exclude: "node_modules",
      cache: true,
    }),
    new HtmlWebpackPlugin({ template: path.resolve(__dirname, "../public/index.html") }),
    new MiniCssExtractPlugin({
      filename: "static/css/[name].[contenthash:10].css",
      chunkFilename: "static/css/[name].[contenthash:10].chunk.css",
    }),
    new CopyPlugin({ patterns: [{ from: "../public", to: "../dist", globOptions: { ignore: ["**/index.html"] } }] }),
  ],
  optimization: {
    minimizer: [
      new CssMinimizerPlugin(),
      new TerserWebpackPlugin(),
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
    splitChunks: { chunks: "all" },
    runtimeChunk: { name: (entrypoint) => `runtime~${entrypoint.name}` },
  },
  resolve: { extensions: [".jsx", ".js", ".json"] },
  mode: "production",
  devtool: "source-map",
};
```

### package.json 配置

```json
{
  "name": "react-cli",
  "version": "1.0.0",
  "scripts": {
    "start": "npm run dev",
    "dev": "cross-env NODE_ENV=development webpack serve --config ./config/webpack.config.js",
    "build": "cross-env NODE_ENV=production webpack --config ./config/webpack.config.js"
  },
  "devDependencies": {
    "@babel/core": "^7.17.10",
    "@pmmmwh/react-refresh-webpack-plugin": "^0.5.5",
    "babel-loader": "^8.2.5",
    "babel-preset-react-app": "^10.0.1",
    "copy-webpack-plugin": "^10.2.4",
    "cross-env": "^7.0.3",
    "css-loader": "^6.7.1",
    "css-minimizer-webpack-plugin": "^3.4.1",
    "eslint-config-react-app": "^7.0.1",
    "eslint-webpack-plugin": "^3.1.1",
    "html-webpack-plugin": "^5.5.0",
    "image-minimizer-webpack-plugin": "^3.2.3",
    "imagemin": "^8.0.1",
    "imagemin-gifsicle": "^7.0.0",
    "imagemin-jpegtran": "^7.0.0",
    "imagemin-optipng": "^8.0.0",
    "imagemin-svgo": "^10.0.1",
    "less-loader": "^10.2.0",
    "mini-css-extract-plugin": "^2.6.0",
    "postcss-loader": "^6.2.1",
    "postcss-preset-env": "^7.5.0",
    "react-refresh": "^0.13.0",
    "sass-loader": "^12.6.0",
    "style-loader": "^3.3.1",
    "stylus-loader": "^6.2.0",
    "webpack": "^5.72.0",
    "webpack-cli": "^4.9.2",
    "webpack-dev-server": "^4.9.0"
  },
  "dependencies": {
    "react": "^18.1.0",
    "react-dom": "^18.1.0",
    "react-router-dom": "^6.3.0"
  },
  "browserslist": ["last 2 version", "> 1%", "not dead"]
}
```

## Vue 脚手架

### 开发模式配置

```js
const path = require("path");
const ESLintWebpackPlugin = require("eslint-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { VueLoaderPlugin } = require("vue-loader");
const { DefinePlugin } = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");

const getStyleLoaders = (preProcessor) => {
  return [
    "vue-style-loader",
    "css-loader",
    {
      loader: "postcss-loader",
      options: {
        postcssOptions: {
          plugins: ["postcss-preset-env"],
        },
      },
    },
    preProcessor,
  ].filter(Boolean);
};

module.exports = {
  entry: "./src/main.js",
  output: {
    path: undefined,
    filename: "static/js/[name].js",
    chunkFilename: "static/js/[name].chunk.js",
    assetModuleFilename: "static/js/[hash:10][ext][query]",
  },
  module: {
    rules: [
      { test: /\.css$/, use: getStyleLoaders() },
      { test: /\.less$/, use: getStyleLoaders("less-loader") },
      { test: /\.s[ac]ss$/, use: getStyleLoaders("sass-loader") },
      { test: /\.styl$/, use: getStyleLoaders("stylus-loader") },
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        type: "asset",
        parser: { dataUrlCondition: { maxSize: 10 * 1024 } },
      },
      { test: /\.(ttf|woff2?)$/, type: "asset/resource" },
      {
        test: /\.(jsx|js)$/,
        include: path.resolve(__dirname, "../src"),
        loader: "babel-loader",
        options: { cacheDirectory: true, cacheCompression: false },
      },
      {
        test: /\.vue$/,
        loader: "vue-loader",
        options: { cacheDirectory: path.resolve(__dirname, "node_modules/.cache/vue-loader") },
      },
    ],
  },
  plugins: [
    new ESLintWebpackPlugin({ context: path.resolve(__dirname, "../src"), exclude: "node_modules", cache: true }),
    new HtmlWebpackPlugin({ template: path.resolve(__dirname, "../public/index.html") }),
    new CopyPlugin({ patterns: [{ from: "../public", to: "../dist", globOptions: { ignore: ["**/index.html"] } }] }),
    new VueLoaderPlugin(),
    new DefinePlugin({ __VUE_OPTIONS_API__: "true", __VUE_PROD_DEVTOOLS__: "false" }),
  ],
  optimization: {
    splitChunks: { chunks: "all" },
    runtimeChunk: { name: (entrypoint) => `runtime~${entrypoint.name}` },
  },
  resolve: { extensions: [".vue", ".js", ".json"] },
  devServer: {
    open: true,
    host: "localhost",
    port: 3000,
    hot: true,
    compress: true,
    historyApiFallback: true,
  },
  mode: "development",
  devtool: "cheap-module-source-map",
};
```

### 生产模式配置

```js
const path = require("path");
const ESLintWebpackPlugin = require("eslint-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserWebpackPlugin = require("terser-webpack-plugin");
const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");
const { VueLoaderPlugin } = require("vue-loader");
const { DefinePlugin } = require("webpack");

const getStyleLoaders = (preProcessor) => {
  return [
    MiniCssExtractPlugin.loader,
    "css-loader",
    {
      loader: "postcss-loader",
      options: {
        postcssOptions: {
          plugins: ["postcss-preset-env"],
        },
      },
    },
    preProcessor,
  ].filter(Boolean);
};

module.exports = {
  entry: "./src/main.js",
  output: {
    path: path.resolve(__dirname, "../dist"),
    filename: "static/js/[name].[contenthash:10].js",
    chunkFilename: "static/js/[name].[contenthash:10].chunk.js",
    assetModuleFilename: "static/js/[hash:10][ext][query]",
    clean: true,
  },
  module: {
    rules: [
      { test: /\.css$/, use: getStyleLoaders() },
      { test: /\.less$/, use: getStyleLoaders("less-loader") },
      { test: /\.s[ac]ss$/, use: getStyleLoaders("sass-loader") },
      { test: /\.styl$/, use: getStyleLoaders("stylus-loader") },
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        type: "asset",
        parser: { dataUrlCondition: { maxSize: 10 * 1024 } },
      },
      { test: /\.(ttf|woff2?)$/, type: "asset/resource" },
      {
        test: /\.(jsx|js)$/,
        include: path.resolve(__dirname, "../src"),
        loader: "babel-loader",
        options: { cacheDirectory: true, cacheCompression: false },
      },
      { test: /\.vue$/, loader: "vue-loader" },
    ],
  },
  plugins: [
    new ESLintWebpackPlugin({ context: path.resolve(__dirname, "../src"), exclude: "node_modules", cache: true }),
    new HtmlWebpackPlugin({ template: path.resolve(__dirname, "../public/index.html") }),
    new MiniCssExtractPlugin({ filename: "static/css/[name].[contenthash:10].css" }),
    new VueLoaderPlugin(),
    new DefinePlugin({ __VUE_OPTIONS_API__: "true", __VUE_PROD_DEVTOOLS__: "false" }),
  ],
  optimization: {
    minimizer: [new CssMinimizerPlugin(), new TerserWebpackPlugin(), new ImageMinimizerPlugin({
      minimizer: {
        implementation: ImageMinimizerPlugin.imageminGenerate,
        options: { plugins: [["gifsicle"], ["jpegtran"], ["optipng"], ["svgo"]] }
      }
    })],
    splitChunks: { chunks: "all" },
    runtimeChunk: { name: (entrypoint) => `runtime~${entrypoint.name}` },
  },
  resolve: { extensions: [".vue", ".js", ".json"] },
  mode: "production",
  devtool: "source-map",
};
```

### 合并配置

```js
const path = require("path");
const ESLintWebpackPlugin = require("eslint-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserWebpackPlugin = require("terser-webpack-plugin");
const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");
const { VueLoaderPlugin } = require("vue-loader");
const { DefinePlugin } = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");

const isProduction = process.env.NODE_ENV === "production";

const getStyleLoaders = (preProcessor) => {
  return [
    isProduction ? MiniCssExtractPlugin.loader : "vue-style-loader",
    "css-loader",
    { loader: "postcss-loader", options: { postcssOptions: { plugins: ["postcss-preset-env"] } } },
    preProcessor,
  ].filter(Boolean);
};

module.exports = {
  entry: "./src/main.js",
  output: {
    path: isProduction ? path.resolve(__dirname, "../dist") : undefined,
    filename: isProduction ? "static/js/[name].[contenthash:10].js" : "static/js/[name].js",
    chunkFilename: isProduction ? "static/js/[name].[contenthash:10].chunk.js" : "static/js/[name].chunk.js",
    assetModuleFilename: "static/js/[hash:10][ext][query]",
    clean: true,
  },
  module: {
    rules: [
      { test: /\.css$/, use: getStyleLoaders() },
      { test: /\.less$/, use: getStyleLoaders("less-loader") },
      { test: /\.s[ac]ss$/, use: getStyleLoaders("sass-loader") },
      { test: /\.styl$/, use: getStyleLoaders("stylus-loader") },
      { test: /\.(png|jpe?g|gif|svg)$/, type: "asset", parser: { dataUrlCondition: { maxSize: 10 * 1024 } } },
      { test: /\.(ttf|woff2?)$/, type: "asset/resource" },
      { test: /\.(jsx|js)$/, include: path.resolve(__dirname, "../src"), loader: "babel-loader" },
      { test: /\.vue$/, loader: "vue-loader" },
    ],
  },
  plugins: [
    new ESLintWebpackPlugin({ context: path.resolve(__dirname, "../src"), exclude: "node_modules", cache: true }),
    new HtmlWebpackPlugin({ template: path.resolve(__dirname, "../public/index.html") }),
    new CopyPlugin({ patterns: [{ from: "../public", to: "../dist", globOptions: { ignore: ["**/index.html"] } }] }),
    isProduction && new MiniCssExtractPlugin({ filename: "static/css/[name].[contenthash:10].css" }),
    new VueLoaderPlugin(),
    new DefinePlugin({ __VUE_OPTIONS_API__: "true", __VUE_PROD_DEVTOOLS__: "false" }),
  ].filter(Boolean),
  optimization: {
    minimize: isProduction,
    minimizer: [new CssMinimizerPlugin(), new TerserWebpackPlugin(), new ImageMinimizerPlugin({
      minimizer: {
        implementation: ImageMinimizerPlugin.imageminGenerate,
        options: { plugins: [["gifsicle"], ["jpegtran"], ["optipng"], ["svgo"]] }
      }
    })],
    splitChunks: { chunks: "all" },
    runtimeChunk: { name: (entrypoint) => `runtime~${entrypoint.name}` },
  },
  resolve: { extensions: [".vue", ".js", ".json"] },
  devServer: { open: true, host: "localhost", port: 3000, hot: true, compress: true, historyApiFallback: true },
  mode: isProduction ? "production" : "development",
  devtool: isProduction ? "source-map" : "cheap-module-source-map",
};
```

## 总结

通过以上配置，我们成功搭建了：

1. **React 脚手架**：包含完整的开发和生产配置
2. **Vue 脚手架**：包含 Vue 特有的配置项

两个脚手架都包含：
- 样式处理（CSS、Less、Sass、Stylus）
- 图片和字体资源处理
- ESLint 代码检查
- Babel 编译
- 代码分割优化
- 开发服务器配置
