---
title: 短轮询、长轮询、SSE、WebSocket 与 socket.io —— 对比与实战
excerpt: 本文全面对比了短轮询、长轮询、SSE、WebSocket 这几种实时通信技术，从发展历史、实现条件、客户端与服务器要求、资源消耗、实现难度到适用场景逐一剖析，并给出了完整的可运行代码示例。文章还展示了如何通过 socket.io 简化开发，轻松实现消息推送与双向通信，帮助你快速选择最合适的实时通信方案。
publishDate: 'Jul 23 2021'
featureImage:
  src: '/post-2.webp'
  alt: Sun and sea waves
seo:
  image:
    src: '/post-2.jpg'
---

## 一、概念与发展历史

- **短轮询（Short Polling）**  
  客户端定期发送 HTTP 请求询问服务器是否有新数据。最早的“客户端拉取”方案。
- **长轮询（Long Polling）**  
  客户端请求会被服务器挂起，直到有新数据或超时才返回。属于 Comet 技术。
- **SSE（Server-Sent Events）**  
  HTML5 标准的一部分，浏览器通过 `EventSource` 建立单向连接，服务器可以持续推送事件。
- **WebSocket**  
  HTML5 标准，建立在 HTTP 协议升级之上，支持 **双向持久通信**。
- **socket.io**  
  基于 WebSocket 的高级封装，支持事件命名、自动重连、兼容旧环境。

---

## 二、实现条件

- **短轮询**：只需普通 HTTP，任何环境可实现。
- **长轮询**：需要服务器/代理支持长时间保持请求。
- **SSE**：浏览器需支持 `EventSource`（现代浏览器支持，IE 除外）。
- **WebSocket**：浏览器支持 WebSocket（现代浏览器 OK），服务器需支持协议升级。
- **socket.io**：在 WebSocket 基础上提供降级、重连机制，降低前后端要求。

---

## 三、对客户端与服务器的要求

- **短轮询**：客户端定时发请求，服务器简单返回。
- **长轮询**：客户端能处理挂起请求，服务器要维护大量长连接。
- **SSE**：客户端用 `EventSource`，服务器需支持 `text/event-stream`。
- **WebSocket**：浏览器与服务器保持 TCP 长连接，需要额外心跳管理。
- **socket.io**：自动管理连接、重连、心跳、房间等，比原生 WebSocket 友好。

---

## 四、资源消耗对比

| 技术      | 连接数     | 带宽消耗             | 延迟 | 消息方向   |
| --------- | ---------- | -------------------- | ---- | ---------- |
| 短轮询    | 多次短连接 | 请求频繁，浪费多     | 高   | 客户端拉取 |
| 长轮询    | 持久挂起   | 有消息才发，较省     | 较低 | 单向       |
| SSE       | 持久连接   | 仅必要消息，较轻     | 低   | 单向       |
| WebSocket | 持久连接   | 高效，支持二进制     | 低   | 双向       |
| socket.io | 持久连接   | 同 WebSocket，带容错 | 低   | 双向       |

---

## 五、适用场景

- **短轮询**：低频更新、环境受限。
- **长轮询**：近实时但环境不支持 WebSocket。
- **SSE**：单向推送，如通知、实时行情。
- **WebSocket**：双向实时交互，如游戏、协作。
- **socket.io**：复杂业务的首选，尤其适合聊天、房间、多人应用。

---

## 六、实战示例

下面展示四种方式实现方式，其中WebSocket以 **socket.io**实现。

### 1. 客户端

**短轮询**

```js
let sinceId = 0;
async function poll() {
  const res = await fetch('http://localhost:3000/poll-short?sinceId=' + sinceId);
  const data = await res.json();
  data.forEach((m) => {
    console.log('收到: ' + JSON.stringify(m));
    sinceId = Math.max(sinceId, m.id);
  });
}
setInterval(poll, 3000);
poll();
```

**长轮询**

```js
let sinceId = 0;

async function longPoll() {
  try {
    const res = await fetch('http://localhost:3000/poll-long?sinceId=' + sinceId);
    const data = await res.json();
    data.forEach((m) => {
      log('收到: ' + JSON.stringify(m));
      sinceId = Math.max(sinceId, m.id);
    });
  } catch (e) {
    log('错误: ' + e);
  }
  longPoll();
}
longPoll();
```

**SSE**

```js
function log(x) {
  document.getElementById('log').innerHTML += `<p>${x}</p>`;
}
const es = new EventSource('http://localhost:3000/sse');
es.onmessage = (ev) => log('SSE消息: ' + ev.data);
es.onerror = () => log('SSE错误/断开');
```

**websocket(socket.io)**

```js
const socket = io('http://localhost:3000');

socket.on('connect', () => log('连接成功: ' + socket.id));
socket.on('welcome', (data) => log('欢迎: ' + JSON.stringify(data)));
socket.on('new_message', (data) => log('推送消息: ' + JSON.stringify(data)));
socket.on('chat', (data) => log('聊天: ' + JSON.stringify(data)));

document.getElementById('send').onclick = () => {
  const v = document.getElementById('txt').value;
  socket.emit('chat', v);
  console.log('客户端: ' + v);
};
```

### 2. 服务端

```js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/client', express.static(__dirname + '/client'));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = 3000;

let messageId = 1;
let messageBuffer = [];
let longPollWaiters = [];
const sseClients = new Set();

// 定期生产消息
function produceMessage() {
  const msg = { id: messageId++, text: 'msg at ' + new Date().toISOString() };
  messageBuffer.push(msg);
  if (messageBuffer.length > 100) messageBuffer.shift();

  // 长轮询
  while (longPollWaiters.length > 0) {
    const res = longPollWaiters.shift();
    res.json([msg]);
  }

  // SSE
  for (const res of sseClients) {
    res.write(`id: ${msg.id}\n`);
    res.write(`data: ${JSON.stringify(msg)}\n\n`);
  }

  // socket.io
  io.emit('new_message', msg);

  console.log('Produced message:', msg);
}
setInterval(produceMessage, 5000);

// 短轮询
app.get('/poll-short', (req, res) => {
  const sinceId = Number(req.query.sinceId || 0);
  const msgs = messageBuffer.filter((m) => m.id > sinceId);
  res.json(msgs);
});

// 长轮询
app.get('/poll-long', (req, res) => {
  const sinceId = Number(req.query.sinceId || 0);
  const msgs = messageBuffer.filter((m) => m.id > sinceId);
  if (msgs.length > 0) return res.json(msgs);

  const timeout = setTimeout(() => {
    const idx = longPollWaiters.indexOf(res);
    if (idx !== -1) longPollWaiters.splice(idx, 1);
    res.json([]);
  }, 30000);

  res.on('close', () => clearTimeout(timeout));
  longPollWaiters.push(res);
});

// SSE
app.get('/sse', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.flushHeaders();
  res.write(`: welcome\n\n`);

  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});

// socket.io
io.on('connection', (socket) => {
  console.log('socket.io client connected');

  socket.emit('welcome', { text: 'Welcome via socket.io!' });

  socket.on('chat', (msg) => {
    console.log('客户端消息:', msg);
    io.emit('chat', { from: socket.id, msg });
  });

  socket.on('disconnect', () => {
    console.log('socket.io client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
```
