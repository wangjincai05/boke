---
title: 'AntV X6 图编辑引擎使用文档'
date: 2026-01-10
description: 'AntV X6 是蚂蚁集团开源的图编辑引擎，提供高性能、高可定制的图编辑能力，适用于流程图编辑器、ER 图、BPMN 编辑器等场景'
tags: ['AntV X6', '图编辑', '可视化', '流程图']
featured: true
---

## 1. 概述

### 1.1 什么是 AntV X6

AntV X6 是蚂蚁集团 AntV 团队开源的**图编辑引擎**，专注于提供高性能、高可定制的图编辑能力。它基于 HTML 和 SVG 渲染，采用 MVC（Model-View-Controller）架构，为开发者提供了丰富的 API 和插件生态，用于快速构建图编辑、图分析、图可视化类应用。

X6 不是传统的图表库（如 G2），也不是纯粹的图可视化库（如 G6），而是专注于**图编辑**场景，强调节点和边的交互操作能力。

### 1.2 核心特性

| 特性 | 说明 |
|---|---|
| **MVC 架构** | 数据（Model）与视图（View）分离，通过事件总线通信 |
| **丰富的内置元素** | 矩形、圆形、椭圆、多边形、路径、图片等内置节点/边类型 |
| **灵活的自定义能力** | 支持自定义 Shape、HTML 节点、React/Vue 组件节点 |
| **强大的插件生态** | 框选、对齐线、键盘快捷键、剪贴板、历史记录、小地图等 11 个内置插件 |
| **完善的交互系统** | 拖拽、缩放、平移、连线、框选等开箱即用的交互能力 |
| **虚拟渲染** | v3.x 新增，支持大图场景下的按需渲染 |
| **动画系统** | v3.x 新增，基于 Web Animations API 的关键帧动画 |
| **框架集成** | 官方支持 React、Vue、Angular 三大框架 |
| **TypeScript** | 完整的 TypeScript 类型定义 |

### 1.3 适用场景

- **流程图编辑器** — 工作流、审批流、业务流程
- **ER 图** — 数据库表关系可视化
- **BPMN 编辑器** — 业务流程建模
- **DAG 编辑器** — 任务编排、CI/CD 流水线
- **思维导图** — 知识管理、头脑风暴
- **组织架构图** — 人员层级关系
- **网络拓扑图** — 网络设备连接关系
- **UML 类图** — 软件设计

### 1.4 版本历史

| 版本 | 状态 | 关键变化 |
|---|---|---|
| **v1.x** | 已停止维护 | 初始稳定版本，API 基本成型 |
| **v2.x** | 已停止维护 | 默认异步渲染（`async: true`），API 微调 |
| **v3.x** | 当前稳定版 | 插件合并到主包、动画系统、虚拟渲染、默认启用画布拖拽 |

## 2. 快速开始

### 2.1 安装

```bash
# npm
npm install @antv/x6 --save

# yarn
yarn add @antv/x6

# pnpm
pnpm add @antv/x6
```

**框架集成包（按需安装）：**

```bash
# React 集成（需要 React 18+）
npm install @antv/x6-react-shape --save

# Vue 集成
npm install @antv/x6-vue-shape --save

# Angular 集成
npm install @antv/x6-angular-shape --save
```

### 2.2 第一个图

```typescript
import { Graph } from '@antv/x6'

const graph = new Graph({
  container: document.getElementById('container'),
  width: 800,
  height: 600,
  background: { color: '#F2F7FA' },
  grid: true,
  panning: true,
  mousewheel: true,
})

const source = graph.addNode({
  shape: 'rect', x: 80, y: 40, width: 100, height: 40,
  label: '开始',
  attrs: {
    body: { fill: '#e6f7ff', stroke: '#5F95FF', strokeWidth: 2, rx: 6, ry: 6 },
    text: { fill: '#333', fontSize: 14 },
  },
})

const target = graph.addNode({
  shape: 'rect', x: 300, y: 40, width: 100, height: 40,
  label: '结束',
  attrs: {
    body: { fill: '#f6ffed', stroke: '#52c41a', strokeWidth: 2, rx: 6, ry: 6 },
    text: { fill: '#333', fontSize: 14 },
  },
})

graph.addEdge({
  shape: 'edge', source, target,
  attrs: {
    line: {
      stroke: '#5F95FF', strokeWidth: 2,
      targetMarker: { name: 'block', args: { fill: '#5F95FF' } },
    },
  },
})
```

