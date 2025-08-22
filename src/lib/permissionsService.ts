import type { User, Metric } from '@/types'

export type Permission = 'read' | 'write' | 'delete' | 'share'
export type Role = 'admin' | 'user' | 'viewer'

export interface MetricPermission {
  userId: string
  metricId: string
  permissions: Permission[]
  grantedBy: string
  grantedAt: Date
}

export class PermissionsService {
  
  // 角色默认权限映射
  private rolePermissions: Record<Role, Permission[]> = {
    admin: ['read', 'write', 'delete', 'share'],
    user: ['read', 'write', 'share'],
    viewer: ['read']
  }

  // 检查用户对指标的权限
  checkMetricPermission(
    user: User | null,
    metric: Metric,
    requiredPermission: Permission
  ): boolean {
    if (!user) return false

    // 管理员拥有所有权限
    if (user.role === 'admin') return true

    // 指标创建者拥有所有权限（假设有 userId 字段）
    // if (metric.userId && metric.userId === user._id) return true

    // 检查角色默认权限
    const rolePerms = this.rolePermissions[user.role] || []
    if (rolePerms.includes(requiredPermission)) return true

    // 检查特定指标权限（这里可以扩展为从数据库查询）
    // const specificPerms = await this.getMetricPermissions(user._id, metric._id)
    // return specificPerms.includes(requiredPermission)

    return false
  }

  // 检查批量指标权限
  filterMetricsByPermission(
    user: User | null,
    metrics: Metric[],
    requiredPermission: Permission = 'read'
  ): Metric[] {
    if (!user) return []

    return metrics.filter(metric => 
      this.checkMetricPermission(user, metric, requiredPermission)
    )
  }

  // 获取用户可访问的指标分类
  getAccessibleCategories(user: User | null, metrics: Metric[]): string[] {
    const accessibleMetrics = this.filterMetricsByPermission(user, metrics, 'read')
    return [...new Set(accessibleMetrics.map(m => m.category))]
  }

  // 验证指标操作权限
  validateMetricOperation(
    user: User | null,
    metric: Metric,
    operation: 'create' | 'read' | 'update' | 'delete'
  ): { allowed: boolean; reason?: string } {
    if (!user) {
      return { allowed: false, reason: '用户未登录' }
    }

    const permissionMap: Record<string, Permission> = {
      create: 'write',
      read: 'read',
      update: 'write',
      delete: 'delete'
    }

    const requiredPermission = permissionMap[operation]
    const hasPermission = this.checkMetricPermission(user, metric, requiredPermission)

    if (!hasPermission) {
      const messages = {
        create: '您没有创建指标的权限',
        read: '您没有查看此指标的权限',
        update: '您没有编辑此指标的权限',
        delete: '您没有删除此指标的权限'
      }
      return { allowed: false, reason: messages[operation] }
    }

    return { allowed: true }
  }

  // 获取用户可执行的操作列表
  getAvailableActions(user: User | null, metric: Metric): Permission[] {
    if (!user) return []
    
    const actions: Permission[] = []
    
    if (this.checkMetricPermission(user, metric, 'read')) {
      actions.push('read')
    }
    
    if (this.checkMetricPermission(user, metric, 'write')) {
      actions.push('write')
    }
    
    if (this.checkMetricPermission(user, metric, 'delete')) {
      actions.push('delete')
    }
    
    if (this.checkMetricPermission(user, metric, 'share')) {
      actions.push('share')
    }
    
    return actions
  }

  // 检查是否可以分享指标
  canShareMetric(user: User | null, metric: Metric): boolean {
    return this.checkMetricPermission(user, metric, 'share')
  }

  // 检查是否可以编辑指标
  canEditMetric(user: User | null, metric: Metric): boolean {
    return this.checkMetricPermission(user, metric, 'write')
  }

  // 检查是否可以删除指标
  canDeleteMetric(user: User | null, metric: Metric): boolean {
    return this.checkMetricPermission(user, metric, 'delete')
  }

  // 获取角色权限描述
  getRoleDescription(role: Role): string {
    const descriptions = {
      admin: '管理员 - 拥有所有权限',
      user: '用户 - 可以查看、编辑和分享指标',
      viewer: '查看者 - 只能查看指标'
    }
    return descriptions[role] || '未知角色'
  }

  // 检查是否可以访问指标管理页面
  canAccessMetricsManagement(user: User | null): boolean {
    if (!user) return false
    return user.role === 'admin' || user.role === 'user'
  }

  // 检查是否可以创建新指标
  canCreateMetric(user: User | null): boolean {
    if (!user) return false
    return user.role === 'admin' || user.role === 'user'
  }

  // 获取指标访问级别
  getMetricAccessLevel(user: User | null, metric: Metric): 'none' | 'read' | 'write' | 'full' {
    if (!user) return 'none'
    
    if (user.role === 'admin') return 'full'
    
    const permissions = this.getAvailableActions(user, metric)
    
    if (permissions.includes('delete')) return 'full'
    if (permissions.includes('write')) return 'write'
    if (permissions.includes('read')) return 'read'
    
    return 'none'
  }

  // 过滤敏感指标信息
  sanitizeMetricForUser(user: User | null, metric: Metric): Partial<Metric> {
    const accessLevel = this.getMetricAccessLevel(user, metric)
    
    if (accessLevel === 'none') {
      return {}
    }
    
    // 基础信息对所有有权限的用户可见
    const sanitized: Partial<Metric> = {
      _id: metric._id,
      name: metric.name,
      displayName: metric.displayName,
      description: metric.description,
      type: metric.type,
      category: metric.category,
      unit: metric.unit,
      tags: metric.tags,
      isActive: metric.isActive,
      createdAt: metric.createdAt,
      updatedAt: metric.updatedAt
    }

    // 只有写权限以上才能看到计算公式和数据源
    if (accessLevel === 'write' || accessLevel === 'full') {
      sanitized.formula = metric.formula
      sanitized.datasourceId = metric.datasourceId
    }

    return sanitized
  }
}

// 单例实例
export const permissionsService = new PermissionsService()

// Hook for using permissions in React components
export function usePermissions() {
  // 这里可以从 context 或 store 获取当前用户
  // const { user } = useUser()
  
  // Mock user for demo
  const user: User = {
    _id: 'user1',
    email: 'user@example.com',
    name: 'Demo User',
    role: 'user',
    preferences: {
      theme: 'light',
      language: 'zh-CN',
      timezone: 'Asia/Shanghai'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }

  return {
    user,
    checkMetricPermission: (metric: Metric, permission: Permission) =>
      permissionsService.checkMetricPermission(user, metric, permission),
    canEditMetric: (metric: Metric) =>
      permissionsService.canEditMetric(user, metric),
    canDeleteMetric: (metric: Metric) =>
      permissionsService.canDeleteMetric(user, metric),
    canShareMetric: (metric: Metric) =>
      permissionsService.canShareMetric(user, metric),
    canCreateMetric: () =>
      permissionsService.canCreateMetric(user),
    canAccessMetricsManagement: () =>
      permissionsService.canAccessMetricsManagement(user),
    getMetricAccessLevel: (metric: Metric) =>
      permissionsService.getMetricAccessLevel(user, metric),
    filterMetricsByPermission: (metrics: Metric[], permission: Permission = 'read') =>
      permissionsService.filterMetricsByPermission(user, metrics, permission)
  }
}