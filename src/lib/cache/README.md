# Smart BI 缓存系统

本文档介绍 Smart BI 系统的缓存功能，包括设计理念、使用方法和性能优化策略。

## 概述

Smart BI 缓存系统是一个高性能的内存缓存解决方案，专门为数据集和指标加载优化设计。它提供以下核心功能：

- **多层缓存架构**：数据集缓存、指标缓存、查询缓存
- **智能失效机制**：基于数据变更的自动缓存失效
- **内存管理**：LRU 淘汰策略和内存限制
- **性能监控**：实时缓存统计和性能指标
- **灵活配置**：可调整的 TTL、内存限制和清理策略

## 架构设计

### 缓存管理器 (CacheManager)

核心缓存引擎，提供基础的缓存操作：

```typescript
import { CacheManager } from '@/lib/cache/CacheManager'

const cache = new CacheManager({
  maxMemorySize: 100, // 100MB
  defaultTTL: 5 * 60 * 1000, // 5分钟
  cleanupInterval: 60 * 1000, // 1分钟清理间隔
  enableMetrics: true
})
```

### 预配置缓存实例

系统提供三个预配置的缓存实例：

1. **datasetCache**: 数据集缓存 (50MB, 10分钟TTL)
2. **metricsCache**: 指标缓存 (30MB, 5分钟TTL)  
3. **queryCache**: 查询缓存 (100MB, 3分钟TTL)

### 缓存失效管理器 (CacheInvalidator)

统一管理缓存失效策略：

```typescript
import { CacheInvalidator } from '@/lib/cache/CacheInvalidator'

// 数据集更新时自动失效相关缓存
CacheInvalidator.onDatasetUpdated(datasetId, 'fields')

// 指标更新时失效缓存
CacheInvalidator.onMetricUpdated(metricId, 'definition')
```

## 使用方法

### 数据集服务缓存

数据集服务自动使用缓存来提高性能：

```typescript
// 获取数据集（自动缓存）
const dataset = await DatasetService.getDataset(userId, datasetId)

// 预览数据集（带缓存）
const preview = await DatasetService.previewDataset(userId, datasetId, 100)

// 查询数据集（智能缓存键）
const result = await DatasetService.queryDataset(userId, datasetId, {
  measures: ['sales_amount'],
  dimensions: ['product_category'],
  filters: [],
  limit: 1000
})
```

### 指标服务缓存

指标服务提供缓存支持：

```typescript
import { metricsService } from '@/lib/metricsService'

// 获取指标列表（缓存5分钟）
const metrics = await metricsService.getMetrics({ category: 'sales' })

// 获取单个指标（缓存10分钟）
const metric = await metricsService.getMetric(metricId)

// 获取指标数据（缓存2分钟）
const data = await metricsService.getMetricData(metricId, { timeRange: '7d' })
```

### 手动缓存操作

```typescript
import { datasetCache, CacheKeys } from '@/lib/cache/CacheManager'

// 手动设置缓存
datasetCache.set('custom-key', data, {
  ttl: 10 * 60 * 1000, // 10分钟
  tags: ['custom', 'important']
})

// 获取缓存
const cachedData = datasetCache.get('custom-key')

// 使用 getOrSet 模式
const result = await datasetCache.getOrSet('expensive-computation', async () => {
  // 执行昂贵的计算
  return await heavyComputation()
}, { ttl: 30 * 60 * 1000 })
```

## 缓存键策略

系统使用结构化的缓存键命名：

```typescript
// 数据集相关
CacheKeys.dataset(id)                    // dataset:123
CacheKeys.datasetFields(id)              // dataset:fields:123
CacheKeys.datasetQuery(id, queryHash)    // dataset:query:123:abc123
CacheKeys.datasetPreview(id, limit)      // dataset:preview:123:100

// 指标相关
CacheKeys.metrics(userId, params)        // metrics:user123:{"category":"sales"}
CacheKeys.metricData(id, params)         // metric:data:123:{"range":"7d"}
```

## 性能监控

### API 端点

1. **GET /api/cache/stats** - 获取缓存统计
2. **POST /api/cache/stats** - 执行缓存操作
3. **GET /api/cache/config** - 获取缓存配置
4. **PUT /api/cache/config** - 更新缓存配置
5. **POST /api/cache/test** - 运行性能测试

### 统计指标

```typescript
const stats = datasetCache.getStats()
console.log({
  hitRate: stats.hitRate,              // 命中率 %
  memoryUsagePercent: stats.memoryUsagePercent, // 内存使用率 %
  entryCount: stats.entryCount,        // 缓存条目数
  averageEntrySize: stats.averageEntrySize     // 平均条目大小
})
```

### 缓存健康监控