## 3. 核心概念

### 3.1 架构概览

X6 采用经典的 **MVC（Model-View-Controller）** 架构：

| 层级 | 核心类 | 职责 |
|---|---|---|
| **Controller** | `Graph` | 主 API 入口，编排模型、视图、插件和注册表 |
| **Model** | `Cell` / `Model` / `Collection` | 维护 Cell 集合，通过事件总线发出变更事件 |
| **View** | `CellView` / `NodeView` / `EdgeView` | 将模型渲染为 SVG DOM 元素 |

### 3.2 Cell（基类）

`Cell` 是 `Node` 和 `Edge` 的共同基类：

```typescript
cell.prop('attrs/body/fill', '#ff0000')   // 修改属性
cell.attr('body/fill', '#ff0000')          // 修改 SVG 属性
cell.setData({ status: 'active' })         // 设置业务数据
cell.getData()                              // 获取业务数据
cell.remove()                               // 删除元素
cell.clone()                                // 克隆元素
cell.toBack() / cell.toFront()             // 层级操作
```

### 3.3 Node（节点）

```typescript
const node = graph.addNode({
  shape: 'rect', x: 100, y: 40, width: 100, height: 40,
  label: '节点',
  attrs: {
    body: { fill: '#fff', stroke: '#333', strokeWidth: 2, rx: 6, ry: 6 },
    text: { fill: '#000', fontSize: 14 },
  },
})
```

### 3.4 Edge（边）

```typescript
const edge = graph.addEdge({
  shape: 'edge', source: 'node1', target: 'node2',
  vertices: [{ x: 100, y: 200 }],
  router: { name: 'orth' },
  connector: { name: 'rounded' },
  labels: ['边标签'],
  attrs: { line: { stroke: '#333', strokeWidth: 2, targetMarker: 'block' } },
})
```

### 3.5 Port（连接桩）

```typescript
const node = graph.addNode({
  shape: 'rect', x: 100, y: 40, width: 100, height: 40,
  ports: {
    groups: {
      top: { position: 'top', attrs: { circle: { r: 4, magnet: true, stroke: '#5F95FF', fill: '#fff' } } },
    },
    items: [{ group: 'top', id: 'port1' }],
  },
})
```

## 4. Graph 画布详解

### 4.1 构造器选项

```typescript
const graph = new Graph({
  container: document.getElementById('container'),
  width: 800,
  height: 600,
  autoResize: true,
  panning: true,
  mousewheel: true,
  grid: { visible: true, type: 'doubleMesh', size: 10 },
  background: { color: '#F2F7FA' },
})
```

### 4.2 画布操作

```typescript
graph.resize(800, 600)              // 调整大小
graph.translate(20, 20)               // 平移
graph.zoom(0.2)                       // 放大 0.2
graph.zoom(-0.2)                     // 缩小 0.2
graph.zoomTo(1.2)                    // 设置缩放比例
graph.zoomToFit({ maxScale: 1 })     // 缩放适应所有元素
graph.centerContent()                 // 居中显示
graph.dispose()                       // 销毁画布
```

### 4.3 背景与网格

```typescript
const graph = new Graph({
  container: document.getElementById('container'),
  background: {
    color: '#F2F7FA',
    image: 'data:image/svg+xml,...',
    repeat: 'repeat',
    opacity: 0.5,
  },
  grid: {
    visible: true,
    type: 'doubleMesh',
    args: [
      { color: '#eee', thickness: 1 },
      { color: '#ddd', thickness: 1, factor: 4 },
    ],
    size: 10,
  },
})
```

## 5. 节点详解

### 5.1 内置节点类型

| 构造器 | Shape 名称 | 说明 |
|---|---|---|
| `Shape.Rect` | `rect` | 矩形 |
| `Shape.Circle` | `circle` | 圆形 |
| `Shape.Ellipse` | `ellipse` | 椭圆 |
| `Shape.Polygon` | `polygon` | 多边形 |
| `Shape.Polyline` | `polyline` | 折线 |
| `Shape.Path` | `path` | 路径 |
| `Shape.Image` | `image` | 图片 |
| `Shape.HTML` | `html` | HTML 节点 |

### 5.2 节点操作

