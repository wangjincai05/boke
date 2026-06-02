---
title: 'ESLint 9 + Prettier + Git提交校验：前端工程化配置实战'
date: 2026-06-01
description: 'Vue3 + TypeScript + Vite 项目的完整工程化配置方案，包含ESLint 9 Flat Config、Prettier、Husky、lint-staged、commitlint'
tags: ['ESLint', 'Prettier', 'Git Hooks', '工程化', 'Vue3']
---

# ESLint 9 + Prettier + Git 提交校验：前端工程化配置实战

> 本文是技术博客系列的第 20 篇，聚焦 Vue3 + TypeScript + Vite 项目的工程化配置。

## 前言：为什么工程化配置必须做？

你有没有遇到过这种情况：

- 代码风格一会儿缩进 2 空格，一会儿 4 空格
- 同事提交的代码 `console.log` 满天飞
- Git 历史里充斥着 `update`、`fix bug`、`xxx` 这种提交信息
- 代码合并后突然报错，排查半天才发现是格式问题

**工程化配置就是来解决这些问题的。** 本质上，它是一套自动化规则：
- 代码检查：谁来提交都不许写烂代码
- 自动格式化：风格统一，不需要争论
- 提交规范：每次提交都有据可查、可追溯

本文不讲理论，只讲实操。Vue3 + TypeScript + Vite 技术栈，拿来即用。

---

## 一、ESLint 9 Flat Config 完整配置

### 1.1 为什么选 ESLint 9？

ESLint 9（2024年4月发布）带来了**扁平化配置（Flat Config）**，彻底告别 `.eslintrc.json` 时代。新特性：

- **数组式配置**：逻辑更清晰，不像原来那样嵌套继承
- **原生 ESM 支持**：直接用 `import`，不需要 `require`
- **defineConfig 函数**：可以嵌套配置，自动展平
- **性能提升**：配置加载更快

> **迁移警告**：`.eslintrc` 和 `eslint.config.js` 不能同时使用，必须二选一。

### 1.2 安装依赖

```bash
npm install -D eslint @eslint/js typescript-eslint eslint-plugin-vue eslint-plugin-vue@latest globals eslint-config-prettier prettier
```

或者用 pnpm：

```bash
pnpm add -D eslint @eslint/js typescript-eslint eslint-plugin-vue globals eslint-config-prettier prettier
```

**版本要求**（2025-2026 最新）：

| 工具 | 最低版本 | 推荐版本 |
|------|---------|---------|
| ESLint | ^9.0.0 | ^9.18.0 |
| eslint-plugin-vue | ^10.6.0 | ^10.8.0 |
| typescript-eslint | ^7.0.0 | ^8.28.0 |
| vue-eslint-parser | ^9.3.0 | ^9.4.0 |

### 1.3 核心配置：eslint.config.js

在项目根目录创建 `eslint.config.js`（注意不是 `.eslintrc.js`）：

```javascript
// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import pluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

export default tseslint.config(
  // ===== 1. 忽略文件 =====
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '*.min.js',
      '.husky/**',
      'public/**',
    ],
  },

  // ===== 2. JavaScript 基础规则 =====
  js.configs.recommended,

  // ===== 3. TypeScript 规则 =====
  ...tseslint.configs.recommended,

  // ===== 4. Vue 3 规则 =====
  ...pluginVue.configs['flat/recommended'],

  // ===== 5. Vue 文件特殊配置（支持 <script setup> 和 TypeScript） =====
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
      },
      globals: {
        ...globals.browser,
        defineProps: 'readonly',
        defineEmits: 'readonly',
        defineExpose: 'readonly',
        withDefaults: 'readonly',
      },
    },
    rules: {
      // Vue 3 特有规则调整
      'vue/multi-word-component-names': 'off', // 允许 Login.vue 这种单字组件名
      'vue/html-indent': ['error', 2],
      'vue/max-attributes-per-line': [
        'error',
        {
          singleline: { max: 3 },  // 单行超过3个属性就换行
          multiline: { max: 1 },   // 多行模式下每行只能有1个属性
        },
      ],
      'vue/first-attribute-linebreak': [
        'error',
        { singleline: 'beside', multiline: 'below' },
      ],
      'vue/attribute-hyphenation': ['error', 'always'],
      'vue/v-on-event-hyphenation': ['error', 'always'],
      'vue/require-default-prop': 'off',  // TypeScript 已强制类型，可关闭
      'vue/require-prop-types': 'off',
    },
  },

  // ===== 6. TypeScript 文件特殊配置 =====
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],
    },
  },

  // ===== 7. 测试文件放宽规则 =====
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/__tests__/**'],
    languageOptions: {
      globals: {
        ...globals.jest,
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        test: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-unused-vars': 'warn',
    },
  },

  // ===== 8. 脚本文件配置 =====
  {
    files: ['scripts/**', '*.config.js', '*.config.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
    },
  },

  // ===== 9. Prettier 冲突处理（必须放最后） =====
  pluginPrettierRecommended,

  // ===== 10. 自定义全局规则 =====
  {
    rules: {
      'no-debugger': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': 'off',  // 已在 TypeScript 规则中覆盖
    },
  },
);
```

