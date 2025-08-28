import { useState, useEffect, useCallback } from 'react'
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

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  // 获取指标数据
  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const queryParams: any = { limit: 50 }
      if (category) queryParams.category = category
      if (search) queryParams.search = search
      if (tags.length > 0) queryParams.tags = tags
      
      const response = await fetch('/api/metrics', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(queryParams)
      })

      if (!response.ok) {
        throw new Error('Failed to fetch metrics')
      }

      const data = await response.json()
      
      setMetrics(data.metrics || [])
      setCategories(data.categories?.map((c: any) => c.name) || [])
      setAllTags(data.tags?.map((t: any) => t.name) || [])
      setTotal(data.pagination?.total || 0)
      setHasMore(data.pagination ? data.pagination.page < data.pagination.pages : false)
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
      const response = await fetch('/api/metrics', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(metricData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create metric')
      }

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
      const response = await fetch(`/api/metrics/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(metricData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update metric')
      }

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
      const response = await fetch(`/api/metrics/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete metric')
      }

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
        const token = localStorage.getItem('token')
        const response = await fetch('/api/metrics', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ limit })
        })

        if (response.ok) {
          const data = await response.json()
          setMetrics(data.metrics || [])
        } else {
          setMetrics([])
        }
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
        const token = localStorage.getItem('token')
        const response = await fetch(`/api/metrics/${id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        })

        if (response.ok) {
          const fetchedMetric = await response.json()
          setMetric(fetchedMetric)
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch metric')
        }
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