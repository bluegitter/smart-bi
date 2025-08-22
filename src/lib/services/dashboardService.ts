import type { Dashboard, ComponentLayout } from '@/types'

export class DashboardService {
  private baseURL = '/api/dashboards'

  // 获取看板列表
  async getDashboards(params?: {
    userId?: string
    page?: number
    limit?: number
    search?: string
  }) {
    const searchParams = new URLSearchParams()
    
    if (params?.userId) searchParams.append('userId', params.userId)
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)

    const response = await fetch(`${this.baseURL}?${searchParams}`)
    if (!response.ok) {
      throw new Error('Failed to fetch dashboards')
    }
    
    return response.json()
  }

  // 获取单个看板
  async getDashboard(id: string, userId?: string): Promise<Dashboard> {
    const searchParams = new URLSearchParams()
    if (userId) searchParams.append('userId', userId)

    const response = await fetch(`${this.baseURL}/${id}?${searchParams}`)
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Dashboard not found')
      } else if (response.status === 403) {
        throw new Error('Access denied')
      }
      throw new Error('Failed to fetch dashboard')
    }
    
    return response.json()
  }

  // 创建看板
  async createDashboard(dashboard: Partial<Dashboard>): Promise<Dashboard> {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dashboard)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create dashboard')
    }
    
    return response.json()
  }

  // 更新看板
  async updateDashboard(id: string, dashboard: Partial<Dashboard>): Promise<Dashboard> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dashboard)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update dashboard')
    }
    
    return response.json()
  }

  // 删除看板
  async deleteDashboard(id: string, userId?: string): Promise<void> {
    const searchParams = new URLSearchParams()
    if (userId) searchParams.append('userId', userId)

    const response = await fetch(`${this.baseURL}/${id}?${searchParams}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete dashboard')
    }
  }

  // 克隆看板
  async cloneDashboard(id: string, newName: string, userId?: string): Promise<Dashboard> {
    const response = await fetch(`${this.baseURL}/clone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, newName, userId })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to clone dashboard')
    }
    
    return response.json()
  }

  // 保存看板布局
  async saveDashboardLayout(id: string, layout: Dashboard['layout'], userId?: string): Promise<Dashboard> {
    return this.updateDashboard(id, { 
      layout,
      userId,
      updatedAt: new Date()
    })
  }

  // 添加组件到看板
  async addComponent(dashboardId: string, component: ComponentLayout, userId?: string): Promise<Dashboard> {
    const dashboard = await this.getDashboard(dashboardId, userId)
    
    const updatedComponents = [...dashboard.layout.components, component]
    const updatedLayout = {
      ...dashboard.layout,
      components: updatedComponents
    }

    return this.saveDashboardLayout(dashboardId, updatedLayout, userId)
  }

  // 更新组件
  async updateComponent(
    dashboardId: string, 
    componentId: string, 
    updates: Partial<ComponentLayout>,
    userId?: string
  ): Promise<Dashboard> {
    const dashboard = await this.getDashboard(dashboardId, userId)
    
    const updatedComponents = dashboard.layout.components.map(comp =>
      comp.id === componentId ? { ...comp, ...updates } : comp
    )
    
    const updatedLayout = {
      ...dashboard.layout,
      components: updatedComponents
    }

    return this.saveDashboardLayout(dashboardId, updatedLayout, userId)
  }

  // 删除组件
  async removeComponent(dashboardId: string, componentId: string, userId?: string): Promise<Dashboard> {
    const dashboard = await this.getDashboard(dashboardId, userId)
    
    const updatedComponents = dashboard.layout.components.filter(comp => comp.id !== componentId)
    const updatedLayout = {
      ...dashboard.layout,
      components: updatedComponents
    }

    return this.saveDashboardLayout(dashboardId, updatedLayout, userId)
  }

  // 验证看板数据
  validateDashboard(dashboard: Partial<Dashboard>): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!dashboard.name?.trim()) {
      errors.push('看板名称不能为空')
    }

    if (dashboard.name && dashboard.name.length > 100) {
      errors.push('看板名称长度不能超过100个字符')
    }

    if (dashboard.description && dashboard.description.length > 500) {
      errors.push('看板描述长度不能超过500个字符')
    }

    // 验证布局
    if (dashboard.layout) {
      if (!dashboard.layout.grid || 
          typeof dashboard.layout.grid.columns !== 'number' ||
          typeof dashboard.layout.grid.rows !== 'number') {
        errors.push('无效的网格配置')
      }

      if (dashboard.layout.components) {
        dashboard.layout.components.forEach((component, index) => {
          if (!component.id) {
            errors.push(`组件 ${index + 1} 缺少ID`)
          }
          if (!component.type) {
            errors.push(`组件 ${index + 1} 缺少类型`)
          }
          if (!component.position || typeof component.position.x !== 'number' || typeof component.position.y !== 'number') {
            errors.push(`组件 ${index + 1} 位置信息无效`)
          }
          if (!component.size || typeof component.size.width !== 'number' || typeof component.size.height !== 'number') {
            errors.push(`组件 ${index + 1} 尺寸信息无效`)
          }
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // 生成组件ID
  generateComponentId(): string {
    return `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // 导出看板配置
  exportDashboard(dashboard: Dashboard): string {
    const exportData = {
      name: dashboard.name,
      description: dashboard.description,
      layout: dashboard.layout,
      globalConfig: dashboard.globalConfig,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }

    return JSON.stringify(exportData, null, 2)
  }

  // 导入看板配置
  async importDashboard(configJson: string, userId?: string): Promise<Dashboard> {
    try {
      const config = JSON.parse(configJson)
      
      // 验证导入的配置
      if (!config.name || !config.layout) {
        throw new Error('无效的看板配置文件')
      }

      const importedDashboard = {
        name: `${config.name} (导入)`,
        description: config.description || '',
        layout: config.layout,
        globalConfig: config.globalConfig || {
          theme: 'light',
          refreshInterval: 300000,
          timezone: 'Asia/Shanghai'
        },
        userId
      }

      // 为所有组件生成新ID
      if (importedDashboard.layout.components) {
        importedDashboard.layout.components = importedDashboard.layout.components.map(comp => ({
          ...comp,
          id: this.generateComponentId()
        }))
      }

      return this.createDashboard(importedDashboard)
    } catch (error) {
      throw new Error('导入看板配置失败：' + (error instanceof Error ? error.message : '未知错误'))
    }
  }
}

// 单例实例
export const dashboardService = new DashboardService()