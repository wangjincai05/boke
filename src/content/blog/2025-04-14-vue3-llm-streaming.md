---
title: 'Vue3接入大模型流式输出实战'
date: 2025-04-14
description: '基于真实项目踩坑经验，详解如何在Vue3中处理大模型的SSE流式响应，包含Fetch + ReadableStream实现、Buffer管理、多轮对话等核心内容'
tags: ['Vue3', '大模型', 'SSE', '流式输出', 'AI']
---

# Vue3接入大模型流式输出实战

> **作者按**：这不是官方文档的翻译，而是基于真实项目踩坑经验的实战总结。如果你正在做 AI 聊天类应用，需要在前端处理大模型的流式响应，这篇文章会告诉你那些官方文档不会明说的坑。

## 一、为什么不用原生 EventSource

这是新人最容易踩的第一个坑。EventSource 确实是浏览器原生支持的 SSE 客户端，用起来简单：

```typescript
const eventSource = new EventSource('/api/stream');
eventSource.onmessage = (event) => {
  console.log(event.data);
};
```

**但问题是：EventSource 只支持 GET 请求。**

大模型 API（比如 OpenAI、DeepSeek、通义千问）全部都需要 POST 请求，而且请求体里必须带 JSON body：

```typescript
{
  "model": "deepseek-chat",
  "messages": [{ "role": "user", "content": "你好" }],
  "stream": true
}
```

GET 请求带不了这些。所以我们必须放弃 EventSource，改用 Fetch API 配合 ReadableStream。

**我的判断**：不要在 EventSource 上浪费时间，Fetch + ReadableStream 是处理大模型 SSE 的标准方案，原生支持、性能好、且能发送复杂请求体。

## 二、Fetch + ReadableStream 实现 SSE 解析

核心思路很简单：利用 fetch 返回的 Promise 会在响应头到达时就 resolve 的特性，提前拿到一个 ReadableStream 对象，然后逐步读取。

### 基础实现

```typescript
import { ref } from 'vue';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  isGenerating?: boolean;
}

const messages = ref<ChatMessage[]>([]);
const isGenerating = ref(false);
const abortController = ref<AbortController | null>(null);

async function sendMessage(userInput: string) {
  // 1. 添加用户消息
  messages.value.push({ role: 'user', content: userInput });
  
  // 2. 创建 AI 消息占位
  const aiMessage: ChatMessage = {
    role: 'assistant',
    content: '',
    isGenerating: true
  };
  messages.value.push(aiMessage);
  
  // 3. 创建 AbortController 用于中断
  abortController.value = new AbortController();
  isGenerating.value = true;
  
  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages.value.slice(0, -1).map(m => ({
          role: m.role,
          content: m.content
        })),
        stream: true
      }),
      signal: abortController.value.signal
    });
    
    if (!response.ok || !response.body) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    // 4. 获取 Reader
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    
    // 5. 开始读取流
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      // 解析 SSE 数据（见下一节）
      parseSSEChunk(chunk, aiMessage);
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.log('用户中断了请求');
    } else {
      console.error('请求失败:', err);
      aiMessage.content += '\n\n[请求失败，请重试]';
    }
  } finally {
    isGenerating.value = false;
    aiMessage.isGenerating = false;
    abortController.value = null;
  }
}

// 6. 中断函数
function stopGeneration() {
  abortController.value?.abort();
}
```

### SSE 协议解析：Buffer 管理

**这是最容易出 bug 的地方**。

SSE 数据长这样：

```
data: {"choices":[{"delta":{"content":"你好"}}]}
data: {"choices":[{"delta":{"content":"，"}}]}
data: {"choices":[{"delta":{"content":"我是"}}]}
data: [DONE]
```

但网络传输是按二进制 chunk 来的，一个 chunk 可能包含多条 SSE 行，也可能只包含半条 JSON。

**坑1：JSON 被截断**

如果收到半个 JSON 就直接 `JSON.parse()`，必崩无疑。

**解决方案：维护一个 buffer**

