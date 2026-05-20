---
title: 'Jupyter 相关项目部署配置说明文档'
date: 2024-01-15
description: '详细介绍 Jupyter Lab、Notebook、主题及自定义扩展的完整部署配置流程'
tags: ['Jupyter', '部署', '配置', '扩展开发']
---

## 一、安装 Anaconda

### 官网下载

访问 [Anaconda 个人版下载地址](https://www.anaconda.com/products/individual)，根据操作系统选择对应版本安装。

### conda 常用命令

- `conda create -n <envName>`：创建名为 `<envName>` 的虚拟环境
- `conda env list`/ `conda info --env`：查看所有已创建的虚拟环境列表
- `conda activate <name>`：进入指定名称的虚拟环境
- `conda deactivate`：退出当前虚拟环境
- `conda remove -n <name> --all`：删除指定名称的虚拟环境

## 二、配置虚拟环境（非必选）

### 1. 查看 conda 版本

执行命令：`conda --version`  
示例输出：`conda 4.5.12`

### 2. 创建虚拟环境

执行命令：`conda create -n jupyterlab python=3 jupyterlab nodejs`

### 3. 确认安装

命令执行后会列出依赖包清单，输入 `y` 确认安装。

### 4. 查看已创建环境

执行命令：`conda info --envs`

### 5. 激活虚拟环境

执行命令：`activate jupyterlab`  
激活成功后，命令行前缀会显示 `(jupyterlab)`。

### 6. 验证环境依赖

分别执行以下命令，查看 node 和 jlpm 的路径及版本：
- `where node`：查看 node 可执行文件路径
- `where jlpm`：查看 jlpm 可执行文件路径
- `node --version`：查看 node 版本（示例输出：`v10.13.0`）

## 三、启动 Jupyter Lab

### 1. 启动命令

打开 Anaconda Prompt（或已激活虚拟环境的命令行），执行：`jupyter lab --no-browser`  
（`--no-browser` 参数表示不自动打开浏览器）

### 2. 静态文件替换

编译后的静态文件需替换至对应目录：
- 全局环境：替换 `D:\python\Anaconda3\share\jupyter\lab\static` 下的内容
- 虚拟环境：替换 `D:\python\Anaconda3\envs\jupyterlab\share\jupyter\lab\static` 下的内容
- 替换前建议先清空目标目录原有文件

## 四、配置 Jupyter Lab 项目

### 1. 前提：安装 Jupyter Lab

执行以下 pip 命令安装指定版本：
```bash
pip install jupyter
pip install jupyterlab
pip install jupyterlab==3.1.12
```

查看安装版本：`pip show jupyterlab`

验证安装：`pip list | findstr "jupyter"`（确认已安装）

### 2. 生成配置文件

执行命令：`jupyter notebook --generate-config`  
若已存在配置文件，会提示是否覆盖，输入 `y` 确认，生成路径：`C:\Users\<用户名>\.jupyter\jupyter_notebook_config.py`

### 3. 关闭默认浏览器自动启动

打开生成的配置文件，找到并修改以下配置项：
`c.NotebookApp.open_browser = False`

### 4. 源码编译

#### （1）下载源码

切换至目标路径，克隆指定分支源码：
```bash
e:
cd E:\ideaWorkspace\jupyterlab
git clone -b 0.35.x https://github.com/jupyterlab/jupyterlab
```

#### （2）安装依赖

进入源码目录（以 0.31.x 版本为例），执行：`jlpm install`

#### （3）编译打包

按以下顺序执行编译命令：
1. `jlpm run build`：基础打包
2. `jlpm run build:packages`：编译 lib 目录
3. 若修改了 package 中的 ts 文件，需先将 package 下的 lib 拷贝至 `\jupyterlab\staging\node_modules\@jupyterlab` 对应模块目录，再执行 `jlpm run build:core`

#### （4）部署生效

- 前端静态文件：将 `E:\ideaWorkspace\jupyterlab\jupyterlab-1.2.x\dev_mode\static` 内容替换至对应环境的 `share\jupyter\lab\static` 目录
- 后端代码：将源码中修改的 `jupyterlab` 包文件，替换至环境目录 `Lib\site-packages\jupyterlab` 对应位置

### 5. 开发部署模式脚本

进入 Jupyter Lab 源码文件夹，按以下步骤操作：
1. `pip install -e . --user`：将项目安装到当前虚拟环境（权限不足时加 `--user`）
2. `jlpm install`：首次编译，下载依赖包
3. `jlpm run build:packages`：前端源码修改后，编译至各模块 lib 目录
4. `jlpm run build:core`：编译核心模块资源（可选）
5. `jlpm run build`：编译开发模式资源（可选）
6. `jupyter lab --dev-mode`：启用本地开发模块启动（可选）
7. `jupyter lab --dev-mode --watch`：监控模式启动，修改代码无需重复执行 3-5 步骤（可选）
8. `jupyter lab build`：编译开发模块至系统环境 share 文件夹（可选）

### 6. 国内镜像配置

为提升依赖下载速度，配置淘宝 npm 镜像：
`jlpm config set registry https://registry.npmmirror.com`

## 五、配置 Notebook 项目

### 1. 前提：安装 Notebook

确保当前环境已安装 Notebook：`pip install notebook`

### 2. 源码编译

1. `pip install -e . --user`：将项目安装到虚拟环境（权限不足时加 `--user`）
2. `npm install`：首次编译，下载依赖包（与 `npm run browe` 功能一致）
3. `npm run build`：每次修改代码后执行编译打包

### 3. 部署项目

1. 执行 `npm run build` 完成编译
2. 前端文件部署：将 `E:\notebook-6.4.3\notebook\static` 内容清空后，替换为项目编译后的 static 目录文件
   - 全局环境：`D:\python\Anaconda3\Lib\site-packages\notebook\static`
   - 虚拟环境：`D:\python\Anaconda3\envs\jupyterlab\Lib\site-packages\notebook\static`
   （替换前清空目标目录）。

## 六、配置主题 jupyter-themes-master 项目

### 1. 前提：安装 jupyter-themes

执行命令：`pip install jupyterthemes`
验证安装：`pip list | findstr "jupyterthemes"`（确认已安装）

### 2. 源码编译

进入 `jupyter-themes-master` 源码文件夹：
1. `pip install -e . --user`：安装到当前虚拟环境（权限不足时加 `--user`）
2. `npm install`：首次编译，下载依赖包
3. `npm run build`：每次修改代码后编译打包

### 3. 部署与主题切换

1. 编译：`npm run build`（修改代码后执行）
2. 查看可用主题：`jt -l`（列出可用主题名称`如 chesterish、monokai 等`）
3. 切换主题：`jt -t <主题名称>`（`-T -N` 可选，首次切换需重启生效）
4. 强制生效（首次切换）: `jt -t <主题名> -T -N`（`-T` 显示工具栏，`-N` 显示文件名） 
5. 恢复默认主题：`jt -r`（重置为 Notebook 默认外观）

### 4. 全局样式自定义

1. 进入系统配置目录：`C:\Users\<用户名>\.jupyter\custom`
2. 编辑 `custom.css` 文件，添加自定义样式（示例：隐藏 Notebook 菜单栏和标题栏）：
```css
div#menubar {
  display: none !important;
}
#header-container {
  display: none !important;
}
```

## 七、自定义扩展项目

### 参考地址

[Jupyter Lab 扩展开发教程](https://jupyterlab.readthedocs.io/en/stable/extension/extension_tutorial.html)

### 前提条件

- 开发环境：conda 虚拟环境（不影响其他环境）
- 依赖工具：cookiecutter、nodejs、jupyterlab==3.1.12、jupyter-packaging、git

### 1. 安装虚拟环境

创建并激活专用虚拟环境：
```bash
conda create -n julab3 --override-strict-channel-priority -c conda-forge -c nodefaults jupyterlab=3.1.12 cookiecutter nodejs jupyter-packaging git
```

激活环境：`conda activate julab3`

### 2. 使用脚手架创建项目

1. 进入项目保存路径，执行：`cookiecutter https://github.com/jupyterlab/extension-cookiecutter-ts`
2. 按提示填写项目信息（示例）：
   - author_name：创建人姓名
   - author_email：创建人邮箱
   - labextension_name：扩展包名称（如 jupyterlab_datafile）
   - python_name：Python 包名称（建议与扩展包名称一致）
   - project_short_description：项目描述（如 Show file browser list file from service）
   - has_settings：是否创建配置文件（输入 y）
   - has_server_extension：是否需要服务端扩展（输入 y）
   - has_binder：是否支持 binder（输入 y）
   - repository：Git 仓库路径（可选，可留空）

### 3. 编译与安装

进入创建的项目目录，执行以下步骤：
1. `pip install -e .`：将项目安装到虚拟环境
2. `jlpm install`：首次编译，下载依赖包（生成 node_modules 文件夹）
3. `jupyter labextension develop . --overwrite`：安装扩展到 Jupyter Lab
   - 查看已安装扩展：`jupyter labextension list`
4. 若有后端服务，执行：`jupyter server extension enable jupyterlab_datafile`
   - 查看服务端扩展：`jupyter server extension list`（显示 “ok” 表示启用成功）

### 4. 扩展卸载

```bash
jupyter server extension disable jupyterlab_datafile # 禁用服务端扩展
pip uninstall jupyterlab_datafile # 卸载 Python 包
```

### 5. 开发与运行

1. 代码修改后编译：`jlpm run build`
2. 启动 Jupyter Lab（不自动打开浏览器）：`jupyter lab --no-browser`
3. 监控模式（自动编译）：`jlpm watch`

### 6. 上线部署

1. 生产环境打包：`jlpm run build:prod`
2. 生成安装包：`python -m build`（生成 .whl 文件至 dist 目录）
   - 若提示“No module named build”，执行：`pip install build`
3. 服务器安装：将 .whl 文件上传至目标服务器，执行 `pip install <包文件名>.whl`（如 `pip install jupyterlab_datafile-0.1.0-py3-none-any.whl`）

### 7. 注意事项

- 扩展依赖其他插件时，优先使用当前环境直接安装的插件，避免使用本地修改后的插件源码编译安装，否则可能出现编译异常。