import type { Metric } from '@/types'
import { metricsCache, CacheKeys } from '@/lib/cache/CacheManager'

export class MetricsService {
  private baseURL = '/api/metrics'

  // 获取指标列表
  async getMetrics(params?: {
    category?: string
    search?: string
    tags?: string[]
    page?: number
    limit?: number
  }) {
    const paramsStr = JSON.stringify(params || {})
    const cacheKey = CacheKeys.metrics('current_user', paramsStr)
    
    return metricsCache.getOrSet(cacheKey, async () => {
      const searchParams = new URLSearchParams()
      
      if (params?.category) searchParams.append('category', params.category)
      if (params?.search) searchParams.append('search', params.search)
      if (params?.tags && params.tags.length > 0) searchParams.append('tags', params.tags.join(','))
      if (params?.page) searchParams.append('page', params.page.toString())
      if (params?.limit) searchParams.append('limit', params.limit.toString())

      const response = await fetch(`${this.baseURL}?${searchParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch metrics')
      }
      
      return response.json()
    }, {
      ttl: 5 * 60 * 1000, // 5 minutes
      tags: ['metrics', 'list']
    })
  }

  // 获取单个指标
  async getMetric(id: string): Promise<Metric> {
    const cacheKey = `metric:${id}`
    
    return metricsCache.getOrSet(cacheKey, async () => {
      const response = await fetch(`${this.baseURL}/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch metric')
      }
      
      return response.json()
    }, {
      ttl: 10 * 60 * 1000, // 10 minutes
      tags: [`metric:${id}`]
    })
  }

  // 创建指标
  async createMetric(metric: Partial<Metric>): Promise<Metric> {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create metric')
    }
    
    const result = await response.json()
    
    // 清除指标列表缓存
    this.invalidateMetricListCache()
    
