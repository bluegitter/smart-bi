'use client'

import { useState, useEffect } from 'react'
import { DataSource } from '@/types'

interface CreateDataSourceRequest {
  name: string
  type: string
  config: Record<string, any>
}

interface UpdateDataSourceRequest {
  name?: string
  type?: string
  config?: Record<string, any>
  isActive?: boolean
}

interface TestConnectionRequest {
  type: string
  config: Record<string, any>
}

interface TestConnectionResponse {
  success: boolean
  message: string
  schema?: {
    tables: Array<{
      name: string
      columns: Array<{
        name: string
        type: string
        nullable: boolean
      }>
    }>
  }
  error?: string
}

interface DataSourcesResponse {
  dataSources: DataSource[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export function useDataSources() {
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  // 获取数据源列表
  const fetchDataSources = async (params?: {
    page?: number
    limit?: number
    type?: string
    search?: string
  }) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/datasources', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params || {})
      })

      if (!response.ok) {
        throw new Error('Failed to fetch data sources')
      }

      const data: DataSourcesResponse = await response.json()
      setDataSources(data.dataSources)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // 获取单个数据源
  const fetchDataSource = async (id: string): Promise<DataSource> => {
    const response = await fetch(`/api/datasources/${id}`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    })

    if (!response.ok) {
      throw new Error('Failed to fetch data source')
    }

    return response.json()
  }

  // 创建数据源
  const createDataSource = async (data: CreateDataSourceRequest): Promise<DataSource> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/datasources', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create data source')
      }

      const newDataSource = await response.json()
      setDataSources(prev => [newDataSource, ...prev])
      return newDataSource
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // 更新数据源
  const updateDataSource = async (id: string, data: UpdateDataSourceRequest): Promise<DataSource> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/datasources/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update data source')
      }

      const updatedDataSource = await response.json()
      setDataSources(prev => 
        prev.map(ds => ds._id === id ? updatedDataSource : ds)
      )
      return updatedDataSource
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // 删除数据源
  const deleteDataSource = async (id: string): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/datasources/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete data source')
      }

      setDataSources(prev => prev.filter(ds => ds._id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // 测试连接
  const testConnection = async (data: TestConnectionRequest): Promise<TestConnectionResponse> => {
    const response = await fetch('/api/datasources/test', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Connection test failed')
    }

    return response.json()
  }

  // 初始加载
  useEffect(() => {
    fetchDataSources()
  }, [])

  return {
    dataSources,
    loading,
    error,
    fetchDataSources,
    fetchDataSource,
    createDataSource,
    updateDataSource,
    deleteDataSource,
    testConnection,
    setError
  }
}