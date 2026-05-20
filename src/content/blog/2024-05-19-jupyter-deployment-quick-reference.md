---
title: 'Jupyter 部署配置快速参考手册'
date: 2024-01-22
description: 'Jupyter Lab 部署配置的核心命令、关键目录和常见问题解决方案速查手册'
tags: ['Jupyter', 'Python', '部署', '配置']
---

## 一、核心命令速查

| 操作场景                | 命令                                  | 说明                                  |
|-------------------------|---------------------------------------|---------------------------------------|
| **conda环境操作**       | `conda create -n <envName> python=3`  | 创建指定Python版本的虚拟环境          |
|                        | `conda activate <envName>`            | 激活虚拟环境                          |
|                        | `conda deactivate`                    | 退出当前虚拟环境                      |
|                        | `conda env list`                      | 查看所有虚拟环境列表                  |
|                        | `conda remove -n <envName> --all`     | 删除指定虚拟环境                      |
| **Jupyter Lab操作**     | `pip install jupyterlab==3.1.12`      | 安装指定版本Jupyter Lab               |
|                        | `jupyter lab --no-browser`            | 启动Jupyter Lab（不自动开浏览器）     |
|                        | `jupyter notebook --generate-config`  | 生成Jupyter配置文件                   |
|                        | `pip show jupyterlab`                 | 查看Jupyter Lab安装版本               |
| **扩展开发操作**        | `cookiecutter https://github.com/jupyterlab/extension-cookiecutter-ts` | 用脚手架创建扩展项目 |
|                        | `jlpm install`                        | 下载扩展项目依赖                      |
|                        | `jlpm run build`                      | 编译扩展代码                          |
|                        | `pip install -e . --user`             | 本地安装扩展（解决权限问题）          |
|                        | `jupyter server extension enable <extName>` | 启用扩展后端服务                  |
| **主题配置操作**        | `pip install jupyterthemes`           | 安装主题工具                          |
|                        | `jt -l`                               | 查看所有可用主题                      |
|                        | `jt -t <themeName>`                   | 切换指定主题                          |
|                        | `jt -r`                               | 恢复默认主题                          |

## 二、关键目录速查

| 目录用途                | 全局环境路径                          | 虚拟环境路径（以jupyterlab为例）      |
|-------------------------|---------------------------------------|---------------------------------------|
| Jupyter Lab静态文件目录  | `D:\python\Anaconda3\share\jupyter\lab\static` | `D:\python\Anaconda3\envs\jupyterlab\share\jupyter\lab\static` |
| Jupyter配置文件目录      | `C:\Users\<用户名>\.jupyter`          | 同全局（配置文件全局共享）            |
| Notebook静态文件目录     | `D:\python\Anaconda3\Lib\site-packages\notebook\static` | `D:\python\Anaconda3\envs\jupyterlab\Lib\site-packages\notebook\static` |
| 扩展安装目录            | `D:\python\Anaconda3\share\jupyter\labextensions` | `D:\python\Anaconda3\envs\jupyterlab\share\jupyter\labextensions` |
| 主题自定义CSS目录       | `C:\Users\<用户名>\.jupyter\custom`   | 同全局                                |

## 三、常见问题与解决方案

| 问题现象                                  | 解决方案                                                                 |
|-------------------------------------------|--------------------------------------------------------------------------|
| 执行`pip install -e .`提示“权限不足”      | 加`--user`参数：`pip install -e . --user`                                |
| 执行`python -m build`提示“No module named build” | 安装build模块：`pip install build`                                      |
| Jupyter Lab启动后扩展不生效                | 1. 检查扩展是否启用：`jupyter labextension list` <br> 2. 重启服务端扩展：`jupyter server extension enable <extName>` |
| 编译扩展时依赖下载缓慢                    | 配置国内npm镜像：`jlpm config set registry https://registry.npmmirror.com` |
| 切换主题后Notebook界面无变化              | 1. 加参数强制生效：`jt -t <themeName> -T -N` <br> 2. 重启Jupyter Notebook |
| 虚拟环境中node命令找不到                  | 重新创建环境时指定nodejs：`conda create -n <envName> nodejs`             |