### 1.4 package.json 添加脚本

```json
{
  "scripts": {
    "lint": "eslint src --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx --fix",
    "lint:check": "eslint src --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx",
    "lint:quiet": "eslint src --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx --quiet"
  }
}
```

### 1.5 ESLint 9 踩坑记录

**坑1：Vue 文件中 TypeScript 不生效**

```typescript
// ❌ 错误写法
{
  files: ['**/*.vue'],
  languageOptions: {
    parser: require('vue-eslint-parser'),
    parserOptions: {
      parser: require('@typescript-eslint/parser'),
    },
  },
}

// ✅ 正确写法（使用 tseslint.parser）
{
  files: ['**/*.vue'],
  languageOptions: {
    parserOptions: {
      parser: tseslint.parser,
      extraFileExtensions: ['.vue'],
    },
  },
}
```

**坑2：忽略文件不生效**

```javascript
// ❌ 这样写在某个配置对象里是错的
{
  files: ['**/*.ts'],
  ignores: ['**/*.d.ts'],  // ignores 不能在有 files 的配置里
}

// ✅ 正确写法 - 顶层 ignores
export default tseslint.config(
  {
    ignores: ['**/*.d.ts', 'dist/**'],  // 顶层配置
  },
  // 其他配置...
);
```

**坑3：规则优先级混乱**

```javascript
// ❌ 基础规则放在后面，会覆盖前面的配置
...pluginVue.configs['flat/recommended'],
{
  rules: {
    'vue/no-unused-vars': 'error',  // 这会被前面的 recommended 覆盖
  },
}

// ✅ 正确 - 具体配置放后面，数组后面的优先级更高
{
  rules: {
    'vue/no-unused-vars': 'error',
  },
},
...pluginVue.configs['flat/recommended'],
```

**坑4：globalIgnores 的新写法**

ESLint 9.3+ 引入了 `globalIgnores()` 辅助函数：

```javascript
import { globalIgnores } from 'eslint/config';

export default tseslint.config(
  globalIgnores(['dist/**', 'node_modules/**']),
  // 其他配置...
);
```

---

## 二、Prettier 配置与冲突解决

### 2.1 为什么需要 Prettier？

ESLint 负责**代码质量**（逻辑错误、未使用变量等），Prettier 负责**代码风格**（缩进、引号、换行等）。

两者有重叠功能，必须解决冲突。

### 2.2 安装与基础配置

```bash
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
```

创建 `.prettierrc.js`：

```javascript
// .prettierrc.js
/** @type {import('prettier').Config} */
export default {
  // 打印宽度
  printWidth: 100,

  // 缩进
  tabWidth: 2,
  useTabs: false,

  // 分号
  semi: true,

  // 单引号
  singleQuote: true,

  // 对象/数组尾随逗号
  trailingComma: 'es5',

  // 箭头函数参数括号
  arrowParens: 'always',

  // 行尾符
  endOfLine: 'lf',

  // Vue 文件脚本缩进
  vueIndentScriptAndStyle: false,

  // 嵌入语言格式化
  embeddedLanguageFormatting: 'auto',

  // HTML 空白敏感度
  htmlWhitespaceSensitivity: 'css',

  // 模板缩进
  proseWrap: 'preserve',
};
```

### 2.3 创建 .prettierignore

