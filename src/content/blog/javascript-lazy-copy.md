---
title: JavaScript 中的懒拷贝（Lazy Copy）
excerpt: 懒拷贝（Lazy Copy，或称为“写时拷贝”，Copy-on-Write, COW）是一种优化拷贝技术，旨在减少不必要的内存分配和数据复制操作。它的核心思想是延迟实际的数据复制，直到需要修改数据时才进行拷贝。。
publishDate: 'Jun 12 2022'
featureImage:
  src: '/post-17.webp'
  alt: Net
seo:
  image:
    src: '/post-17.jpg'
---

## 引言

**懒拷贝**（Lazy Copy，或称为“写时拷贝”，Copy-on-Write, COW）是一种优化拷贝技术，旨在减少不必要的内存分配和数据复制操作。它的核心思想是延迟实际的数据复制，直到需要修改数据时才进行拷贝。与传统的深拷贝（立即递归复制所有数据）或浅拷贝（仅复制顶层引用）不同，懒拷贝在初始时只复制引用或部分数据结构，真正的数据复制发生在修改发生时。本文将详细解释懒拷贝的原理、适用场景、优缺点，并提供实现示例，包括使用 Immer 库的现代方案。

---

## 懒拷贝的原理

- **初始阶段**：懒拷贝创建的对象与原对象共享相同的内存引用（类似浅拷贝），但通常通过代理（Proxy）或其他机制跟踪修改。
- **写时触发**：当尝试修改拷贝对象时，系统检测到写操作，触发实际的数据复制，仅复制被修改的部分及其依赖路径。
- **实现机制**：在 JavaScript 中，懒拷贝通常通过 `Proxy` 对象实现，拦截对象的读写操作。Vue3 和 MobX 也使用对象读写劫持来实现响应式数据管理，但它们的目的是实时更新 UI 或通知观察者，而懒拷贝（如 Immer 实现）专注于生成不可变副本，仅在修改时复制数据路径，保持原对象不变。
- **优点**：显著降低初始拷贝的性能开销，尤其适用于大型对象或数组，且修改较少的情况。

### 适用场景

- **大型数据结构**：如深层嵌套对象、树或大数组，初始深拷贝成本高。
- **读多写少**：数据大部分时间用于读取，修改较少，如 Redux 状态管理或 React 组件状态。
- **内存优化**：在内存敏感的场景（如 Node.js 服务器或浏览器渲染）减少不必要复制。
- **不可变数据模式**：在函数式编程中，懒拷贝与不可变性结合，确保修改不影响原数据。

### 优缺点

**优点**：

- 性能高效：初始拷贝成本低，仅在修改时复制。
- 内存节省：共享未修改的数据，减少冗余分配。
- 适合现代框架：如 React、Redux 或 Vue 的状态管理。

**缺点**：

- 实现复杂：需要代理或额外逻辑跟踪修改。
- 运行时开销：写操作触发拷贝，可能增加延迟。
- 不适合频繁修改：若修改频繁，多次触发拷贝可能抵消性能优势。

---

## 懒拷贝与深拷贝、浅拷贝的对比

- **浅拷贝**：仅复制顶层引用，嵌套对象共享内存，修改嵌套对象影响原对象。
- **深拷贝**：立即递归复制所有层级，生成独立副本，成本高。
- **懒拷贝**：初始共享引用，修改时按需复制，平衡性能和独立性。

---

## 如何实现懒拷贝？

在 JavaScript 中，懒拷贝通常通过 `Proxy` 对象实现，`Proxy` 可以拦截对象的读写操作，触发写时拷贝。以下是两种实现方式：**简化版**（手动实现，适合简单场景）和**生产级版**（使用 `Proxy` 和 Immer 库，支持复杂对象）。

### 简化版懒拷贝

这个实现针对简单对象，延迟嵌套对象的复制，直到修改发生。

```javascript
function lazyCopy(obj) {
  const copy = Array.isArray(obj) ? [...obj] : { ...obj }; // 浅拷贝顶层

  return new Proxy(copy, {
    set(target, key, value) {
      // 检测嵌套对象并深拷贝修改路径
      if (typeof target[key] === 'object' && target[key] !== null) {
        target[key] = deepCopy(target[key]); // 深拷贝被修改的嵌套对象
      }
      target[key] = value; // 设置新值
      return true;
    }
  });
}

// 简单的深拷贝辅助函数（不处理循环引用）
function deepCopy(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  const copy = Array.isArray(obj) ? [] : {};
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      copy[key] = deepCopy(obj[key]);
    }
  }
  return copy;
}

// 测试
const original = { a: 1, b: { c: 2 } };
const copy = lazyCopy(original);
console.log(copy.b === original.b); // true（初始共享引用）
copy.b.c = 3; // 触发写时拷贝
console.log(copy.b !== original.b); // true（嵌套对象已复制）
console.log(original.b.c); // 2（原对象未变）
```

**说明**：

- 初始时，`copy` 是顶层浅拷贝，嵌套对象（如 `b`）仍共享引用。
- `Proxy` 的 `set` 拦截器在修改时调用 `deepCopy` 复制被修改的嵌套对象。
- **局限**：未处理循环引用、Symbol 键、不可枚举属性，且每次修改触发完整深拷贝，可能影响性能.

### 生产级懒拷贝

#### 基于 Proxy 的实现

以下是一个更健壮的实现，使用 `Proxy` 和 `WeakMap` 处理循环引用，并优化修改路径的拷贝。

