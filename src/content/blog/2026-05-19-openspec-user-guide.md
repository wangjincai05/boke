---
title: 'OpenSpec 使用文档完整指南'
date: 2026-05-19
description: 'OpenSpec 规范驱动开发框架的完整使用文档，包含安装、配置、核心工作流和最佳实践'
tags: ['OpenSpec', '开发工具', 'AI编程', '工作流']
---

## 简介

OpenSpec 是一个规范驱动开发（Spec-Driven Development, SDD）框架，专为 AI 编程助手设计。

### 核心理念

- **流动而非僵化**：文档可以随时更新
- **迭代而非瀑布**：增量添加需求
- **简单而非复杂**：只需 Markdown 文件
- **兼顾存量与新建项目**

### 核心价值

1. 先达成一致再构建 — 避免 AI 理解偏差导致的返工
2. 保持组织性 — 每个变更都有独立文件夹
3. 流动迭代 — 随时更新文档
4. 工具兼容 — 支持 Claude Code、Cursor、GitHub Copilot 等

## 安装

### 前置要求

- Node.js 20.19.0+
- npm / pnpm / yarn / bun（任选其一）

### 安装命令

```bash
npm install -g @fission-ai/openspec@latest
```

### 验证安装

```bash
openspec --version
openspec --help
```

## 项目初始化

### 初始化命令

```bash
cd your-project
openspec init
```

### 交互式配置

选择要配置的 AI 工具（空格选择，回车确认）：

```
? Which AI tools do you want to configure?
❯◉ Claude Code
 ◯ Cursor
 ◯ GitHub Copilot
```

### 非交互模式

```bash
openspec init --tools none       # 跳过配置
openspec init --tools all        # 配置所有工具
openspec init --tools claude,cursor  # 指定工具
```

## 目录结构

### 整体结构

```
your-project/
├── .openspec/                  # 内部配置（自动生成）
├── openspec/                   # OpenSpec 工作目录
│   ├── agent-instructions.md   # AI 代理指导文件
│   ├── project-context.md      # 项目上下文
│   ├── changes/                # 变更工作区
│   │   └── archive/           # 已完成变更归档
│   └── specs/                  # 主规范目录
```

### changes/ 目录

每个变更一个独立文件夹：

```
openspec/changes/<change-name>/
├── proposal.md           # 提案（必需）
├── specs/<domain>/       # 能力规范（必需）
├── design.md            # 技术设计
└── tasks.md             # 任务清单
```

### specs/ 目录

已归档规范的长期存储，按业务域组织：

```
openspec/specs/
├── account/
│   └── spec.md
├── order/
│   └── spec.md
└── payment/
    └── spec.md
```

## 命令速查

### 核心工作流命令

| 命令 | 用途 |
|---|---|
| `/opsx:propose <name>` | 一步创建变更并生成 artifacts |
| `/opsx:explore` | 探索模式，思考问题不写代码 |
| `/opsx:apply <name>` | 按任务清单实现代码 |
| `/opsx:archive <name>` | 归档已完成变更 |

### 辅助命令

| 命令 | 用途 |
|---|---|
| `/opsx:new <name>` | 新建变更，逐个创建 artifact |
| `/opsx:continue <name>` | 继续处理，创建下一个 artifact |
| `/opsx:ff <name>` | 快进，一步生成所有 artifacts |
| `/opsx:verify <name>` | 验证实现与 artifacts 一致性 |
| `/opsx:sync <name>` | 同步代码和 artifact 状态 |
| `/opsx:bulk-archive` | 批量归档多个 change |
| `/opsx:onboard` | 新手引导，完整走一遍工作流 |

### CLI 命令

| 命令 | 用途 |
|---|---|
| `openspec init` | 项目初始化 |
| `openspec new change <name>` | 创建变更脚手架 |
| `openspec list --json` | 列出所有变更 |
| `openspec status --change <name> --json` | 查看变更状态 |
| `openspec config profile` | 配置命令和 profile |
| `openspec --version` | 查看版本 |

## 核心工作流

### 完整流程

```
/opsx:explore    → 想不清楚时探索
/opsx:propose    → 需求清晰后提案
/opsx:apply      → 按任务实现代码
/opsx:verify     → 验证完整性/正确性/一致性
/opsx:archive    → 归档变更
```

### /opsx:propose — 提案

一步创建变更并生成全部 artifacts：

```bash
/opsx:propose account-auto-pricing

卖家发布账号时不知道定价多少，导致滞销。
希望提供参考价格区间，基于历史成交价计算。
```

**输出**：生成 `proposal.md`、`specs/<domain>/spec.md`、`design.md`、`tasks.md`

**输出质量取决于**：
- 说清楚"为什么现在做"
- 点名不做什么（Out of scope）
- 提前说明技术约束

### /opsx:apply — 实现

按 `tasks.md` 逐条实现代码：

```bash
/opsx:apply account-auto-pricing
```

- AI 按任务编号顺序执行
- 每完成一条自动标记 `[x]`
- 中途可中断，下次从断点继续

### /opsx:verify — 验证

归档前检查三个维度：

| 维度 | 检查内容 |
|---|---|
| **COMPLETENESS** | tasks 是否全部完成，Scenario 是否有测试覆盖 |
| **CORRECTNESS** | 实现是否与 specs 定义一致（如 `< 5` vs `<= 5`） |
| **COHERENCE** | 代码是否忠实执行 design.md 的技术决策 |