```
# 忽略格式化
dist
node_modules
*.min.js
coverage
.husky
public
```

### 2.4 ESLint 与 Prettier 冲突解决

**eslint-config-prettier** 的原理：关闭 ESLint 中所有与 Prettier 冲突的格式化规则。

```javascript
// eslint.config.js 中已经导入
import pluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

// 这等价于：
// 1. eslint-plugin-prettier - 把 Prettier 作为 ESLint 规则运行
// 2. eslint-config-prettier - 关闭冲突的 ESLint 规则
```

**验证冲突是否解决**：

```bash
npx eslint --print-config . | grep -E 'prettier|indent|quotes'
```

如果没有输出（或只有 prettier 相关的），说明配置正确。

### 2.5 Prettier 踩坑记录

**坑1：保存后 ESLint 报错**

常见原因：Prettier 修改了格式，但 ESLint 没有配置 `eslint-config-prettier`。

```bash
# 检查是否有冲突规则
npx eslint --print-config . > eslint-config.txt
grep -E 'indent|quotes|semi' eslint-config.txt
```

**坑2：Vue 文件 script 缩进被修改**

```javascript
// .prettierrc.js
vueIndentScriptAndStyle: false  // Vue 文件的 <script> 不额外缩进
```

**坑3：Windows 换行符问题**

```javascript
// .prettierrc.js
endOfLine: 'lf'  // 统一用 LF，避免 Windows CRLF 问题
```

**坑4：TypeScript 类型导入格式**

```javascript
// .prettierrc.js
trailingComma: 'all',  // 类型导入也要尾随逗号

// .eslintrc 或 eslint.config.js 中
'@typescript-eslint/consistent-type-imports': [
  'error',
  { prefer: 'type-imports' },
],
```

这样 TypeScript 会强制使用 `import type { xxx }` 语法。

---

## 三、Git 提交校验三件套

### 3.1 整体架构

```bash
┌─────────────────────────────────────────────────────────┐
│                    git commit                           │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Husky (Git Hooks 管理器)                     │
│  ┌─────────────────┐    ┌─────────────────┐              │
│  │   pre-commit    │    │   commit-msg    │              │
│  └────────┬────────┘    └────────┬────────┘              │
└───────────┼──────────────────────┼───────────────────────┘
            │                      │
            ▼                      ▼
┌────────────────────┐    ┌────────────────────┐
│   lint-staged      │    │    commitlint      │
│  (只检查暂存文件)   │    │  (校验提交信息格式)  │
└────────┬───────────┘    └────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────┐
│     ESLint --fix + Prettier --write                     │
│              (自动修复并提交)                             │
└────────────────────────────────────────────────────────┘
```

### 3.2 Husky v9 配置

**安装**：

```bash
npm install -D husky
npx husky init
```

**初始化后会自动**：
1. 创建 `.husky/` 目录
2. 在 `package.json` 添加 `"prepare": "husky"` 脚本
3. 创建 `.husky/pre-commit` 文件

### 3.3 lint-staged 配置

**安装**：

```bash
npm install -D lint-staged
```

**在 package.json 中添加配置**：

```json
{
  "lint-staged": {
    "*.{vue,js,jsx,ts,tsx}": [
      "eslint --fix --max-warnings=0",
      "prettier --write"
    ],
    "*.{json,css,scss,md,html}": [
      "prettier --write"
    ]
  }
}
```

**修改 .husky/pre-commit**：

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

### 3.4 commitlint 配置

**安装**：

```bash
npm install -D @commitlint/config-conventional @commitlint/cli
```

**创建 commitlint.config.js**：

