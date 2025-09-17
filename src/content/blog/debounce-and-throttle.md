---
title: 防抖（Debounce）与节流（Throttle）
excerpt: 在 JavaScript 开发中，防抖（Debounce）和节流（Throttle）是两种常见的优化技术，用于处理高频触发的事件，例如窗口调整（resize）、滚动（scroll）、键盘输入（input）等。这两种技术都能有效减少事件处理函数的执行频率，从而提升性能，但它们的实现方式和适用场景有所不同。
publishDate: 'Apr 12 2019'
featureImage:
  src: '/post-22.webp'
  alt: fleeting glimpses
seo:
  image:
    src: '/post-22.jpg'
---

在 JavaScript 开发中，防抖（Debounce）和节流（Throttle）是两种常见的优化技术，用于处理高频触发的事件，例如窗口调整（resize）、滚动（scroll）、键盘输入（input）等。这两种技术都能有效减少事件处理函数的执行频率，从而提升性能，但它们的实现方式和适用场景有所不同。

在这篇文章中，我们将深入探讨防抖和节流的定义、工作原理、区别、常见问题，以及如何在 JavaScript 中实现它们。

---

## 什么是防抖（Debounce）？

防抖是一种优化技术，通过延迟事件处理函数的执行来减少高频事件的触发次数。它的核心思想是：**在事件被触发后，等待一段时间（延迟时间），只有当这段时间内没有新的相同事件被触发，处理函数才会执行。**

### 防抖的工作原理

想象你在输入框中快速输入文字，每次按键都会触发一个事件（例如 `oninput`）。如果我们直接在每次按键时调用一个昂贵的操作（比如向服务器发送请求），可能会导致性能问题。防抖的解决方法是：

1. 当事件触发时，设置一个定时器（`setTimeout`），延迟执行处理函数。
2. 如果在延迟时间内又触发了相同的事件，清除之前的定时器，重新设置一个新的定时器。
3. 只有当事件停止触发并等待了指定的延迟时间后，处理函数才会执行。

### 防抖的使用场景

防抖特别适合处理那些只需要在用户“完成”操作后才执行的事件，例如：

- **搜索输入**：用户在搜索框输入时，只有在用户停止输入一段时间后，才发送 API 请求。
- **窗口调整**：在用户调整浏览器窗口大小时，只有在调整完成后才重新渲染页面。
- **表单验证**：在用户输入表单内容时，只有在输入暂停后才进行验证。

### 防抖的代码实现

以下是一个简单的防抖函数实现：

```jsx
function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}
```

使用示例：

```jsx
function expensiveOperation() {
  console.log('执行昂贵操作');
}

const debouncedOperation = debounce(expensiveOperation, 300);

window.addEventListener('resize', debouncedOperation);
```

在这个例子中，`expensiveOperation` 只有在用户停止调整窗口大小 300 毫秒后才会执行。

---

## 什么是节流（Throttle）？

节流是另一种优化技术，通过限制事件处理函数在一定时间内的执行频率来减少触发次数。它的核心思想是：**在指定时间间隔内，事件处理函数最多只执行一次。**

### 节流的工作原理

与防抖不同，节流不会等待事件完全停止触发，而是确保在指定时间间隔内，处理函数只会被调用一次。例如，假设我们设置了一个 100 毫秒的节流间隔，那么即使事件在这一时间段内被触发多次，处理函数也只会执行一次。

节流的工作方式如下：

1. 当事件触发时，立即执行处理函数（或者等待一个时间间隔）。
2. 在指定的时间间隔内，忽略所有后续的触发事件。
3. 时间间隔结束后，允许下一次事件触发时再次执行处理函数。

### 节流的使用场景

节流适用于需要以固定频率执行的事件，例如：

- **滚动事件**：在用户滚动页面时，以固定频率更新某些 UI 元素（如导航栏的透明度）。
- **鼠标移动**：在用户拖动鼠标时，限制处理函数的调用频率以减少计算量。
- **游戏中的射击机制**：限制玩家按下射击键的频率。

### 节流的代码实现

以下是一个简单的节流函数实现：

```jsx
function throttle(fn, interval) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= interval) {
      last = now;
      fn.apply(this, args);
    }
  };
}
```

使用示例：

