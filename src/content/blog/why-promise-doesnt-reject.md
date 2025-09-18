---
title: 为什么 Fetch 不会在错误响应时拒绝
excerpt: Fetch API 是现代 JavaScript 中常用的网络请求工具，但其 Promise 不会在 HTTP 错误响应（如 404、500）时拒绝。这种行为常让开发者困惑。本文从网络请求的角度解释其设计逻辑，并提供正确处理方式。
publishDate: 'Sep 18 2019'
featureImage:
  src: '/post-21.webp'
  alt: keyboard
seo:
  image:
    src: '/post-21.jpg'
---

## 为什么 Fetch 的 Promise 不会在错误响应时拒绝

### 问题背景

如果你使用过浏览器的 `fetch()` 或 Node.js 现代版本的 `fetch()`，你知道它返回一个 Promise：

```javascript
fetch(request).then((response) => {
  // 处理响应
});
```

在 JavaScript 中，Promise 通常在发生错误时拒绝（reject）。但令人困惑的是，`fetch()` 的 Promise 在收到 HTTP 错误响应（如 404 或 500）时并不拒绝。这迫使开发者显式检查响应状态：

```javascript
fetch(request).then((response) => {
  if (!response.ok) {
    throw new Error(`服务器返回 ${response.status} 状态`);
  }
  return response.json();
});
```

这种行为看似奇怪，但实际上是 Fetch API 的设计初衷。

### Promise 的本质

开发者通常期望 `fetch()` 的 Promise 状态反映请求的结果：

- 请求成功，Promise 解析（resolve）。
- 请求失败，Promise 拒绝（reject）。

这正是 `fetch()` 的行为，但关键在于“请求成功”的定义。

### 网络请求的视角

一个 HTTP 请求/响应的过程可以简化为以下步骤：

1. 代码发起请求。
2. 请求头（HTTP 消息头，如 `GET / HTTP/1.1`）发送到服务器。
3. 请求体（如果有）开始传输。
4. **请求体传输完成。**
5. 服务器返回响应头。
6. 响应体传输到客户端。

从网络层面看，只要请求成功发送到服务器（完成步骤 4），就视为“请求成功”。这与服务器返回的响应状态无关。换句话说，`fetch()` 的 Promise 表示的是**请求是否成功发送并接收到响应**，而不是响应是否符合你的预期。

即使服务器返回 404 或 500，请求本身仍然是成功的，因为它已经到达服务器并得到了响应。因此，`fetch()` 的 Promise 不会因为 HTTP 错误状态而拒绝。

### 错误响应的真相

HTTP 错误响应（如 404、500）并不表示请求失败。相反，收到错误响应意味着请求成功到达服务器并返回了结果。开发者期望的“成功”通常是“200 OK”这样的响应，例如请求 `/books` 希望返回书籍列表，任何其他状态都被视为错误。

而 `fetch()` 不会假设你的意图。例如，在某些场景中，你可能期望 404 或 403 响应（如检查资源是否存在）。响应的预期因上下文而异，`fetch()` 不应擅自决定哪些状态是“错误”。因此，它将所有 HTTP 响应视为解析状态，交由开发者通过 `response.ok` 或 `response.status` 判断。

此外，许多开发者熟悉的现代库（如 Axios）会在 4xx/5xx 状态时自动拒绝 Promise，从而导致对 `fetch()` 的期望偏差。Axios 的设计假设 HTTP 错误状态是异常情况，而 `fetch()` 仅关注请求本身的成功与否，于是开发者会觉得 `fetch()` 的行为有些“怪”。

### Promise 拒绝的场景

`fetch()` 的 Promise 会在以下情况发生时拒绝：

- 请求构造错误（如无效 URL）。
- 网络错误（如 DNS 解析失败、网络断开）。
- 请求被中止（如通过 `AbortController`）。

这些场景与请求本身的失败有关，与响应状态无关。你可以在 `.catch()` 中处理这些错误：

```javascript
fetch(request)
  .then((response) => {
    if (!response.ok) {
      throw new Error(`服务器返回 ${response.status} 状态`);
    }
    return response.json();
  })
  .catch((error) => {
    // 处理请求层面的错误
    console.error('请求失败:', error.message);
  });
```

这种设计非常优雅：`.then()` 处理所有响应（无论状态），`.catch()` 捕获请求失败的错误。这种分离让代码逻辑清晰，职责明确。

### 总结

Fetch API 的 Promise 设计是深思熟虑的，其行为完全符合网络请求的本质。HTTP 错误响应是服务器的正常返回，`fetch()` 的 Promise 只关心请求是否成功发送和接收，而不假设响应状态的含义。

**参考资源**：

- [MDN Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [WHATWG Fetch Standard](https://fetch.spec.whatwg.org/)
