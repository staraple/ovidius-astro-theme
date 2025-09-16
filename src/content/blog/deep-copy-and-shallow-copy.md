---
title: JavaScript 中的浅拷贝与深拷贝
excerpt: 在 JavaScript 中，对象和数组是引用类型，直接赋值时拷贝的是引用而非值本身，修改拷贝对象会影响原对象。为了解决这个问题，引入了浅拷贝（Shallow Copy）和深拷贝（Deep Copy）的概念。浅拷贝只复制顶层属性，而深拷贝递归复制所有层级。本文将详细解释浅拷贝和深拷贝的定义、适用场景、优缺点及最佳实践。
publishDate: 'May 12 2022'
featureImage:
  src: '/post-18.webp'
  alt: Net
seo:
  image:
    src: '/post-18.jpg'
---

## 引言

在 JavaScript 中，对象和数组是引用类型，直接赋值时拷贝的是引用而非值本身，修改拷贝对象会影响原对象。为了解决这个问题，引入了浅拷贝（Shallow Copy）和深拷贝（Deep Copy）的概念。浅拷贝只复制顶层属性，而深拷贝递归复制所有层级。本文将详细解释浅拷贝和深拷贝的定义、适用场景、优缺点及最佳实践。理解这些概念有助于编写更可靠的代码，避免意外的副作用。

---

## 什么是浅拷贝？

### 定义

浅拷贝是指创建一个新对象，该对象与原对象具有相同的顶层属性值。对于原始类型（如数字、字符串），值被直接复制；对于引用类型（如对象、数组），则复制引用地址。这意味着嵌套的对象或数组在拷贝后仍指向同一内存位置。

**示例**：

```javascript
const original = { a: 1, b: { c: 2 } };
const shallowCopy = { ...original };
shallowCopy.b.c = 3;
console.log(original.b.c); // 输出 3（原对象被修改）
```

### 适用场景

- **简单对象拷贝**：当对象没有嵌套结构，或嵌套部分不需要修改时，例如配置对象或浅层数据传输。
- **性能敏感场景**：如在 React 中拷贝 props 或 state 的顶层属性，避免不必要的深层遍历。
- **数组浅拷贝**：如使用 `slice()` 或 `concat()` 复制数组元素，而元素本身是原始值。

### 优点

- 性能高：只需遍历顶层属性，时间复杂度为 O(n)，n 为顶层属性数。
- 简单实现：内置方法如 `Object.assign()` 或扩展运算符 `{ ...obj }` 即可实现。
- 内存高效：不复制嵌套对象，节省空间。

### 缺点

- 无法处理嵌套结构：修改拷贝的嵌套属性会影响原对象。
- 不适合复杂数据：如多层 JSON 对象或树形结构。

### 最佳实践

- **使用内置方法**：优先使用扩展运算符 `{ ...obj }` 或 `Object.assign({}, obj)`，它们简洁且兼容性好。
- **数组浅拷贝**：使用 `arr.slice()` 或 `[...arr]`。
- **结合 immutable 模式**：在函数式编程中，确保不修改原对象，而是返回新拷贝。
- **避免滥用**：如果数据有嵌套，考虑深拷贝或 immutable 库（如 Immutable.js）。

---

## 什么是深拷贝？

### 定义

深拷贝是指递归复制对象的所有层级属性，创建一个完全独立的副本。拷贝后，修改新对象不会影响原对象，包括嵌套的引用类型。

**示例**：

```javascript
const original = { a: 1, b: { c: 2 } };
const deepCopy = JSON.parse(JSON.stringify(original)); // 简单深拷贝
deepCopy.b.c = 3;
console.log(original.b.c); // 输出 2（原对象未变）
```

### 适用场景

- **复杂数据结构**：如多层嵌套的对象、树形数据或状态管理（Redux 中的 state 拷贝）。
- **数据隔离**：在 API 响应处理、表单数据备份或状态快照中，确保独立修改。
- **避免副作用**：函数中返回修改后的对象，而不影响输入参数。

### 各种常用方案及优缺点

1. **JSON.parse(JSON.stringify(obj))**：

   - **优点**：简单、无需额外代码，支持基本对象和数组。
   - **缺点**：不支持函数、Date、RegExp、undefined、Symbol 和循环引用（会导致错误）。性能较低（序列化开销大）。
   - **适用**：纯数据对象，如 API JSON。

2. **递归手动实现**：

   - **优点**：可自定义处理特殊类型（如 Date）。
   - **缺点**：需处理循环引用（使用 WeakMap），否则栈溢出。代码复杂。
   - **适用**：需要精确控制的场景。

