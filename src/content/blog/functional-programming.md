---
title: 函数式编程思想：输入/输出模式与高阶函数
excerpt: 函数式编程（Functional Programming, FP）起源于20世纪50年代的数学与计算机科学领域，受到λ演算（Lambda Calculus）等理论的启发。它强调函数的纯净性、不可变性和声明式编程，通过将计算视为数学函数的求值来构建健壮、可预测的软件系统。随着Haskell、Lisp等语言的兴起，函数式编程逐渐在学术界和工业界崭露头角。近年来，随着JavaScript的广泛应用，函数式编程的思想被引入前端开发，深刻影响了JavaScript编程范式。
publishDate: 'Oct 25 2018'
featureImage:
  src: '/post-20.webp'
  alt: laptop
seo:
  image:
    src: '/post-20.jpg'
---

## 引言

函数式编程（Functional Programming, FP）起源于20世纪50年代的数学与计算机科学领域，受到λ演算（Lambda Calculus）等理论的启发。它强调函数的纯净性、不可变性和声明式编程，通过将计算视为数学函数的求值来构建健壮、可预测的软件系统。随着Haskell、Lisp等语言的兴起，函数式编程逐渐在学术界和工业界崭露头角。近年来，随着JavaScript的广泛应用，函数式编程的思想被引入前端开发，深刻影响了JavaScript编程范式。例如，JavaScript的数组方法（如`map`、`reduce`）和现代框架（如React）的函数式组件设计都体现了FP的理念，极大地提高了代码的可读性和可维护性。

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

即便我们暂时不清楚`Field`的具体类型，这个定义已经清晰地界定了函数的行为：无论验证逻辑多么复杂，最终结果必须是一个布尔值。这种约束确保了函数逻辑的简单性和专注性。

### 功能拆分与函数组合

在复杂系统中，一个操作往往由多个函数组成。通过将复杂操作分解为一系列较小的函数，并确保每个函数遵循输入/输出模式，可以让设计更清晰。例如，假设我们需要实现一个操作，接受用户ID并返回其所有帖子的点赞总数。我们可以将操作分解为以下步骤：

1. 获取用户 → 获取用户的帖子 → 计算帖子点赞总数。

每个步骤对应一个函数，同时考虑函数组合的原则：**一个函数的输出可以作为另一个函数的输入**。代码如下：

```typescript
const getUser = (id: string) => User;
const getPosts = (user: User) => Post[];
const getTotalLikes = (posts: Post[]) => number;
```

这种高层次的函数链设计让开发者能够清晰地追踪数据流，快速发现逻辑中的潜在问题，同时保持代码的简洁和可维护性。

### 利于单元测试

通过明确输入和输出，实际上已经为函数定义了一个简单的单元测试。例如，如果一个函数接受字符串列表并返回一个数字，就可以写出以下测试：

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

在JavaScript中，许多内置方法如`Array.prototype.map`、`Array.prototype.filter`和`Array.prototype.reduce`都是高阶函数。以`map`为例：

```javascript
const numbers = [1, 2, 3];
numbers.map((number) => number * 2); // [2, 4, 6]
```

`map`方法负责数组的迭代，而开发者只需要提供转换逻辑。这体现了高阶函数的核心原则：**逻辑封装**。高阶函数封装了某些行为（例如迭代），并将其他行为（例如具体转换）委托给作为参数传入的函数。

### 高阶函数的关键特性

高阶函数通过以下方式建立与调用者的“契约”：

1. **控制调用时机**：高阶函数决定何时调用传入的函数。
2. **控制参数传递**：高阶函数决定向传入的函数提供什么参数。

让我们通过实现一个自定义`myMap`函数来理解这一点：

```javascript
function myMap(arr, mapFn) {
  let result = [];
  for (let i = 0; i < arr.length; i++) {
    result.push(mapFn(arr[i]));
  }
  return result;
}
```

使用方式如下：

```javascript
myMap([1, 2, 3], (number) => number * 2); // [2, 4, 6]
```

在这个实现中，`myMap`函数控制了迭代逻辑，并决定何时以及如何调用`mapFn`。开发者只需关注转换逻辑，而无需关心迭代细节。

### 返回函数的高阶函数

高阶函数还可以返回一个函数，从而将调用控制权交给调用者。例如，我们可以将`higherMap`函数改写为返回一个新函数：

```javascript
function higherMap(mapFn) {
  return (arr) => {
    let result = [];
    for (let i = 0; i < arr.length; i++) {
      result.push(mapFn(arr[i]));
    }
    return result;
  };
}
```

调用方式变为：

```javascript
const multiplyByTwo = higherMap((number) => number * 2);
multiplyByTwo([1, 2, 3]); // [2, 4, 6]
multiplyByTwo([4, 5, 6]); // [8, 10, 12]
```

这种方式通过返回的函数“记住”了转换逻辑，实现了代码复用。

### 高阶函数的应用

高阶函数适用以下场景：

1. **抽象实现细节**：通过封装重复逻辑（如迭代），高阶函数让代码更具声明性。例如，比较以下两种实现方式：

   ```javascript
   // 命令式
   const letters = ['a', 'b', 'c'];
   const upperCaseLetters = [];
   for (let i = 0; i < letters.length; i++) {
     upperCaseLetters.push(letters[i].toUpperCase());
   }

   // 声明式
   const upperCaseLetters = letters.map((letter) => letter.toUpperCase());
   ```

   声明式代码更加清晰，更符合意图，同时不暴露实现细节。

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

### 实际项目中的高阶函数

