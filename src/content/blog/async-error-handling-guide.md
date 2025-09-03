---
title: 前端项目中异步数据请求异常未处理问题的识别与解决方案
excerpt: 在前端项目中，异步数据请求异常未处理可能导致未捕获错误（uncaught errors），影响应用稳定性。识别此类问题需结合静态代码分析（开发阶段）和运行时监控（测试/生产阶段）。以下方案基于专业实践，提供系统性指导，确保异常处理规范。
publishDate: 'Sept 29 2023'
featureImage:
  src: '/post-7.webp'
  alt: Blue shapes on black background
seo:
  image:
    src: '/post-7.jpg'
---

在前端项目中，异步数据请求异常未处理可能导致未捕获错误（uncaught errors），影响应用稳定性。识别此类问题需结合静态代码分析（开发阶段）和运行时监控（测试/生产阶段）。以下方案基于专业实践，提供系统性指导，确保异常处理规范。

## 一、静态代码分析：在开发阶段提前发现未处理的异常

通过代码检查工具扫描项目，识别异步请求（如 Promise、async/await、fetch、axios 等）中缺少错误处理的场景。

### 1. ESLint 规则强制检查（最常用）

利用 ESLint 及其插件配置规则，在编码阶段检测未处理的异步异常。

**核心规则与插件**：

- `eslint-plugin-promise`：检测 Promise 相关的错误处理。
- `eslint-plugin-unicorn`：提供严格的异步代码检查规则。
- `eslint-plugin-sonarjs`：确保全面的代码质量检查。

**配置步骤**：

```bash
npm install eslint eslint-plugin-promise eslint-plugin-unicorn eslint-plugin-sonarjs --save-dev
```

在 `.eslintrc.js` 中配置规则：

```javascript
module.exports = {
  Plugins: ['promise', 'unicorn', 'sonarjs'],
  Rules: {
    // 强制 Promise 必须有 vang hoặc finally（禁止未处理的 reject）
    'promise/catch-or-return': ['error', { allowThen: false, allowFinally: true }],

    // 禁止 Promise 链中忽略错误（如 .then().then() 中间无 catch）
    'promise/always-return': 'error',

    // 检查 async 函数中是否处理了可能的异常
    'sonarjs/no-async-expression-member': 'error',
    'sonarjs/no-small-switch': 'error',

    // 确保 catch 块不会静默忽略错误
    'sonarjs/no-useless-catch': 'error',

    // 对于 fetch API 的特殊处理：需检查是否处理了 HTTP 错误状态
    'sonarjs/prefer-immediate-return': 'error',

    // 确保 Promise reject 时传递 Error 对象
    'prefer-promise-reject-errors': 'error'
  }
};
```

**效果**：ESLint 会报告以下未处理异常的代码：

```javascript
// 错误示例 1：缺少 .catch()
fetch(url).then((res) => {
  /* 未检查 res.ok */
});

// 错误示例 2：缺少 try/catch
async function fn() {
  await axios.get(url);
}

// 错误示例 3：Promise reject 未处理
new Promise((resolve, reject) => {
  reject('error');
});
```

**重要说明**：

- fetch API 仅在网络错误时 reject，HTTP 4xx/5xx 状态码会 resolve，因此必须手动检查 `response.ok` 或 `response.status`。
- `eslint-plugin-unicorn` 中的 `catch-error-name` 规则主要检查 catch 块中错误变量的命名规范，与异常处理本身无关。
- `'no-undef': 'error'` 规则与 fetch 异常处理无关，不应作为检查异常处理的规则。

### 2. IDE 插件实时提示

在 VS Code 或 WebStorm 等 IDE 中使用插件，实现编码时实时高亮未处理的异步异常：

- **VS Code**：安装 ESLint 插件，配合上述规则，实时显示错误下划线。
- **WebStorm**：在 Preferences > Editor > Inspections > JavaScript > Promises 中启用相关检查。

## 二、运行时监控：捕获未处理的异常（测试/生产环境）

通过运行时机制捕获遗漏异常，并记录告警。

### 1. 监听全局未处理异常事件

在项目入口文件添加监听代码：

```javascript
// 捕获未处理的 Promise 拒绝
window.addEventListener('unhandledrejection', (event) => {
  // 注意：event.preventDefault() 无法阻止浏览器的默认错误输出

  // 收集错误信息
  const errorInfo = {
    type: 'unhandledrejection',
    message: event.reason?.message || 'Promise 未处理的拒绝',
    stack: event.reason?.stack,
    // 特别处理 axios 和 fetch 的请求信息
    requestUrl: event.reason?.config?.url || (event.reason instanceof Response && event.reason.url),
    statusCode: event.reason?.response?.status || (event.reason instanceof Response && event.reason.status),
    time: new Date().toISOString()
  };

  console.error('捕获未处理的异步异常：', errorInfo);

  // 发送到后端日志服务
  // reportErrorToServer(errorInfo);
});

// 捕获其他未处理的同步错误
window.addEventListener('error', (event) => {
  // 注意：这只能捕获全局同步错误，不能捕获 Promise 异常
  const errorInfo = {
    type: 'error',
    message: event.error?.message,
    stack: event.error?.stack,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    time: new Date().toISOString()
  };

  console.error('捕获未处理的同步错误：', errorInfo);
  // reportErrorToServer(errorInfo);
});
```

**关键作用**：

- 实时捕获所有未被 catch 或 try/catch 处理的 Promise 拒绝。
- 定位具体请求 URL、HTTP 状态码和错误堆栈。
- 未处理的 Promise 拒绝不会导致页面崩溃，但会输出到控制台，长期积累可能影响用户体验和监控噪音。

