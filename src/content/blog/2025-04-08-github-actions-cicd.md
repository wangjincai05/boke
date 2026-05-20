---
title: 'GitHub Actions CI/CD 静态网站部署实战教程'
date: 2025-02-15
description: '从零开始掌握自动化部署流程，涵盖 GitHub Pages、Vercel、阿里云 OSS 等多种部署方案'
tags: ['GitHub Actions', 'CI/CD', 'DevOps', '自动化部署']
---

## 1. CI/CD 基础概念

### 1.1 什么是 CI/CD

CI/CD 是 **Continuous Integration（持续集成）** 和 **Continuous Deployment（持续部署）** 的缩写。它代表了一套自动化软件交付流程，让开发团队能够更频繁、更可靠地发布软件更新。

### 什么是持续集成（CI）

持续集成是指开发人员频繁地将代码变更合并到主分支，每次合并都会自动触发构建和测试流程。主要目标包括：

- 快速发现集成错误
- 自动化代码质量检查
- 减少手动测试工作量
- 保持代码库的健康状态

### 什么是持续部署（CD）

持续部署是在持续集成的基础上，将通过测试的代码自动部署到生产环境。它的核心价值在于：

- 缩短从代码提交到上线的周期
- 降低部署过程中的人为错误
- 实现快速回滚能力
- 支持快速迭代和持续交付价值

### 1.2 CI/CD 工作流程

一个典型的 CI/CD 工作流程包含以下阶段：

| 阶段 | 描述 | 常用工具 |
|------|------|----------|
| 代码提交 | 开发人员提交代码到版本控制系统 | Git, SVN |
| 触发构建 | CI 系统检测到代码变更，启动构建流程 | GitHub Actions, Jenkins |
| 编译构建 | 编译源代码，生成可执行文件或部署包 | Webpack, Vite, npm |
| 自动化测试 | 运行单元测试、集成测试和端到端测试 | Jest, Cypress, Playwright |
| 代码分析 | 检查代码质量、安全漏洞和风格规范 | ESLint, SonarQube |
| 部署发布 | 将通过所有检查的代码部署到目标环境 | Vercel, Netlify, AWS |
| 监控反馈 | 监控应用运行状态，收集用户反馈 | Sentry, Datadog |

## 2. GitHub Actions 简介

GitHub Actions 是 GitHub 提供的原生 CI/CD 解决方案，它与 GitHub 仓库深度集成，无需额外配置即可使用。

### 2.1 GitHub Actions 核心概念

#### Workflow（工作流）

Workflow 是可配置的自动化流程，定义在仓库的 `.github/workflows` 目录下的 YAML 文件中。一个仓库可以有多个工作流，分别处理不同的任务。

#### Event（事件）

Event 是触发工作流运行的特定活动，常见的事件包括：

- `push` - 代码推送
- `pull_request` - 拉取请求
- `schedule` - 定时触发
- `workflow_dispatch` - 手动触发

#### Job（任务）

Job 是工作流中的一组步骤，在同一个运行器上执行。多个 Job 可以并行运行，也可以通过依赖关系串行执行。

#### Step（步骤）

Step 是 Job 中的单个任务，可以是执行 shell 命令或运行预定义的操作（Action）。每个步骤在相同的运行器环境中顺序执行。

#### Action（操作）

Action 是 GitHub Actions 的扩展组件，是可重用的自动化单元。GitHub Marketplace 提供了数千个官方和社区维护的 Action，可以简化常见任务的配置。

### 2.2 GitHub Actions 的优势

- **原生集成**：与 GitHub 仓库无缝集成，无需额外配置
- **免费额度**：公共仓库无限使用，私有仓库每月 2000 分钟免费额度
- **丰富生态**：GitHub Marketplace 提供数千个预构建 Action
- **多平台支持**：支持 Ubuntu、Windows 和 macOS 运行环境
- **矩阵构建**：轻松实现多版本、多环境的并行测试

## 3. 环境准备

### 3.1 前置要求

在开始之前，请确保您已具备以下条件：

1. 一个 GitHub 账号
2. 基础的 Git 操作知识
3. 一个静态网站项目（HTML、React、Vue 等均可）
4. 基本的 YAML 语法了解

### 3.2 创建示例项目

如果您还没有现成的项目，可以快速创建一个简单的静态网站：

```bash
# 创建项目目录
mkdir my-static-site
cd my-static-site

# 初始化项目
git init

# 创建基础 HTML 文件
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>我的静态网站</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>Hello, CI/CD!</h1>
    <p>这是一个使用 GitHub Actions 自动部署的静态网站</p>
</body>
</html>
EOF

# 提交代码
git add .
git commit -m "Initial commit"

# 推送到 GitHub（请先创建远程仓库）
git remote add origin https://github.com/username/my-static-site.git
git push -u origin main
```