在实际项目中，高阶函数可以显著简化复杂逻辑。例如，将`XMLHttpRequest`封装为promise形式：

```javascript
// 注意：以下实现做了适当的简化，实际生产中，还需要处理参数验证、超时、请求头、更多错误处理等情况。
function createAjax({ method = 'GET', url, body = null, responseType = 'json' }) {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest();

    req.open(method, url);
    req.responseType = responseType;

    if (method === 'POST' || method === 'PUT') {
      req.setRequestHeader('Content-Type', 'application/json');
    }

    req.addEventListener('load', () => {
      if (req.status >= 200 && req.status < 300) {
        resolve(req.response);
      } else {
        reject(new Error(`Request failed with status ${req.status}: ${req.statusText}`));
      }
    });

    req.addEventListener('error', () => reject(new Error('Network error occurred')));
    req.addEventListener('abort', () => reject(new Error('Request was aborted')));

    try {
      const reqBody = body && typeof body === 'object' ? JSON.stringify(body) : body;
      req.send(reqBody);
    } catch (error) {
      reject(new Error(`Failed to send request: ${error.message}`));
    }
  });
}
```

于是我们就可以这样发起GET请求：

```javascript
createAjax({ url: 'https://api.example.com/data' })
  .then((data) => {
    console.log('Received Data:', data);
  })
  .catch((error) => {
    console.error('Error:', error.message);
  });
```

### 柯里化（Currying）

柯里化是一种特殊的函数转换技术，将一个接受多个参数的函数转变为一系列接受单一参数的函数。每个函数返回一个新函数，直到所有参数都提供为止。这种技术依赖于高阶函数，因为它通过返回函数来逐步收集参数。柯里化在函数式编程中非常重要，因为它增强了函数的灵活性、可复用性和组合性。

#### 什么是柯里化？

假设我们有一个函数接受两个参数：

```javascript
function add(a, b) {
  return a + b;
}
```

通过柯里化，我们可以将它改写为：

```javascript
function curriedAdd(a) {
  return (b) => a + b;
}
```

调用方式如下：

```javascript
const addFive = curriedAdd(5); // 返回一个新函数，固定了 a = 5
addFive(3); // 返回 8
addFive(10); // 返回 15
```

在这里，`curriedAdd`是一个高阶函数，它返回一个新函数，记住了第一个参数`a`，并等待第二个参数`b`。这种方式让函数更具模块化，可以轻松创建特定用途的函数（如`addFive`）。

#### 柯里化的好处

1. **参数复用**：通过固定部分参数，可以创建更具体的函数。例如，`addFive`复用了`a = 5`，无需重复传递。
2. **延迟执行**：柯里化允许逐步提供参数，直到所有参数齐全才执行计算，适合需要延迟计算的场景。
3. **函数组合**：柯里化使函数更容易与其他函数组合，符合函数式编程的理念。

#### 实践中的柯里化

我们可以创建一个通用的柯里化工具函数：

```javascript
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn(...args);
    }
    return (...moreArgs) => curried(...args, ...moreArgs);
  };
}
```

使用`curry`函数，我们可以柯里化任意函数。例如：

```javascript
function multiply(a, b, c) {
  return a * b * c;
}

const curriedMultiply = curry(multiply);
const multiplyByTwo = curriedMultiply(2); // 固定 a = 2
const multiplyByTwoAndThree = multiplyByTwo(3); // 固定 b = 3
console.log(multiplyByTwoAndThree(4)); // 返回 2 * 3 * 4 = 24
```

#### 柯里化在JavaScript中的应用

在JavaScript中，柯里化常用于创建可配置的函数。例如，在事件处理或API调用中，柯里化可以简化配置逻辑：

```javascript
// 假设有一个日志函数
function log(level, message) {
  console.log(`[${level}] ${message}`);
}

const curriedLog = curry(log);
const logError = curriedLog('ERROR'); // 固定 level = 'ERROR'
logError('Something went wrong'); // 输出 [ERROR] Something went wrong
logError('Another error'); // 输出 [ERROR] Another error
```

柯里化通过固定部分参数（如日志级别），让代码更简洁且易于复用，特别适合需要重复配置的场景。

#### Redux中间件(middleware)

Redux中间件天生具有柯里化特性。中间件函数是一个高阶函数，它首先接受store的dispatch和getState函数，返回一个接受下一个中间件的函数，最后返回一个处理action的函数。这种结构允许中间件在初始化时进行配置，并在处理多个action时复用。柯里化的结构使中间件能够封装逻辑，并提供一个简洁的API来处理action。

以下展示一个简单的redux日志中间件：

```javascript
// 柯里化的日志中间件
function loggerMiddleware() {
  return ({ getState }) =>
    (next) =>
    (action) => {
      console.log(`Action:`, action);
      console.log(`State before:`, getState());
      const result = next(action); // 将 action 传递给下一个中间件或 reducer
      console.log(`State after:`, getState());
      return result; // 返回结果以支持中间件链
    };
}
```

---

## 总结

- **输入/输出模式**通过明确函数的输入和输出，定义了函数的调用签名和单元测试场景，帮助开发者专注于函数的核心职责，保持代码简洁和可维护。
- **高阶函数**通过封装逻辑和委托行为，提供了声明式编程和逻辑复用的能力，使代码更易读、更灵活。**柯里化**作为高阶函数的延伸，进一步增强了函数的模块化和组合能力。
- 函数式编程的核心是将函数视为数据转换的工具，通过输入/输出模式、高阶函数和柯里化，可以设计出更清晰、更模块化的代码。
