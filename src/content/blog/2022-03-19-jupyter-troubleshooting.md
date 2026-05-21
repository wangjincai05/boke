---
title: 'Jupyter 相关项目常见问题排查手册'
date: 2022-03-19
description: 'Jupyter Lab、Notebook 部署和使用过程中的常见问题及解决方案'
tags: ['Jupyter', '问题排查', '故障处理', '调试']
---

## 一、依赖冲突问题排查

### 1. conda 与 pip 依赖冲突

#### 问题现象

- 执行 `conda install` 或 `pip install` 时提示“package conflict”
- 启动 Jupyter 时提示“module not found”但已安装对应包
- 命令行显示“WARNING: Ignoring invalid distribution”

#### 可能原因

- 混用 `conda` 和 `pip` 安装同一依赖（如 `jupyterlab`、`nodejs`），导致版本优先级混乱
- 虚拟环境未激活，误操作全局环境依赖
- 依赖包版本不兼容（如 `jupyterlab==3.1.12` 需匹配 `nodejs>=10.13.0`）

#### 解决方案

1. **查看依赖列表**：  
   - 查看 conda 管理的依赖：`conda list | findstr "目标包名"`（如 `conda list | findstr "jupyterlab"`）  
   - 查看 pip 管理的依赖：`pip list | findstr "目标包名"`  
2. **清理冲突依赖**：  
   - 优先用 conda 卸载：`conda remove --force 包名`  
   - 残留依赖用 pip 卸载：`pip uninstall -y 包名`  
3. **重新安装（指定来源）**：  
   - 核心依赖用 conda 安装：`conda install -c conda-forge jupyterlab==3.1.12 nodejs`  
   - 扩展依赖用 pip 安装：`pip install 包名 --no-deps`（`--no-deps` 避免自动安装依赖引发冲突）  
4. **隔离环境**：确保激活目标虚拟环境（命令行前缀显示 `(envName)`），避免操作全局环境

### 2. 扩展依赖版本不兼容

#### 问题现象

- 扩展编译时提示“Cannot find module '@jupyterlab/xxx'”
- 启动 Jupyter Lab 后扩展显示“disabled”或“incompatible”
- 浏览器控制台报错“Version mismatch for extension xxx”

#### 可能原因

- 扩展依赖的 Jupyter Lab 版本与当前安装版本不匹配（如扩展要求 3.2.x 但当前是 3.1.12）
- 本地修改的依赖包未正确关联（如之前提到的“扩展依赖本地 jupyterlab 源码编译包”）

#### 解决方案

1. **确认版本兼容性**：  
   - 查看扩展文档，确认支持的 Jupyter Lab 版本（如自定义扩展需匹配 3.1.12）  
   - 执行 `jupyter lab --version` 确认当前版本  
2. **修复依赖引用**：  
   - 卸载本地源码依赖：`pip uninstall -y jupyterlab`  
   - 重新安装官方版本：`conda install jupyterlab==3.1.12`  
3. **重新编译扩展**：  
   - 进入扩展目录，执行 `jlpm install && jlpm run build`  
   - 重新关联扩展：`jupyter labextension develop . --overwrite`

## 二、启动失败问题排查

### 1. Jupyter Lab 启动无响应/报错

#### 问题现象

- 执行 `jupyter lab --no-browser` 后卡住，无 URL 输出
- 提示“Port 8888 is already in use”（端口被占用）
- 提示“Failed to load kernel”（内核加载失败）

#### 可能原因

- 端口被其他进程占用（默认端口 8888）
- Jupyter 配置文件损坏（如 `jupyter_notebook_config.py` 语法错误）
- 虚拟环境内核未注册（如切换环境后内核路径无效）

#### 解决方案

1. **端口占用处理**：  
   - 查看端口占用进程：`netstat -ano | findstr ":8888"`（Windows）  
   - 终止占用进程：`taskkill /PID 进程号 /F`（如 PID 为 1234，执行 `taskkill /PID 1234 /F`）  
   - 指定其他端口启动：`jupyter lab --no-browser --port 8889`  
2. **配置文件修复**：  
   - 备份损坏配置：`move C:\Users\<用户名>\.jupyter\jupyter_notebook_config.py C:\Users\<用户名>\.jupyter\jupyter_notebook_config_bak.py`  
   - 重新生成配置：`jupyter notebook --generate-config`  
   - 重新设置“关闭默认浏览器”：打开新配置文件，修改 `c.NotebookApp.open_browser = False`  
