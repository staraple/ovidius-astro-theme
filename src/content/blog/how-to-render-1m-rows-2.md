---
title: 渲染100万行数据（下）
excerpt: 本文探讨针对大数据表格渲染的前端优化方案，焦点包括缓存机制、预加载与按需加载，以及请求队列的实现与升级。这些方案基于React和react-virtualized等库，旨在通过虚拟化渲染、缓存管理和智能请求处理，实现高效的性能优化。
publishDate: 'Mar 17 2023'
featureImage:
  src: '/post-14.webp'
  alt: Golden and blue geometrical shapes
seo:
  image:
    src: '/post-14.jpg'
    alt: Golden and blue geometrical shapes
---

在现代Web应用中，渲染大规模数据表格（如百万行数据）是一个常见的任务。一方面，用户期望流畅的滚动体验和快速的数据加载；另一方面，浏览器内存限制、网络延迟和后端响应时间等因素可能导致卡顿、崩溃或长时间的加载等待。本文探讨针对大数据表格渲染的前端优化方案，包括缓存机制、预加载与按需加载，以及请求队列的实现与升级。这些方案基于React和react-virtualized等库，旨在通过虚拟化渲染、缓存管理和智能请求处理，实现高效的性能优化。

## 挑战概述

传统方式一次性渲染百万行数据是不现实的：浏览器DOM节点过多会立即导致浏览器崩溃（每行DOM节点约100-200k，100万行约100G-200G）。更实际的场景是动态按需渲染——只渲染可视区域的行（几十到几百行），结合服务端分页加载数据。但在快速滚动时，如何避免空白区域、减少延迟，并处理网络波动，是优化的关键。

本文将从以下方面展开讨论：

1. 缓存机制：使用内存或IndexedDB缓存请求数据。
2. 预加载与按需加载：利用Intersection Observer API检测即将进入可视区域的行。
3. 请求队列及其升级：包括带优先级的队列、动态并发窗口，以及移除重复请求/合并重合范围。

这些方案协同工作，确保大数据表格在普通硬件和网络环境下流畅运行。

## 1. 缓存机制：内存或IndexedDB缓存请求数据

大数据表格的优化首先依赖于高效的数据缓存。通过缓存已加载的行数据，可以减少重复请求，提高响应速度，并支持离线场景。

### 内存缓存

内存缓存适合快速访问场景，使用JavaScript对象（如Map）存储数据。核心是实现LRU（Least Recently Used）机制，设置上限（如50,000行）以防止内存溢出：

- **实现要点**：使用Map存储键值对（键为行索引，值为行数据）。访问数据时，将其移动到Map末尾（LRU）。当缓存满时，删除最旧键。
- **优点**：读写速度快（O(1)操作），适合高频访问。
- **缺点**：浏览器内存有限（通常<1GB），页面刷新后数据丢失。

### IndexedDB缓存

IndexedDB是浏览器内置的持久化存储，适合大数据量场景，支持离线缓存：

- **实现要点**：使用IndexedDB对象存储（键为行索引，值包含数据和时间戳）。实现LRU通过维护键数组，超出上限删除最旧键。添加TTL（Time To Live，如7天）定期清理过期数据。版本控制确保应用更新时清理旧缓存。
- **优点**：持久化（页面刷新或关闭后保留），存储上限大（浏览器分配数百MB）。
- **缺点**：异步操作稍慢（比内存慢10-50ms），初始化需处理兼容性。

### 缓存抽象

通过抽象接口，可以在内存和IndexedDB间切换（例如通过组件prop）。实际应用中，缓存检查发生在加载数据前：优先从缓存读取，缺失时发起请求。结合50,000行上限，确保内存占用约10MB（每行200字节）。

缓存显著降低网络请求：快速上下滚动时，往回滚动（如从500回200）通常命中缓存，无需新请求，提高用户体验。

## 2. 使用Intersection Observer预加载、按需加载

虚拟化渲染（如react-virtualized）只渲染可视区域的行（几十行），但快速滚动可能出现空白区域。为解决此问题，使用Intersection Observer API实现预加载和按需加载。

### 按需加载

- **原理**：通过 onRowsRendered 回调获取当前可视区域的 startIndex 和 stopIndex，仅加载这些行。
- **实现**：监听滚动事件，计算可视行索引，从缓存或后端请求缺失数据。

### 预加载

