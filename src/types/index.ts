// 基础类型定义
export type ObjectId = string

// 用户类型
export interface User {
  _id: ObjectId
  email: string
  name: string
  role: 'admin' | 'user' | 'viewer'
  avatarUrl?: string
  preferences: {
    theme: 'light' | 'dark'
    language: string
    timezone: string
  }
  createdAt: Date
  updatedAt: Date
}

// 组件布局类型
export interface ComponentLayout {
  id: string
  type: 'line-chart' | 'bar-chart' | 'pie-chart' | 'table' | 'kpi-card' | 'gauge' | 'container'
  title: string
  position: { x: number, y: number }
  size: { width: number, height: number }
  config: Record<string, any>
  dataConfig: {
    datasourceId: ObjectId
    query: string
    metrics: string[]
    dimensions: string[]
    filters: Filter[]
  }
  // 容器组件专用属性 - 嵌套的子组件
  children?: ComponentLayout[]
  // 容器组件专用属性 - 布局配置
  containerConfig?: {
    layout: 'grid' | 'flex' | 'absolute'
    padding: number
    gap: number
    backgroundColor?: string
    borderStyle?: 'solid' | 'dashed' | 'none'
    borderColor?: string
    borderWidth?: number
  }
}

// 过滤器类型
export interface Filter {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like'
  value: any
}

// 看板类型
export interface Dashboard {
  _id: ObjectId
  name: string
  description?: string
  layout: {
    grid: { columns: number, rows: number }
    components: ComponentLayout[]
  }
  globalConfig: {
    theme: string
    refreshInterval: number
    timezone: string
  }
  userId: ObjectId
  isPublic: boolean
  shareToken?: string
  permissions: {
    userId: ObjectId
    role: 'viewer' | 'editor' | 'owner'
  }[]
  createdAt: Date
  updatedAt: Date
}

// 指标类型
export interface Metric {
  _id: ObjectId
  name: string
  displayName: string
  description?: string
  type: 'count' | 'sum' | 'avg' | 'max' | 'min' | 'ratio' | 'custom'
  formula?: string
  datasourceId: ObjectId
  category: string
  unit?: string
  tags: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// 数据源类型
export interface DataSource {
  _id: ObjectId
  name: string
  type: 'mysql' | 'postgresql' | 'mongodb' | 'api' | 'csv'
  config: {
    host?: string
    port?: number
    database?: string
    username?: string
    password?: string
    apiUrl?: string
    headers?: Record<string, string>
    filePath?: string
  }
  schemaInfo: {
    tables: {
      name: string
      columns: {
        name: string
        type: string
        nullable: boolean
      }[]
    }[]
  }
  userId: ObjectId
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// 查询结果类型
export interface QueryResult {
  data: any[]
  columns: ColumnInfo[]
  total: number
  executionTime: number
}

export interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
}

// AI相关类型
export interface ParsedQuery {
  metrics: string[]
  dimensions: string[]
  timeRange?: DateRange
  filters: Filter[]
  chartType: ComponentLayout['type']
}

export interface DateRange {
  start: Date
  end: Date
}

// 拖拽相关类型
export interface DragItem {
  type: 'component' | 'metric' | 'container' | 'container-child'
  id: string
  data: any // Flexible data structure to handle different drag sources
  // 容器拖拽时的附加信息
  containerId?: string // 当拖拽到容器内时记录目标容器ID
  isFromContainer?: boolean // 标记是否从容器内拖出
  // 容器子组件拖拽时的信息
  index?: number // 子组件在容器中的索引
  component?: ComponentLayout // 子组件信息
}

// 应用状态类型
export interface AppState {
  // 用户状态
  user: User | null
  isAuthenticated: boolean
  
  // 看板状态
  currentDashboard: Dashboard | null
  dashboards: Dashboard[]
  
  // 编辑状态
  isEditing: boolean
  selectedComponent: ComponentLayout | null
  draggedMetric: Metric | null
  
  // UI状态
  sidebarCollapsed: boolean
  headerHidden: boolean
  isFullscreen: boolean
  // 保存全屏前的状态
  previousSidebarCollapsed: boolean
  previousHeaderHidden: boolean
  loading: boolean
  error: string | null
  
  // Actions
  actions: {
    setUser: (user: User | null) => void
    setCurrentDashboard: (dashboard: Dashboard | null) => void
    setIsEditing: (editing: boolean) => void
    setSelectedComponent: (component: ComponentLayout | null) => void
    toggleSidebar: () => void
    toggleHeader: () => void
    toggleFullscreen: () => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
  }
}