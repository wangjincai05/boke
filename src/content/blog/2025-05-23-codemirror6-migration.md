---
title: 'CodeMirror 6 迁移实战指南'
date: 2025-05-23
description: '基于真实项目(SQL Lab)迁移经验，详解从CodeMirror 5升级到6的核心差异、Vue3封装、Compartment动态切换、自动补全等关键技术'
tags: ['CodeMirror', '编辑器', 'Vue3', 'SQL', '迁移']
---

# CodeMirror 6 迁移实战指南

> **作者按**：这不是 CodeMirror 官方文档的中文翻译，而是基于真实项目（SQL Lab 开发经验）迁移 CodeMirror 5 到 CodeMirror 6 的踩坑总结。如果你正在评估是否要升级，或者正在迁移过程中，这篇文章会告诉你哪些地方会出问题。

## 一、CodeMirror 5 vs 6：核心架构差异

这是迁移前必须搞清楚的根本问题。CodeMirror 6 不是 CodeMirror 5 的 "Plus 版本"，而是一个完全重写的架构。

### 架构对比

| 维度 | CodeMirror 5 | CodeMirror 6 |
|------|--------------|--------------|
| **核心概念** | `options` 对象 + `mode` | `extensions` + `EditorState` |
| **配置方式** | `setOption()` 动态修改 | 创建 `EditorState` 时固定，运行时需 `Compartment` |
| **模块化** | 弱，全局副作用 | 强，完全基于 extension |
| **状态管理** | 隐式，和 DOM 耦合 | 显式 `EditorState`，可序列化 |
| **语言支持** | 加载 mode 文件 | Lezer 解析器 + `@codemirror/lang-*` |
| **补全系统** | `showHint` 插件 | `autocompletion` 扩展 |
| **渲染** | DOM 直接操作 | Canvas + DOM 混合，精确更新 |

### CodeMirror 5 的典型写法

```typescript
import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/sql/sql';
import 'codemirror/addon/hint/show-hint';

const editor = CodeMirror.fromTextArea(textareaElement, {
  mode: 'text/x-sql',
  lineNumbers: true,
  indentWithTabs: true
});

// 动态修改
editor.setOption('mode', 'text/x-python');

// 补全
editor.showHint();
```

### CodeMirror 6 的典型写法

```typescript
import { EditorState } from '@codemirror/state';
import { EditorView, lineNumbers, keymap } from '@codemirror/view';
import { sql } from '@codemirror/lang-sql';
import { autocompletion } from '@codemirror/autocomplete';
import { defaultKeymap, historyKeymap } from '@codemirror/commands';

const state = EditorState.create({
  doc: 'SELECT * FROM users',
  extensions: [
    lineNumbers(),
    sql(),
    autocompletion(),
    keymap.of([...defaultKeymap, ...historyKeymap])
  ]
});

const view = new EditorView({
  state,
  parent: containerElement
});

// 动态修改语言？需要 Compartment
const languageCompartment = new Compartment();
```

**我的判断**：CodeMirror 6 的设计更现代、更安全、更易测试，但学习曲线确实比 5 高。如果你的项目需要长期维护、支持多种语言、需要复杂补全，咬牙上 6 是值得的。如果只是临时用用，5 可能更快上手。

## 二、模块化拆解：@codemirror/* 包结构

CodeMirror 6 把功能拆成了多个独立的 npm 包：

```bash
# 核心包（必须）
@codemirror/state      # EditorState、Transaction、StateField、Facet
@codemirror/view       # EditorView、DOM 渲染、装饰器
@codemirror/language   # 语言支持基础设施

# 功能包（按需引入）
@codemirror/autocomplete   # 自动补全
@codemirror/commands       # 快捷键命令
@codemirror/search         # 搜索替换
@codemirror/lint            # 代码检查
@codemirror/theme-one-dark  # 主题

# 语言包（按需引入）
@codemirror/lang-javascript
@codemirror/lang-python
@codemirror/lang-sql
@codemirror/lang-html
@codemirror/lang-css

# 懒加载语言包
@codemirror/language-data   # 包含所有语言
```

### 基础设置包

`codemirror` 包提供了基础配置的懒加载版本：

```typescript
import { basicSetup } from 'codemirror';

// basicSetup 包含：
// - 行号
// - 历史记录
// - 快捷键
// - 折叠
// - 高亮当前行
// - 拖拽光标
// - 等等...
```

## 三、Vue3 封装 CodeMirror 6 组件

这是本文的核心部分。