```typescript
function parseSSEChunk(rawChunk: string, message: ChatMessage) {
  buffer += rawChunk;
  
  // 按双换行分割（每条 SSE 消息的结束标记）
  const lines = buffer.split('\n');
  
  // 保留最后一行（可能是未完整的）
  buffer = lines.pop() || '';
  
  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    
    const dataStr = line.slice(6).trim();
    
    // 处理结束信号
    if (dataStr === '[DONE]') {
      return;
    }
    
    try {
      const data = JSON.parse(dataStr);
      const delta = data.choices?.[0]?.delta?.content;
      if (delta) {
        message.content += delta;
      }
    } catch {
      // JSON 不完整，放回 buffer
      buffer += line + '\n';
    }
  }
}
```

**坑2：UTF-8 多字节字符被截断**

中文、日文等字符在 UTF-8 编码下占 3-4 个字节。网络传输时，这些字节可能被拆分到不同的 chunk 中。

**解决方案：`TextDecoder` 要开启 `stream: true`**

```typescript
const decoder = new TextDecoder('utf-8');
// 每次 decode 时传入 { stream: true }
// 这样 decoder 会缓存不完整的字节，等待后续 chunk 补全
const chunk = decoder.decode(value, { stream: true });
```

## 三、封装 useLLMChat Composable

把上面的逻辑抽成一个可复用的组合式函数：

```typescript
// composables/useLLMChat.ts
import { ref, reactive, computed, watch } from 'vue';

export interface LLMConfig {
  baseUrl: string;
  model: string;
  apiKey: string;
  provider?: 'openai' | 'deepseek' | 'qwen'; // 用于适配不同 API 格式
}

export interface UseLLMChatOptions {
  config: LLMConfig;
  onChunk?: (delta: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (err: Error) => void;
}

export function useLLMChat(options: UseLLMChatOptions) {
  const { config, onChunk, onComplete, onError } = options;
  
  const isLoading = ref(false);
  const isStreaming = ref(false);
  const error = ref<string | null>(null);
  const fullResponse = ref('');
  
  let abortController: AbortController | null = null;
  let buffer = '';
  
  const chat = async (messages: Array<{ role: string; content: string }>) => {
    // 重置状态
    isLoading.value = true;
    isStreaming.value = true;
    error.value = null;
    fullResponse.value = '';
    buffer = '';
    
    abortController = new AbortController();
    
    try {
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages,
          stream: true
        }),
        signal: abortController.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      const reader = response.body!.getReader();
      const decoder = new TextDecoder('utf-8');
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          
          const dataStr = line.slice(6).trim();
          if (dataStr === '[DONE]') continue;
          
          try {
            // 适配不同 provider 的响应格式
            const delta = extractDelta(dataStr, config.provider);
            if (delta) {
              fullResponse.value += delta;
              onChunk?.(delta);
            }
          } catch {
            buffer += line + '\n';
          }
        }
      }
      
      onComplete?.(fullResponse.value);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // 用户中断，不是错误
      } else {
        error.value = err.message;
        onError?.(err);
      }
    } finally {
      isLoading.value = false;
      isStreaming.value = false;
    }
  };
  
  const stop = () => {
    abortController?.abort();
  };
  
  const reset = () => {
    fullResponse.value = '';
    error.value = null;
    buffer = '';
  };
  
  // 辅助函数：适配不同 API 的响应格式
  function extractDelta(dataStr: string, provider?: string): string | null {
    try {
      const data = JSON.parse(dataStr);
      
      // OpenAI / DeepSeek 格式
      if (provider === 'openai' || provider === 'deepseek') {
        return data.choices?.[0]?.delta?.content || null;
      }
      
      // 通义千问格式
      if (provider === 'qwen') {
        return data.output?.choices?.[0]?.delta?.content || null;
      }
      
      // 默认尝试 OpenAI 格式
      return data.choices?.[0]?.delta?.content || null;
    } catch {
      return null;
    }
  }
  
  return {
    isLoading: readonly(isLoading),
    isStreaming: readonly(isStreaming),
    error: readonly(error),
    fullResponse: readonly(fullResponse),
    chat,
    stop,
    reset
  };
}
```