### 2. 封装请求工具，规范异常处理

对请求库进行二次封装，引导开发者处理异常（JavaScript 无法强制处理）。

**示例：规范 axios 封装**

```javascript
import axios from 'axios';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
});

// 响应拦截器：统一处理 HTTP 错误状态
request.interceptors.response.use(
  (response) => {
    // 对于 2xx 范围的状态码，直接返回数据
    return response;
  },
  (error) => {
    // 处理网络错误或超时
    if (!error.response) {
      console.error('网络错误或请求超时:', error.config?.url);
      error.isNetworkError = true;
    }
    // 处理 HTTP 错误状态
    else {
      const { status, config } = error.response;
      console.error(`请求失败 [${status}]: ${config.url}`);

      // 可在此添加特定状态码的处理逻辑
      if (status === 401) {
        // 处理未授权
      }
      if (status === 403) {
        // 处理禁止访问
      }
    }

    // 重要：始终将错误抛出，由调用方决定如何处理
    return Promise.reject(error);
  }
);

// 提供两种使用模式：显式错误处理和自动全局处理
export const api = {
  // 推荐：显式错误处理模式（调用方必须处理错误）
  get: (url, config) => request.get(url, config),
  post: (url, data, config) => request.post(url, data, config),
  // ...

  // 可选：自动全局处理模式（静默处理错误，仅用于特定场景）
  silentGet: async (url, config) => {
    try {
      return await request.get(url, config);
    } catch (error) {
      // 静默处理，不抛出错误
      console.warn(`静默处理请求错误: ${url}`);
      return null;
    }
  }
};
```

**使用示例**：

```javascript
// 推荐方式：显式处理错误
async function fetchData() {
  try {
    const response = await api.get('/data');
    return response.data;
  } catch (error) {
    // 在这里处理错误
    if (error.isNetworkError) {
      showToast('网络连接异常');
    } else {
      showToast(`请求失败: ${error.response?.status}`);
    }
    throw error; // 根据需要决定是否继续
  }
}

// 不推荐：忽略错误处理（ESLint 会报错）
async function badExample() {
  const response = await api.get('/data'); // ESLint 会标记此行
  return response.data;
}
```

## 三、测试阶段：主动模拟异常场景

### 1. 单元测试（Jest + Mock）

验证异步函数是否正确处理异常。

**正确示例**：

```javascript
// 正确处理异常的函数
async function fetchUser() {
  try {
    const res = await fetch('/api/user');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error; // 或返回默认值
  }
}

// 测试用例：验证当请求失败时，函数能正确处理异常
test('fetchUser 处理 HTTP 错误', async () => {
  // Mock fetch 返回 500 响应
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Server error' })
    })
  );

  // 验证函数是否抛出预期的错误
  await expect(fetchUser()).rejects.toThrow('HTTP error!');

  // 验证是否记录了错误日志
  console.error = jest.fn();
  try {
    await fetchUser();
  } catch (e) {
    expect(console.error).toHaveBeenCalledWith('Fetch failed:', expect.any(Error));
  }
});
```

### 2. E2E 测试（Cypress）

**示例**：

```javascript
it('当接口返回错误时，应正常处理不崩溃', () => {
  // 捕获未处理的 Promise 拒绝
  let unhandledRejection = null;
  cy.window().then((win) => {
    win.addEventListener('unhandledrejection', (event) => {
      unhandledRejection = event;
    });
  });

  // 拦截接口，强制返回 500 错误
  cy.intercept('GET', '/api/data', {
    statusCode: 500,
    body: { error: '服务器错误' }
  }).as('fetchData');

  cy.visit('/page');
  cy.wait('@fetchData');

  // 检查页面是否仍正常渲染
  cy.get('.page-container').should('exist');

  // 验证没有未处理的 Promise 拒绝
  cy.wrap(null).then(() => {
    expect(unhandledRejection).to.be.null;
  });
});
```

**重要修正**：`cy.on('window:error', ...)` 只能捕获同步错误，无法捕获 Promise 的 unhandledrejection。需监听 unhandledrejection 事件。

## 四、总结：方案组合建议

### 1. 开发阶段

- **ESLint**：严格配置，使用 `eslint-plugin-promise` 和 `eslint-plugin-sonarjs` 强制检查 Promise 错误处理。
- **请求库规范封装**：对 fetch/axios 进行封装，明确区分 HTTP 错误和网络错误。
- **IDE 实时提示**：确保开发者在编码时发现潜在问题。

### 2. 测试阶段

- **单元测试**：针对异步函数编写测试用例，模拟网络错误和 HTTP 错误。
- **E2E 测试**：验证页面在接口异常时的健壮性，确保没有未处理的异常。

### 3. 生产/预发阶段

- **全局异常监听**：通过 unhandledrejection 事件捕获漏网之鱼。
- **错误上报系统**：集成 Sentry/Bugsnag 等工具，监控生产环境异常。
- **定期审计**：分析错误日志，持续优化异常处理逻辑。

## 重要注意事项

- **fetch API 特性**：HTTP 4xx/5xx 不会触发 Promise reject，必须手动检查 `response.ok`。
- **未处理 Promise 拒绝**：不会导致页面崩溃，但会输出到控制台，长期积累会影响用户体验。
- **无法真正强制**：JavaScript 无法强制开发者处理异常，只能通过工具和规范引导。
- **错误处理策略**：根据业务场景选择合适策略（静默处理、用户提示、全局错误页等）。

通过上述组合方案，可系统减少异步请求异常未处理问题，提升应用健壮性和用户体验。
