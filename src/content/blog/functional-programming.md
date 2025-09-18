---
title: 函数式编程思想：输入/输出模式与高阶函数
excerpt: 函数式编程（Functional Programming, FP）起源于20世纪50年代的数学与计算机科学领域，受到λ演算（Lambda Calculus）等理论的启发。它强调函数的纯净性、不可变性和声明式编程，通过将计算视为数学函数的求值来构建健壮、可预测的软件系统。随着Haskell、Lisp等语言的兴起，函数式编程逐渐在学术界和工业界崭露头角。近年来，随着JavaScript的广泛应用，函数式编程的思想被引入前端开发，深刻影响了JavaScript编程范式。
publishDate: 'Oct 25 2017'
featureImage:
  src: '/post-20.webp'
  alt: laptop
seo:
  image:
    src: '/post-20.jpg'
---

## 引言

函数式编程（Functional Programming, FP）起源于20世纪50年代的数学与计算机科学领域，受到λ演算（Lambda Calculus）等理论的启发。它强调函数的纯净性、不可变性和声明式编程，通过将计算视为数学函数的求值来构建健壮、可预测的软件系统。随着Haskell、Lisp等语言的兴起，函数式编程逐渐在学术界和工业界崭露头角。近年来，随着JavaScript的广泛应用，函数式编程的思想被引入前端开发，深刻影响了JavaScript编程范式。例如，JavaScript的数组方法（如map、reduce）和现代框架（如React）的函数式组件设计都体现了FP的理念，极大地提高了代码的可读性和可维护性。

本文介绍两种核心的函数式编程模式：输入/输出模式和高阶函数，并探讨如何在实际编程中应用它们。

---

## 输入/输出模式

### 核心思想

函数式编程的一个基本原则是将函数视为输入到输出的转换过程。每个函数接受参数（输入）并返回一个值（输出）。通过在设计函数时明确回答以下两个问题，可以帮助我们更好地定义函数的职责：

1. **函数的输入是什么？**（接受哪些参数？）
2. **函数的输出是什么？**（返回什么数据？）

这种方法将技术细节暂时搁置，专注于函数的核心功能——输入到输出的转换。明确输入和输出不仅能为函数设定清晰的职责边界，还能避免在开发过程中让函数变得过于复杂，从而遵循**单一职责原则**（Single Responsibility Principle）和**KISS原则**（Keep It Simple, Stupid）。

### 实践中的输入/输出模式

以一个表单字段验证函数为例，我们可以先回答输入和输出的问题：

- **输入**：一个字段（Field）。
- **输出**：验证结果（布尔值，boolean）。

根据这些答案，我们可以定义函数的调用签名：

```typescript
function validate(field: Field): boolean;
```

即便我们暂时不清楚`Field`的具体类型，这个签名已经清晰地界定了函数的行为：无论验证逻辑多么复杂，最终结果必须是一个布尔值。这种约束确保了函数逻辑的简单性和专注性。

你可以进一步使用抽象类型来描述输入和输出。例如，一个函数可能接受“一个苹果列表”并返回“一只快乐的狐狸”。这种抽象进一步将函数签名与具体实现分离，增强了设计的灵活性。

### 在规模化开发中的应用

在复杂系统中，一个操作往往由多个函数组成。通过将复杂操作分解为一系列较小的函数，并确保每个函数遵循输入/输出模式，可以让设计更清晰。例如，假设我们需要实现一个操作，接受用户ID并返回其所有帖子的点赞总数。我们可以将操作分解为以下步骤：

1. 获取用户 → 获取用户的帖子 → 计算帖子点赞总数。

每个步骤对应一个函数，并应用输入/输出模式设计其调用签名，同时考虑函数组合的原则：**一个函数的输出可以作为另一个函数的输入**。代码如下：

```typescript
const getUser = (id: string) => User;
const getPosts = (user: User) => Post[];
const getTotalLikes = (posts: Post[]) => number;
```

这种高层次的函数链设计让你能够清晰地追踪数据流，快速发现逻辑中的潜在问题，同时保持代码的简洁和可维护性。

### 输入/输出模式的额外优势

通过明确输入和输出，你实际上已经为函数定义了一个简单的单元测试。例如，如果一个函数接受字符串列表并返回一个数字，你可以立即写出以下测试：

```javascript
expect(myFunc(['a', 'b'])).toEqual(2);
```

这种方法自然支持**测试驱动开发（TDD）**和**行为驱动开发（BDD）**，因为输入和输出的描述直接表达了函数的意图。

---

## 高阶函数

### 什么是高阶函数？

高阶函数是指**接受函数作为参数**或**返回一个函数**的函数（或两者兼具）。这是函数式编程中最强大的概念之一，能够封装逻辑、提高代码可读性并实现灵活的复用。

以下是一个简单的高阶函数示例：

```javascript
function fn(anotherFn) {
  const y = anotherFn(x);
}
```

在JavaScript中，许多内置方法如`Array.prototype.map`、`String.prototype.replace`和`Array.prototype.reduce`都是高阶函数。以`map`为例：

```javascript
const numbers = [1, 2, 3];
numbers.map((number) => number * 2); // [2, 4, 6]
```

`map`方法负责数组的迭代，而开发者只需要提供转换逻辑（例如将每个数字乘以2）。这体现了高阶函数的核心原则：**逻辑封装**。高阶函数封装了某些行为（例如迭代），并将其他行为（例如具体转换）委托给作为参数传入的函数。

### 高阶函数的关键特性