```typescript
import { CacheInvalidator } from '@/lib/cache/CacheInvalidator'

// 获取所有缓存统计
const allStats = CacheInvalidator.getAllCacheStats()

// 检查缓存健康状态
const isHealthy = allStats.dataset.memoryUsagePercent < 80 &&
                 allStats.metrics.memoryUsagePercent < 80 &&
                 allStats.query.memoryUsagePercent < 80
```

## 配置优化

### 内存配置

根据服务器内存调整缓存大小：

```typescript
// 服务器内存 >= 8GB
datasetCache.updateConfig({ maxMemorySize: 100 }) // 100MB
metricsCache.updateConfig({ maxMemorySize: 50 })  // 50MB
queryCache.updateConfig({ maxMemorySize: 200 })   // 200MB

// 服务器内存 4-8GB (默认配置)
// dataset: 50MB, metrics: 30MB, query: 100MB

// 服务器内存 <= 4GB
datasetCache.updateConfig({ maxMemorySize: 25 })  // 25MB
metricsCache.updateConfig({ maxMemorySize: 15 })  // 15MB
queryCache.updateConfig({ maxMemorySize: 50 })    // 50MB
```

### TTL 策略

根据数据更新频率调整 TTL：

```typescript
// 静态数据（很少更新）
cache.set(key, data, { ttl: 30 * 60 * 1000 }) // 30分钟

// 半静态数据（每小时更新）
cache.set(key, data, { ttl: 15 * 60 * 1000 }) // 15分钟

// 动态数据（实时性要求高）
cache.set(key, data, { ttl: 2 * 60 * 1000 })  // 2分钟
```

### 清理策略

```typescript
// 高频清理（内存紧张时）
cache.updateConfig({ cleanupInterval: 30 * 1000 }) // 30秒

// 正常清理（默认）
cache.updateConfig({ cleanupInterval: 60 * 1000 }) // 1分钟

// 低频清理（内存充足时）
cache.updateConfig({ cleanupInterval: 5 * 60 * 1000 }) // 5分钟
```

## 最佳实践

### 1. 缓存键设计

- 使用结构化命名约定
- 包含版本信息以便失效
- 避免过长的键名

### 2. 数据序列化

- 缓存计算后的结果，而不是原始数据
- 避免缓存包含敏感信息的对象
- 使用合适的数据格式（JSON vs Binary）

### 3. 失效策略

- 数据更新时立即失效相关缓存
- 使用标签进行批量失效
- 避免雪崩效应（缓存同时失效）

### 4. 监控告警

- 监控命中率（< 70% 需要优化）
- 监控内存使用（> 80% 需要清理）
- 设置内存使用告警

### 5. 测试验证

```typescript
// 运行基础性能测试
POST /api/cache/test
{
  "testType": "basic",
  "iterations": 1000
}

// 内存压力测试
POST /api/cache/test
{
  "testType": "memory",
  "iterations": 5000
}

// 并发测试
POST /api/cache/test
{
  "testType": "concurrent",
  "iterations": 2000
}
```

## 性能指标

### 预期性能

- **写入性能**: 10,000+ ops/sec
- **读取性能**: 50,000+ ops/sec (缓存命中)
- **内存效率**: < 1KB 每条记录开销
- **命中率**: > 80% (稳定状态)

### 性能优化建议

1. **预热缓存**: 系统启动时预加载热点数据
2. **分层缓存**: 热数据使用更长 TTL
3. **异步更新**: 使用后台任务更新缓存
4. **压缩存储**: 大数据对象使用压缩
5. **批量操作**: 合并多个缓存操作

## 故障排除

### 常见问题

1. **内存泄漏**: 检查长时间运行的缓存条目
2. **命中率低**: 分析缓存键策略和 TTL 设置
3. **性能下降**: 监控内存使用和清理频率
4. **数据不一致**: 检查缓存失效机制

### 调试工具

```typescript
// 获取详细统计
const stats = CacheInvalidator.getAllCacheStats()

// 强制清理
CacheInvalidator.emergencyClearAll('Debug cleanup')

// 手动清理过期条目
const cleaned = datasetCache.cleanup()
```

## 版本历史

- **v1.0.0**: 基础缓存管理器
- **v1.1.0**: 添加标签支持和批量失效
- **v1.2.0**: 性能监控和统计API
- **v1.3.0**: 自动失效机制
- **v1.4.0**: 配置管理和测试工具

## 注意事项

1. **内存限制**: 缓存占用的内存不会被 Node.js 垃圾回收器立即释放
2. **数据一致性**: 缓存可能导致数据不一致，需要合理设置 TTL
3. **并发安全**: 当前实现不支持多进程共享缓存
4. **持久化**: 缓存数据在服务重启后会丢失
5. **安全性**: 避免缓存包含敏感信息

## 后续计划

- [ ] Redis 分布式缓存支持
- [ ] 缓存预热机制
- [ ] 更细粒度的权限控制
- [ ] 缓存数据压缩
- [ ] 持久化缓存选项