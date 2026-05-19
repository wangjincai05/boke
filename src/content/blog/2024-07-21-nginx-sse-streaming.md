---
title: 'Nginx SSE 流式响应配置详解'
date: 2024-07-21
description: '详解 Nginx 配置 SSE（Server-Sent Events）流式响应的关键参数，解决前端无法流式接收数据的问题'
tags: ['Nginx', 'SSE', '流式响应', '服务器配置']
---

## 一、问题背景

在实现 ChatGPT 打字机效果等场景时，需要服务端进行流式响应（SSE）。本地开发时正常，但线上使用 Nginx 转发后出现问题：

1. 服务端配置了 `Content-Type: text/event-stream`，但前端无法流式接收
2. 内容接收完毕后长连接未关闭，导致前端持续请求超时

## 二、核心原因

Nginx 默认会缓存响应内容，只有接收到完整响应后才发送给客户端，因此默认不支持流式响应，需要手动配置相关参数。

## 三、关键配置

```nginx
server {
    server_name example.com;
    listen 80;

    location /api/stream {
        add_header backendIP $upstream_addr;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # 关键配置
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_cache off;
        proxy_buffering off;
        chunked_transfer_encoding on;
        tcp_nopush on;
        tcp_nodelay on;
        keepalive_timeout 60;
        
        proxy_pass http://backend:8080;
        proxy_redirect off;
        proxy_connect_timeout 15;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
    }
}
```

## 四、配置参数详解

### 必选配置

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `proxy_http_version 1.1` | 使用 HTTP/1.1 协议 | 1.0 |
| `proxy_set_header Connection ""` | 启用长连接 | close |
| `proxy_cache off` | 关闭缓存 | on |
| `proxy_buffering off` | 关闭代理缓冲 | on |
| `chunked_transfer_encoding on` | 开启分块传输编码 | - |

### 性能优化配置

| 参数 | 说明 |
|------|------|
| `tcp_nopush on` | 禁止 Nagle 算法，立即发送数据 |
| `tcp_nodelay on` | 禁止延迟 ACK 算法，降低延迟 |
| `keepalive_timeout 60` | 长连接超时时间 |

## 五、原理说明

1. **`proxy_buffering off`**：禁用响应缓冲，Nginx 会立即将上游服务器的响应发送给客户端
2. **`proxy_http_version 1.1`**：HTTP/1.1 支持持久连接，是长连接的基础
3. **`proxy_set_header Connection ""`**：清除 Connection 头，让 Nginx 使用默认的 keep-alive
4. **`chunked_transfer_encoding on`**：启用分块传输，支持流式响应

## 六、完整示例

```nginx
server {
    listen 80;
    server_name api.example.com;

    location /stream {
        proxy_pass http://localhost:3000;
        
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_cache off;
        proxy_buffering off;
        chunked_transfer_encoding on;
        
        proxy_connect_timeout 10;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
    }
}
```

## 七、注意事项

1. 确保后端服务正确设置 `Content-Type: text/event-stream` 响应头
2. 后端需要正确关闭连接，避免前端持续等待
3. 根据业务需求调整 `proxy_read_timeout` 和 `proxy_send_timeout`

## 总结

通过配置 `proxy_buffering off`、`proxy_http_version 1.1` 和 `proxy_set_header Connection ""` 这三个关键参数，可以让 Nginx 正确支持 SSE 流式响应。这些配置确保了响应数据能够实时传输到前端，实现打字机效果等交互体验。