**使用方式**：

```typescript
const llmChat = useLLMChat({
  config: {
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    apiKey: 'sk-xxx',
    provider: 'deepseek'
  },
  onChunk: (delta) => {
    // 实时更新 UI
  },
  onComplete: (text) => {
    console.log('完整回答:', text);
  }
});

// 发送消息
await llmChat.chat([
  { role: 'user', content: '你好，请介绍一下你自己' }
]);
```

## 四、多轮对话上下文管理

大模型需要"记住"之前的对话内容，这需要我们维护 messages 数组：

```typescript
const conversationHistory = ref<Array<{ role: string; content: string }>>([
  { role: 'system', content: '你是我的 AI 助手，请用简洁的语言回答。' }
]);

async function sendMessage(userInput: string) {
  // 1. 添加用户消息到历史
  conversationHistory.value.push({
    role: 'user',
    content: userInput
  });
  
  // 2. 创建 AI 回复占位
  const aiMessage = {
    role: 'assistant' as const,
    content: '',
    isGenerating: true
  };
  messages.value.push(aiMessage);
  
  try {
    // 3. 只传 system + 最近 N 轮对话（节省 token）
    const messagesToSend = buildMessagesWithLimit(
      conversationHistory.value,
      10 // 最多保留 10 轮
    );
    
    await llmChat.chat(messagesToSend, {
      onChunk: (delta) => {
        aiMessage.content += delta;
      },
      onComplete: () => {
        // 4. 把 AI 回复也加入历史
        conversationHistory.value.push({
          role: 'assistant',
          content: aiMessage.content
        });
      }
    });
  } finally {
    aiMessage.isGenerating = false;
  }
}

// 限制上下文长度（避免超出 token 限制）
function buildMessagesWithLimit(
  history: Array<{ role: string; content: string }>,
  maxTurns: number
) {
  // system prompt 始终在第一位
  const systemMsg = history[0];
  const otherMessages = history.slice(1);
  
  // 从后往前取最近的对话
  const recentMessages = otherMessages.slice(-maxTurns * 2);
  
  return [systemMsg, ...recentMessages];
}
```

## 五、Markdown 实时渲染 + 打字光标

AI 输出通常是 Markdown 格式，需要实时渲染：

```typescript
import { marked } from 'marked';
import hljs from 'highlight.js';

// 配置 marked
marked.setOptions({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  }
});

const aiMessage = reactive({
  rawContent: '',
  get htmlContent() {
    if (!this.rawContent) return '';
    return marked.parse(this.rawContent) as string;
  }
});
```

**模板写法**：

```vue
<template>
  <div class="message assistant">
    <span v-html="aiMessage.htmlContent"></span>
    <span v-if="isStreaming" class="cursor">|</span>
  </div>
</template>

<style scoped>
.cursor {
  animation: blink 1s step-end infinite;
  color: #10b981;
}

@keyframes blink {
  50% { opacity: 0; }
}
</style>
```

**坑3：高频 DOM 更新的性能问题**

当 AI 输出几千字时，如果每个 token 都触发一次完整的 Markdown 解析 + DOM 更新，页面会非常卡顿。

**解决方案：节流 + requestAnimationFrame**

```typescript
let rafId: number | null = null;
let pendingContent = '';

function onChunk(delta: string) {
  pendingContent += delta;
  
  // 防抖：合并多个 chunk，只在下一帧渲染一次
  if (rafId === null) {
    rafId = requestAnimationFrame(() => {
      aiMessage.rawContent = pendingContent;
      rafId = null;
    });
  }
}
```

**更激进的方案：每 50ms 最多渲染一次**

```typescript
import { throttle } from '../utils/throttle';

const throttledUpdate = throttle((content: string) => {
  aiMessage.rawContent = content;
}, 50);

function onChunk(delta: string) {
  pendingContent += delta;
  throttledUpdate(pendingContent);
}
```

## 六、AbortController 中断流式输出

用户可能等不及想中途停止生成：

