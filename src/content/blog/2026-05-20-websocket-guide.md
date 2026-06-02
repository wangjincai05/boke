---
title: 'WebSocket 完整教程（Node.js 后端）'
date: 2026-04-08
description: '从零开始学习 WebSocket，包含基础概念、Node.js 后端实现、前端客户端代码以及实战案例'
tags: ['WebSocket', 'Node.js', '实时通信', 'Socket.io']
---

## 1. WebSocket 简介

WebSocket 是一种在单个 TCP 连接上进行**全双工通信**的协议，使得客户端和服务器之间可以建立持久连接，双方都可以随时发送数据。

### 核心特点

| 特性 | 说明 |
|------|------|
| **全双工通信** | 客户端和服务器可以同时发送和接收消息 |
| **持久连接** | 连接建立后保持打开状态，无需重复建立 |
| **低延迟** | 避免 HTTP 轮询开销，实时性更高 |
| **轻量级头部** | 数据传输时头部信息很小，节省带宽 |

### 适用场景

- 🎮 实时游戏
- 💬 即时聊天应用
- 📊 实时数据监控/仪表盘
- 📈 股票行情推送
- 🔔 通知推送系统

## 2. WebSocket vs HTTP

| 特性 | HTTP | WebSocket |
|------|------|-----------|
| **通信模式** | 请求-响应（半双工） | 全双工 |
| **连接方式** | 短连接，每次请求需重新建立 | 长连接，一次握手后保持 |
| **实时性** | 需要轮询，有延迟 | 实时推送，低延迟 |
| **服务器推送** | 不支持 | 原生支持 |

## 3. 环境准备

```bash
# 创建项目目录
mkdir websocket-tutorial && cd websocket-tutorial

# 初始化 npm 项目
npm init -y

# 安装依赖
npm install ws socket.io express
```

## 4. 基础实现：原生 ws 模块

```javascript
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws, req) => {
  console.log('新客户端连接:', req.socket.remoteAddress);
  
  ws.send(JSON.stringify({
    type: 'welcome',
    message: '欢迎来到 WebSocket 服务器！'
  }));

  ws.on('message', (data) => {
    const message = JSON.parse(data);
    ws.send(JSON.stringify({
      type: 'echo',
      message: `服务器收到: ${message.content}`
    }));
  });
});
```

## 5. 进阶实现：Socket.io

```javascript
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  socket.on('login', (username) => {
    io.emit('userJoined', `${username} 加入了聊天室`);
  });

  socket.on('sendMessage', (data) => {
    io.emit('newMessage', {
      username: data.username,
      content: data.content,
      timestamp: new Date().toLocaleTimeString()
    });
  });
});

httpServer.listen(3000);
```

## 6. 前端客户端

```html
<script src="/socket.io/socket.io.js"></script>
<script>
const socket = io();

socket.on('connect', () => {
  socket.emit('login', '用户名');
});

socket.on('newMessage', (data) => {
  console.log(`${data.username}: ${data.content}`);
});
</script>
```

## 7. 实战案例：在线聊天室

### 项目结构

```bash
websocket-chat/
├── server.js
├── public/
│   ├── index.html
│   └── chat.js
└── package.json
```

### 核心功能

- 用户登录和状态管理
- 实时消息发送和接收
- 房间管理和切换
- 正在输入状态提示
- 消息历史记录

## 8. 最佳实践

| 实践 | 说明 |
|------|------|
| **心跳检测** | 防止连接假死 |
| **消息限制** | 防止内存溢出和 DoS 攻击 |
| **XSS 防护** | 对用户输入进行转义 |
| **断线重连** | 自动重连机制 |
| **Redis 适配器** | 多服务器部署时共享状态 |

## 9. 快速开始

```bash
# 启动服务器
node server.js

# 访问客户端
open http://localhost:3000
```

---

**参考资源：**
- [WebSocket API - MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/WebSocket)
- [Socket.io 文档](https://socket.io/docs/)
