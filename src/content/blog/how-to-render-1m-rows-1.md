---
title: 如何渲染100万行数据（上）
excerpt: 现代浏览器的DOM操作和渲染能力有限。一次性将100万行数据渲染为表格会占用大量内存，导致浏览器卡顿甚至崩溃。为了解决性能问题，现代Web开发中通常采用动态按需渲染（或虚拟化渲染）来处理大数据量表格。
publishDate: 'Mar 10 2023'
featureImage:
  src: '/post-8.webp'
  alt: Golden and blue geometrical shapes
seo:
  image:
    src: '/post-8.jpg'
    alt: Golden and blue geometrical shapes
---

## 假如我们使用`<table>`标签一次渲染100万行数据，会怎么样？

- 浏览器限制：现代浏览器的DOM操作和渲染能力有限。一次性将100万行数据渲染为表格会占用大量内存，导致浏览器卡顿甚至崩溃。假设每行数据占用100KB（包括HTML结构和数据），100万行将需要约100GB的内存，远超普通设备的承载能力。
- 渲染时间：即使内存足够，浏览器解析和渲染如此多的DOM元素耗时极长，用户体验极差。
- 网络传输：如果数据从服务器传输到客户端，100万行的JSON数据（假设每行1KB）也需要约1GB的带宽，传输和解析成本极高。

在现实应用中，几乎没有场景需要一次性展示100万行数据。用户无法有效浏览如此大量的数据，通常会通过分页、过滤或搜索来缩小数据范围。

## 那我们应该怎么办？

为了解决性能问题，现代Web开发中通常采用动态按需渲染（或虚拟化渲染）来处理大数据量表格。以下是常见技术：

### 虚拟化渲染（Virtualization）

原理：只渲染可视区域的表格行（例如屏幕上可见的几十行），其他数据在用户滚动时动态加载和卸载。
实现方式：

前端库如react-window、react-virtualized、ag-grid、tanstack-table等，专门为大数据量表格设计。
核心技术是通过监听滚动事件，计算当前可视区域的行索引，仅渲染这些行，并用占位元素（如空的div）填充不可见区域以保持滚动条的正确长度。

**优点：** 内存占用低，无论数据量多大，只渲染少量DOM节点（通常几十到几百个）；响应速度快，初始加载和滚动都非常流畅。

**缺点：** 需要额外的开发工作来处理动态加载、数据同步等。

### 分页（Pagination）

将数据分成小块（例如每页100行），用户通过翻页操作查看数据。适合服务端渲染或数据量较大的场景，但交互体验不如虚拟化流畅。

### 增量加载（Infinite Scroll）

用户滚动到表格底部时，动态加载下一批数据。适合数据流式加载，需要服务端配合提供分片数据。

### 为什么动态按需渲染更合理？

- 用户体验：用户通常只关心当前查看的数据，动态渲染能保证流畅的交互体验。
- 资源效率：减少内存、CPU和带宽的消耗，适合普通硬件环境。
- 可扩展性：动态渲染方案可以轻松扩展到更大的数据集（如亿级行），而一次性渲染几乎不可能。

## 前端虚拟化渲染的优化

react-virtualized（或其他虚拟化库如 react-window、ag-grid）通过只渲染可视区域的行（通常几十到几百行），极大减少了DOM节点的开销。以下是确保前端滚动流畅的关键点：

### a. 合理配置虚拟化参数

- **行高（rowHeight）：**

  - 使用固定行高（如35像素）以简化计算。如果行高动态变化，使用 react-virtualized 的 CellMeasurer 动态测量每行高度，但需注意性能开销。

    ```javascript
    import { List } from 'react-virtualized';
    const rowHeight = 35; // 固定行高
    const list = (
      <List
        height={400} // 容器高度
        width={800} // 容器宽度
        rowCount={1000000} // 总行数
        rowHeight={rowHeight}
        rowRenderer={({ index, style }) => <div style={style}>Row {index}</div>}
      />
    );
    ```

- **超渲染行数（overscanRowCount）：**

  - 设置适当的 overscanRowCount（默认10-20行），即在可视区域上下额外渲染几行，防止快速滚动时出现空白。
  - 示例：overscanRowCount={20}。

