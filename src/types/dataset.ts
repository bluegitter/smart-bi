import { ObjectId } from '@/types'

// 数据集字段类型
export interface DatasetField {
  name: string
  displayName: string
  type: 'string' | 'number' | 'date' | 'boolean'
  isPrimaryKey?: boolean
  isNullable?: boolean
  // 字段分类
  fieldType: 'dimension' | 'measure' | 'calculated'
  // 度量相关配置
  aggregationType?: 'SUM' | 'AVG' | 'COUNT' | 'MAX' | 'MIN' | 'DISTINCT'
  // 维度相关配置
  dimensionLevel?: 'categorical' | 'ordinal' | 'temporal'
  // 计算字段配置
  expression?: string
  // 格式化配置
  format?: {
    type: 'number' | 'percentage' | 'currency' | 'date' | 'custom'
    pattern?: string
    decimalPlaces?: number
    thousandsSeparator?: boolean
  }
  // 描述信息
  description?: string
  // 示例值
  sampleValues?: any[]
  // 虚拟字段，用于UI显示
  hidden?: boolean
}

// 数据集创建方式
export type DatasetType = 'table' | 'sql' | 'view'

// 数据表配置
export interface TableConfig {
  datasourceId: ObjectId
  schema?: string
  tableName: string
  alias?: string
}

// SQL查询配置（继承现有的SQLQueryConfig但简化）
export interface DatasetSQLConfig {
  datasourceId: ObjectId
  sql: string
  parameters?: DatasetParameter[]
}

// 视图配置（基于现有数据集创建的虚拟视图）
export interface ViewConfig {
  baseDatasetId: ObjectId
  filters: DatasetFilter[]
  computedFields: ComputedField[]
}

// 数据集参数
export interface DatasetParameter {
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

// 数据集过滤器
export interface DatasetFilter {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like' | 'between' | 'is_null' | 'is_not_null'
  value?: any
  logic?: 'AND' | 'OR'
}

// 计算字段
export interface ComputedField {
  name: string
  displayName: string
  expression: string
  type: 'string' | 'number' | 'date' | 'boolean'
  description?: string
}

// 数据集主体
export interface Dataset {
  _id: ObjectId
  name: string
  displayName: string
  description?: string
  type: DatasetType
  
  // 不同类型的配置
  tableConfig?: TableConfig
  sqlConfig?: DatasetSQLConfig  
  viewConfig?: ViewConfig
  
  // 数据集字段（自动识别或手动配置）
  fields: DatasetField[]
  
  // 数据集元数据
  metadata: {
    recordCount?: number
    lastRefreshed?: Date
    dataSize?: number // 数据大小（字节）
    columns: number
  }
  
  // 分类和标签
  category: string
  tags: string[]
  
  // 权限控制
  permissions: DatasetPermission[]
  
  // 缓存配置
  cacheConfig?: {
    enabled: boolean
    ttl: number // 缓存时间（秒）
    refreshSchedule?: string // cron表达式
  }
  
  // 数据质量
  qualityScore?: number // 0-100分
  qualityIssues?: DataQualityIssue[]
  
  // 版本控制
  version: number
  parentDatasetId?: ObjectId
  
  // 状态管理
  status: 'active' | 'inactive' | 'processing' | 'error'
  lastError?: string
  
  // 审计字段
  userId: ObjectId
  createdAt: Date
  updatedAt: Date
}

// 数据集权限
export interface DatasetPermission {
  userId: ObjectId
  role: 'viewer' | 'editor' | 'owner'
}

// 数据质量问题
export interface DataQualityIssue {
  type: 'missing_values' | 'duplicate_records' | 'format_errors' | 'outliers'
  field?: string
  count: number
  percentage: number
  description: string
  severity: 'low' | 'medium' | 'high'
}

// 数据集预览结果
export interface DatasetPreview {
  columns: DatasetField[]
  rows: any[][]
  totalCount: number
  executionTime: number
  errors?: string[]
}

// 数据集统计信息
export interface DatasetStats {
  fieldStats: FieldStats[]
  dataQuality: {
    completeness: number // 完整性（非空率）
    consistency: number // 一致性
    accuracy: number // 准确性
    overall: number // 总体质量评分
  }
}

// 字段统计信息
export interface FieldStats {
  fieldName: string
  dataType: string
  nullCount: number
  nullPercentage: number
  uniqueCount: number
  minValue?: any
  maxValue?: any
  avgValue?: number
  topValues?: { value: any, count: number, percentage: number }[]
  distribution?: { range: string, count: number }[]
}

// 数据集搜索和筛选
export interface DatasetSearchParams {
  keyword?: string
  category?: string
  tags?: string[]
  type?: DatasetType
  status?: Dataset['status']
  userId?: ObjectId
  createdAfter?: Date
  createdBefore?: Date
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'recordCount' | 'qualityScore'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// 数据集创建/更新请求
export interface CreateDatasetRequest {
  name: string
  displayName: string
  description?: string
  type: DatasetType
  tableConfig?: TableConfig
  sqlConfig?: DatasetSQLConfig
  viewConfig?: ViewConfig
  category: string
  tags?: string[]
  cacheConfig?: Dataset['cacheConfig']
}

export interface UpdateDatasetRequest extends Partial<CreateDatasetRequest> {
  fields?: DatasetField[]
  status?: Dataset['status']
}

// API响应类型
export interface DatasetResponse {
  dataset: Dataset
  preview?: DatasetPreview
  stats?: DatasetStats
}

export interface DatasetListResponse {
  datasets: Dataset[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: {
    categories: string[]
    tags: string[]
    types: DatasetType[]
  }
}