- **Intersection Observer**：浏览器API，检测元素是否即将进入视口（threshold=0.1，视口10%时触发）。
- **实现**：为每行元素添加 data-index，Observer观察行元素。当行即将可见时，触发 loadData 预加载附近行（前后 batchSize=100）。
- **优点**：提前加载（快速滚动时无空白），结合优先级队列，确保可视区域优先。
- **效果**：快速滚动到500，预加载400-600；回200时，数据已缓存或快速加载，骨架屏时间<500ms。

Intersection Observer与虚拟化结合，确保只加载必要数据，内存占用低（<10MB），响应速度快。

## 3. 请求队列及其升级

大数据表格加载依赖异步请求队列，处理快速滚动生成的多个范围（如 100-300, 200-400）。基本队列使用先进先出（FIFO），但升级版引入优先级、动态并发和去重机制。

### 基本请求队列

- **作用**：将滚动触发的范围放入队列，按序执行 loadData 请求数据。
- **实现**：使用数组或自定义队列，结合 setTimeout 或 Promise 异步处理。
- **问题**：快速上下滚动可能生成重合范围，导致重复请求；可视区域可能延迟加载。

### 升级方案

请求队列的升级针对快速滚动场景优化性能和效率。

### a. 带优先级的请求队列

- **必要性**：快速滚动时，可视区域（最后范围，如 400-500）应优先加载，以减少骨架屏时间。
- **实现**：自定义 PriorityQueue 类，按优先级排序（可视区域优先级1，其他0）。入队时指定优先级，dequeue 返回最高优先级范围。
- **效果**：滚动到500，再回200，可视区域（200附近）优先加载；中间范围（如100-199）后台处理。
- **收益**：骨架屏时间缩短约30-50%（300ms vs. 500ms），用户体验更流畅。

### b. 动态并发窗口（根据网络/服务负载动态调整）

- **必要性**：网络环境多样（3G~5G），后端负载变化大。慢网络下多并发可能拥堵，快网络下单并发浪费带宽。
- **实现**：维护活跃请求计数（activeRequests），动态计算窗口大小（1-4个）。根据网络带宽（navigator.connection.downlink）和响应时间（最近5次平均）调整。
- **效果**：慢网络（<1Mbps）单并发（1个）稳定，快网络（>5Mbps）4个并发高效加载多个范围。
- **收益**：吞吐量提高20-50%（快网络下总加载时间从2秒降到1秒），适应性强。

### c. 移除重复请求/合并重合范围

- **必要性**：快速上下滚动生成重合范围（如 100-300, 200-400），导致重复请求200-300的行。
- **实现**：mergeRanges 函数排序并合并重合范围（current.stopIndex >= next.startIndex - 1），保留最高优先级。合并后分割为≤1000行的范围，重新入队。
- **效果**：100-200, 200-300, 300-400, 200-400 合并为 100-400，分割为1-2个请求，节省100-200KB。
- **收益**：减少20-50%网络流量，缩短延迟（300-500ms vs. 1秒），避免状态混乱。

这些升级协同工作：优先级确保可视区域快，动态并发平衡负载，去重/合并减少冗余。

## 结论

大数据表格渲染的前端优化是一个系统工程，从缓存（内存/IndexDB）减少请求，到Intersection Observer实现预加载/按需加载，再到请求队列的升级（优先级、动态并发、去重/合并），每一步都针对性能瓶颈。固定参数简化版本适合稳定环境，动态调整提升适应性。实际应用中，结合缓存（50,000行上限）和虚拟化（如react-virtualized），可轻松处理百万行数据，保持60fps流畅体验。

建议根据网络环境和用户行为测试优化参数（如 batchSize=100），并监控性能指标（如请求时间、缓存命中率）。通过这些方案，前端开发者可以构建高效、用户友好的大数据应用。

附参考代码实现：