```typescript
const node = graph.addNode({ shape: 'rect', x: 100, y: 40, width: 100, height: 40 })

// 位置
node.position(200, 100)
node.move(50, 30)

// 大小
node.resize(120, 60)
node.scale(1.5, 1.5)

// 旋转
node.rotate(45)

// 显示/隐藏
node.show() / node.hide() / node.toggleVisible()

// 删除
node.remove()
graph.removeCells([node1, node2])

// 克隆
const cloned = node.clone()

// 层级
node.toFront() / node.toBack() / node.setZIndex(10)
```

### 5.3 节点数据绑定

```typescript
node.setData({ status: 'active', count: 5 })
const data = node.getData()

node.on('change:data', ({ current, previous }) => {
  console.log('数据变更:', previous, '->', current)
  if (current.status === 'active') {
    node.attr('body/fill', '#e6f7ff')
  }
})
```

## 6. 边详解

### 6.1 路由（Router）

| 路由 | 说明 |
|---|---|
| `normal` | 直线连接（默认） |
| `orth` | 正交路由（仅水平/垂直线段） |
| `oneSide` | 单侧路由 |
| `manhattan` | 曼哈顿路由 |
| `metro` | 地铁线路风格 |
| `er` | ER 图专用路由 |

```typescript
graph.addEdge({
  source: 'node1', target: 'node2',
  router: { name: 'orth', args: { padding: 20 } },
})
```

### 6.2 连接器（Connector）

| 连接器 | 说明 |
|---|---|
| `normal` | 直线连接（默认） |
| `rounded` | 圆角连接 |
| `smooth` | 平滑曲线 |
| `jumpover` | 交叉跳线 |

### 6.3 箭头（Marker）

| 箭头 | 说明 |
|---|---|
| `block` | 实心三角 |
| `classic` | 经典箭头 |
| `diamond` | 菱形 |
| `cross` | 十字 |
| `circle` | 圆形 |

### 6.4 连接规则

```typescript
const graph = new Graph({
  connecting: {
    snap: true,
    allowBlank: false,
    allowLoop: false,
    allowMulti: false,
    allowNode: false,
    allowPort: true,
    router: { name: 'manhattan' },
    connector: { name: 'rounded', args: { radius: 8 } },
    validateConnection({ sourceCell, targetCell }) {
      return sourceCell !== targetCell
    },
  },
})
```

## 7. 连接桩（Port）

### 7.1 Port 分组

```typescript
ports: {
  groups: {
    in: {
      position: 'left',
      attrs: { circle: { r: 5, magnet: true, stroke: '#31d0c6', fill: '#fff', strokeWidth: 2 } },
    },
    out: {
      position: 'right',
      attrs: { circle: { r: 5, magnet: true, stroke: '#5F95FF', fill: '#fff', strokeWidth: 2 } },
    },
  },
  items: [
    { group: 'in', id: 'in-1' },
    { group: 'out', id: 'out-1' },
  ],
}
```

### 7.2 连接桩交互

```typescript
node.addPort({ group: 'out', id: 'out-3' })    // 添加
node.removePort('port-id')                      // 删除
node.getPorts()                                 // 获取所有
node.getPort('port-id')                         // 获取指定
node.setPortProp('port-id', 'attrs/circle/fill', '#ff0000')

graph.on('port:click', ({ node, port }) => {
  console.log('点击连接桩:', port.id)
})
```

## 8. 事件系统

### 8.1 鼠标事件

| 事件 | Node | Edge | Graph（空白） |
|---|---|---|---|
| 单击 | `node:click` | `edge:click` | `blank:click` |
| 双击 | `node:dblclick` | `edge:dblclick` | `blank:dblclick` |
| 右键 | `node:contextmenu` | `edge:contextmenu` | `blank:contextmenu` |
| 进入 | `node:mouseenter` | `edge:mouseenter` | `graph:mouseenter` |
| 离开 | `node:mouseleave` | `edge:mouseleave` | `graph:mouseleave` |

```typescript
graph.on('node:click', ({ e, x, y, node }) => {
  console.log('点击节点:', node.id)
})

graph.on('blank:click', ({ e, x, y }) => {
  console.log('点击空白区域:', x, y)
})

graph.on('node:mouseenter', ({ node }) => { node.attr('body/stroke', '#1890ff') })
graph.on('node:mouseleave', ({ node }) => { node.attr('body/stroke', '#333') })
```