### 最小化组件结构

```vue
<!-- components/CodeEditor.vue -->
<template>
  <div ref="editorRef" class="code-editor"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, shallowRef } from 'vue';
import { EditorState, type Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';

const props = defineProps<{
  modelValue: string;
  extensions?: Extension[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const editorRef = ref<HTMLElement | null>(null);
// 重要：用 shallowRef 存储 EditorView，避免深度响应式开销
const view = shallowRef<EditorView | null>(null);

// 是否正在更新（防止 v-model 死循环）
let isUpdating = false;

onMounted(() => {
  if (!editorRef.value) return;
  
  const state = EditorState.create({
    doc: props.modelValue,
    extensions: [
      basicSetup,
      // 监听内容变化
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !isUpdating) {
          emit('update:modelValue', update.state.doc.toString());
        }
      }),
      // 额外的扩展
      ...(props.extensions || [])
    ]
  });
  
  view.value = new EditorView({
    state,
    parent: editorRef.value
  });
});

onBeforeUnmount(() => {
  view.value?.destroy();
  view.value = null;
});

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  if (!view.value) return;
  
  const current = view.value.state.doc.toString();
  if (newVal !== current) {
    isUpdating = true;
    view.value.dispatch({
      changes: {
        from: 0,
        to: current.length,
        insert: newVal || ''
      }
    });
    isUpdating = false;
  }
});
</script>

<style scoped>
.code-editor {
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  overflow: hidden;
}

.code-editor :deep(.cm-editor) {
  height: 100%;
}
</style>
```

**坑1：v-model 死循环**

这是最容易踩的坑。问题出在：

1. 用户在编辑器输入 → 触发 `updateListener` → emit `update:modelValue`
2. 父组件收到 `update:modelValue` → 更新 `modelValue` prop
3. watch `modelValue` → dispatch changes → 触发 `updateListener`
4. 回到步骤 1 → 死循环！

**解决**：使用 `isUpdating` 标记，阻止循环触发：

```typescript
let isUpdating = false;

EditorView.updateListener.of((update) => {
  if (update.docChanged && !isUpdating) {
    emit('update:modelValue', update.state.doc.toString());
  }
});

watch(() => props.modelValue, (newVal) => {
  if (!view.value) return;
  
  const current = view.value.state.doc.toString();
  if (newVal !== current) {
    isUpdating = true; // 先标记
    view.value.dispatch({
      changes: { from: 0, to: current.length, insert: newVal || '' }
    });
    isUpdating = false; // 更新完取消标记
  }
});
```

## 四、Compartment 动态切换

这是 CodeMirror 6 的核心概念，也是迁移最难的部分。

### 什么是 Compartment？

Compartment 就像一个"隔间"，把 extension 装进去。当你需要动态修改某个 extension 时，只需要替换这个隔间里的东西，而不用重建整个 EditorState。

### 典型场景：动态切换语言

```typescript
import { Compartment } from '@codemirror/state';
import { sql } from '@codemirror/lang-sql';
import { javascript } from '@codemirror/lang-javascript';

// 创建语言 Compartment
const languageConf = new Compartment();

const state = EditorState.create({
  doc: 'SELECT * FROM users',
  extensions: [
    basicSetup,
    // 把语言包放入 Compartment
    languageConf.of(sql())
  ]
});

// 切换到 JavaScript
function switchToJS() {
  view.dispatch({
    effects: languageConf.reconfigure(javascript())
  });
}

// 切换回 SQL
function switchToSQL() {
  view.dispatch({
    effects: languageConf.reconfigure(sql())
  });
}
```

### 完整的多配置 Compartment 封装

```typescript
import { Compartment } from '@codemirror/state';
import { EditorState, type Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';

// 创建多个 Compartment
const langConf = new Compartment();
const themeConf = new Compartment();
const completionConf = new Compartment();
const readOnlyConf = new Compartment();

// 获取语言扩展
function getLangExtension(mode: string): Extension {
  switch (mode) {
    case 'sql': return import('@codemirror/lang-sql').then(m => m.sql());
    case 'javascript': return import('@codemirror/lang-javascript').then(m => m.javascript());
    case 'python': return import('@codemirror/lang-python').then(m => m.python());
    default: return [];
  }
}

// 初始化状态
const state = EditorState.create({
  doc: '',
  extensions: [
    basicSetup,
    langConf.of([]),
    themeConf.of([]),
    completionConf.of([])
  ]
});

// 动态切换语言
async function setLanguage(mode: string) {
  const langExt = await getLangExtension(mode);
  view.dispatch({
    effects: langConf.reconfigure(langExt)
  });
}
```

