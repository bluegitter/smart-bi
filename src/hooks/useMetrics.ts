import { useState, useEffect, useCallback } from 'react'
import { metricsService } from '@/lib/metricsService'
import type { Metric } from '@/types'

interface UseMetricsOptions {
  category?: string
  search?: string
  tags?: string[]
  autoFetch?: boolean
}

interface UseMetricsReturn {
  metrics: Metric[]
  loading: boolean
  error: string | null
  categories: string[]
  allTags: string[]
  total: number
  hasMore: boolean
  // 操作方法
  fetchMetrics: () => Promise<void>
  createMetric: (metric: Partial<Metric>) => Promise<void>
  updateMetric: (id: string, metric: Partial<Metric>) => Promise<void>
  deleteMetric: (id: string) => Promise<void>
  // 搜索和过滤
  setSearch: (search: string) => void
  setCategory: (category: string) => void
  setTags: (tags: string[]) => void
  clearFilters: () => void
}

export function useMetrics(options: UseMetricsOptions = {}): UseMetricsReturn {
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  
  // 过滤状态
  const [search, setSearch] = useState(options.search || '')
  const [category, setCategory] = useState(options.category || '')
  const [tags, setTags] = useState<string[]>(options.tags || [])

  // 获取指标数据
  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await metricsService.getMetrics({
        category: category || undefined,
        search: search || undefined,
        tags: tags.length > 0 ? tags : undefined,
        limit: 50 // 增加限制以获取更多数据
      })
      
      setMetrics(response.metrics || [])
      setCategories(response.categories || [])
      setAllTags(response.tags || [])
      setTotal(response.total || 0)
      setHasMore(response.hasMore || false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics')
      setMetrics([])
    } finally {
      setLoading(false)
    }
  }, [search, category, tags])

  // 创建指标
  const createMetric = useCallback(async (metricData: Partial<Metric>) => {
    try {
      setError(null)
      await metricsService.createMetric(metricData)
      await fetchMetrics() // 重新获取数据
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create metric'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [fetchMetrics])

  // 更新指标
  const updateMetric = useCallback(async (id: string, metricData: Partial<Metric>) => {
    try {
      setError(null)
      await metricsService.updateMetric(id, metricData)
      await fetchMetrics() // 重新获取数据
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update metric'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [fetchMetrics])

  // 删除指标
  const deleteMetric = useCallback(async (id: string) => {
    try {
      setError(null)
      await metricsService.deleteMetric(id)
      await fetchMetrics() // 重新获取数据
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete metric'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [fetchMetrics])

  // 清除所有过滤器
  const clearFilters = useCallback(() => {
    setSearch('')
    setCategory('')
    setTags([])
  }, [])

  // 自动获取数据
  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchMetrics()
    }
  }, [fetchMetrics, options.autoFetch])

  return {
    metrics,
    loading,
    error,
    categories,
    allTags,
    total,
    hasMore,
    // 操作方法
    fetchMetrics,
    createMetric,
    updateMetric,
    deleteMetric,
    // 搜索和过滤
    setSearch,
    setCategory,
    setTags,
    clearFilters
  }
}

// 简化版本，只获取指标列表
export function useMetricsList(limit = 20) {
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await metricsService.getMetrics({ limit })
        setMetrics(response.metrics || [])
      } catch (error) {
        console.error('Error fetching metrics:', error)
        setMetrics([])
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [limit])

  return { metrics, loading }
}

// 获取单个指标的hook
export function useMetric(id: string) {
  const [metric, setMetric] = useState<Metric | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchMetric = async () => {
      try {
        setLoading(true)
        setError(null)
        const fetchedMetric = await metricsService.getMetric(id)
        setMetric(fetchedMetric)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch metric')
        setMetric(null)
      } finally {
        setLoading(false)
      }
    }

    fetchMetric()
  }, [id])

  return { metric, loading, error }
}