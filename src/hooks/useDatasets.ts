'use client'

import { useState, useCallback, useEffect } from 'react'
import { getAuthHeaders } from '@/lib/authUtils'
import type { Dataset, DatasetSearchParams, DatasetListResponse } from '@/types/dataset'

export function useDatasets() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [filters, setFilters] = useState({
    categories: [] as string[],
    tags: [] as string[],
    types: [] as string[]
  })

  const searchDatasets = useCallback(async (params: DatasetSearchParams = {}) => {
    setLoading(true)
    setError(null)

    try {
      const searchParams = new URLSearchParams()
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            searchParams.set(key, value.join(','))
          } else {
            searchParams.set(key, String(value))
          }
        }
      })

      const response = await fetch(`/api/datasets?${searchParams}`, {
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error('获取数据集列表失败')
      }

      const data: DatasetListResponse = await response.json()
      
      setDatasets(data.datasets)
      setPagination(data.pagination)
      setFilters(data.filters)
    } catch (error) {
      console.error('搜索数据集失败:', error)
      setError(error instanceof Error ? error.message : '获取数据集列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshDatasets = useCallback(() => {
    searchDatasets({ page: pagination.page })
  }, [searchDatasets, pagination.page])

  // 初始加载
  useEffect(() => {
    searchDatasets()
  }, [searchDatasets])

  return {
    datasets,
    loading,
    error,
    pagination,
    filters,
    searchDatasets,
    refreshDatasets
  }
}

export function useDataset(datasetId?: string) {
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDataset = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/datasets/${id}`, {
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error('获取数据集失败')
      }

      const data = await response.json()
      setDataset(data.dataset)
    } catch (error) {
      console.error('获取数据集失败:', error)
      setError(error instanceof Error ? error.message : '获取数据集失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const save = useCallback(async (datasetData: any) => {
    setLoading(true)
    setError(null)

    try {
      const url = datasetId ? `/api/datasets/${datasetId}` : '/api/datasets'
      const method = datasetId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datasetData)
      })

      if (!response.ok) {
        throw new Error('保存数据集失败')
      }

      const data = await response.json()
      setDataset(data.dataset)
      
      return data.dataset
    } catch (error) {
      console.error('保存数据集失败:', error)
      setError(error instanceof Error ? error.message : '保存数据集失败')
      throw error
    } finally {
      setLoading(false)
    }
  }, [datasetId])

  const preview = useCallback(async (id: string, limit: number = 100) => {
    try {
      const response = await fetch(`/api/datasets/${id}/preview?limit=${limit}`, {
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error('预览数据集失败')
      }

      const data = await response.json()
      return data.preview
    } catch (error) {
      console.error('预览数据集失败:', error)
      throw error
    }
  }, [])

  const deleteDataset = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/datasets/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error('删除数据集失败')
      }

      setDataset(null)
    } catch (error) {
      console.error('删除数据集失败:', error)
      throw error
    }
  }, [])

  const refresh = useCallback(() => {
    if (datasetId) {
      fetchDataset(datasetId)
    }
  }, [datasetId, fetchDataset])

  useEffect(() => {
    if (datasetId) {
      fetchDataset(datasetId)
    }
  }, [datasetId, fetchDataset])

  return {
    dataset,
    loading,
    error,
    save,
    preview,
    refresh,
    delete: deleteDataset
  }
}