**坑2：Compartment 重新配置时闪烁**

切换语言时，如果内容很长，重新渲染可能会有短暂闪烁。

**解决**：内容不会丢失，但可以加 loading 状态过渡：

```typescript
const isSwitchingLang = ref(false);

async function setLanguage(mode: string) {
  isSwitchingLang.value = true;
  await view.dispatch({
    effects: langConf.reconfigure(await getLangExtension(mode))
  });
  isSwitchingLang.value = false;
}
```

## 五、SQL 编辑器实战

基于 SQL Lab 开发经验，以下是 SQL 编辑器的最佳实践。

### 基础 SQL 编辑器

```typescript
import { sql } from '@codemirror/lang-sql';
import { mysql } from '@codemirror/lang-sql';  // MySQL 方言
import { postgresql } from '@codemirror/lang-sql'; // PostgreSQL 方言

// SQL 基础配置
const sqlExtensions = [
  basicSetup,
  // 选择方言
  sql({ dialect: postgresql }),
  // SQL 关键字大写
  EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      // 可选：自动格式化
    }
  })
];
```

### SQL 关键字高亮配置

```typescript
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// SQL 高亮主题
const sqlHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: '#c678dd', fontWeight: 'bold' },
  { tag: t.operator, color: '#56b6c2' },
  { tag: t.string, color: '#98c379' },
  { tag: t.comment, color: '#5c6370', fontStyle: 'italic' },
  { tag: t.number, color: '#d19a66' },
  { tag: t.function(t.variableName), color: '#61afef' },
  { tag: t.definition(t.variableName), color: '#e06c75' }
]);

// 应用高亮
const extensions = [
  sql(),
  syntaxHighlighting(sqlHighlightStyle)
];
```

## 六、自动补全（Autocompletion）

这是 SQL 编辑器的核心功能。

### 静态补全（关键字、函数名）

```typescript
import { autocompletion, type CompletionSource } from '@codemirror/autocomplete';
import { sql, PostgreSQL } from '@codemirror/lang-sql';

// 使用 SQL 包自带的补全
const extensions = [
  sql({ dialect: PostgreSQL }),
  autocompletion({
    override: [
      // 自定义补全源
      sqlCompletionSource
    ],
    activateOnTyping: true,  // 输入时触发
    maxRenderedOptions: 15,   // 最多显示 15 条
    defaultKeymap: true       // 使用默认快捷键
  })
];

// 自定义 SQL 补全
const sqlCompletionSource: CompletionSource = (context) => {
  // 获取当前光标前的单词
  const word = context.matchBefore(/\w*/);
  if (!word) return null;
  
  // 定义 SQL 关键字
  const keywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', ...];
  
  // 定义常用函数
  const functions = ['COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'COALESCE', ...];
  
  // 过滤匹配的
  const matches = [...keywords, ...functions]
    .filter(k => k.toLowerCase().startsWith(word.text.toLowerCase()))
    .map(k => ({
      label: k,
      type: keywords.includes(k) ? 'keyword' : 'function'
    }));
  
  return {
    from: word.from,
    options: matches
  };
};
```

### 异步补全（表名、字段名）

这是 SQL 编辑器最实用的功能——补全表名和字段名。

```typescript
import { autocompletion, type CompletionContext } from '@codemirror/autocomplete';

interface TableInfo {
  name: string;
  columns: Array<{ name: string; type: string }>;
}

// 从后端获取表结构
async function fetchTableInfo(): Promise<TableInfo[]> {
  // 实际项目中从 API 获取
  return [
    { name: 'users', columns: [{ name: 'id', type: 'int' }, { name: 'name', type: 'varchar' }] },
    { name: 'orders', columns: [{ name: 'id', type: 'int' }, { name: 'user_id', type: 'int' }] }
  ];
}

// 异步补全源
const tableCompletion: CompletionSource = async (context: CompletionContext) => {
  const word = context.matchBefore(/\w*/);
  if (!word) return null;
  
  // 获取表信息
  const tables = await fetchTableInfo();
  
  const options: Array<{ label: string; type: string; detail?: string }> = [];
  
  // 添加表名
  for (const table of tables) {
    if (table.name.toLowerCase().startsWith(word.text.toLowerCase())) {
      options.push({
        label: table.name,
        type: 'class',
        detail: `${table.columns.length} columns`
      });
    }
    
    // 添加字段名（带表名前缀）
    for (const col of table.columns) {
      const fullName = `${table.name}.${col.name}`;
      if (fullName.toLowerCase().startsWith(word.text.toLowerCase())) {
        options.push({
          label: fullName,
          type: 'property',
          detail: col.type
        });
      }
    }
  }
  
  return {
    from: word.from,
    options
  };
};

// 使用异步补全
const extensions = [
  sql(),
  autocompletion({
    override: [tableCompletion],
    defaultKeymap: true
  })
];
```

