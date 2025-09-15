---
title: JavaScript 中的 WeakMap、Map 和普通对象
excerpt: 在 JavaScript 中，键值对存储是常见需求。普通对象（Plain Objects）、Map 和 WeakMap 是三种主要的实现方式，每种都有独特的设计目标和适用场景。
publishDate: 'May 10 2020'
featureImage:
  src: '/post-15.webp'
  alt: Laptop
seo:
  image:
    src: '/post-15.jpg'
---

## 引言

在 JavaScript 中，键值对存储是常见需求。普通对象（Plain Objects）、`Map` 和 `WeakMap` 是三种主要的实现方式，每种都有独特的设计目标和适用场景。普通对象是最基础的键值存储，`Map` 提供更灵活的键类型和迭代功能，而 `WeakMap` 专为内存管理和私有数据设计。本文将详细介绍它们的定义、使用场景、优缺点、最佳实践，并通过示例代码展示实际应用。内容基于权威来源，如 MDN Web Docs。

---

## 普通对象 (Plain Objects)

### 定义

普通对象是 JavaScript 最基本的键值存储结构，使用 `{}` 字面量或 `new Object()` 创建。键通常是字符串或 Symbol，值可以是任意类型。对象继承自 `Object.prototype`，支持属性枚举和原型链。

### 使用场景

- **简单键值存储**：存储配置或简单数据，如 `{ theme: 'dark', fontSize: 14 }`。
- **实体表示**：表示数据实体，如用户对象 `{ name: 'Alice', age: 30 }`。
- **兼容性优先**：在需要支持旧浏览器或简单脚本时，普通对象是默认选择。

### 示例代码

```javascript
// 存储用户配置
const config = {
  theme: 'dark',
  fontSize: 14
};

// 遍历属性
Object.keys(config).forEach((key) => {
  console.log(`${key}: ${config[key]}`);
});

// 动态添加属性
config.language = 'zh';
console.log(config); // { theme: 'dark', fontSize: 14, language: 'zh' }
```

### 优缺点

**优点**：

- **简单易用**：语法简洁，广泛支持（自 JavaScript 诞生以来）。
- **性能高效**：字符串键访问通常比 `Map` 快，适合小规模数据。
- **内置方法丰富**：支持 `Object.keys()`、`Object.values()`、`Object.entries()`。

**缺点**：

- **键类型限制**：键自动转为字符串（或 Symbol），对象键会变成 `[object Object]`。
- **无插入顺序保证**：早期版本不保证属性顺序（现代引擎已改善）。
- **强引用**：属性值持有强引用，可能导致内存泄漏。
- **原型污染风险**：继承自 `Object.prototype`，可能被意外修改。

### 最佳实践

- **使用字面量**：优先 `{}` 而非 `new Object()`。
- **检查自有属性**：使用 `hasOwnProperty` 避免原型链问题。

  ```javascript
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      console.log(obj[key]);
    }
  }
  ```

- **避免对象键**：需要对象键时，使用 `Map` 或 `WeakMap`.
- **防止原型污染**：使用 `Object.create(null)` 创建无原型对象。

  ```javascript
  const noProtoObj = Object.create(null);
  noProtoObj.key = 'value'; // 无原型干扰
  ```

---

## Map

### 定义

`Map` 是 ES6 引入的键值对集合，支持任意类型作为键，并维护插入顺序。它通过 `new Map()` 创建，提供丰富的 API（如 `set`、`get`、`has`、`delete`）。

### 使用场景

- **任意键类型**：使用对象或函数作为键，例如为 DOM 元素绑定数据。
- **有序数据**：需要按插入顺序迭代的场景，如日志或队列。
- **大型数据集**：处理大量键值对，需快速访问 `size` 或迭代。
- **替代普通对象**：在现代应用中避免普通对象的局限。

### 示例代码

```javascript
// 使用对象作为键
const map = new Map();
const keyObj1 = { id: 1 };
const keyObj2 = { id: 2 };

map.set(keyObj1, 'User A');
map.set(keyObj2, 'User B');
console.log(map.get(keyObj1)); // 'User A'

// 维护插入顺序
map.set('key3', 'Value C');
map.forEach((value, key) => {
  console.log(`${JSON.stringify(key)}: ${value}`);
});

// 获取大小
console.log(map.size); // 3

// 迭代键值对
for (let [key, value] of map.entries()) {
  console.log(`${JSON.stringify(key)}: ${value}`);
}
```

### 优缺点

**优点**：