### 3.3 理解工作流文件结构

GitHub Actions 的工作流文件使用 YAML 格式，存储在仓库的 `.github/workflows/` 目录下。一个基本的工作流文件结构如下：

```yaml
name: Deploy Static Site

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      
    - name: Deploy
      run: echo "部署命令"
```

## 4. 实战案例一：部署到 GitHub Pages

GitHub Pages 是 GitHub 提供的免费静态网站托管服务，非常适合托管个人博客、项目文档和演示页面。

### 4.1 配置步骤

#### 步骤 1：启用 GitHub Pages

1. 打开 GitHub 仓库页面
2. 点击 Settings（设置）选项卡
3. 在左侧菜单选择 Pages
4. 在 Source 部分选择 **GitHub Actions**

#### 步骤 2：创建部署工作流

在仓库根目录创建 `.github/workflows/deploy.yml` 文件：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Pages
        uses: actions/configure-pages@v5
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
          
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

#### 步骤 3：提交并验证

提交工作流文件到仓库：

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Pages deployment workflow"
git push origin main
```

推送后，GitHub Actions 会自动触发部署流程。您可以在仓库的 Actions 选项卡中查看部署进度。

### 4.2 针对 React/Vue 项目的配置

如果您的项目使用 React 或 Vue 等前端框架，需要添加构建步骤：

```yaml
name: Deploy React App to GitHub Pages

on:
  push:
    branches: ["main"]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          CI: false
          
      - name: Setup Pages
        uses: actions/configure-pages@v5
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
          
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## 5. 实战案例二：部署到 Vercel

Vercel 是一个流行的前端部署平台，提供自动 HTTPS、全球 CDN、预览部署等强大功能，特别适合 React、Next.js、Vue 等项目。

### 5.1 准备工作

1. 注册 Vercel 账号（可以使用 GitHub 账号直接登录）
2. 在 Vercel 控制台创建新项目，导入 GitHub 仓库
3. 获取 Vercel Token 和 Project ID（用于 GitHub Actions）

### 5.2 配置 Secrets

在 GitHub 仓库中配置以下 Secrets：

| Secret 名称 | 获取方式 | 用途 |
|-------------|----------|------|
| VERCEL_TOKEN | Vercel Settings > Tokens | API 认证令牌 |
| VERCEL_ORG_ID | Vercel Project Settings | 组织 ID |
| VERCEL_PROJECT_ID | Vercel Project Settings | 项目 ID |

配置方法：
1. 进入 GitHub 仓库 → Settings → Secrets and variables → Actions
2. 点击 "New repository secret"
3. 添加上述三个 Secret

### 5.3 创建工作流

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build Project
        run: npm run build
        
      - name: Deploy to Vercel (Production)
        if: github.ref == 'refs/heads/main'
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          
      - name: Deploy to Vercel (Preview)
        if: github.ref != 'refs/heads/main'
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### 5.4 Vercel 部署的优势

- **自动 HTTPS**：所有部署自动配置 SSL 证书
- **预览部署**：每个 Pull Request 自动生成预览链接
- **全球 CDN**：内容自动分发到全球边缘节点
- **回滚支持**：一键回滚到任意历史版本
- **无服务器函数**：支持 API 路由和边缘函数

## 6. 实战案例三：部署到阿里云 OSS

阿里云 OSS（对象存储服务）是阿里云提供的海量、安全、低成本、高可靠的云存储服务，结合 CDN 可以实现高性能的静态网站托管。

### 6.1 准备工作

1. 注册阿里云账号并完成实名认证
2. 创建 OSS Bucket，开启静态网站托管功能
3. 配置 CDN 加速（可选但推荐）
4. 创建阿里云 AccessKey（建议使用 RAM 子账号，仅授予 OSS 权限）

### 6.2 配置 GitHub Secrets

在 GitHub 仓库 Settings > Secrets and variables > Actions 中添加：

| Secret 名称 | 说明 |
|-------------|------|
| ACCESS_KEY_ID | 阿里云 AccessKey ID |
| ACCESS_KEY_SECRET | 阿里云 AccessKey Secret |
| OSS_BUCKET | OSS Bucket 名称 |
| OSS_ENDPOINT | OSS 访问域名（如 oss-cn-beijing.aliyuncs.com） |

### 6.3 创建工作流