- **容器尺寸：**
  - 确保容器高度和宽度明确，避免动态调整导致重排（reflow）。

### b. 优化滚动事件

- **防抖/节流（Debounce/Throttle）：**

  - react-virtualized 内部已对滚动事件进行优化，但如果自定义了滚动事件监听，需使用防抖或节流函数（如 lodash.debounce）避免频繁触发。

    ```javascript
    import { debounce } from 'lodash';
    const handleScroll = debounce(({ scrollTop }) => {
      console.log('Scrolled to:', scrollTop);
    }, 100);
    ```

- **避免复杂渲染逻辑：**

  - 确保 rowRenderer 函数逻辑简单，避免在每行渲染时执行复杂计算或状态更新。
  - 将数据预处理（如格式化日期）放在数据加载阶段，而非渲染时。

### c. 缓存与重用

- **缓存行数据：**

  - 使用 useMemo 或 useCallback 缓存 rowRenderer 函数和数据，防止不必要的重新渲染。

    ```javascript
    const rowRenderer = useCallback(({ index, style }) => <div style={style}>{data[index]}</div>, [data]);
    ```

- **列表重用：**

  - 如果数据频繁更新（如实时数据），使用 react-virtualized 的 List 或 Grid 组件的 key 属性，确保组件在数据变化时尽量重用已有DOM结构。

### d. 性能监控

- 使用浏览器的性能工具（如Chrome DevTools）分析渲染时间，确保每帧渲染时间低于16ms（60fps）。
- 避免在滚动期间触发大量状态更新或DOM操作。

## **后端数据加载的性能瓶颈**

即使前端虚拟化优化到位，如果后端数据加载存在延迟，滚动时仍可能出现卡顿（例如空白区域或加载动画）。以下是后端加载的瓶颈分析及优化方案：

### **瓶颈分析**

- **数据请求延迟**：
  - 每次滚动到新数据区域时，前端可能需要向后端请求新的数据片段。如果后端响应时间过长（例如 >200ms），用户会感知到延迟。
- **数据量过大**：
  - 即使只请求部分行（例如100行），如果每行数据复杂（例如1KB/行），100行的数据量仍可能达到100KB，网络传输和解析可能成为瓶颈。
- **数据库查询效率**：
  - 后端数据库查询（如SQL）如果未优化，可能导致响应时间长，尤其是对于1M行的大表。

### **后端优化方案**

- **分片加载（Range-based Queries）**：

  - 前端根据滚动位置请求特定范围的行（如第1000-1100行）。
  - 后端API支持分页或范围查询，例如：

    ```
    GET /api/data?start=1000&limit=100
    ```

  - 后端使用数据库的 `OFFSET` 和 `LIMIT`（或等效的 `SKIP/TAKE`）高效获取数据：

    ```sql
    SELECT * FROM table_name LIMIT 100 OFFSET 1000;
    ```

  - 优化数据库索引，确保查询性能。例如，为排序字段或过滤条件建立索引。

- **数据压缩**：

  - 使用 Gzip 或 Brotli 压缩 API 响应数据，减少网络传输时间。例如，100KB 的数据压缩后可能只有 10-20KB。
  - 示例（Node.js/Express）：

    ```javascript
    const compression = require('compression');
    app.use(compression());
    ```

- **缓存数据**：
  - 对于不经常变化的数据，使用后端缓存（如 Redis、Memcached）存储热门数据片段，减少数据库查询。
  - 示例：缓存最近访问的 1000 行数据，TTL 设为 1 小时。
  - 对于动态数据，结合增量更新机制（如 WebSocket）仅推送变化部分。
- **预加载（Prefetching）**：

  - 预测用户可能滚动的区域，提前加载附近的数据。例如，用户滚动到第 1000 行时，预加载第 1100-1200 行。
  - 前端实现：

    ```javascript
    const prefetchData = async (startIndex) => {
      const response = await fetch(`/api/data?start=${startIndex}&limit=100`);
      const data = await response.json();
      cacheData(startIndex, data); // 存储到本地缓存
    };
    useEffect(() => {
      prefetchData(currentIndex + 100); // 预加载下一页
    }, [currentIndex]);
    ```

  - 后端支持批量查询，减少请求次数。

