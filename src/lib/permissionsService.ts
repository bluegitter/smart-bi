// Types for permissions
export type AccessLevel = 'full' | 'read' | 'none'
export type Permission = 'read' | 'write' | 'delete' | 'admin'

// Simple permissions service - currently allows all operations
// Can be expanded later with role-based access control
export function usePermissions() {
  // In a real implementation, this would get user roles from auth context
  const userRole = 'admin' // Default to admin for now
  
  return {
    // Metric permissions
    filterMetricsByPermission: (metrics: any[], permission: Permission) => {
      // For now, return all metrics. In a real app, filter based on user permissions
      return metrics
    },
    canCreateMetric: () => true,
    canAccessMetricsManagement: () => true,
    canEditMetric: (metric?: any) => {
      // In a real app, check if user owns the metric or has appropriate role
      return true
    },
    canDeleteMetric: (metric?: any) => {
      // In a real app, check if user owns the metric or has appropriate role  
      return true
    },
    checkMetricPermission: (metric: any, permission: Permission) => {
      // In a real app, check user permissions against metric ownership/sharing
      return true
    },
    getMetricAccessLevel: (metric: any): AccessLevel => {
      // In a real app, determine access level based on user role and metric ownership
      return 'full'
    },
    
    // Data source permissions
    checkDataSourcePermission: (dataSource: any, permission: Permission) => {
      return true
    },
    getDataSourceAccessLevel: (dataSource: any): AccessLevel => {
      return 'full'
    },
    
    // Dashboard permissions
    checkDashboardPermission: (dashboard: any, permission: Permission) => {
      return true
    },
    getDashboardAccessLevel: (dashboard: any): AccessLevel => {
      return 'full'
    },
    
    // General permissions
    hasRole: (role: string) => userRole === role || userRole === 'admin',
    getUserRole: () => userRole
  }
}