```javascript
// 前端实现：React + react-virtualized + 抽象缓存 + 优先级队列
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { List } from 'react-virtualized';
import io from 'socket.io-client';
import { debounce } from 'lodash';

// 优先级队列实现
class PriorityQueue {
  constructor() {
    this.queue = [];
  }

  enqueue(range, priority) {
    this.queue.push({ range, priority });
    this.queue.sort((a, b) => b.priority - a.priority);
  }

  dequeue() {
    return this.queue.shift();
  }

  isEmpty() {
    return this.queue.length === 0;
  }

  // 获取所有范围
  getRanges() {
    return this.queue.map((item) => item.range);
  }

  // 替换队列内容
  replace(rangesWithPriority) {
    this.queue = rangesWithPriority;
    this.queue.sort((a, b) => b.priority - a.priority);
  }
}

// 合并重合范围
const mergeRanges = (ranges) => {
  if (ranges.length === 0) return [];
  // 按 startIndex 排序
  ranges.sort((a, b) => a.startIndex - a.startIndex || a.stopIndex - b.stopIndex);
  const merged = [];
  let current = { ...ranges[0] };

  for (let i = 1; i < ranges.length; i++) {
    const next = ranges[i];
    if (current.stopIndex >= next.startIndex - 1) {
      // 重合或相邻，合并
      current.stopIndex = Math.max(current.stopIndex, next.stopIndex);
      current.priority = Math.max(current.priority || 0, next.priority || 0);
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);
  return merged;
};

// 抽象缓存接口
class Cache {
  async get(_key) {}
  async set(_key, _value) {}
  async clear() {}
}

// 内存缓存（基于LRU）
class MemoryCache extends Cache {
  constructor(maxSize = 50000) {
    super();
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  async get(key) {
    const value = this.cache.get(key);
    if (value) {
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  async set(key, value) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  async clear() {
    this.cache.clear();
  }
}

// IndexedDB缓存（带版本和TTL）
class IndexedDBCache extends Cache {
  constructor(maxSize = 50000, ttlDays = 7) {
    super();
    this.dbName = 'VirtualTableCache';
    this.storeName = 'data';
    this.version = 1;
    this.maxSize = maxSize;
    this.ttl = ttlDays * 24 * 60 * 60 * 1000;
    this.db = null;
    this.keys = [];
    this.initDB();
  }

  async initDB() {
    const request = indexedDB.open(this.dbName, this.version);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (event.oldVersion < this.version) {
        if (db.objectStoreNames.contains(this.storeName)) {
          db.deleteObjectStore(this.storeName);
        }
        db.createObjectStore(this.storeName);
      }
    };
    this.db = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await this.cleanupExpired();
  }

  async cleanupExpired() {
    if (!this.db) return;
    const tx = this.db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);
    const now = Date.now();
    const expiredKeys = [];

    await new Promise((resolve) => {
      const req = store.openCursor();
      req.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const { timestamp } = cursor.value;
          if (now - timestamp > this.ttl) {
            expiredKeys.push(cursor.key);
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
    });

    for (const key of expiredKeys) {
      await this.delete(key);
      this.keys = this.keys.filter((k) => k !== key);
    }
  }

  async get(key) {
    if (!this.db) return null;
    const tx = this.db.transaction(this.storeName, 'readonly');
    const store = tx.objectStore(this.storeName);
    const value = await new Promise((resolve) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
    if (value) {
      this.keys = this.keys.filter((k) => k !== key);
      this.keys.push(key);
      if (this.keys.length > this.maxSize) {
        const oldKey = this.keys.shift();
        this.delete(oldKey);
      }
    }
    return value?.data;
  }

  async set(key, value) {
    if (!this.db) return;
    const tx = this.db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);
    await new Promise((resolve, reject) => {
      const req = store.put({ data: value, timestamp: Date.now() }, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    this.keys.push(key);
    if (this.keys.length > this.maxSize) {
      const oldKey = this.keys.shift();
      this.delete(oldKey);
    }
  }

  async delete(key) {
    if (!this.db) return;
    const tx = this.db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);
    await new Promise((resolve, reject) => {
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async clear() {
    if (!this.db) return;
    const tx = this.db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);
    await new Promise((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    this.keys = [];
  }
}

// 网络状况检测
const getNetworkSpeed = () => {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!connection) return 'fast';
  const downlink = connection.downlink; // Mbps
  if (downlink < 1) return 'slow';
  if (downlink < 5) return 'medium';
  return 'fast';
};

// 组件
const VirtualTable = ({ cacheType = 'memory' }) => {
  const [data, setData] = useState({});
  const [rowCount] = useState(1000000);
  const [loadingStates, setLoadingStates] = useState({});
  const socketRef = useRef(null);
  const listRef = useRef(null);
  const observerRef = useRef(null);
  const cacheRef = useRef(null);
  const responseTimes = useRef([]); // 最近5次响应时间
  const pendingRequests = useRef(new Set()); // 正在加载的范围
  const priorityQueue = useRef(new PriorityQueue()); // 优先级队列
  const activeRequests = useRef(0); // 活跃请求计数
  const maxRequestRows = 1000; // 最大请求行数

  // 动态并发窗口大小
  const getMaxConcurrentRequests = () => {
    const speed = getNetworkSpeed();
    const avgResponseTime = responseTimes.current.length ? responseTimes.current.reduce((sum, t) => sum + t, 0) / responseTimes.current.length : 100;

    if (speed === 'slow' || avgResponseTime > 500) return 1;
    if (speed === 'medium' || avgResponseTime > 200) return 2;
    return 4;
  };

  // 初始化缓存
  useEffect(() => {
    cacheRef.current = cacheType === 'indexedDB' ? new IndexedDBCache(50000, 7) : new MemoryCache(50000);
    return () => cacheRef.current.clear();
  }, [cacheType]);

  // 动态请求行数
  const getBatchSize = () => {
    const speed = getNetworkSpeed();
    const avgResponseTime = responseTimes.current.length ? responseTimes.current.reduce((sum, t) => sum + t, 0) / responseTimes.current.length : 100;

    if (speed === 'slow' || avgResponseTime > 500) return 50;
    if (speed === 'medium' || avgResponseTime > 200) return 100;
    return 200;
  };

  // 数据加载函数
  const loadData = useCallback(
    async (startIndex, stopIndex, retryCount = 0) => {
      const batchSize = getBatchSize();
      const adjustedStart = Math.max(0, startIndex - batchSize);
      const adjustedStop = Math.min(stopIndex + batchSize, rowCount - 1);
      const requestKey = `${adjustedStart}-${adjustedStop}`;

      if (pendingRequests.current.has(requestKey)) return;
      pendingRequests.current.add(requestKey);
      activeRequests.current += 1;

      const missingIndices = [];
      for (let i = adjustedStart; i <= adjustedStop; i++) {
        if (!loadingStates[i]) {
          const cached = await cacheRef.current.get(i);
          if (!cached) missingIndices.push(i);
          else setData((prev) => ({ ...prev, [i]: cached }));
        }
      }

      if (missingIndices.length === 0) {
        pendingRequests.current.delete(requestKey);
        activeRequests.current -= 1;
        processQueue();
        return;
      }

      setLoadingStates((prev) => {
        const newStates = { ...prev };
        missingIndices.forEach((i) => (newStates[i] = true));
        return newStates;
      });

      try {
        const startTime = performance.now();
        const response = await fetch(`/api/data?start=${adjustedStart}&limit=${adjustedStop - adjustedStart + 1}`);
        const endTime = performance.now();
        responseTimes.current = [...responseTimes.current, endTime - startTime].slice(-5);
        if (!response.ok) throw new Error('Network error');

        const newData = await response.json();
        for (const [index, value] of Object.entries(newData)) {
          await cacheRef.current.set(parseInt(index), value);
          setData((prev) => ({ ...prev, [index]: value }));
        }

        setLoadingStates((prev) => {
          const newStates = { ...prev };
          missingIndices.forEach((i) => delete newStates[i]);
          return newStates;
        });
      } catch (error) {
        if (retryCount < 1) {
          const retryDelay = responseTimes.current.length
            ? Math.min(2000, (responseTimes.current.reduce((sum, t) => sum + t, 0) / responseTimes.current.length) * 2)
            : 1000;
          setTimeout(() => loadData(startIndex, stopIndex, retryCount + 1), retryDelay);
        } else {
          setLoadingStates((prev) => {
            const newStates = { ...prev };
            missingIndices.forEach((i) => (newStates[i] = 'error'));
            return newStates;
          });
        }
      } finally {
        pendingRequests.current.delete(requestKey);
        activeRequests.current -= 1;
        processQueue();
      }
    },
    [loadingStates, rowCount]
  );

  // 处理优先级队列
  const processQueue = useCallback(() => {
    const maxConcurrent = getMaxConcurrentRequests();
    while (activeRequests.current < maxConcurrent && !priorityQueue.current.isEmpty()) {
      const { range } = priorityQueue.current.dequeue();
      loadData(range.startIndex, range.stopIndex);
    }
  }, []);

  // 防抖包装，收集并合并滚动范围
  const debouncedLoadData = useCallback(
    debounce(
      (startIndex, stopIndex) => {
        const batchSize = getBatchSize();
        const adjustedStart = Math.max(0, startIndex - batchSize);
        const adjustedStop = Math.min(stopIndex + batchSize, rowCount - 1);

        // 收集所有现有范围
        const existingRanges = [
          ...Array.from(pendingRequests.current).map((key) => {
            const [start, stop] = key.split('-').map(Number);
            return { startIndex: start, stopIndex: stop, priority: 0 };
          }),
          ...priorityQueue.current.getRanges().map((range) => ({
            startIndex: range.startIndex,
            stopIndex: range.stopIndex,
            priority: range.priority || 0
          }))
        ];

        // 添加新范围（可视区域优先级最高）
        existingRanges.push({ startIndex: adjustedStart, stopIndex: adjustedStop, priority: 1 });

        // 合并重合范围
        const mergedRanges = mergeRanges(existingRanges);

        // 清空 pendingRequests 和 priorityQueue
        pendingRequests.current.clear();
        priorityQueue.current.replace(
          mergedRanges.map((range) => ({
            range: { startIndex: range.startIndex, stopIndex: range.stopIndex },
            priority: range.priority
          }))
        );

        // 分割大范围并入队
        mergedRanges.forEach((range) => {
          let currentStart = range.startIndex;
          while (currentStart <= range.stopIndex) {
            const currentStop = Math.min(currentStart + maxRequestRows - 1, range.stopIndex);
            priorityQueue.current.enqueue({ startIndex: currentStart, stopIndex: currentStop }, range.priority);
            currentStart = currentStop + 1;
          }
        });

        processQueue();
      },
      100,
      { leading: false, trailing: true }
    ),
    [processQueue, rowCount]
  );

  // WebSocket 增量更新
  useEffect(() => {
    socketRef.current = io('http://localhost:3000');

    socketRef.current.on('dataUpdate', async (update) => {
      await cacheRef.current.set(update.index, update.data);
      setData((prev) => ({
        ...prev,
        [update.index]: update.data
      }));
    });

    return () => socketRef.current.disconnect();
  }, []);

  // Intersection Observer 用于预加载
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.dataset.index);
            debouncedLoadData(index, index + getBatchSize());
          }
        });
      },
      { root: null, threshold: 0.1 }
    );

    observerRef.current = observer;
    return () => observer.disconnect();
  }, [debouncedLoadData]);

  // 行渲染器（带骨架屏和错误提示）
  const rowRenderer = useCallback(
    ({ index, style }) => {
      let content;
      if (loadingStates[index] === true) {
        content = (
          <div style={style} className="animate-pulse bg-gray-200 h-full w-full">
            <div className="h-4 bg-gray-300 rounded w-3/4 mx-2 my-1"></div>
          </div>
        );
      } else if (loadingStates[index] === 'error') {
        content = (
          <div style={style} className="text-red-500">
            Failed to load Row {index}
          </div>
        );
      } else {
        content = (
          <div style={style} data-index={index}>
            {data[index] ? `Row ${index}: ${JSON.stringify(data[index])}` : 'No data'}
          </div>
        );
      }

      useEffect(() => {
        const element = content.ref?.current;
        if (observerRef.current && element) {
          observerRef.current.observe(element);
          return () => observerRef.current.unobserve(element);
        }
      }, []);

      return content;
    },
    [data, loadingStates]
  );

  // 虚拟化列表
  return (
    <List
      ref={listRef}
      height={400}
      width={800}
      rowCount={rowCount}
      rowHeight={35}
      rowRenderer={rowRenderer}
      onRowsRendered={({ startIndex, stopIndex }) => debouncedLoadData(startIndex, stopIndex)}
      overscanRowCount={20}
    />
  );
};

export default VirtualTable;
```

```javascript
// 后端实现：Node.js + Express + Socket.IO
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const compression = require('compression');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(compression());
app.use(express.json());

// 模拟数据库
const db = Array.from({ length: 1000000 }, (_, i) => ({ id: i, value: `Data ${i}` }));

// 数据范围查询
app.get('/api/data', (req, res) => {
  const start = parseInt(req.query.start) || 0;
  const limit = parseInt(req.query.limit) || 100;
  const end = Math.min(start + limit, db.length);
  const result = {};

  for (let i = start; i < end; i++) {
    result[i] = db[i];
  }

  res.json(result);
});

// 模拟数据更新
setInterval(() => {
  const index = Math.floor(Math.random() * 1000000);
  db[index] = { id: index, value: `Updated Data ${index} at ${new Date().toISOString()}` };
  io.emit('dataUpdate', { index, data: db[index] });
}, 5000);

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```
