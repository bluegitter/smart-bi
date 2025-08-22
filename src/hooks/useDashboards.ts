import { useState, useEffect, useCallback } from 'react'
import { dashboardService } from '@/lib/services/dashboardService'
import { useAuth } from '@/contexts/AuthContext'
import type { Dashboard, ComponentLayout } from '@/types'

interface UseDashboardsOptions {
  userId?: string
  autoFetch?: boolean
}

interface UseDashboardsReturn {
  dashboards: Dashboard[]
  loading: boolean
  error: string | null
  total: number
  hasMore: boolean
  // 操作方法
  fetchDashboards: () => Promise<void>
  createDashboard: (dashboard: Partial<Dashboard>) => Promise<Dashboard>
  updateDashboard: (id: string, dashboard: Partial<Dashboard>) => Promise<Dashboard>
  deleteDashboard: (id: string) => Promise<void>
  cloneDashboard: (id: string, newName: string) => Promise<Dashboard>
  // 搜索和过滤
  searchDashboards: (query: string) => void
}

export function useDashboards(options: UseDashboardsOptions = {}): UseDashboardsReturn {
  const { user } = useAuth()
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const userId = options.userId || user?._id || 'user1' // 使用真实用户ID

  // 获取看板列表
  const fetchDashboards = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await dashboardService.getDashboards({
        userId,
        search: searchQuery || undefined,
        limit: 50
      })
      
      setDashboards(response.dashboards || [])
      setTotal(response.total || 0)
      setHasMore(response.hasMore || false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboards')
      setDashboards([])
    } finally {
      setLoading(false)
    }
  }, [userId, searchQuery])

  // 创建看板
  const createDashboard = useCallback(async (dashboardData: Partial<Dashboard>) => {
    try {
      setError(null)
      const newDashboard = await dashboardService.createDashboard({
        ...dashboardData,
        userId
      })
      await fetchDashboards() // 重新获取列表
      return newDashboard
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create dashboard'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [userId, fetchDashboards])

  // 更新看板
  const updateDashboard = useCallback(async (id: string, dashboardData: Partial<Dashboard>) => {
    try {
      setError(null)
      const updatedDashboard = await dashboardService.updateDashboard(id, {
        ...dashboardData,
        userId
      })
      await fetchDashboards() // 重新获取列表
      return updatedDashboard
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update dashboard'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [userId, fetchDashboards])

  // 删除看板
  const deleteDashboard = useCallback(async (id: string) => {
    try {
      setError(null)
      await dashboardService.deleteDashboard(id, userId)
      await fetchDashboards() // 重新获取列表
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete dashboard'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [userId, fetchDashboards])

  // 克隆看板
  const cloneDashboard = useCallback(async (id: string, newName: string) => {
    try {
      setError(null)
      const clonedDashboard = await dashboardService.cloneDashboard(id, newName, userId)
      await fetchDashboards() // 重新获取列表
      return clonedDashboard
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clone dashboard'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [userId, fetchDashboards])

  // 搜索看板
  const searchDashboards = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  // 自动获取数据
  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchDashboards()
    }
  }, [fetchDashboards, options.autoFetch])

  return {
    dashboards,
    loading,
    error,
    total,
    hasMore,
    // 操作方法
    fetchDashboards,
    createDashboard,
    updateDashboard,
    deleteDashboard,
    cloneDashboard,
    // 搜索
    searchDashboards
  }
}

// 管理单个看板的Hook
export function useDashboard(id: string | null, options: { userId?: string } = {}) {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const userId = options.userId || user?._id || 'user1'

  // 获取看板详情
  const fetchDashboard = useCallback(async () => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)
      const fetchedDashboard = await dashboardService.getDashboard(id, userId)
      setDashboard(fetchedDashboard)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard'
      // 如果是新创建的看板，可能暂时找不到，不设置为严重错误
      if (errorMessage.includes('Dashboard not found')) {
        console.log('Dashboard not found, might be a new dashboard:', id)
        setDashboard(null)
        setError(errorMessage)
      } else {
        setError(errorMessage)
        setDashboard(null)
      }
    } finally {
      setLoading(false)
    }
  }, [id, userId])

  // 保存看板
  const saveDashboard = useCallback(async (updates: Partial<Dashboard>) => {
    if (!id) return null

    try {
      setSaving(true)
      setError(null)
      const updatedDashboard = await dashboardService.updateDashboard(id, {
        ...updates,
        userId
      })
      setDashboard(updatedDashboard)
      return updatedDashboard
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save dashboard'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setSaving(false)
    }
  }, [id, userId])

  // 保存布局
  const saveLayout = useCallback(async (layout: Dashboard['layout']) => {
    return saveDashboard({ layout })
  }, [saveDashboard])

  // 添加组件
  const addComponent = useCallback(async (component: ComponentLayout) => {
    if (!dashboard) return null
    
    const updatedComponents = [...dashboard.layout.components, component]
    const updatedLayout = {
      ...dashboard.layout,
      components: updatedComponents
    }
    
    return saveLayout(updatedLayout)
  }, [dashboard, saveLayout])

  // 更新组件
  const updateComponent = useCallback(async (componentId: string, updates: Partial<ComponentLayout>) => {
    if (!dashboard) return null
    
    const updatedComponents = dashboard.layout.components.map(comp =>
      comp.id === componentId ? { ...comp, ...updates } : comp
    )
    
    const updatedLayout = {
      ...dashboard.layout,
      components: updatedComponents
    }
    
    return saveLayout(updatedLayout)
  }, [dashboard, saveLayout])

  // 删除组件
  const removeComponent = useCallback(async (componentId: string) => {
    if (!dashboard) return null
    
    const updatedComponents = dashboard.layout.components.filter(comp => comp.id !== componentId)
    const updatedLayout = {
      ...dashboard.layout,
      components: updatedComponents
    }
    
    return saveLayout(updatedLayout)
  }, [dashboard, saveLayout])

  // 初始化数据
  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  return {
    dashboard,
    loading,
    error,
    saving,
    // 操作方法
    fetchDashboard,
    saveDashboard,
    saveLayout,
    addComponent,
    updateComponent,
    removeComponent
  }
}