```typescript
const stopGeneration = () => {
  abortController.value?.abort();
  
  // 注意：AbortError 不是异常，是正常的中断信号
  // 但我们还是需要等待 chat 函数内的 finally 执行完
};
```

**坑4：中断后状态残留**

调用 `stop()` 后，`isStreaming` 会变成 `false`，但 `fullResponse` 会保留已接收的内容。如果需要清空，需要手动调用 `reset()`：

```typescript
function handleStop() {
  stopGeneration();
  
  // 清理 AI 消息（保留用户的消息）
  const userMessages = messages.value.filter(m => m.role === 'user');
  messages.value = userMessages;
  
  // 或者只清空 AI 消息的内容
  // messages.value.at(-1).content = '';
}
```

## 七、支持多 Provider 适配

不同大模型 API 的请求/响应格式略有差异，需要适配：

```typescript
// 请求体适配
function buildRequestBody(messages: any[], config: LLMConfig) {
  const base = {
    model: config.model,
    messages,
    stream: true
  };
  
  switch (config.provider) {
    case 'qwen':
      // 通义千问额外参数
      return { ...base, parameters: { top_p: 0.9 } };
    case 'deepseek':
    default:
      return base;
  }
}

// 响应解析适配（见上方 extractDelta 函数）
```

## 八、踩坑实录

### 坑1：JSON 截断导致 `Unexpected end of JSON input`

**问题**：网络传输时，一个 chunk 可能只包含半个 JSON 字符串，直接 `JSON.parse()` 会报错。

**解决**：维护 buffer，拼接完整后再解析。代码见上方 `parseSSEChunk` 函数。

### 坑2：长文本渲染卡顿

**问题**：AI 输出几千字时，每个 token 都触发 DOM 更新，页面直接卡死。

**解决**：
1. 使用 `requestAnimationFrame` 合并更新
2. Markdown 解析节流到 50ms 一次
3. 考虑虚拟滚动（vue-virtual-scroller）

### 坑3：AbortController 中断后连接未释放

**问题**：调用 `abort()` 后，虽然 fetch 请求断了，但 SSE 连接可能还挂着。

**解决**：
1. 确保 `finally` 块里清理 `abortController`
2. 组件卸载时也要调用 `abort()`
3. 考虑使用 `@microsoft/fetch-event-source` 库，它封装得更好

### 坑4：多轮对话 token 超限

**问题**：对话历史越来越长，最后超出模型的 token 限制。

**解决**：
1. 实现滑动窗口，只保留最近 N 轮对话
2. system prompt 可以精简或放到单独的配置里
3. 考虑服务端做 context 压缩

### 坑5（附加）：流式输出期间切换页面导致内存泄漏

**问题**：用户在 AI 输出期间跳转到其他页面，SSE 连接未断开。

**解决**：

```typescript
onUnmounted(() => {
  abortController.value?.abort();
});
```

## 九、总结与决策建议

### 什么时候自研 vs 用库？

| 场景 | 推荐方案 |
|------|----------|
| 简单聊天界面，只需要流式输出 | 自研，使用本文的方案 |
| 需要断线重连、错误重试 | 用 `@microsoft/fetch-event-source` |
| 企业级应用，需要完整的状态管理 | 用 `langchain-js` 或类似框架 |

### 核心决策点

1. **Fetch + ReadableStream 是标准方案**：别在 EventSource 上浪费时间
2. **Buffer 管理是刚需**：一定要处理 JSON 截断和 UTF-8 多字节字符
3. **性能优化不可忽视**：使用节流/throttle 防止高频 DOM 更新
4. **AbortController 要管理好**：组件卸载时必须清理
5. **多 provider 适配**：预留 provider 配置字段，方便后续扩展

### 参考资料

- [Vue 3 实战：如何优雅地处理大模型 SSE 流式数据](https://blog.csdn.net/2501_93411574/article/details/160980940)
- [Vue 3 实现 AI 流式输出](https://juejin.cn/post/7586973107322241064)
- [从 chunk 到对话：Vue 3 实现 LLM 流式输出](https://juejin.cn/post/7580550040395841571)