// 基础类型定义
export type ObjectId = string

// Re-export dataset types for convenience
export type { 
  Dataset, 
  DatasetField, 
  DatasetType,
  CreateDatasetRequest,
  UpdateDatasetRequest,
  DatasetSearchParams 
} from './dataset'

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
  type: 'line-chart' | 'bar-chart' | 'pie-chart' | 'table' | 'kpi-card' | 'gauge' | 'container' | 'map'
  title: string
  titleIcon?: string // 标题图标
  position: { x: number, y: number }
  size: { width: number, height: number }
  config: Record<string, any>
  dataConfig: {
    // 新的数据集绑定方式
    datasetId?: ObjectId
    selectedMeasures?: string[] // 选中的度量字段
    selectedDimensions?: string[] // 选中的维度字段
    fieldDisplayNames?: Record<string, string> // 字段名到显示名称的映射
    fieldUnits?: Record<string, string> // 字段名到单位的映射
    // 保留原有的直接绑定方式（向后兼容）
    datasourceId?: ObjectId
    query?: string
    metrics?: string[]
    dimensions?: string[]
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

// SQL查询配置
export interface SQLQueryConfig {
  select: SelectField[]
  from: TableConfig[]
  joins: JoinConfig[]
  where: WhereCondition[]
  groupBy: string[]
  having: WhereCondition[]
  orderBy: OrderByConfig[]
  limit?: number
  customSql?: string
}

export interface SelectField {
  field: string
  alias?: string
  aggregation?: 'SUM' | 'AVG' | 'COUNT' | 'MAX' | 'MIN' | 'DISTINCT'
  table?: string
}

export interface TableConfig {
  name: string
  alias?: string
  schema?: string
}

export interface JoinConfig {
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL'
  table: string
  alias?: string
  condition: string
}

export interface WhereCondition {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like' | 'between'
  value: any
  logic?: 'AND' | 'OR'
  isParameter?: boolean
  parameterName?: string
}

export interface OrderByConfig {
  field: string
  direction: 'ASC' | 'DESC'
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
  // 新增SQL查询配置
  queryConfig?: SQLQueryConfig
  // 新增参数定义
  parameters?: MetricParameter[]
  // 新增数据质量配置
  qualityChecks?: QualityCheck[]
  // 新增版本控制
  version: number
  parentVersion?: ObjectId
  // 新增权限控制
  permissions?: MetricPermission[]
  createdAt: Date
  updatedAt: Date
}

export interface MetricParameter {
  name: string
  displayName: string
  type: 'string' | 'number' | 'date' | 'boolean' | 'list'
  required: boolean
  defaultValue?: any
  options?: { label: string, value: any }[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

export interface QualityCheck {
  type: 'range' | 'null' | 'duplicate' | 'format'
  field: string
  rule: any
  errorMessage: string
}

export interface MetricPermission {
  userId: ObjectId
  role: 'viewer' | 'editor' | 'owner'
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
  type: 'component' | 'metric' | 'container' | 'container-child' | 'dataset-field'
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