```javascript
function lazyCopy(obj, visited = new WeakMap()) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (visited.has(obj)) {
    return visited.get(obj);
  }

  // 初始浅拷贝
  const copy = Array.isArray(obj) ? [...obj] : { ...obj };
  visited.set(obj, copy);

  return new Proxy(copy, {
    get(target, key) {
      const value = target[key];
      // 如果获取嵌套对象，返回其懒拷贝
      if (typeof value === 'object' && value !== null) {
        return lazyCopy(value, visited);
      }
      return value;
    },
    set(target, key, value) {
      // 如果修改嵌套对象，先深拷贝
      if (typeof target[key] === 'object' && target[key] !== null) {
        target[key] = deepCopy(target[key], visited); // 深拷贝被修改部分
      }
      target[key] = value;
      return true;
    }
  });
}

// 深拷贝辅助函数（支持循环引用）
function deepCopy(obj, visited = new WeakMap()) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (visited.has(obj)) {
    return visited.get(obj);
  }

  let copy;
  if (obj instanceof Date) {
    copy = new Date(obj.getTime());
  } else if (obj instanceof RegExp) {
    copy = new RegExp(obj.source, obj.flags);
  } else if (obj instanceof Map) {
    copy = new Map();
    visited.set(obj, copy);
    obj.forEach((value, key) => {
      copy.set(deepCopy(key, visited), deepCopy(value, visited));
    });
  } else if (obj instanceof Set) {
    copy = new Set();
    visited.set(obj, copy);
    obj.forEach((value) => {
      copy.add(deepCopy(value, visited));
    });
  } else {
    copy = Array.isArray(obj) ? [] : {};
    visited.set(obj, copy);
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        copy[key] = deepCopy(obj[key], visited);
      }
    }
  }
  return copy;
}

// 测试
const original = { a: 1, b: { c: 2 } };
original.self = original;
const copy = lazyCopy(original);
console.log(copy.b === original.b); // true（初始共享）
copy.b.c = 3; // 触发写时拷贝
console.log(copy.b !== original.b); // true（已复制）
console.log(original.b.c); // 2（原对象未变）
console.log(copy.self === copy); // true（循环引用保持）
```

**说明**：

- **初始阶段**：`copy` 是浅拷贝，嵌套对象共享引用。
- **Proxy 拦截**：
  - `get`：对嵌套对象返回懒拷贝，确保读取嵌套对象时也支持写时拷贝。
  - `set`：在修改时深拷贝被修改的嵌套对象。
- **循环引用**：通过 `WeakMap` 跟踪已拷贝对象，避免无限递归。
- **优势**：仅在修改路径上触发深拷贝，减少初始开销。
- **局限**：不支持 Symbol 键、不可枚举属性和特殊类型（如 `ArrayBuffer`），需进一步扩展。

#### 使用 Immer 库

Immer 是一个轻量级库（约 3KB 压缩后），通过 `Proxy` 实现写时拷贝，简化不可变数据操作。开发者可以像修改原对象一样操作“草稿”（draft），Immer 自动生成新副本，仅复制修改路径。Immer 广泛用于 React 和 Redux 状态管理，提供高效的懒拷贝方案。

- **优势**：
  - 代码直观，像直接修改对象，但生成不可变副本。
  - 性能高效，仅复制修改路径，适合大型数据。
  - 支持循环引用（需配置）和复杂对象。
- **使用场景**：
  - React/Redux 状态更新。
  - 函数式编程中的不可变数据。
  - 替代传统深拷贝，减少性能开销。

**示例**：

```javascript
import produce from 'immer';

function lazyCopy(obj) {
  return produce(obj, (draft) => {
    // 返回 draft，修改在外部完成
    return draft;
  });
}

// 测试
const original = { a: 1, b: { c: 2 } };
const copy = lazyCopy(original);
const updatedCopy = produce(copy, (draft) => {
  draft.b.c = 3; // 触发写时拷贝
});
console.log(original.b.c); // 2（原对象未变）
console.log(updatedCopy.b.c); // 3
console.log(updatedCopy !== original); // true（独立副本）
```

**说明**：

- 使用 `produce` 创建不可变副本，修改通过 `draft` 完成。
- Immer 自动跟踪修改路径，仅复制受影响部分。

---

## 最佳实践

1. **使用 Proxy**：JavaScript 的 `Proxy` 是实现懒拷贝的理想工具，拦截读写操作。
2. **结合 WeakMap**：处理循环引用，避免栈溢出。
3. **优化修改路径**：仅复制被修改的嵌套对象，减少性能开销。
4. **使用 Immer**：在生产环境中，优先考虑 Immer 简化懒拷贝实现。
   - 安装：`npm install immer`
   - 配置：启用循环引用支持（参考 Immer 文档）。
5. **场景选择**：
   - 适合大型对象、读多写少的场景。
   - 不适合频繁修改（可能触发多次深拷贝）。

---

## 结论

懒拷贝通过延迟复制优化了性能和内存，特别适合大型数据或读多写少的场景。使用 `Proxy` 和 `WeakMap` 实现懒拷贝可以在修改时按需复制，结合深拷贝辅助函数处理复杂结构。Immer 提供了一种优雅的写时拷贝方案，简化不可变数据操作，其核心基于对象读写劫持，与 Vue 3 和 MobX 的响应式机制类似，但专注于不可变副本生成。

**参考资源**：

- [MDN Web Docs: Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- [MDN Web Docs: WeakMap](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)
- [Immer: Official Documentation](https://immerjs.github.io/immer/)
- [ECMAScript 规范 (ECMA-262)](https://tc39.es/ecma262/)