高阶函数通过以下方式建立与调用者的“契约”：

1. **控制调用时机**：高阶函数决定何时调用传入的函数。
2. **控制参数传递**：高阶函数决定向传入的函数提供什么参数。

让我们通过实现一个自定义`map`函数来理解这一点：

```javascript
function map(arr, mapFn) {
  let result = [];
  for (let i = 0; i < arr.length; i++) {
    const member = arr[i];
    const mappedValue = mapFn(member);
    result.push(mappedValue);
  }
  return result;
}
```

使用方式如下：

```javascript
map([1, 2, 3], (number) => number * 2); // [2, 4, 6]
```

在这个实现中，`map`函数控制了迭代逻辑，并决定何时以及如何调用`mapFn`。开发者只需关注转换逻辑，而无需关心迭代细节。

### 返回函数的高阶函数

高阶函数还可以返回一个函数，从而将调用控制权交给调用者。例如，我们可以将`map`函数改写为返回一个新函数：

```javascript
function map(mapFn) {
  return (arr) => {
    let result = [];
    for (let i = 0; i < arr.length; i++) {
      const member = arr[i];
      const mappedValue = mapFn(member);
      result.push(mappedValue);
    }
    return result;
  };
}
```

调用方式变为：

```javascript
const multiplyByTwo = map((number) => number * 2);
multiplyByTwo([1, 2, 3]); // [2, 4, 6]
multiplyByTwo([4, 5, 6]); // [8, 10, 12]
```

这种方式通过返回的函数“记住”了转换逻辑（例如乘以2），调用者只需提供数据即可。这种技术为代码复用提供了极大的灵活性。

### 高阶函数的应用

高阶函数在以下场景中特别有用：

1. **抽象实现细节**：通过封装重复逻辑（如迭代），高阶函数让代码更具声明性。例如，比较以下两种实现方式：

   ```javascript
   // 命令式
   const letters = ['a', 'b', 'c'];
   const nextLetters = [];
   for (let i = 0; i < letters.length; i++) {
     nextLetters.push(letters[i].toUpperCase());
   }

   // 声明式
   const nextLetters = map(letters, (letter) => letter.toUpperCase());
   ```

   声明式代码更易读，因为它直接表达了意图（将字母转换为大写）而无需暴露实现细节。

2. **逻辑封装与复用**：假设我们需要多次按评分排序不同的数据：

   ```javascript
   function sort(comparator, array) {
     array.sort(comparator);
   }

   sort((left, right) => left.rating - right.rating, products);
   sort((left, right) => left.rating - right.rating, books);
   ```

   为了避免重复的比较器逻辑，我们可以抽象出一个高阶函数：

   ```javascript
   function sort(comparator) {
     return (array) => {
       array.sort(comparator);
     };
   }

   const sortByRating = sort((left, right) => left.rating - right.rating);
   sortByRating(products);
   sortByRating(books);
   ```

   这种方式不仅减少了代码重复，还通过单一函数清晰地表达了排序的意图。

### 实践中的高阶函数

在实际项目中，高阶函数可以显著简化复杂逻辑。例如，我曾需要将`XMLHttpRequest`封装为支持`async/await`的Promise形式。最初的实现如下：

```javascript
function createXHR(options) {
  const req = new XMLHttpRequest();
  req.open(options.method, options.url);
  return new Promise((resolve, reject) => {
    req.addEventListener('load', resolve);
    req.addEventListener('abort', reject);
    req.addEventListener('error', reject);
    req.send();
  });
}
```

然而，随着需求的增加（如设置请求头、发送请求体等），函数变得复杂且难以维护。我意识到，应该将请求配置逻辑交给调用者，于是将其改写为高阶函数：

```javascript
function createXHR(middleware) {
  const req = new XMLHttpRequest();
  middleware(req);
  return new Promise((resolve, reject) => {
    req.addEventListener('loadend', resolve);
    req.addEventListener('abort', reject);
    req.addEventListener('error', reject);
  });
}
```

使用方式如下：

```javascript
test('submits a new blog post', async () => {
  const req = await createXHR((req) => {
    req.open('POST', '/posts');
    req.setRequestHeader('Content-Type', 'application/json');
    req.send(JSON.stringify({ title: 'Thinking in functions', part: 2 }));
  });
});
```

这种设计将配置逻辑委托给调用者，使函数更简洁且灵活。

### 设计高阶函数的注意事项

在设计高阶函数时，除了应用输入/输出模式，还需要考虑以下问题：

1. **委托了什么动作？**（参数函数负责什么？）
2. **何时调用参数函数？**
3. **向参数函数提供什么数据？**
4. **参数函数的返回值如何影响父函数？**

明确高阶函数与其参数函数的职责划分是确保代码清晰的关键。

### 练习

尝试编写一个`filter`函数，接受一个数组和一个返回布尔值的函数，返回一个新数组，包含参数函数返回`true`的元素：

```javascript
filter([1, 3, 5], (number) => number > 2); // [3, 5]
```

可以参考之前的`map`函数实现。

---

## 总结

- **输入/输出模式**通过明确函数的输入和输出，定义了函数的调用签名和单元测试场景，帮助开发者专注于函数的核心职责，保持代码简洁和可维护。
- **高阶函数**通过封装逻辑和委托行为，提供了声明式编程和逻辑复用的能力，使代码更易读、更灵活。
- 函数式编程的核心是将函数视为数据转换的工具，通过输入/输出模式和高阶函数，可以设计出更清晰、更模块化的代码。