3. **内核注册问题**：  
   - 查看已注册内核：`jupyter kernelspec list`  
   - 重新注册当前环境内核：`python -m ipykernel install --user --name=jupyterlab`（`jupyterlab` 为环境名）

### 2. 虚拟环境启动 Jupyter 显示“command not found”

#### 问题现象

- 激活虚拟环境后执行 `jupyter lab`，提示“'jupyter' 不是内部或外部命令”
- 命令行前缀显示 `(envName)`，但 `pip list` 中无 `jupyterlab`

#### 可能原因

- 虚拟环境未正确安装 Jupyter Lab（仅全局环境安装）
- conda 环境变量配置异常（如 `Scripts` 目录未加入 PATH）

#### 解决方案

1. **确认虚拟环境依赖**：  
   - 执行 `pip list | findstr "jupyter"`，若无结果，重新安装：`pip install jupyterlab==3.1.12`  
2. **检查环境变量**：  
   - 查看虚拟环境 Scripts 路径：`where python`（输出如 `D:\python\Anaconda3\envs\jupyterlab\python.exe`，则 Scripts 路径为 `D:\python\Anaconda3\envs\jupyterlab\Scripts`）  
   - 手动添加环境变量：右键“此电脑”→“属性”→“高级系统设置”→“环境变量”→“用户变量”→“PATH”→添加上述 Scripts 路径  
3. **重启命令行**：关闭当前 Anaconda Prompt，重新打开并激活环境

## 三、编译报错问题排查

### 1. jlpm/npm 编译依赖下载失败

#### 问题现象

- 执行 `jlpm install` 时提示“ETIMEDOUT”“404 Not Found”
- 依赖下载到一半卡住，提示“Failed to fetch xxx”

#### 可能原因

- 国外 npm 镜像访问缓慢或被墙
- 网络不稳定（如公司内网限制）
- 本地缓存损坏（如 `node_modules` 目录残留）

#### 解决方案

1. **配置国内镜像**：  
   - 执行 `jlpm config set registry https://registry.npmmirror.com`（淘宝 npm 镜像）  
   - 验证镜像配置：`jlpm config get registry`（输出应显示 `https://registry.npmmirror.com`）  
2. **清理缓存并重试**：  
   - 清理 jlpm 缓存：`jlpm cache clean --force`  
   - 删除残留依赖目录：进入项目目录，删除 `node_modules` 文件夹和 `package-lock.json` 文件  
   - 重新下载依赖：`jlpm install`  
3. **网络代理设置（可选）**：  
   - 若需通过代理，执行 `jlpm config set proxy http://代理地址:端口`  
   - 取消代理：`jlpm config delete proxy`

### 2. 执行 `jlpm run build` 提示“TS2345: Argument of type xxx is not assignable to parameter of type xxx”

#### 问题现象

- TypeScript 编译报错，提示类型不匹配
- 扩展源码修改后编译失败，指向 `src` 目录下的 `.ts` 文件

#### 可能原因

- TypeScript 语法错误（如变量类型定义错误、函数参数不匹配）
- 扩展依赖的 `@jupyterlab/*` 类型定义版本不兼容

#### 解决方案