**坑3：异步补全的竞态条件**

快速切换位置时，前一个请求的结果可能覆盖后一个。

**解决**：使用防抖 + 请求取消

```typescript
let completionAbortController: AbortController | null = null;

const debouncedCompletion: CompletionSource = async (context) => {
  // 取消之前的请求
  completionAbortController?.abort();
  completionAbortController = new AbortController();
  
  try {
    // 等待一小段时间，合并快速输入
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 如果中途被取消，跳过
    if (completionAbortController.signal.aborted) return null;
    
    return await fetchCompletion(context);
  } catch (err) {
    if (err.name === 'AbortError') return null;
    throw err;
  }
};
```

## 七、主题定制

### 基础主题

```typescript
import { EditorView } from '@codemirror/view';
import { oneDark } from '@codemirror/theme-one-dark';
import { basicSetup } from 'codemirror';

// 使用预设主题
const state = EditorState.create({
  extensions: [basicSetup, oneDark]
});
```

### 自定义主题

```typescript
import { EditorView, type HighlightStyle } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';

// 定义主题
const myTheme = EditorView.theme({
  '&': {
    backgroundColor: '#1e1e1e',
    color: '#d4d4d4',
    height: '100%'
  },
  '.cm-content': {
    caretColor: '#fff',
    fontFamily: '"JetBrains Mono", "Fira Code", monospace'
  },
  '.cm-cursor': {
    borderLeftColor: '#fff'
  },
  '&.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: '#264f78'
  },
  '.cm-activeLine': {
    backgroundColor: '#2a2a2a'
  },
  '.cm-gutters': {
    backgroundColor: '#1e1e1e',
    color: '#858585'
  }
}, { dark: true });

// 定义语法高亮
const myHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: '#c586c0' },
  { tag: t.operator, color: '#d4d4d4' },
  { tag: t.string, color: '#ce9178' },
  { tag: t.number, color: '#b5cea8' },
  { tag: t.comment, color: '#6a9955' },
  { tag: t.function(t.variableName), color: '#dcdcaa' }
]);

// 应用主题
const extensions = [
  myTheme,
  syntaxHighlighting(myHighlightStyle)
];
```

### 动态切换主题

```typescript
import { EditorView } from '@codemirror/view';
import { oneDark } from '@codemirror/theme-one-dark';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';

const themeConf = new Compartment();

const extensions = [
  basicSetup,
  themeConf.of(oneDark)
];

// 切换主题
function toggleTheme(isDark: boolean) {
  view.dispatch({
    effects: themeConf.reconfigure(isDark ? oneDark : [])
  });
}
```

## 八、CodeMirror 5 到 6 的 API 映射表

| CodeMirror 5 | CodeMirror 6 |
|---------------|--------------|
| `CodeMirror.fromTextArea()` | `new EditorView({ state, parent })` |
| `editor.setValue()` | `view.dispatch({ changes })` |
| `editor.getValue()` | `view.state.doc.toString()` |
| `editor.setOption()` | `EditorState.create({ extensions: [...] })` |
| `editor.getOption()` | 查看 Facet/StateField |
| `editor.setCursor()` | `view.dispatch({ selection: ... })` |
| `editor.getCursor()` | `view.state.selection.main.head` |
| `mode: 'text/x-sql'` | `sql()` language extension |
| `showHint()` | `autocompletion()` |
| `CodeMirror.Pass` | 直接返回 `true` |
| `editor.addKeyMap()` | `keymap.of([])` |
| `getSelection()` | `view.state.sliceDoc()` |
| `replaceSelection()` | `dispatch({ changes })` |

## 九、vue-codemirror vs 自己封装

社区有现成的 `vue-codemirror6` 组件，用还是自己封装？

### 使用 vue-codemirror6

```bash
npm install vue-codemirror @codemirror/state @codemirror/view
```

