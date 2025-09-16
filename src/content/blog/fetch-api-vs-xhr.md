---
title: Fetch API 相比 XMLHttpRequest 的优缺点分析
excerpt: Fetch API 代表了 Web 网络请求的未来方向，它更符合现代 JavaScript 开发模式，提供了更简洁的 API 和更好的功能。
publishDate: 'Dec 11 2019'
featureImage:
  src: '/post-23.webp'
  alt: Lights
seo:
  image:
    src: '/post-23.jpg'
---

## 一、Fetch API 的主要优点

### 1. 基于 Promise 的现代异步处理

- **优点**：完全基于 Promise，避免回调地狱，支持 async/await 语法
- **对比**：XHR 需要处理多个回调函数（onload, onerror, onprogress等）
- **代码示例**：

  ```jsx
  // Fetch (简洁清晰)
  async function fetchData() {
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Fetch error:', error);
    }
  }

  // XHR (嵌套回调)
  function fetchDataXHR() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/data', true);
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        console.log(JSON.parse(xhr.responseText));
      }
    };
    xhr.onerror = function () {
      console.error('XHR error');
    };
    xhr.send();
  }
  ```

### 2. 标准化的请求/响应对象模型

- **优点**：请求和响应都有标准化对象，提供多种数据解析方法
- **对比**：XHR 的响应数据需要手动解析
- **特性**：
  - `response.json()`
  - `response.text()`
  - `response.blob()`
  - `response.arrayBuffer()`
  - `response.formData()`

### 3. 更好的流式处理能力

- **优点**：支持流式处理响应体，可以处理大文件而不必等待整个响应完成
- **对比**：XHR 需要等待整个响应完成才能处理
- **示例**：

  ```jsx
  fetch('/large-file')
    .then((response) => response.body.getReader())
    .then((reader) => {
      return pump();
      function pump() {
        return reader.read().then(({ done, value }) => {
          if (done) return;
          console.log('Received chunk', value);
          return pump();
        });
      }
    });
  ```

### 4. 与现代 Web 技术无缝集成

- **优点**：与 Service Worker、Cache API 等现代 Web 技术完美配合
- **对比**：XHR 与 Service Worker 的集成较为复杂
- **应用场景**：离线应用、PWA、缓存策略等

### 5. 语义更清晰的 API 设计

- **优点**：方法和参数设计更符合现代 JavaScript 开发习惯
- **对比**：XHR 的 API 设计较为陈旧
- **示例**：

  ```jsx
  // Fetch (更直观)
  fetch('/api/data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ key: 'value' })
  });

  // XHR (步骤繁琐)
  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/data', true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(JSON.stringify({ key: 'value' }));
  ```

## 二、Fetch API 的主要缺点

### 1. 默认不处理 HTTP 错误状态

- **缺点**：HTTP 错误状态码（404、500等）不会导致 Promise reject
- **对比**：XHR 在 `onload` 中可以直接检查状态码
- **需要额外处理**：

  ```jsx
  fetch('/api/data')
    .then((response) => {
      if (!response.ok) {
        // 必须手动检查
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .catch((error) => console.error('Error:', error));
  ```

### 2. 上传进度支持有限

- **缺点**：原生不支持上传进度事件
- **对比**：XHR 有 `xhr.upload.onprogress` 事件
- **解决方案**：需要使用第三方库或结合 XHR 实现

  ```jsx
  // XHR 原生支持上传进度
  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/upload', true);
  xhr.upload.onprogress = function (event) {
    if (event.lengthComputable) {
      const percentComplete = (event.loaded / event.total) * 100;
      console.log(`Upload progress: ${percentComplete}%`);
    }
  };
  xhr.send(formData);
  ```

### 3. 取消请求需要额外 API

- **缺点**：需要使用 AbortController API 来取消请求
- **对比**：XHR 有简单的 `abort()` 方法
- **Fetch 取消示例**：

  ```jsx
  const controller = new AbortController();
  const signal = controller.signal;

  fetch('/api/data', { signal })
    .then((response) => response.json())
    .catch((error) => {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
      }
    });

  // 取消请求
  setTimeout(() => controller.abort(), 5000);
  ```

### 4. 默认不发送 Cookie

- **缺点**：跨域请求默认不发送 Cookie
- **对比**：XHR 默认发送 Cookie
- **需要显式设置**：

  ```jsx
  fetch('/api/data', {
    credentials: 'include' // 需要显式设置才能发送 Cookie
  });
  ```

### 5. 无内置超时机制