```
/opsx:verify account-auto-pricing

COMPLETENESS
✓ 全部 tasks 已勾选
⚠ "数据不足" 场景未找到测试覆盖

CORRECTNESS
✓ 返回结构与 specs 一致
⚠ 数据不足触发条件：specs 定义 < 5，代码 <= 5

COHERENCE
✓ 缓存 key 格式与 design.md 一致

Ready to archive: Yes (with warnings)
```

### /opsx:archive — 归档

归档后发生两件事：

1. **Delta Spec 合并进主规范**
   - `ADDED` → 追加为新 Requirement
   - `MODIFIED` → 替换旧 Requirement
   - `REMOVED` → 从主 spec 删除

2. **变更文件夹移入 archive 目录**
   ```
   openspec/changes/archive/
   └── 2026-04-08-account-auto-pricing/
   ```

### /opsx:explore — 探索

思考伙伴模式，不产生代码：

```bash
/opsx:explore
# 或关联到已有变更
/opsx:explore account-auto-pricing
```

- 能做：读文件、搜索代码、画架构图、比较方案
- 不能做：写应用代码

**适用场景**：需求不明确、性能优化、调试、架构决策

## 文档格式规范

### proposal.md — 提案

**必须包含**：`## Why` 和 `## What Changes`

```markdown
# Proposal: <change-name>

## Why
### Background（背景）
### Problem Statement（问题描述）
### Alternatives Considered（备选方案）

## What Changes
### New Resources Added（新增资源）
### New Capabilities（新增能力）

## Out of scope（不做什么）
## Success criteria（成功标准）
```

### spec.md — 能力规范

**必须使用**：Delta Header + Requirement + Scenario

```markdown
# <能力名称>

## ADDED Requirements    ← 或 MODIFIED / REMOVED

### Requirement: <需求标题>

需求描述...

**Priority**: P0/P1/P2
**Rationale**: 为什么需要这个需求

#### Scenario: <场景标题>
- GIVEN <前置条件>
- WHEN <操作>
- THEN <预期结果>
```

**示例**：

```markdown
# 账号领域

## ADDED Requirements

### Requirement: 账号定价建议

卖家创建新商品上架信息时，系统必须提供定价建议。

**Priority**: P1
**Rationale**: 提升卖家体验，减少滞销。

#### Scenario: 常规定价
- GIVEN 卖家提交信息（游戏类型=英雄联盟，等级=150）
- WHEN 调用定价服务存在充足历史数据
- THEN 返回 { 低价: 280, 中价: 350, 高价: 480 }
- AND 95分位响应时间低于500ms

#### Scenario: 数据不足
- GIVEN 可对比交易记录少于5条
- WHEN 调用定价服务
- THEN 返回 { 数据不足: true, 低价: 空值 }
```

### design.md — 技术设计

无严格格式要求，建议包含：

```markdown
# Design: <change-name>

## Architecture（架构）
AccountController → PricingService → PricingRepository → Redis

## Key decisions（关键决策）
- 算法：P25/P50/P75 分位数
- 缓存：Redisson，key = pricing:{game}:{level_bucket}，TTL 30min
- 降级：DB 超时 200ms 返回 insufficient_data

## API contract
GET /api/v1/accounts/pricing
Response: { low, mid, high, currency, sample_size }
```

### tasks.md — 任务清单

按里程碑组织，使用 GitHub 风格任务列表：

```markdown
# Tasks: <change-name>

## 1. 数据层
- [ ] 1.1 新增索引
- [ ] 1.2 实现 Repository

## 2. 服务层
- [ ] 2.1 实现核心逻辑
- [ ] 2.2 缓存封装

## 3. 接口层
- [ ] 3.1 Controller
- [ ] 3.2 参数校验
```

**粒度建议**：每条任务对应一个方法或类。太粗 AI 自由发挥，太细则失去 AI 价值。

## 配置

### Profile 说明

| Profile | 命令 | 适用场景 |
|---|---|---|
| **core**（默认） | propose, apply, archive, explore | 日常开发 |
| **expanded** | core + new, continue, ff, verify, sync, bulk-archive, onboard | 细粒度控制 |

### 配置命令

```bash
openspec config profile
# → 选择 Delivery and workflows
# → 空格勾选需要的命令
```

## 最佳实践

### Artifact 修改策略

| 时机 | 操作 |
|---|---|
| propose 后 | 直接编辑 + `/opsx:ff` 重新生成 |
| apply 中途 | 中断 → 编辑 → `/opsx:apply` 从断点继续 |
| apply 后修改 | 编辑 → `/opsx:sync` 同步 → `/opsx:verify` |
| archive 后 | 需创建新 change（不可逆） |

### 存量项目策略

- 不要一次性全量文档化
- 随每次功能迭代顺带建档
- 或使用 `/opsx:onboard` 快速上手

### Git 集成

```bash
# 每次 archive 单独提交
git commit -m "spec: archive account-auto-pricing"
```

### 快速参考

| 任务 | 命令 |
|---|---|
| 遇到问题想不清 | `/opsx:explore` |
| 需求已清楚 | `/opsx:propose <name>` |
| 实现代码 | `/opsx:apply <name>` |
| 验证质量 | `/opsx:verify <name>` |
| 归档完成 | `/opsx:archive <name>` |
| 存量项目上手 | `/opsx:onboard` |

## 总结

OpenSpec 为 AI 编程助手提供了规范驱动开发的完整框架，通过先达成一致再构建的方式，有效避免了 AI 理解偏差导致的返工。其流动迭代、简单易用的特性，让开发者能够高效地与 AI 协作，提升开发质量。

---

> **参考来源**：[OpenSpec 官方文档](https://www.wulicode.com/ai/openspec)