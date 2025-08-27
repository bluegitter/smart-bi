import { datasetCache, metricsCache, queryCache } from './CacheManager'

/**
 * 缓存失效管理器
 * 负责统一管理各种数据变更时的缓存失效策略
 */
export class CacheInvalidator {
  
  /**
   * 数据集更新时的缓存失效策略
   */
  static onDatasetUpdated(datasetId: string, updateType: 'fields' | 'data' | 'metadata' | 'permissions' = 'data') {
    console.log(`Dataset ${datasetId} updated (type: ${updateType}), invalidating caches...`)
    
    // 清除数据集本身的缓存
    datasetCache.removeByTags([`dataset:${datasetId}`])
    
    // 根据更新类型决定清除范围
    switch (updateType) {
      case 'fields':
        // 字段更新影响所有查询结果
        queryCache.removeByTags([`dataset:${datasetId}`])
        break
      case 'data':
        // 数据更新影响查询结果和预览
        queryCache.removeByTags([`dataset:${datasetId}`])
        break
      case 'metadata':
        // 元数据更新只影响数据集本身
        break
      case 'permissions':
        // 权限更新影响数据集访问
        datasetCache.removeByTags([`dataset:${datasetId}`])
        break
    }
  }

  /**
   * 指标更新时的缓存失效策略
   */
  static onMetricUpdated(metricId: string, updateType: 'definition' | 'data' | 'metadata' = 'data') {
    console.log(`Metric ${metricId} updated (type: ${updateType}), invalidating caches...`)
    
    // 清除指标本身的缓存
    metricsCache.removeByTags([`metric:${metricId}`])
    
    // 清除指标列表缓存
    metricsCache.removeByTags(['metrics', 'list'])
    
    // 如果是定义更新，可能影响依赖的其他指标
    if (updateType === 'definition') {
      // 这里可以扩展依赖分析
      console.log(`Metric ${metricId} definition updated, checking dependencies...`)
    }
  }

  /**
   * 数据源更新时的缓存失效策略
   */
  static onDatasourceUpdated(datasourceId: string, updateType: 'config' | 'schema' | 'permissions' = 'config') {
    console.log(`Datasource ${datasourceId} updated (type: ${updateType}), invalidating caches...`)
    
    // 数据源更新可能影响多个数据集
    // 这里需要查找所有使用此数据源的数据集
    this.invalidateDatasetsByDatasource(datasourceId, updateType)
  }

  /**
   * 用户权限更新时的缓存失效策略
   */
  static onUserPermissionsUpdated(userId: string, resourceType: 'dataset' | 'metric' | 'datasource', resourceId?: string) {
    console.log(`User ${userId} permissions updated for ${resourceType}${resourceId ? ` ${resourceId}` : ''}`)
    
    if (resourceId) {
      // 特定资源的权限更新
      switch (resourceType) {
        case 'dataset':
          datasetCache.removeByTags([`dataset:${resourceId}`, `user:${userId}`])
          queryCache.removeByTags([`dataset:${resourceId}`])
          break
        case 'metric':
          metricsCache.removeByTags([`metric:${resourceId}`])
          break
        case 'datasource':
          this.invalidateDatasetsByDatasource(resourceId, 'permissions')
          break
      }
    } else {
      // 用户整体权限更新，清除该用户相关的所有缓存
      datasetCache.removeByTags([`user:${userId}`])
      metricsCache.removeByTags([`user:${userId}`])
      queryCache.removeByTags([`user:${userId}`])
    }
  }

  /**
   * 系统配置更新时的缓存失效策略
   */
  static onSystemConfigUpdated(configType: 'cache' | 'database' | 'security' | 'performance') {
    console.log(`System config updated (type: ${configType}), evaluating cache impact...`)
    
    switch (configType) {
      case 'cache':
        // 缓存配置更新，可能需要重新配置缓存管理器
        break
      case 'database':
        // 数据库配置更新，可能影响数据查询
        queryCache.clear()
        break
      case 'security':
        // 安全配置更新，清除所有与权限相关的缓存
        datasetCache.clear()
        metricsCache.clear()
        break
      case 'performance':
        // 性能配置更新，可能需要调整缓存策略
        break
    }
  }

  /**
   * 批量失效操作
   */
  static invalidateBatch(operations: Array<{
    type: 'dataset' | 'metric' | 'datasource' | 'user' | 'system'
    id: string
    updateType?: string
  }>) {
    console.log(`Executing batch cache invalidation for ${operations.length} operations`)
    
    operations.forEach(op => {
      switch (op.type) {
        case 'dataset':
          this.onDatasetUpdated(op.id, op.updateType as any)
          break
        case 'metric':
          this.onMetricUpdated(op.id, op.updateType as any)
          break
        case 'datasource':
          this.onDatasourceUpdated(op.id, op.updateType as any)
          break
        case 'user':
          this.onUserPermissionsUpdated(op.id, 'dataset') // 简化处理
          break
        case 'system':
          this.onSystemConfigUpdated(op.updateType as any)
          break
      }
    })
  }

  /**
   * 定时清理过期缓存
   */
  static scheduleCleanup(intervalMs: number = 5 * 60 * 1000) { // 默认5分钟
    setInterval(() => {
      console.log('Performing scheduled cache cleanup...')
      
      const datasetCleaned = datasetCache.cleanup()
      const metricsCleaned = metricsCache.cleanup()
      const queryCleaned = queryCache.cleanup()
      
      const total = datasetCleaned + metricsCleaned + queryCleaned
      if (total > 0) {
        console.log(`Cleaned up ${total} expired cache entries (datasets: ${datasetCleaned}, metrics: ${metricsCleaned}, queries: ${queryCleaned})`)
      }
    }, intervalMs)
  }

  /**
   * 获取所有缓存的统计信息
   */
  static getAllCacheStats() {
    return {
      dataset: datasetCache.getStats(),
      metrics: metricsCache.getStats(),
      query: queryCache.getStats(),
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 紧急清理所有缓存
   */
  static emergencyClearAll(reason?: string) {
    console.warn(`Emergency cache clear triggered${reason ? `: ${reason}` : ''}`)
    
    datasetCache.clear()
    metricsCache.clear()
    queryCache.clear()
    
    console.log('All caches cleared')
  }

  // 私有辅助方法

  /**
   * 根据数据源ID失效相关数据集缓存
   */
  private static invalidateDatasetsByDatasource(datasourceId: string, updateType: string) {
    // 这是一个简化实现，实际应该查询数据库找到所有使用此数据源的数据集
    // 为了性能，这里使用标签模式清理
    
    console.log(`Invalidating datasets using datasource ${datasourceId} (update: ${updateType})`)
    
    // 清除所有可能相关的数据集缓存
    // 在实际实现中，应该维护数据源与数据集的映射关系
    if (updateType === 'schema' || updateType === 'config') {
      // 架构或配置更新影响查询结果
      queryCache.removeByTags([`datasource:${datasourceId}`])
    }
    
    // 可以考虑在缓存键中包含数据源信息以便精确清理
    datasetCache.removeByTags([`datasource:${datasourceId}`])
  }
}

// 自动启动定时清理
if (typeof window === 'undefined') { // 只在服务端启动
  CacheInvalidator.scheduleCleanup()
}

export { CacheInvalidator as cacheInvalidator }