```jsx
function logScroll() {
  console.log('滚动事件触发');
}

const throttledScroll = throttle(logScroll, 200);

window.addEventListener('scroll', throttledScroll);
```

在这个例子中，`logScroll` 在用户滚动页面时最多每 200 毫秒执行一次。

---

## 防抖与节流的区别

虽然防抖和节流都用于优化高频事件的处理，但它们的机制和适用场景有显著差异：

| 特性         | 防抖（Debounce）                           | 节流（Throttle）                   |
| ------------ | ------------------------------------------ | ---------------------------------- |
| **执行时机** | 事件停止触发后，等待指定延迟时间后执行一次 | 事件触发时，以固定时间间隔定期执行 |
| **执行频率** | 只有在事件停止触发后才会执行               | 在事件触发期间以固定频率执行       |
| **适用场景** | 适合需要等待用户操作完成的场景             | 适合需要以固定频率响应的场景       |
| **典型例子** | 搜索输入、窗口调整                         | 滚动事件、鼠标移动                 |

### 形象的比喻

- **防抖**：就像你在等电梯。如果有人不断按下按钮，电梯会延迟关门，直到没有人再按按钮一段时间后，电梯才会关闭并运行。
- **节流**：就像公交车定时发车。不管有多少人在车站等车，公交车每隔固定时间（例如 10 分钟）发车一次。

---

## 常见问题

### 重复声明防抖/节流函数

在使用这些函数时，最常见的错误是重复声明。错误示例如下：

```jsx
button.addEventListener('click', function handleButtonClick() {
  return debounce(expensiveOperation, 500);
});
```

乍一看似乎没问题，但实际上防抖并未起效。每次点击都会创建新的防抖函数，导致之前的定时器被覆盖或丢失，无法正确实现防抖逻辑。

防抖和节流之所以有效，是因为它们依赖于同一个（防抖/节流后的）函数引用被调用。正确的做法是将**防抖/节流后的函数实例提供给事件监听器**：

```jsx
button.addEventListener(
  'click',
  debounce(function handleButtonClick() {
    return expensiveOperation();
  }, 500)
);
```

### React 示例

下面是 React 中的错误示例：

```jsx
class MyComponent extends React.Component {
  handleButtonClick = () => {
    console.log('The button was clicked');
  };

  render() {
    return <button onClick={debounce(this.handleButtonClick, 500)}>Click the button</button>;
  }
}
```

由于 `debounce` 在渲染期间被调用，每次 `MyComponent` 的重新渲染都会产生一个新的防抖后的 `handleButtonClick` 函数实例，导致没有效果。

正确做法是对 `handleButtonClick` 声明进行防抖：

```jsx
class MyComponent extends React.Component {
  handleButtonClick = debounce(() => {
    console.log('The button was clicked');
  }, 500);

  render() {
    return <button onClick={this.handleButtonClick}>Click the button</button>;
  }
}
```

### 找到最佳持续时间

对于防抖和节流来说，找到一个对用户体验和性能都最佳的持续时间很重要。间隔太短性能提升有限，而太长又影响体验。时间间隔因场景而各异，选择间隔前，应充分测试，找到最适合当前场景的数值。

---

## 高级实现：结合防抖和节流

在某些场景中，我们可能需要结合防抖和节流的特点。例如，我们可能希望函数在第一次触发时立即执行，类似于节流的即时响应，同时保留防抖的延迟执行特性。

以下是一个增强版防抖函数：

```jsx
function advancedDebounce(fn, delay, immediate = false) {
  let timer = null;
  return function (...args) {
    const callNow = immediate && !timer;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (!immediate) fn.apply(this, args);
    }, delay);
    if (callNow) fn.apply(this, args);
  };
}
```

这个实现允许：

- **立即执行**（`immediate = true`）：在事件第一次触发时立即执行处理函数，然后在后续的延迟时间内忽略触发。
- **延迟执行**（`immediate = false`）：与普通防抖相同，只有在事件停止触发后才执行。

---

## 总结

防抖和节流是优化高频事件处理的强大工具。选择哪种技术取决于具体场景：

- 如果希望在用户操作完成后才执行一次，使用**防抖**。
- 如果需要在用户操作期间以固定频率执行，使用**节流**。

合理使用这两种技术，可以显著提升 Web 应用的性能，减少不必要的计算开销，同时为用户提供更流畅的体验。