- **灵活键类型**：支持对象、函数、原始值作为键。
- **插入顺序**：按添加顺序迭代，便于有序处理。
- **丰富 API**：`size`、`set`、`get`、`delete`、`has` 等方法高效。
- **可枚举**：支持 `keys()`、`values()`、`entries()` 迭代。

**缺点**：

- **性能开销**：字符串键场景下可能比普通对象稍慢。
- **强引用**：键和值持有强引用，可能导致内存泄漏。
- **不适合简单场景**：仅字符串键时，普通对象更轻量。

### 最佳实践

- **对象键场景**：优先 `Map` 处理非字符串键。
- **有序迭代**：利用 `map.entries()` 或 `for...of`.

  ```javascript
  const map = new Map([
    ['a', 1],
    ['b', 2]
  ]);
  for (let [key, value] of map) {
    console.log(`${key}: ${value}`);
  }
  ```

- **清理强引用**：手动 `delete` 不需要的键值对。
- **与 WeakMap 权衡**：需要弱引用时转用 `WeakMap`.

---

## WeakMap

### 定义

`WeakMap` 是 ES6 引入的弱引用键值对集合，键必须是对象（或非注册 Symbol），值可以是任意类型。键为弱引用，允许垃圾回收。

### 使用场景

- **内存管理**：在 DOM 元素上存储元数据，元素回收时自动清理。
- **私有数据**：实现类的私有成员，防止外部访问。
- **临时缓存**：键对象生命周期短时，避免内存泄漏.
- **深拷贝循环引用**：如深拷贝实现，使用 `WeakMap` 记录已拷贝对象。

### 示例代码

```javascript
// 私有数据存储
const privateData = new WeakMap();

class User {
  constructor(name) {
    privateData.set(this, { name });
  }

  getName() {
    return privateData.get(this).name;
  }
}

const user = new User('Alice');
console.log(user.getName()); // 'Alice'
console.log(privateData.get(user)); // { name: 'Alice' }

// DOM 元数据
const metaData = new WeakMap();
const button = document.createElement('button');
metaData.set(button, { clicks: 0 });
button.addEventListener('click', () => {
  metaData.set(button, { clicks: metaData.get(button).clicks + 1 });
  console.log(metaData.get(button).clicks);
});
```

### 优缺点

**优点**：

- **弱引用**：键不阻止垃圾回收，适合内存敏感场景。
- **自动清理**：键回收后值也成为回收候选。
- **安全性**：不可枚举，保护私有数据。

**缺点**：

- **键限制**：仅支持对象或非注册 Symbol。
- **不可枚举**：无 `keys()`、`values()`、`entries()`。
- **调试困难**：弱引用导致内容难以检查。

### 最佳实践

- **弱引用场景**：仅在需要垃圾回收时使用。
- **私有成员**：用 `WeakMap` 存储类实例数据。

  ```javascript
  const privateData = new WeakMap();
  class Example {
    constructor() {
      privateData.set(this, { secret: 'hidden' });
    }
  }
  ```

- **DOM 元数据**：绑定临时数据到 DOM 元素。
- **深拷贝**：使用 `WeakMap` 处理循环引用。

---

## 总结比较

| 特性         | 普通对象                   | Map                  | WeakMap             |
| ------------ | -------------------------- | -------------------- | ------------------- |
| **键类型**   | 字符串、Symbol             | 任意类型             | 对象、非注册 Symbol |
| **引用类型** | 强引用                     | 强引用               | 弱引用              |
| **插入顺序** | 无明确保证（现代引擎支持） | 维护插入顺序         | 无序（不可枚举）    |
| **枚举性**   | 可枚举（Object.keys 等）   | 可枚举（entries 等） | 不可枚举            |
| **性能**     | 字符串键最优               | 稍慢但灵活           | 类似 Map            |
| **内存管理** | 可能泄漏                   | 可能泄漏             | 自动清理            |

**选择建议**：

- **普通对象**：适合简单字符串键、性能敏感场景。
- **Map**：需要对象键、有序迭代或丰富 API 时。
- **WeakMap**：内存管理、私有数据或循环引用场景。

**整体最佳实践**：

- 测试性能：在大型数据集上比较 `Map` 和对象。
- 内存监控：长期运行程序中使用 `WeakMap` 避免泄漏。
- 结合 TypeScript：定义类型以确保键值一致性。

**参考资源**：

- [MDN Web Docs: Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)
- [MDN Web Docs: Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
- [MDN Web Docs: WeakMap](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)
- [ECMAScript 规范 (ECMA-262)](https://tc39.es/ecma262/)