- **缺点**：没有内置的超时设置
- **对比**：XHR 有 `timeout` 属性
- **需要自行实现**：

  ```jsx
  function fetchWithTimeout(url, options = {}, timeout = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    return fetch(url, {
      ...options,
      signal: controller.signal
    }).finally(() => clearTimeout(id));
  }
  ```

## 三、全面对比表

| 特性                    | Fetch API                                | XMLHttpRequest                   |
| ----------------------- | ---------------------------------------- | -------------------------------- |
| **异步模型**            | 基于 Promise，支持 async/await           | 基于事件回调                     |
| **代码简洁性**          | 高（链式调用，更少样板代码）             | 低（多步骤设置）                 |
| **HTTP 错误处理**       | 需要手动检查 `response.ok`               | 在 `onload` 中可直接检查状态码   |
| **上传进度**            | 不支持（需第三方库）                     | 原生支持 `xhr.upload.onprogress` |
| **下载进度**            | 支持（通过 `response.body.getReader()`） | 支持 `xhr.onprogress`            |
| **请求取消**            | 需要 AbortController                     | 简单的 `xhr.abort()`             |
| **Cookie 处理**         | 默认不发送，需 `credentials: 'include'`  | 默认发送                         |
| **超时机制**            | 无内置，需自行实现                       | 有 `timeout` 属性                |
| **流式处理**            | 原生支持 ReadableStream                  | 需要等待完整响应                 |
| **Service Worker 支持** | 原生支持                                 | 有限支持                         |
| **浏览器兼容性**        | 现代浏览器（不支持 IE）                  | 所有浏览器（包括 IE）            |
| **二进制数据处理**      | 更好的 API（blob(), arrayBuffer()）      | 需要设置 responseType            |
| **请求中止事件**        | 通过 AbortSignal                         | 通过 onabort 事件                |

## 四、适用场景建议

### 优先使用 Fetch API 的场景

- **现代 Web 应用**：不需要支持 IE 的项目
- **PWA/离线应用**：需要与 Service Worker 集成
- **流式数据处理**：处理大文件或实时数据流
- **代码可读性要求高**：需要简洁、可维护的代码
- **使用 async/await**：希望代码更线性、更易读

### 优先使用 XMLHttpRequest 的场景

- **需要支持 IE**：旧版浏览器兼容性要求
- **需要上传进度**：文件上传进度显示
- **简单请求**：小型项目或快速原型开发
- **需要同步请求**：虽然不推荐，但某些特殊场景可能需要

## 五、最佳实践建议

1. **现代项目首选 Fetch**：对于新项目，特别是不需要支持 IE 的项目，Fetch 是更好的选择
2. **使用封装库弥补不足**：
   - 使用 ky、swr 等库获取更好的开发体验
   - 这些库基于 Fetch，但提供了更完善的 API
3. **处理 HTTP 错误的标准方式**：

   ```jsx
   async function fetchJson(url) {
     const response = await fetch(url);
     if (!response.ok) {
       const error = new Error(`HTTP error! status: ${response.status}`);
       error.response = response;
       throw error;
     }
     return response.json();
   }
   ```

4. **实现请求取消的标准模式**：

   ```jsx
   function createCancelableFetch() {
     const controller = new AbortController();
     const signal = controller.signal;

     return {
       fetch: (url, options = {}) =>
         fetch(url, { ...options, signal }),
       cancel: () => controller.abort()
     };
   }

   // 使用示例
   const { fetch, cancel } = createCancelableFetch();
   fetch('/api/data').then(...);
   // 需要时取消
   cancel();

   ```

5. **兼容性处理**：
   - 对于需要支持旧浏览器的项目，使用 polyfill
   - 推荐使用 [whatwg-fetch](https://github.com/github/fetch) polyfill

## 六、总结

Fetch API 代表了 Web 网络请求的未来方向，它更符合现代 JavaScript 开发模式，提供了更简洁的 API 和更好的功能。尽管它有一些局限性（如上传进度支持），但这些通常可以通过第三方库或特定实现来解决。

对于新项目，**推荐使用 Fetch API**，它使代码更简洁、更易维护，并与现代 Web 技术栈完美集成。实际项目可以考虑使用基于 Fetch 封装的库（如 ky、swr），它们提供了更完整的功能集，同时保留了 Fetch 的优点。

在浏览器兼容性方面，随着 IE 的逐渐淘汰，Fetch API 的采用率会越来越高，成为 Web 开发中网络请求的标准方式。
