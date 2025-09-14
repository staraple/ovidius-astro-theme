---
title: JavaScript 中的纯对象：Object.create(null) 的用法和优势
excerpt: 在 JavaScript 中，Object.create(null) 创建了一个*纯对象*——一个不继承自 Object.prototype 的对象。与使用 {} 创建的标准对象不同，纯对象缺少继承的属性或方法（例如 toString、hasOwnProperty）。这种特性使它们在需要可预测、隔离或高性能键值存储的特定场景中非常有价值。
publishDate: 'Aug 10 2021'
featureImage:
  src: '/post-4.webp'
  alt: Blue stripes
seo:
  image:
    src: '/post-4.jpg'
---

在 JavaScript 中，Object.create(null) 创建的对象是一个*纯对象*(pure object)——一个不继承自 Object.prototype 的对象。与使用对象字面量(object literal)创建的标准对象不同，纯对象缺少继承的属性或方法（例如 toString、hasOwnProperty）。这种特性使它们在需要可预测、隔离或高性能键值存储的特定场景中非常有价值。本文探讨了纯对象的使用场景、优势和局限性。

## 1. 作为纯字典的键值存储

标准 JavaScript 对象（{}）会从 Object.prototype 继承方法，这在使用它们作为键值存储时可能导致键名冲突：

```jsx
// 标准对象继承原型方法
const standardObj = {};
console.log(standardObj.toString); // [Function: toString]

// 覆盖原型方法的风险
standardObj.toString = 'hello';
console.log(standardObj.toString); // "hello"（覆盖了原型方法）
```

相反，使用 Object.create(null) 创建的纯对象没有继承属性，使其成为“干净”的字典：

```jsx
// 纯对象没有继承属性
const pureObj = Object.create(null);
console.log(pureObj.toString); // undefined

// 可以安全使用任何键，而无冲突
pureObj.toString = 'hello';
console.log(pureObj.toString); // "hello"
```

**使用场景**：纯对象适用于需要动态键名的场景，例如缓存、配置映射或解析 JSON 数据，在这些场景中，避免与原型属性的冲突至关重要。

## 2. 缓解原型污染风险

[原型污染](https://portswigger.net/web-security/prototype-pollution)是一种安全漏洞，通过恶意操作，修改 JavaScript 对象的原型（通常是 Object.prototype），从而导致所有对象都会继承这些被修改/新增的属性。

```jsx
// 易受攻击：标准对象允许原型污染
const userInput = { __proto__: { evil: 'hack' } };
const standardObj = {};
Object.assign(standardObj, userInput);
console.log({}.evil); // "hack"（Object.prototype 被污染）
```

纯对象不受此问题影响，因为它们缺少原型链：

```jsx
// 安全：纯对象防止原型污染
const pureObj = Object.create(null);
Object.assign(pureObj, userInput);
console.log({}.evil); // undefined（Object.prototype 未受影响）
```

**使用场景**：纯对象适用于处理不可信用户输入或解析外部数据。

## 3. 使用 for...in 简化迭代

在使用 for...in 迭代标准对象的属性时，可能会出现从 Object.prototype 继承的属性，需要使用 hasOwnProperty 检查：

```jsx
// 标准对象需要 hasOwnProperty 检查
const standardObj = { a: 1, b: 2 };
for (const key in standardObj) {
  if (standardObj.hasOwnProperty(key)) {
    console.log(key); // 输出: "a", "b"
  }
}
```

纯对象消除了这一问题，因为它们只包含自己的属性：

```jsx
// 纯对象简化迭代
const pureObj = Object.create(null);
pureObj.a = 1;
pureObj.b = 2;
for (const key in pureObj) {
  console.log(key); // 输出: "a", "b"
}
```

**使用场景**：纯对象在数据处理或序列化等场景中简化迭代，其中只需考虑自身属性。

## 4. 特定场景下的性能优化

标准对象需要维护原型链的开销，JavaScript 引擎（例如 V8）通过*隐藏类* 等机制处理。纯对象缺少原型，因此允许引擎优化内存使用和属性访问：

- **减少查找开销**：无原型链遍历。
- **更低的内存占用**：无需跟踪继承属性。
- **更快的初始化**：在某些情况下对象创建更简单。

虽然现代引擎已将这些差异最小化，但纯对象在高频操作中仍可提供边际性能优势，例如在性能关键循环中创建临时字典。

**使用场景**：在创建大量短生命周期对象的库或应用程序中（例如数据转换管道），可能受益于纯对象。

## 5. 无干扰的自定义行为

纯对象允许开发者定义自定义方法，而无需担心与 Object.prototype 的冲突：

```jsx
// 定义自定义行为而无冲突
const pureObj = Object.create(null);
pureObj.toString = function () {
  return '自定义字符串表示';
};
console.log(pureObj.toString()); // "自定义字符串表示"
```

**使用场景**：纯对象在框架或库中非常有用，其中对象需要完全受控的行为，例如自定义数据结构或领域特定模型。

## 6. 与 Map 的比较

虽然纯对象可以作为干净的键值存储，但在复杂使用场景下，ES6 的 Map 提供了更强大的功能。例如，Map 允许使用任意类型的键，而纯对象仅限于字符串键。此外，Map 提供了内置方法，如 size、has 和 forEach，而纯对象需要手动实现这些功能。

- Map **的优势**：
  - 支持非字符串键（例如对象、符号）。
  - 提供内置方法，如 size、has 和 forEach。
  - 保证迭代顺序。
- **何时使用纯对象**：
  - 更简单的 API 用于基本键值存储。
  - 与遗留代码或 JSON 序列化的更好兼容性。
  - 小型数据集的更低内存开销。

**使用场景**：当 Map 过度时或需要 JSON 兼容性时，使用纯对象。

## 纯对象的局限性

- **无内置方法**：纯对象缺少 Object.prototype 方法（toString、hasOwnProperty 等），需要手动实现或使用 Object 静态方法（例如 Object.keys(pureObj)）。
- **控制台显示**：缺少 toString，不同环境的控制台输出可能不同（例如某些浏览器中，纯对象显示为 [object NullPrototype]）。

## 结论

Object.create(null) 创建的纯对象适用于需要干净、可预测键值存储的场景。它们在避免原型污染、简化迭代以及启用无干扰自定义行为方面表现出色。虽然 Map 可能更适合高级使用场景，但纯对象仍是特定应用（如缓存、配置管理或处理不可信数据）的轻量级、安全且高效选择。