1. **检查语法错误**：  
   - 打开报错提示的 `.ts` 文件，根据错误信息修正（如 `let num: number = "123"` 改为 `let num: number = 123`）  
   - 参考 Jupyter Lab 扩展开发文档：[Extension Tutorial](https://jupyterlab.readthedocs.io/en/stable/extension/extension_tutorial.html)  
2. **统一类型定义版本**：  
   - 打开项目根目录的 `package.json`，确保 `devDependencies` 中 `@jupyterlab/*` 依赖版本与 Jupyter Lab 版本匹配（如 Jupyter Lab 3.1.12 对应 `@jupyterlab/coreutils@^5.1.0`）  
   - 重新安装依赖：`jlpm install`  
3. **降低 TypeScript 严格模式（临时方案）**：  
   - 打开 `tsconfig.json`，将 `strict: true` 改为 `strict: false`（不推荐长期使用，建议规范语法）

### 3. 执行 `pip install -e .` 提示“PermissionError: [WinError 5] 拒绝访问”

#### 问题现象

- 本地安装扩展或源码包时，提示权限不足，无法写入 `Scripts` 目录（如 `k:\program files (x86)\anaconda3\envs\jlab3\scripts\jlpm.exe`）

#### 可能原因

- 当前用户无 Anaconda 安装目录的写入权限（如安装在 `Program Files` 目录）
- 命令行未以管理员身份运行

#### 解决方案

1. **使用 `--user` 参数隔离安装**：  
   - 执行 `pip install -e . --user`（将包安装到用户目录，避免系统目录权限问题）  
2. **以管理员身份运行命令行**：  
   - 右键“Anaconda Prompt”→“以管理员身份运行”→激活虚拟环境后重试  
3. **修改目录权限（可选）**：  
   - 右键 Anaconda 安装目录（如 `D:\python\Anaconda3`）→“属性”→“安全”→“编辑”→给当前用户添加“写入”权限

## 四、其他常见问题排查

### 1. 主题切换后 Notebook 界面无变化

#### 问题现象

- 执行 `jt -t 主题名` 后，刷新 Notebook 界面仍为默认主题
- 提示“主题已应用”但界面无响应

#### 可能原因

- 未重启 Jupyter Notebook（首次切换主题需重启）
- 自定义 CSS 覆盖了主题样式（如 `custom.css` 中隐藏了菜单栏）
- 主题工具版本与 Notebook 版本不兼容

#### 解决方案

1. **重启 Jupyter 服务**：  
   - 关闭当前 Jupyter 进程（命令行按 `Ctrl+C` 两次）  
   - 重新启动：`jupyter notebook`  
2. **清理自定义 CSS 干扰**：  
   - 进入 `C:\Users\<用户名>\.jupyter\custom`，重命名 `custom.css` 为 `custom.css.bak`  
   - 重新切换主题：`jt -t 主题名 -T -N`（`-T` 显示工具栏，`-N` 显示文件名）  
3. **更新主题工具**：  
   - 执行 `pip install --upgrade jupyterthemes`

### 2. 扩展安装后在 Jupyter Lab 中不显示

#### 问题现象

- 执行 `jupyter labextension list` 显示扩展“disabled”
- 启动 Jupyter Lab 后，扩展图标或功能未在界面出现

#### 可能原因

- 扩展未启用服务端支持
- 扩展与 Jupyter Lab 版本不兼容
- 静态文件未正确加载（如未执行 `jupyter lab build`）

#### 解决方案

1. **启用服务端扩展**：  
   - 执行 `jupyter server extension enable <扩展名>`（如 `jupyter server extension enable jupyterlab_datafile`）  
   - 验证启用状态：`jupyter server extension list`（确保扩展后显示“ok”）  
2. **重建 Jupyter Lab 静态资源**：  
   - 执行 `jupyter lab build`（重新打包静态文件，确保扩展资源被加载）  
3. **检查扩展兼容性**：  
   - 执行 `jupyter labextension list`，查看扩展是否标注“incompatible”  
   - 卸载不兼容扩展：`jupyter labextension uninstall <扩展名>`，重新安装兼容版本

### 3. Notebook 打开后提示“Kernel died, restarting”

#### 问题现象

- 打开 Notebook 文件后，内核频繁崩溃，提示“内核重启失败”
- 控制台显示“ImportError: cannot import name 'xxx' from 'IPython'”

#### 可能原因

- IPython 版本与内核不兼容（如 Notebook 6.4.3 需匹配 IPython 7.x）
- 内核路径配置错误（指向已删除的虚拟环境）
- 依赖包损坏（如 `ipykernel` 包缺失）

#### 解决方案

1. **修复内核依赖**：  
   - 执行 `pip install --upgrade ipykernel`（更新内核核心包）  
   - 重新注册内核：`python -m ipykernel install --user --name=当前环境名`  
2. **删除无效内核**：  
   - 查看内核列表：`jupyter kernelspec list`  
   - 删除无效内核：`jupyter kernelspec remove 无效内核名`  
3. **重建虚拟环境（终极方案）**：  
   - 若多次修复无效，删除原环境并重建：`conda remove -n jupyterlab --all`，重新执行 `conda create -n jupyterlab python=3 jupyterlab nodejs`

## 五、预防措施

1. **优先使用虚拟环境隔离**：避免全局环境依赖混乱，每个项目单独创建 conda 环境  
2. **规范依赖安装工具**：核心依赖（如 `python`、`nodejs`、`jupyterlab`）用 `conda` 安装，扩展依赖用 `pip` 安装，减少混用  
3. **固定版本号**：安装时指定明确版本（如 `jupyterlab==3.1.12`），避免自动升级到不兼容版本  
4. **备份关键配置**：定期备份 `jupyter_notebook_config.py` 和 `custom.css`，避免配置损坏后无法恢复  
5. **记录操作日志**：修改环境或编译扩展时，记录执行的命令和版本，便于排查问题时回溯