- **增量加载与懒加载**：
  - 结合虚拟化的滚动逻辑，仅在需要时触发数据请求。
  - 使用 Intersection Observer API 检测即将进入可视区域的行，提前触发数据加载。
- **数据库优化**：
  - **索引**：为常用查询字段（如 ID、时间戳）建立索引，加速范围查询。
  - **分区表**：对于 1M 行的大表，按时间或 ID 分区，减少扫描范围。
  - **批量查询**：后端一次性返回稍多数据（例如 200 行而非 100 行），减少请求频率。

### **网络优化**

- **CDN**：如果数据是静态或半静态的，使用 CDN 缓存数据，减少后端压力。
- **HTTP/2 或 HTTP/3**：使用现代协议减少连接建立时间，提升传输效率。
- **WebSocket 或 Server-Sent Events**：对于实时数据，使用 WebSocket 推送数据变化，减少 HTTP 请求。

## **确保滚动无延迟的整体策略**

- **前端+后端协同**：
  - 前端通过虚拟化控制 DOM 渲染，保持每帧 <16ms。
  - 后端 API 响应时间控制在 100ms 以内，结合压缩和缓存减少传输延迟。
- **预加载与缓存**：
  - 前端维护一个数据缓存（如 LRU 缓存），存储已加载的行数据，避免重复请求。
  - 后端预计算常用数据片段，存储在内存中（如 Redis）。
- **动态调整**：
  - 根据网络状况动态调整请求的行数。例如，慢网络下请求更少行（50 行），快网络下请求更多行（200 行）。
- **错误处理与降级**：
  - 如果后端加载失败，显示占位符（如骨架屏），并重试请求。
  - 提供离线缓存机制（如 Service Worker）以支持断网场景。

## **性能测试与监控**

- **前端**：使用 Chrome DevTools 的 Performance 面板分析滚动帧率，识别瓶颈。
- **后端**：监控 API 响应时间（如使用 Prometheus+Grafana），优化慢查询。
- **端到端**：模拟 1M 行数据的加载和滚动，测试不同网络条件下的表现（如 3G、4G、Wi-Fi）。

## **示例实现**

以下是一个简化的前端+后端协同实现：

```javascript
// 前端（React + react-virtualized）
import { List } from 'react-virtualized';
import { useState, useEffect } from 'react';

const VirtualTable = () => {
  const [data, setData] = useState({});
  const loadData = async (startIndex, stopIndex) => {
    if (!data[startIndex]) {
      // 避免重复请求
      const response = await fetch(`/api/data?start=${startIndex}&limit=${stopIndex - startIndex + 1}`);
      const newData = await response.json();
      setData((prev) => ({ ...prev, ...newData }));
    }
  };

  const rowRenderer = ({ index, style }) => <div style={style}>{data[index] || 'Loading...'}</div>;

  return (
    <List
      height={400}
      width={800}
      rowCount={1000000}
      rowHeight={35}
      rowRenderer={rowRenderer}
      onRowsRendered={({ startIndex, stopIndex }) => loadData(startIndex, stopIndex)}
      overscanRowCount={20}
    />
  );
};

// 后端（Node.js/Express）
app.get('/api/data', async (req, res) => {
  const start = parseInt(req.query.start);
  const limit = parseInt(req.query.limit);
  const data = await db.query('SELECT * FROM table_name LIMIT ? OFFSET ?', [limit, start]);
  res.json(data);
});
```

## **结论**

- **前端**：通过 `react-virtualized` 的虚拟化渲染，设置固定行高、适当的超渲染行数和缓存机制，确保滚动帧率达到 60fps。
- **后端**：通过范围查询、数据压缩、缓存和预加载，控制 API 响应时间在 100ms 以内，消除加载延迟。
- **关键点**：前端预加载 + 后端高效查询 + 网络优化是确保 1M 行数据滚动流畅的核心。
- **瓶颈应对**：后端数据加载是主要瓶颈，通过索引、分区、缓存和压缩可有效缓解。