```yaml
name: Deploy to Aliyun OSS

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Setup Aliyun CLI
        uses: aliyun/setup-aliyun-cli-action@v1
        with:
          version: '3.0.174'
          
      - name: Configure Aliyun CLI
        run: |
          aliyun configure set \
            --access-key-id ${{ secrets.ACCESS_KEY_ID }} \
            --access-key-secret ${{ secrets.ACCESS_KEY_SECRET }} \
            --region cn-beijing
            
      - name: Upload to OSS
        run: |
          aliyun oss cp ./dist oss://${{ secrets.OSS_BUCKET }}/ \
            --recursive \
            --force \
            --acl public-read
            
      - name: Refresh CDN Cache (Optional)
        run: |
          aliyun cdn RefreshObjectCaches \
            --ObjectPath https://your-domain.com/ \
            --ObjectType Directory
```

### 6.4 使用 ossutil 的替代方案

也可以使用 ossutil 工具进行部署：

```yaml
- name: Install ossutil
  run: |
    wget https://gosspublic.alicdn.com/ossutil/1.7.15/ossutil64
    chmod 755 ossutil64
    
- name: Configure ossutil
  run: |
    ./ossutil64 config -e ${{ secrets.OSS_ENDPOINT }} \
      -i ${{ secrets.ACCESS_KEY_ID }} \
      -k ${{ secrets.ACCESS_KEY_SECRET }}
      
- name: Upload to OSS
  run: |
    ./ossutil64 cp -rf ./dist oss://${{ secrets.OSS_BUCKET }}/
```

## 7. 高级配置与最佳实践

### 7.1 缓存优化

合理使用缓存可以显著缩短构建时间：

```yaml
- name: Cache node_modules
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

### 7.2 矩阵构建策略

使用矩阵策略在多个环境中并行测试：

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x, 22.x]
    os: [ubuntu-latest, windows-latest]
    
runs-on: ${{ matrix.os }}
steps:
  - uses: actions/checkout@v4
  - name: Use Node.js ${{ matrix.node-version }}
    uses: actions/setup-node@v4
    with:
      node-version: ${{ matrix.node-version }}
```

### 7.3 环境变量管理

区分不同环境的配置：

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: 
      name: production
      url: https://your-site.com
    env:
      NODE_ENV: production
      API_URL: https://api.your-site.com
    steps:
      # ... 部署步骤
```

### 7.4 条件执行

根据条件控制工作流执行：

```yaml
# 仅在特定文件变更时触发
on:
  push:
    paths:
      - 'src/**'
      - 'public/**'
      
# 步骤级别的条件
- name: Deploy to Production
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  run: echo "Deploying to production"
  
# 跳过特定提交信息
if: "!contains(github.event.head_commit.message, '[skip ci]')"
```

### 7.5 安全最佳实践

- **最小权限原则**：为 GitHub Actions 配置最小必要权限
- **使用 Secrets**：所有敏感信息通过 Secrets 管理，绝不硬编码
- **定期轮换密钥**：定期更新 AccessKey 和 Token
- **Action 版本锁定**：使用具体版本号而非 latest，避免意外变更
- **依赖审查**：定期审查使用的第三方 Action 的安全性

## 8. 常见问题与解决方案

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 工作流未触发 | 分支名称不匹配或路径配置错误 | 检查 on.push.branches 配置 |
| 构建失败 | 依赖安装失败或构建命令错误 | 检查 package.json 和构建脚本 |
| 部署成功但页面未更新 | 浏览器缓存或 CDN 缓存 | 强制刷新或清除 CDN 缓存 |
| 权限错误 | Secrets 配置错误或权限不足 | 检查 Secrets 名称和 IAM 权限 |
| 构建时间过长 | 未使用缓存或依赖过多 | 添加缓存配置，优化依赖 |
| 环境变量未生效 | 变量作用域或引用方式错误 | 检查 env 和 ${{ }} 语法 |

### 8.1 调试技巧

当工作流失败时，可以使用以下方法调试：

```yaml
# 启用详细日志
env:
  ACTIONS_STEP_DEBUG: true

# 查看环境信息
- name: Debug Info
  run: |
    echo "Event: ${{ github.event_name }}"
    echo "Ref: ${{ github.ref }}"
    echo "Actor: ${{ github.actor }}"
    pwd
    ls -la
    
# 检查 Secrets 是否存在（不显示值）
- name: Check Secrets
  run: |
    if [ -z "${{ secrets.MY_SECRET }}" ]; then
      echo "Secret not found"
      exit 1
    fi
```

## 9. 总结

通过本教程，您已经学习了：

- CI/CD 的基本概念和工作流程
- GitHub Actions 的核心组件和使用方法
- 部署到 GitHub Pages、Vercel 和阿里云 OSS 的完整流程
- 缓存优化、矩阵构建等高级配置技巧
- CI/CD 安全最佳实践

CI/CD 自动化部署不仅能够提高开发效率，还能减少人为错误，让团队更专注于业务逻辑的开发。建议您从简单的配置开始，逐步添加更多功能，如自动化测试、代码质量检查等，构建完整的 DevOps 流程。