3. **lodash 的 \_.cloneDeep**：

   - **优点**：处理循环引用、特殊类型，生产级可靠。
   - **缺点**：引入第三方库，增加包大小。
   - **适用**：大型项目，使用 lodash 库。

4. **Structured Clone API**（全局函数 `structuredClone`）：

   - **优点**：内置、高效、支持循环引用和特殊类型（如 Map、Set、Date）。
   - **缺点**：不支持函数。浏览器兼容性需检查（现代浏览器支持）。
   - **适用**：Web 应用，避免第三方依赖。

### 现代最佳实践

- **优先 Structured Clone**：在现代环境中，使用 `structuredClone(obj)`（Node.js 17+）或浏览器全局 `structuredClone`。它高效且内置。
- **结合 immutable 库**：如 Immer 或 Immutable.js，实现“写时拷贝”以模拟深拷贝。
- **性能优化**：对于大对象，使用懒拷贝（只拷贝修改部分）。

---

## 实现一个深拷贝

### 简化版本

这是一个基本的递归深拷贝实现，仅处理对象和数组，不支持循环引用和特殊类型。

```javascript
function simpleDeepCopy(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj; // 原始类型直接返回
  }

  const copy = Array.isArray(obj) ? [] : {};

  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      copy[key] = simpleDeepCopy(obj[key]);
    }
  }

  return copy;
}

// 测试
const original = { a: 1, b: { c: 2 } };
const copy = simpleDeepCopy(original);
copy.b.c = 3;
console.log(original.b.c); // 2
```

**局限**：不处理循环引用（如 `obj.self = obj` 会导致无限递归）。

### 生产级版本

这是一个更完整的实现，使用 WeakMap 处理循环引用，并支持常见特殊类型（如 Date、RegExp、Map、Set）。

```javascript
function deepCopy(obj, visited = new WeakMap()) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (visited.has(obj)) {
    return visited.get(obj); // 处理循环引用
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
    return copy;
  } else if (obj instanceof Set) {
    copy = new Set();
    visited.set(obj, copy);
    obj.forEach((value) => {
      copy.add(deepCopy(value, visited));
    });
    return copy;
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

// 测试循环引用
const original = { a: 1 };
original.self = original;
const copy = deepCopy(original);
console.log(copy.self === copy); // true（循环保持）
console.log(copy !== original); // true（独立拷贝）
```

### 未处理的数据类型和场景

这个版本更健壮，适用于日常的使用场景。如果实际需求更复杂，可以按需扩展。以下列举了未覆盖的数据类型或场景：

1. **Symbol 键**：
   - 未处理：`for...in` 忽略 Symbol 键。
   - 解决方法：使用 `Reflect.ownKeys()` 遍历所有键。
2. **不可枚举属性**：
   - 未处理：`for...in` 忽略不可枚举属性。
   - 解决方法：结合 `Object.getOwnPropertyDescriptors` 复制属性描述符。
3. **函数及其属性**：
   - 未处理：函数被直接返回，未复制其附加属性或绑定上下文。
   - 解决方法：检查 `obj instanceof Function` 并复制其属性。
4. **getter/setter 和属性描述符**：
   - 未处理：属性值直接复制，忽略描述符。
   - 解决方法：使用 `Object.getOwnPropertyDescriptors` 和 `Object.defineProperty`。
5. **原型链属性**：
   - 未处理：仅复制自有属性。
   - 解决方法：显式遍历原型链（`Object.getPrototypeOf`），但需谨慎避免内置原型。
6. **特殊内置对象**：
   - 未处理：
     - `ArrayBuffer` 和 `TypedArray`（如 `Int32Array`）
     - `WeakMap` 和 `WeakSet`
     - `Promise`
     - `Error` 和其子类（如 `TypeError`）
     - `Proxy` 和 `Reflect`
     - `Symbol`（注册或非注册）
     - `DataView`
     - 其他宿主对象（如 DOM 节点、Canvas 上下文）
   - 解决方法：为每种类型添加 `instanceof` 检查，特殊处理（如 `new ArrayBuffer`）。

---

## 结论

浅拷贝适合简单、性能敏感的场景，而深拷贝则确保数据完全独立，避免意外修改。现代 JavaScript 通过 Structured Clone 等 API 简化了深拷贝实现。选择方案时，要同时考虑数据复杂度、性能和兼容性。

**参考资源**：

- [MDN: Structured Clone](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone)
- [Lodash: cloneDeep](https://lodash.com/docs/#cloneDeep)
- [ECMAScript 规范（ECMA-262）](https://www.ecma-international.org/ecma-262/5.1/)