### 8.2 数据变更事件

```typescript
graph.on('node:change:position', ({ node, current, previous }) => {
  console.log(`${node.id} 位置变更:`, previous, '->', current)
})
```

### 8.3 画布事件

| 事件 | 说明 |
|---|---|
| `scale` | 画布缩放 |
| `resize` | 画布尺寸变化 |
| `translate` | 画布平移 |
| `blank:click` | 点击空白区域 |
| `blank:mousedown` | 空白区域鼠标按下 |
| `blank:mouseup` | 空白区域鼠标释放 |

## 9. 自定义形状

### 9.1 注册自定义节点

```typescript
Graph.registerNode('custom-rect', {
  inherit: 'rect',
  width: 160,
  height: 80,
  markup: [
    { tagName: 'rect', selector: 'body' },
    { tagName: 'text', selector: 'label' },
  ],
  attrs: {
    body: { fill: '#f5f5f5', stroke: '#333', strokeWidth: 1 },
    label: { fill: '#333', fontSize: 14, textAnchor: 'middle', textVerticalAnchor: 'middle' },
  },
}, true)
```

### 9.2 自定义边

```typescript
Graph.registerEdge('custom-edge', {
  inherit: 'edge',
  attrs: {
    line: { stroke: '#5F95FF', strokeWidth: 2 }
  },
  router: { name: 'manhattan' },
  connector: { name: 'rounded', args: { radius: 10 } },
}, true)
```

## 10. HTML 节点

### 10.1 基本用法

```typescript
Graph.registerNode('html-node', {
  inherit: 'rect',
  width: 120,
  height: 60,
  html: (cell) => {
    const div = document.createElement('div')
    div.style.cssText = 'width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;'
    div.textContent = cell.getData().label
    return div
  },
}, true)

graph.addNode({
  shape: 'html-node',
  x: 100, y: 100,
  data: { label: 'HTML 节点' },
})
```

## 11. 框架集成

### 11.1 React 集成

```bash
npm install @antv/x6-react-shape --save
```

```tsx
import { ReactShape } from '@antv/x6-react-shape'

Graph.registerNode('react-shape', ReactShape, true)

const CustomNode = ({ node }) => {
  const { data } = node
  return (
    <div style={{ padding: 20, border: '1px solid #333', borderRadius: 8 }}>
      <div>{data.title}</div>
      <div style={{ color: '#999' }}>{data.desc}</div>
    </div>
  )
}

graph.addNode({
  shape: 'react-shape',
  x: 100, y: 100,
  data: { title: '标题', desc: '描述' },
  component: <CustomNode />,
})
```

### 11.2 Vue 集成

```bash
npm install @antv/x6-vue-shape --save
```

## 12. 插件系统

### 12.1 框选插件

```typescript
import { Selection } from '@antv/x6'

graph.use(new Selection({
  enabled: true,
  multiple: true,
  showNodeSelectionBox: true,
  showEdgeSelectionBox: true,
  rubberEdge: true,
  rubberNode: true,
}))
```

### 12.2 对齐线插件

```typescript
import { Snapline } from '@antv/x6'

graph.use(new Snapline({
  enabled: true,
  resizing: true,
  connecting: true,
}))
```

### 12.3 历史记录插件

```typescript
import { History } from '@antv/x6'

graph.use(new History({
  enabled: true,
}))

// 操作
graph.undo()
graph.redo()
graph.canUndo()
graph.canRedo()
```

### 12.4 小地图插件

```typescript
import { Minimap } from '@antv/x6'

graph.use(new Minimap({
  enabled: true,
  container: document.getElementById('minimap'),
  width: 200,
  height: 150,
}))
```

### 12.5 键盘快捷键插件

```typescript
import { Keyboard } from '@antv/x6'

graph.use(new Keyboard({
  enabled: true,
}))

// 绑定快捷键
graph.bindKey('ctrl+c', () => graph.getSelectedCells())
graph.bindKey('ctrl+v', () => graph.pasteCells())
graph.bindKey('ctrl+z', () => graph.undo())
graph.bindKey('delete', () => graph.removeCells(graph.getSelectedCells()))
```

## 13. 高级特性

### 13.1 虚拟渲染