```vue
<template>
  <Codemirror
    v-model="code"
    :extensions="extensions"
    @change="handleChange"
  />
</template>

<script setup>
import { Codemirror } from 'vue-codemirror';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';

const code = ref('SELECT * FROM users');
const extensions = [sql(), oneDark];

function handleChange(val) {
  console.log('changed:', val);
}
</script>
```

**优点**：开箱即用，维护成本低
**缺点**：定制化受限，复杂场景可能需要 fork

### 我的建议

| 场景 | 推荐 |
|------|------|
| 简单编辑器，不需要复杂定制 | 用 vue-codemirror6 |
| 需要深度定制（自定义补全、特殊行为） | 自己封装 |
| 多个项目复用 | 自己封装成内部组件库 |

## 十、踩坑实录

### 坑1：v-model 死循环

**问题**：编辑器输入 → emit → watch → dispatch → 触发 emit → 死循环

**解决**：使用 `isUpdating` 标记，见上方代码。

### 坑2：Compartment 重新配置后内容丢失

**问题**：调用 `reconfigure()` 后编辑器内容被清空。

**解决**：确保初始状态时 Compartment 里有有效 extension。空 Compartment 会导致问题：

```typescript
// 错误：初始为空
languageConf.of([])

// 正确：初始放一个默认语言
languageConf.of(sql())
```

### 坑3：中文输入法（IME）输入问题

**问题**：使用中文输入法时，拼音字母被当作英文处理，选词后光标位置错乱。

**原因**：CodeMirror 在 `compositionend` 事件前就开始处理输入。

**解决**：监听 `compositionstart` 和 `compositionend`：

```typescript
const isComposing = ref(false);

const extensions = [
  EditorView.domEventHandlers({
    compositionstart: () => {
      isComposing.value = true;
    },
    compositionend: (event, view) => {
      isComposing.value = false;
      // 手动同步内容
      emit('update:modelValue', view.state.doc.toString());
    }
  }),
  EditorView.updateListener.of((update) => {
    if (update.docChanged && !isComposing.value) {
      emit('update:modelValue', update.state.doc.toString());
    }
  })
];
```

### 坑4：`shallowRef` vs `ref` 的选择

**问题**：用 `ref` 存储 `EditorView` 导致性能问题。

**原因**：`EditorView` 是一个复杂的对象，Vue 会深度追踪它的变化，造成不必要的开销。

**解决**：使用 `shallowRef`：

```typescript
// 错误
const view = ref<EditorView | null>(null);

// 正确
const view = shallowRef<EditorView | null>(null);
```

### 坑5：动态导入语言包后样式丢失

**问题**：异步加载 `@codemirror/lang-*` 后，语法高亮不生效。

**解决**：确保在 `state` 创建时语言 extension 已经就绪：

```typescript
// 错误：异步加载后再创建状态
const langExt = await import('@codemirror/lang-python');
const state = EditorState.create({
  extensions: [langExt.python()] // 太晚了
});

// 正确：先加载，或在初始化时就确定语言
import { python } from '@codemirror/lang-python';
const state = EditorState.create({
  extensions: [python()]
});
```

## 十一、总结与决策建议

### 迁移决策树

```bash
你的项目需要迁移到 CodeMirror 6 吗？

├── 只是临时用用，不需要长期维护？
│   └── 否 → 继续用 CodeMirror 5
│
├── 需要支持多种语言切换？
│   └── 是 → CodeMirror 6（Compartment 是刚需）
│
├── 需要复杂的自定义补全？
│   └── 是 → CodeMirror 6
│
├── 团队有 TypeScript 经验？
│   └── 否 → 谨慎评估，CodeMirror 6 学习曲线较高
│
└── 需要在 Vue/React 组件中封装？
    └── 是 → CodeMirror 6（更好的响应式封装）
```

### 核心决策点

1. **新项目直接上 CodeMirror 6**：这是正确的选择
2. **迁移时优先处理 v-model 和 Compartment**：这两个是最容易出错的地方
3. **SQL 编辑器推荐自己封装**：社区组件的 SQL 补全能力不够用
4. **注意 IME 输入问题**：中文用户必踩的坑
5. **使用 `shallowRef` 存储 `EditorView`**：性能优化的小技巧

### 推荐开发顺序

1. 创建最小组件，跑通基础渲染
2. 接入 v-model，解决死循环问题
3. 接入一种基础语言（如 SQL）
4. 接入自动补全
5. 用 Compartment 支持语言切换
6. 接入主题切换
7. 处理 IME 输入问题

### 参考资料

- [CodeMirror 6 官方配置示例](https://codemirror.net/examples/config/)