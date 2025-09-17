---
title: null 与 undefined 的区别
excerpt: 很多开发者在使用 JavaScript 时，会混淆 null 和 undefined，当要表示“没有值”时就随机用使用一个。今天，我们将深入探讨它们在语法、语义和运行时行为上的不同之处，帮助你彻底厘清这两者的区别。。
publishDate: 'March 16 2018'
featureImage:
  src: '/post-5.webp'
  alt: Stairs
seo:
  image:
    src: '/post-5.jpg'
---

很多开发者在使用 JavaScript 时，会混淆`null` 和 `undefined`，当要表示“没有值”时可能随机选用一个。今天，我们将深入探讨它们在**语法**、**语义**和**运行时行为**上的不同之处，帮助你彻底厘清这两者的区别。

## 语法（Syntax）

`null` 是一个关键字，表示显式的空值（明确指定没有值）；`undefined` 是一个全局属性，表示值的隐式缺失（尚未定义或未知）。它们都是基本数据类型，但在使用场景和运行时行为上有显著区别。

---

## 语义（Semantics）

在编程语言中，每一个设计元素的存在都有其理由。 `null` 和 `undefined` 也是如此，所以需要深入考虑它们的设计初衷和使用场景。

从语义上我们可以这样理解：

- **undefined**：表示值的**隐式缺失**，即“不知道值是什么”或“值尚未定义”。
- **null**：表示值的**显式缺失**，即“明确知道这里没有值”。

网上有一个例子来解释两者的区别：

> **问题**：我的钥匙在柜台上吗？
>
> - **undefined**：我不知道，我没去看。
> - **null**：我检查过了，柜台上没有钥匙。

### 程序中的语义

从程序的角度来看：

- **undefined**：表示内存中已经分配了一个空间，但这个空间还没有被赋值（比如接口还没返回数据）。
- **null**：表示内存中有一个明确的指针，但这个指针指向一个无效的或空的内存地址，表示“这里故意没有值”（比如接口返回了空响应）。

这种语义上的区别在代码逻辑中非常重要，能帮助开发者更清晰地表达程序的状态。

---

## 运行时行为（Runtime）

在运行时，`null` 和 `undefined` 的行为也有显著差异，这些差异进一步印证了它们的语义区别。

### 类型差异

```javascript
console.log(typeof undefined); // 'undefined'
console.log(typeof null); // 'object'，这是一个历史遗留问题
```

### 相等性比较

由于 `null` 和 `undefined` 的类型不同，它们的相等性比较行为也不同：

- **严格相等（`===`）**：`null === undefined` 返回 `false`，因为它们是不同类型的值（null 属于 Null 类型，undefined 属于 Undefined 类型）。
- **宽松相等（`==`）**：`null == undefined` 返回 `true`，ECMAScript 规范对两者的相等性进行了特殊处理，使其返回 `true`。

```javascript
console.log(null === undefined); // false
console.log(null == undefined); // true
```

### 运行时行为差异

在实际代码中，`null` 和 `undefined` 的行为差异会影响逻辑处理。例如：

```javascript
const user = {
  name: undefined, // 表示用户名尚未初始化
  email: null // 表示邮箱已检查但为空
};

// 属性访问
console.log(user.name); // undefined（属性存在但未定义）
console.log(user.email); // null（属性存在，值为空）
console.log(user.address); // undefined（属性不存在）

// JSON 序列化
console.log(JSON.stringify(user)); // {"email":null}（undefined 属性被忽略）

// 逻辑处理
if (user.name === undefined) {
  console.log('用户名尚未定义，可能需要加载');
}
if (user.email === null) {
  console.log('邮箱明确为空，用户未提供');
}
```

在上述例子中，`name: undefined` 表示用户未填写姓名（隐式缺失），而 `email: null` 表示用户明确选择了“无邮箱”选项（显式空值）。这种区别在表单数据处理和 API 提交时尤为重要。
注意：通过ajax提交JSON数据时，会进行序列化，所以`undefined`属性会被忽略，而`null`属性会被保留。

---

## 为什么会有误解？

很多人认为 `null` 和 `undefined` 是“一样的”，主要是因为：

- **值缺失的相似性**：在很多场景中，我们只关心值是否缺失，而不关心缺失的原因（隐式还是显式）。
- **宽松相等的迷惑**：`null == undefined` 返回 `true`，让人误以为它们可以互换使用。

然而，通过理解它们的语义和运行时行为，可以清楚地看到它们是完全不同的概念。

---

## 总结

`null` 和 `undefined` 在 JavaScript 中有着不同的用途：

- **语法**：`null` 是一个关键字，`undefined` 是一个全局属性。
- **语义**：`undefined` 表示值的隐式缺失（“不知道”），`null` 表示值的显式缺失（“确认没有”）。
- **运行时**：`undefined` 是字面量类型，`null` 是对象；它们在相等性比较和对象序列化中表现不同。
