import { ObjectId } from 'mongodb'
import { connectToDatabase } from '../mongodb'
import type { Dashboard, ComponentLayout } from '@/types'

export class DashboardModel {
  private collection = 'dashboards'

  async getCollection() {
    const { db } = await connectToDatabase()
    return db.collection(this.collection)
  }

  // 获取看板列表
  async getDashboards(params: {
    userId?: string
    page?: number
    limit?: number
    search?: string
  } = {}) {
    const collection = await this.getCollection()
    const { userId = 'user1', page = 1, limit = 20, search } = params

    // 构建查询条件
    const query: any = {
      $or: [
        { userId },
        { 'permissions.userId': userId },
        { isPublic: true }
      ]
    }

    // 搜索过滤
    if (search) {
      query.$and = [
        query.$or ? { $or: query.$or } : {},
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ]
        }
      ]
      delete query.$or
    }

    // 分页
    const skip = (page - 1) * limit

    const [dashboards, total] = await Promise.all([
      collection
        .find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(query)
    ])

    return {
      dashboards: dashboards.map(this.transformToClientFormat),
      total,
      page,
      limit,
      hasMore: skip + dashboards.length < total
    }
  }

  // 获取单个看板
  async getDashboard(id: string, userId?: string): Promise<Dashboard> {
    const collection = await this.getCollection()
    
    const dashboard = await collection.findOne({ 
      _id: new ObjectId(id)
    })

    if (!dashboard) {
      throw new Error('Dashboard not found')
    }

    // 检查权限
    const hasPermission = 
      dashboard.userId === userId ||
      dashboard.isPublic ||
      dashboard.permissions?.some((p: any) => p.userId === userId)

    if (userId && !hasPermission) {
      throw new Error('Access denied')
    }

    return this.transformToClientFormat(dashboard)
  }

  // 创建看板
  async createDashboard(dashboardData: Partial<Dashboard>): Promise<Dashboard> {
    const collection = await this.getCollection()
    
    const newDashboard = {
      ...dashboardData,
      _id: new ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: dashboardData.userId || 'user1',
      isPublic: dashboardData.isPublic || false,
      permissions: dashboardData.permissions || [
        {
          userId: dashboardData.userId || 'user1',
          role: 'owner'
        }
      ]
    }

    const result = await collection.insertOne(newDashboard)
    
    if (!result.acknowledged) {
      throw new Error('Failed to create dashboard')
    }

    return this.transformToClientFormat(newDashboard)
  }

  // 更新看板
  async updateDashboard(id: string, updates: Partial<Dashboard>, userId?: string): Promise<Dashboard> {
    const collection = await this.getCollection()
    
    // 先检查看板是否存在和权限
    const existingDashboard = await collection.findOne({ _id: new ObjectId(id) })
    
    if (!existingDashboard) {
      throw new Error('Dashboard not found')
    }

    // 检查编辑权限
    const canEdit = 
      existingDashboard.userId === userId ||
      existingDashboard.permissions?.some((p: any) => 
        p.userId === userId && (p.role === 'owner' || p.role === 'editor')
      )

    if (userId && !canEdit) {
      throw new Error('No permission to edit this dashboard')
    }

    const updateData = {
      ...updates,
      updatedAt: new Date()
    }

    // 移除不应该更新的字段
    delete updateData._id
    delete updateData.createdAt

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    if (!result) {
      throw new Error('Failed to update dashboard')
    }

    return this.transformToClientFormat(result)
  }

  // 删除看板
  async deleteDashboard(id: string, userId?: string): Promise<void> {
    const collection = await this.getCollection()
    
    const dashboard = await collection.findOne({ _id: new ObjectId(id) })
    
    if (!dashboard) {
      throw new Error('Dashboard not found')
    }

    // 只有所有者可以删除
    if (userId && dashboard.userId !== userId) {
      throw new Error('Only dashboard owner can delete it')
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      throw new Error('Failed to delete dashboard')
    }
  }

  // 克隆看板
  async cloneDashboard(id: string, newName: string, userId?: string): Promise<Dashboard> {
    const originalDashboard = await this.getDashboard(id, userId)
    
    const clonedData: Partial<Dashboard> = {
      name: newName,
      description: `${originalDashboard.description} (副本)`,
      layout: JSON.parse(JSON.stringify(originalDashboard.layout)), // 深拷贝
      globalConfig: { ...originalDashboard.globalConfig },
      userId: userId || originalDashboard.userId,
      isPublic: false // 副本默认不公开
    }

    // 为所有组件生成新ID
    if (clonedData.layout?.components) {
      clonedData.layout.components = clonedData.layout.components.map(comp => ({
        ...comp,
        id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }))
    }

    return this.createDashboard(clonedData)
  }

  // 转换MongoDB文档格式为客户端格式
  private transformToClientFormat(doc: any): Dashboard {
    return {
      ...doc,
      _id: doc._id.toString()
    }
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
}

export const dashboardModel = new DashboardModel()