```javascript
// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 类型枚举
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // 修复bug
        'docs',     // 文档变更
        'style',    // 代码格式（不影响逻辑）
        'refactor', // 重构（不是修复也不是新增功能）
        'perf',     // 性能优化
        'test',     // 测试
        'build',    // 构建/工具变更
        'ci',       // CI配置
        'chore',    // 其他杂项
        'revert',   // 回滚
      ],
    ],
    // 类型大小写
    'type-case': [2, 'always', 'lower-case'],
    // 类型不能为空
    'type-empty': [2, 'never'],
    // 提交信息不能为空
    'subject-empty': [2, 'never'],
    // 提交信息结尾不加句号
    'subject-full-stop': [2, 'never', '.'],
    // 提交信息最大长度
    'subject-max-length': [2, 'always', 72],
    // Body 最大行长度
    'body-max-line-length': [2, 'always', 100],
  },
  prompt: {
    messages: {
      type: "Select the type of commit that best describes your change:",
      scope: 'Denote the SCOPE of this change (optional):',
      customScope: 'Denote the SCOPE of this change:',
      subject: 'Write a SHORT, IMPERATIVE tense description of the change:\n',
      body: 'Provide a LONGER description of the change (optional). Use "|" to break new line:\n',
      breaking: 'List any BREAKING CHANGES (optional). Use "|" to break new line:\n',
      footerPrefixesSelect: 'Select the ISSUES type of changeList by this change (optional):',
      customFooterPrefix: 'Input ISSUES prefix:',
      footer: 'List any ISSUES by this change. E.g.: #31, #34:\n',
      generatingBy: 'Generating by...',
      selectCommitType: 'Select the type of commit that best describes your change:',
      confirmCommit: 'Use the commit as above?',
    },
    types: [
      { value: 'feat', name: 'feat:     A new feature', emoji: '✨' },
      { value: 'fix', name: 'fix:      A bug fix', emoji: '🐛' },
      { value: 'docs', name: 'docs:     Documentation only changes', emoji: '📝' },
      { value: 'style', name: 'style:    Changes that do not affect the meaning of the code', emoji: '💄' },
      { value: 'refactor', name: 'refactor: A code change that neither fixes a bug nor adds a feature', emoji: '♻️' },
      { value: 'perf', name: 'perf:     A code change that improves performance', emoji: '⚡' },
      { value: 'test', name: 'test:     Adding missing tests or correcting existing tests', emoji: '✅' },
      { value: 'build', name: 'build:    Changes that affect the build system or external dependencies', emoji: '📦' },
      { value: 'ci', name: 'ci:       Changes to our CI configuration files and scripts', emoji: '👷' },
      { value: 'chore', name: 'chore:    Other changes that do not modify src or test files', emoji: '🔧' },
      { value: 'revert', name: 'revert:   Reverts a previous commit', emoji: '⏪' },
    ],
    useEmoji: false,
  },
};
```

**创建 commit-msg 钩子**：

```bash
echo "npx --no -- commitlint --edit \$1" > .husky/commit-msg
```

**添加脚本到 package.json**：

```json
{
  "scripts": {
    "commit": "git-cz",
    "commitlint": "commitlint --edit",
    "prepare": "husky"
  }
}
```

### 3.5 Git 钩子踩坑记录

**坑1：Husky 钩子不触发**

```bash
# 检查 .husky 目录权限
ls -la .husky/

# 确保有执行权限
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg

# 重新初始化
rm -rf .husky
npx husky init
```

**坑2：lint-staged 卡住**

常见原因：
1. ESLint 配置错误导致无限循环
2. 暂存文件太多

```json
// lint-staged 配置中添加超时
{
  "*.{js,ts,vue}": ["eslint --fix --max-warnings=0", "prettier --write"]
}
```

或者直接跳过 lint-staged 测试：

```bash
# 临时跳过钩子
git commit -m "fix: xxx" --no-verify
```

**坑3：commitlint 报错但找不到原因**

```bash
# 详细输出
npx commitlint --edit $HUSKY_GIT_PARAMS --verbose

# 单独测试提交信息
echo "fix: test" | npx commitlint --stdin
```

**坑4：pnpm 下 lint-staged 不工作**

```bash
# pnpm 需要使用 pnpm exec
# 修改 .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm exec lint-staged
```

**坑5：Windows 下 Husky 不工作**

```bash
# 使用 Git Bash 或 WSL
# 或者手动创建 hooks 目录
mkdir -p .git/hooks
cp .husky/* .git/hooks/
chmod +x .git/hooks/*
```

---

## 四、Conventional Commits 规范

### 4.1 格式说明