```typescript
const graph = new Graph({
  container: document.getElementById('container'),
  virtual: true,
  async: true,
})
```

### 13.2 动画系统

```typescript
node.animate(
  [
    { attrs: { body: { fill: '#ff0000' } }, { duration: 200 },
    { attrs: { body: { fill: '#00ff00' } }, { duration: 200 },
  ],
  { delay: 0, repeat: Infinity }
)
```

### 13.3 导出功能

```typescript
graph.toPNG()
graph.toSVG()
graph.toDataURL()
graph.toBase64()
```

## 14. 实战案例

### 14.1 流程图编辑器

```typescript
const graph = new Graph({
  container: document.getElementById('container'),
  width: 1000,
  height: 600,
  grid: true,
  panning: true,
  mousewheel: true,
  connecting: {
    snap: true,
    router: { name: 'manhattan' },
    connector: { name: 'rounded', args: { radius: 8 } },
  },
  selecting: {
    enabled: true,
    multiple: true,
  },
})

// 添加开始节点
graph.addNode({
  shape: 'rect',
  x: 400, y: 50,
  width: 100, height: 40,
  label: '开始',
  style: { fill: '#e6f7ff', stroke: '#5F95FF' },
})

// 添加结束节点
graph.addNode({
  shape: 'rect',
  x: 400, y: 300,
  width: 100, height: 40,
  label: '结束',
  style: { fill: '#f6ffed', stroke: '#52c41a' },
})
```

### 14.2 DAG 任务编排

```typescript
const tasks = [
  { id: 'task1', name: '数据采集', deps: [] },
  { id: 'task2', name: '数据清洗', deps: ['task1'] },
  { id: 'task3', name: '特征工程', deps: ['task2'] },
  { id: 'task4', name: '模型训练', deps: ['task3'] },
  { id: 'task5', name: '模型评估', deps: ['task4'] },
]

tasks.forEach(task => {
  const x = (task.deps.length + 1) * 150
  const y = tasks.indexOf(task) * 100

  graph.addNode({
    id: task.id,
    shape: 'rect',
    x, y,
    width: 120, height: 60,
    label: task.name,
  })

  task.deps.forEach(depId => {
    graph.addEdge({
      source: depId,
      target: task.id,
      router: { name: 'manhattan' },
      connector: { name: 'rounded', args: { radius: 8 } },
    })
  })
})
```

## 15. 版本升级指南

### 15.1 v2 到 v3 主要变化

| 变化 | 说明 |
|---|---|
| 插件合并到主包 | `x6-plugin-*` 包合并到 `@antv/x6` 主包 |
| 画布拖拽默认启用 | `panning: true` 成为默认行为 |
| 虚拟渲染 | 新增 `virtual` 选项支持大图优化 |
| 动画系统 | 新增基于 Web Animations API 的动画能力 |
| API 调整 | 部分 API 微调，详见官方迁移指南 |

### 15.2 迁移建议

```typescript
// v2
import { Graph } from '@antv/x6'
import { Snapline } from '@antv/x6-plugin-snapline'

// v3
import { Graph, Snapline } from '@antv/x6'

const graph = new Graph({...})
graph.use(new Snapline())
```

## 16. 最佳实践

### 16.1 性能优化

- 对大数据量场景启用虚拟渲染（`virtual: true`）
- 使用 `async: true` 启用异步渲染
- 避免频繁调用 `graph.render()`，使用批量操作
- 合理使用 `node.setData()` 而非直接修改属性

### 16.2 交互体验

- 启用对齐线提升连线体验
- 配置合适的缩放范围（`scaling: { min: 0.1, max: 4 }`）
- 使用 `rubberband` 提供框选功能
- 添加键盘快捷键提升操作效率

### 16.3 数据管理

- 使用 `data` 属性存储业务数据，与视图分离
- 利用事件系统监听数据变化，保持状态同步
- 导出/导入时使用 `graph.toJSON()` / `graph.fromJSON()`

## 17. 参考资源

- [AntV X6 官方文档](https://x6.antv.antgroup.com)
- [GitHub 仓库](https://github.com/antvis/X6)
- [X6 Examples](https://x6.antv.antgroup.com/examples)
- [在线 Playground](https://x6.antv.antgroup.com/playground)

> 本文档基于 AntV X6 v3.1.7 编写，如有疑问请参考官方文档。