    return result
  }

  // 更新指标
  async updateMetric(id: string, metric: Partial<Metric>): Promise<Metric> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update metric')
    }
    
    const result = await response.json()
    
    // 清除相关缓存
    this.invalidateMetricCache(id)
    
    return result
  }

  // 删除指标
  async deleteMetric(id: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete metric')
    }
    
    // 清除相关缓存
    this.invalidateMetricCache(id)
  }

  // 验证指标名称
  validateMetricName(name: string): { isValid: boolean; error?: string } {
    if (!name.trim()) {
      return { isValid: false, error: '指标名称不能为空' }
    }
    
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
      return { isValid: false, error: '指标名称只能包含字母、数字和下划线，且必须以字母或下划线开头' }
    }
    
    if (name.length > 50) {
      return { isValid: false, error: '指标名称长度不能超过50个字符' }
    }
    
    return { isValid: true }
  }

  // 验证计算公式
  validateFormula(formula: string, metricType: Metric['type']): { isValid: boolean; error?: string } {
    if (metricType === 'custom' && !formula.trim()) {
      return { isValid: false, error: '自定义类型必须提供计算公式' }
    }
    
    // 基本SQL关键词检查
    const dangerousKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE']
    const upperFormula = formula.toUpperCase()
    
    for (const keyword of dangerousKeywords) {
      if (upperFormula.includes(keyword)) {
        return { isValid: false, error: `计算公式不能包含危险操作：${keyword}` }
      }
    }
    
    return { isValid: true }
  }

  // 根据指标类型生成默认公式模板
  getFormulaTemplate(metricType: Metric['type']): string {
    switch (metricType) {
      case 'count':
        return 'COUNT(table.column)'
      case 'sum':
        return 'SUM(table.column)'
      case 'avg':
        return 'AVG(table.column)'
      case 'max':
        return 'MAX(table.column)'
      case 'min':
        return 'MIN(table.column)'
      case 'ratio':
        return '(COUNT(table.column1) / COUNT(table.column2)) * 100'
      case 'custom':
        return '-- 请输入自定义SQL表达式'
      default:
        return ''
    }
  }

  // 获取推荐的指标类型
  getRecommendedType(metricName: string): Metric['type'] {
    const name = metricName.toLowerCase()
    
    if (name.includes('count') || name.includes('number') || name.includes('数量') || name.includes('个数')) {
      return 'count'
    }
    
    if (name.includes('amount') || name.includes('total') || name.includes('sum') || name.includes('金额') || name.includes('总额')) {
      return 'sum'
    }
    
    if (name.includes('avg') || name.includes('average') || name.includes('mean') || name.includes('平均')) {
      return 'avg'
    }
    
    if (name.includes('rate') || name.includes('ratio') || name.includes('percentage') || name.includes('率') || name.includes('比')) {
      return 'ratio'
    }
    
    if (name.includes('max') || name.includes('maximum') || name.includes('最大') || name.includes('峰值')) {
      return 'max'
    }
    
    if (name.includes('min') || name.includes('minimum') || name.includes('最小') || name.includes('最低')) {
      return 'min'
    }
    
    return 'count' // 默认类型
  }

  // 获取推荐的分类
  getRecommendedCategory(metricName: string): string {
    const name = metricName.toLowerCase()
    
    if (name.includes('sales') || name.includes('order') || name.includes('revenue') || 
        name.includes('销售') || name.includes('订单') || name.includes('收入')) {
      return '销售'
    }
    
    if (name.includes('user') || name.includes('customer') || name.includes('用户') || name.includes('客户')) {
      return '用户'
    }
    
    if (name.includes('marketing') || name.includes('campaign') || name.includes('营销') || name.includes('推广')) {
      return '营销'
    }
    
    if (name.includes('financial') || name.includes('profit') || name.includes('cost') || 
        name.includes('财务') || name.includes('利润') || name.includes('成本')) {
      return '财务'
    }
    
    if (name.includes('website') || name.includes('page') || name.includes('traffic') || 
        name.includes('网站') || name.includes('页面') || name.includes('流量')) {
      return '网站'
    }
    
    return '其他'
  }

  // 获取推荐的单位
  getRecommendedUnit(metricName: string, metricType: Metric['type']): string {
    const name = metricName.toLowerCase()
    
    if (metricType === 'ratio') {
      return '%'
    }
    
    if (name.includes('amount') || name.includes('price') || name.includes('cost') || 
        name.includes('金额') || name.includes('价格') || name.includes('成本')) {
      return '元'
    }
    
    if (name.includes('count') || name.includes('number') || name.includes('数量') || name.includes('个数')) {
      return '个'
    }
    
    if (name.includes('user') || name.includes('customer') || name.includes('people') || 
        name.includes('用户') || name.includes('客户') || name.includes('人')) {
      return '人'
    }
    
    if (name.includes('time') || name.includes('duration') || name.includes('时间') || name.includes('耗时')) {
      return '秒'
    }
    
    if (name.includes('views') || name.includes('clicks') || name.includes('浏览') || name.includes('点击')) {
      return '次'
    }
    
    return ''
  }

  // 缓存辅助方法

  /**
   * 清除特定指标的缓存
   */
  private invalidateMetricCache(id: string): void {
    metricsCache.removeByTags([`metric:${id}`])
    this.invalidateMetricListCache()
    console.log(`清除指标 ${id} 相关缓存`)
  }

  /**
   * 清除指标列表缓存
   */
  private invalidateMetricListCache(): void {
    metricsCache.removeByTags(['metrics', 'list'])
    console.log('清除指标列表缓存')
  }

  /**
   * 获取指标数据（带缓存）
   */
  async getMetricData(id: string, params?: any) {
    const paramsStr = JSON.stringify(params || {})
    const cacheKey = CacheKeys.metricData(id, paramsStr)
    
    return metricsCache.getOrSet(cacheKey, async () => {
      const searchParams = new URLSearchParams()
      if (params) {
        Object.keys(params).forEach(key => {
          if (params[key] !== undefined && params[key] !== null) {
            searchParams.append(key, params[key].toString())
          }
        })
      }
      
      const url = `${this.baseURL}/${id}/data${searchParams.toString() ? '?' + searchParams.toString() : ''}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch metric data')
      }
      
      return response.json()
    }, {
      ttl: 2 * 60 * 1000, // 2 minutes for metric data
      tags: [`metric:${id}`, 'data']
    })
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    return {
      metricsCache: metricsCache.getStats()
    }
  }

  /**
   * 手动清理缓存
   */
  cleanupCache() {
    const cleaned = metricsCache.cleanup()
    return {
      metricsCleaned: cleaned,
      total: cleaned
    }
  }
}

// 单例实例
export const metricsService = new MetricsService()