```bash
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### 4.2 常用类型

| 类型 | 说明 | 示例 |
|------|------|------|
| feat | 新功能 | `feat(user): 添加第三方登录` |
| fix | 修复bug | `fix(order): 修复支付回调失败问题` |
| docs | 文档 | `docs: 更新 README` |
| style | 格式调整 | `style: 格式化代码` |
| refactor | 重构 | `refactor(api): 提取通用请求方法` |
| perf | 性能优化 | `perf(list): 虚拟列表优化` |
| test | 测试 | `test: 添加登录单元测试` |
| build | 构建 | `build: 升级 Vite 到 5.0` |
| ci | CI | `ci: 添加 GitHub Actions` |
| chore | 杂项 | `chore: 更新依赖` |
| revert | 回滚 | `revert: 回滚 commit abc123` |

### 4.3 提交示例

```bash
feat(auth): 新增微信扫码登录功能

- 集成微信 OAuth2.0 授权
- 添加登录状态管理
- 实现登录成功后的路由跳转

Closes #123
```

```bash
fix(cart): 修复商品数量为0时仍可下单的问题

问题原因：未对数量进行校验
修复方案：添加数量最小值校验

Fixes #456
```

### 4.4 commitizen（可选）

如果你想用交互式命令行生成提交信息：

```bash
npm install -D commitizen cz-conventional-changelog
```

添加配置到 package.json：

```json
{
  "config": {
    "commitizen": {
      "path": "./node_modules/cz-conventional-changelog"
    }
  }
}
```

现在可以使用 `npm run commit` 代替 `git commit`。

---

## 五、VSCode 工作区配置

### 5.1 推荐安装的插件

1. **ESLint** - dbaeumer.vscode-eslint
2. **Prettier - Code formatter** - esbenp.prettier-vscode
3. **Volar** - vue.volar（Vue3 支持）

### 5.2 .vscode/settings.json 配置

在项目根目录创建 `.vscode/settings.json`：

```json
{
  // ===== 文件格式化 =====
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.tabSize": 2,
  "editor.insertSpaces": true,

  // ===== 特定文件类型配置 =====
  "[vue]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": false
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": false
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[markdown]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.wordWrap": "on"
  },

  // ===== ESLint 配置 =====
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "vue"
  ],
  "eslint.run": "onType",
  "eslint.codeAction.showDocumentation": {
    "enable": true
  },

  // ===== Prettier 配置 =====
  "prettier.requireConfig": true,
  "prettier.useEditorConfig": false,

  // ===== Vue 配置 =====
  "volar.autoCompleteRefs": true,
  "volar.completion.preferredTagNameCase": "kebab",
  "volar.completion.autoImportComponent": true
}
```

### 5.3 .vscode/extensions.json（推荐插件）

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "vue.volar",
    "vue.vscode-typescript-vue-plugin"
  ]
}
```

---

## 六、总结与最佳实践

### 6.1 配置清单

| 配置项 | 文件 | 作用 |
|--------|------|------|
| ESLint 9 | eslint.config.js | 代码质量检查 |
| Prettier | .prettierrc.js | 代码风格统一 |
| Prettier 忽略 | .prettierignore | 排除不需要格式化的文件 |
| Husky | .husky/ | Git Hooks 管理 |
| lint-staged | package.json | 只检查暂存文件 |
| commitlint | commitlint.config.js | 提交信息规范 |
| VSCode | .vscode/settings.json | 编辑器配置 |

### 6.2 工作流程

```bash
1. 写代码
   ↓
2. 保存时自动格式化（Prettier）
   ↓
3. ESLint 实时检查（VSCode 插件）
   ↓
4. git add 暂存
   ↓
5. git commit
   ↓
6. pre-commit 触发：lint-staged 检查暂存文件
   ↓
7. commit-msg 触发：commitlint 校验提交信息
   ↓
8. 提交成功
```

### 6.3 常见问题

**Q1：ESLint 和 Prettier 冲突怎么办？**

A：确保 `eslint-config-prettier` 放在配置最后，它会关闭所有冲突规则。

**Q2：想跳过 Git Hooks 怎么办？**

A：使用 `git commit --no-verify`，但仅用于紧急情况。

**Q3：如何临时禁用某条规则？**

A：在代码中使用注释：
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = response.data;
```

**Q4：如何更新 Husky 钩子？**

A：修改 `.husky/` 目录下的文件后，确保有执行权限：
```bash
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

---

*本文基于 Vue3 + TypeScript + Vite 项目，ESLint 9 + Prettier + Husky 完整配置，实测可用。*