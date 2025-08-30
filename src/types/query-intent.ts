/**
 * 查询意图提取和DSL定义
 */

// 时间范围定义
export interface TimeRange {
  type: 'absolute' | 'relative' | 'period'
  start?: string | number  // 绝对时间: '2024-01-01', 相对时间: -30 (30天前)
  end?: string | number
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year'
  value?: number  // 用于相对时间，如 "最近30天"
  format?: 'date' | 'datetime' | 'timestamp' | 'period'  // 日期格式
}

// 指标定义
export interface Metric {
  field: string           // 字段名（英文）
  displayName: string     // 显示名称（中文）
  aggregation: 'sum' | 'count' | 'avg' | 'max' | 'min' | 'distinct_count'
  alias?: string          // 别名
}

// 维度定义
export interface Dimension {
  field: string           // 字段名（英文）
  displayName: string     // 显示名称（中文）
  groupBy: boolean        // 是否分组
  orderBy?: 'asc' | 'desc'  // 排序方向
}

// 过滤条件
export interface Filter {
  field: string           // 字段名（英文）
  displayName: string     // 显示名称（中文）
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'in' | 'not_in' | 'like' | 'between'
  value: unknown | unknown[]  // 过滤值
  dataType: 'string' | 'number' | 'date' | 'boolean'
}

// 查询意图（用户需求的结构化表示）
export interface QueryIntent {
  timeRange?: TimeRange
  metrics: Metric[]
  dimensions: Dimension[]
  filters: Filter[]
  limit?: number
  orderBy?: {
    field: string
    direction: 'asc' | 'desc'
  }
  description: string  // 原始查询描述
}

// 查询DSL（领域特定语言）
export interface QueryDSL {
  select: Array<{
    field: string
    aggregation?: string
    alias?: string
  }>
  from: string
  where?: Array<{
    field: string
    operator: string
    value: unknown | unknown[]
  }>
  groupBy?: string[]
  orderBy?: Array<{
    field: string
    direction: 'asc' | 'desc'
  }>
  limit?: number
  timeRange?: {
    field: string
    start?: string | number
    end?: string | number
  }
}

// LLM意图提取请求
export interface IntentExtractionRequest {
  query: string           // 用户自然语言查询
  datasetSchema: {        // 数据集架构信息
    name: string
    displayName: string
    fields: Array<{
      name: string
      displayName: string
      type: string
      description?: string
      isTimeField?: boolean
      isMetric?: boolean
      isDimension?: boolean
    }>
  }
}

// LLM意图提取响应
export interface IntentExtractionResponse {
  intent: QueryIntent
  confidence: number      // 置信度 0-1
  explanation: string     // 解释说明
  suggestions?: string[]  // 改进建议
}