import { useState, useEffect } from 'react'

interface ChartDataHookOptions {
  metricId?: string
  metricType?: string
  refreshInterval?: number // 刷新间隔（毫秒）
  enabled?: boolean
}

export interface ChartDataPoint {
  name?: string
  date?: string
  value: number
  label?: string
  category?: string
  [key: string]: any
}

export function useChartData(options: ChartDataHookOptions = {}) {
  const { metricId, metricType, refreshInterval = 60000, enabled = true } = options
  
  const [data, setData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = async () => {
    if (!enabled) return
    
    setLoading(true)
    setError(null)

    try {
      let response: Response

      if (metricId) {
        // 获取特定指标的数据
        response = await fetch(`/api/metrics/${metricId}/data`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      } else if (metricType) {
        // 获取预定义指标类型的数据
        response = await fetch(`/api/data/query?metric=${metricType}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      } else {
        throw new Error('需要提供 metricId 或 metricType')
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setData(result.data || [])
        setLastUpdated(new Date())
      } else {
        throw new Error(result.error || '获取数据失败')
      }
    } catch (err) {
      console.error('获取图表数据失败:', err)
      setError(err instanceof Error ? err.message : '未知错误')
      
      // 发生错误时，如果没有现有数据，则使用空数组
      if (data.length === 0) {
        setData([])
      }
    } finally {
      setLoading(false)
    }
  }

  // 手动刷新数据
  const refreshData = () => {
    fetchData()
  }

  // 初始化和定时刷新
  useEffect(() => {
    if (enabled && (metricId || metricType)) {
      fetchData()
      
      // 设置定时刷新
      if (refreshInterval > 0) {
        const interval = setInterval(fetchData, refreshInterval)
        return () => clearInterval(interval)
      }
    }
  }, [metricId, metricType, enabled, refreshInterval])

  return {
    data,
    loading,
    error,
    lastUpdated,
    refreshData,
    isEmpty: data.length === 0 && !loading && !error
  }
}

// 格式化数据的工具函数
export const formatChartData = {
  // 格式化折线图数据
  forLineChart: (data: ChartDataPoint[]) => {
    return data.map(item => ({
      name: item.date || item.name || '',
      value: Number(item.value) || 0,
      ...item
    }))
  },

  // 格式化柱状图数据
  forBarChart: (data: ChartDataPoint[]) => {
    return data.map(item => ({
      name: item.name || item.category || '',
      value: Number(item.value) || 0,
      ...item
    }))
  },

  // 格式化饼图数据
  forPieChart: (data: ChartDataPoint[]) => {
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
    return data.map((item, index) => ({
      name: item.name || item.category || `项目${index + 1}`,
      value: Number(item.value) || 0,
      color: colors[index % colors.length],
      ...item
    }))
  },

  // 格式化KPI数据
  forKPICard: (data: ChartDataPoint[]) => {
    if (data.length === 0) {
      return {
        label: '暂无数据',
        value: '0',
        change: '0%',
        trend: 'neutral' as const,
        description: '暂无描述'
      }
    }

    const latestValue = data[data.length - 1]?.value || 0
    const previousValue = data[data.length - 2]?.value || latestValue
    const change = previousValue !== 0 ? ((latestValue - previousValue) / previousValue * 100) : 0
    
    return {
      label: '指标值',
      value: latestValue.toLocaleString(),
      change: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
      trend: (change > 0 ? 'up' : change < 0 ? 'down' : 'neutral') as const,
      description: '与上期相比'
    }
  },

  // 格式化仪表盘数据
  forGauge: (data: ChartDataPoint[]) => {
    if (data.length === 0) {
      return { value: 0, max: 100, label: '暂无数据', unit: '' }
    }

    const latestValue = data[data.length - 1]?.value || 0
    const maxValue = Math.max(...data.map(d => d.value), 100)
    
    return {
      value: latestValue,
      max: Math.ceil(maxValue * 1.2 / 10) * 10, // 向上取整到10的倍数
      label: '当前值',
      unit: data[data.length - 1]?.unit || ''
    }
  },

  // 格式化表格数据
  forTable: (data: ChartDataPoint[]) => {
    return data.map((item, index) => ({
      id: index + 1,
      name: item.name || `项目${index + 1}`,
      value: item.value,
      category: item.category || '',
      ...item
    }))
  }
}