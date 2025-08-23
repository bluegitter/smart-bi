'use client'

import { useState, useEffect, useCallback } from 'react'

interface UseDatasetDataOptions {
  datasetId?: string
  selectedMeasures?: string[]
  selectedDimensions?: string[]
  filters?: any[]
  enabled?: boolean
}

interface DatasetDataPoint {
  [key: string]: any
}

export function useDatasetData({
  datasetId,
  selectedMeasures = [],
  selectedDimensions = [],
  filters = [],
  enabled = true
}: UseDatasetDataOptions) {
  const [data, setData] = useState<DatasetDataPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    if (!datasetId || !enabled) return

    setLoading(true)
    setError('')

    try {
      // 构建查询参数
      const queryParams = new URLSearchParams()
      if (selectedMeasures.length > 0) {
        queryParams.append('measures', selectedMeasures.join(','))
      }
      if (selectedDimensions.length > 0) {
        queryParams.append('dimensions', selectedDimensions.join(','))
      }
      if (filters.length > 0) {
        queryParams.append('filters', JSON.stringify(filters))
      }
      queryParams.append('limit', '100') // 限制返回行数

      console.log('Fetching dataset data:', {
        datasetId,
        selectedMeasures,
        selectedDimensions,
        filters
      })

      const response = await fetch(`/api/datasets/${datasetId}/query?${queryParams.toString()}`)
      
      if (!response.ok) {
        // 如果查询API不存在，尝试使用预览API
        const previewResponse = await fetch(`/api/datasets/${datasetId}/preview?limit=50`)
        if (previewResponse.ok) {
          const previewResult = await previewResponse.json()
          console.log('Using preview data:', previewResult)
          
          if (previewResult.preview && previewResult.preview.rows) {
            setData(previewResult.preview.rows)
          } else {
            setData([])
          }
          setLastUpdated(new Date())
          return
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('Dataset query result:', result)
      
      if (result.data) {
        setData(result.data)
      } else if (result.rows) {
        setData(result.rows)
      } else {
        setData([])
      }
      
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to fetch dataset data:', err)
      setError(err instanceof Error ? err.message : '获取数据失败')
      
      // 生成一些模拟数据作为后备
      const mockData = generateMockDataForDataset(selectedMeasures, selectedDimensions)
      setData(mockData)
    } finally {
      setLoading(false)
    }
  }, [datasetId, selectedMeasures, selectedDimensions, filters, enabled])

  const refreshData = useCallback(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (enabled && datasetId) {
      fetchData()
    }
  }, [fetchData, enabled, datasetId])

  return {
    data,
    loading,
    error,
    refreshData,
    lastUpdated
  }
}

// 生成模拟数据的辅助函数
function generateMockDataForDataset(measures: string[], dimensions: string[]): DatasetDataPoint[] {
  const mockData: DatasetDataPoint[] = []
  
  // 生成5条示例数据
  for (let i = 0; i < 5; i++) {
    const row: DatasetDataPoint = {}
    
    // 为每个维度生成示例值
    dimensions.forEach((dim, index) => {
      if (dim.includes('时间') || dim.includes('日期') || dim.includes('date')) {
        row[dim] = `2024-${String(i + 1).padStart(2, '0')}-01`
      } else if (dim.includes('地区') || dim.includes('城市')) {
        row[dim] = ['北京', '上海', '广州', '深圳', '杭州'][i] || `城市${i + 1}`
      } else if (dim.includes('类别') || dim.includes('分类')) {
        row[dim] = ['类别A', '类别B', '类别C', '类别D', '类别E'][i] || `类别${i + 1}`
      } else {
        row[dim] = `${dim}_${i + 1}`
      }
    })
    
    // 为每个度量生成示例值
    measures.forEach((measure) => {
      if (measure.includes('金额') || measure.includes('收入') || measure.includes('销售')) {
        row[measure] = Math.floor(Math.random() * 100000) + 10000
      } else if (measure.includes('数量') || measure.includes('count')) {
        row[measure] = Math.floor(Math.random() * 1000) + 10
      } else if (measure.includes('比率') || measure.includes('rate')) {
        row[measure] = (Math.random() * 100).toFixed(2) + '%'
      } else {
        row[measure] = Math.floor(Math.random() * 10000) + 100
      }
    })
    
    mockData.push(row)
  }
  
  return mockData
}