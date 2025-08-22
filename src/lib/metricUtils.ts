import type { Metric } from '@/types'

// 指标类型映射
export const METRIC_TYPE_OPTIONS = [
  { value: 'count', label: '计数 (COUNT)', description: '统计记录数量' },
  { value: 'sum', label: '求和 (SUM)', description: '数值字段求和' },
  { value: 'avg', label: '平均值 (AVG)', description: '数值字段平均值' },
  { value: 'max', label: '最大值 (MAX)', description: '数值字段最大值' },
  { value: 'min', label: '最小值 (MIN)', description: '数值字段最小值' },
  { value: 'ratio', label: '比率 (RATIO)', description: '两个数值的比例' },
  { value: 'custom', label: '自定义', description: '自定义SQL表达式' }
] as const

// 获取指标类型信息
export function getMetricTypeInfo(type: Metric['type']) {
  return METRIC_TYPE_OPTIONS.find(option => option.value === type)
}

// 指标分类选项
export const METRIC_CATEGORY_OPTIONS = [
  '销售',
  '营销',
  '用户',
  '客户',
  '财务',
  '网站',
  '产品',
  '运营',
  '服务',
  '其他'
]

// 常用标签
export const COMMON_TAGS = [
  '核心指标',
  '收入',
  '成本',
  '效率',
  '转化',
  '留存',
  '活跃度',
  '满意度',
  '质量',
  '增长',
  '流量',
  '订单',
  '支付',
  '退款'
]

// 验证指标数据
export interface MetricValidationError {
  field: string
  message: string
}

export function validateMetricData(data: Partial<Metric>): MetricValidationError[] {
  const errors: MetricValidationError[] = []

  // 验证指标名称
  if (!data.name?.trim()) {
    errors.push({ field: 'name', message: '指标名称不能为空' })
  } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(data.name)) {
    errors.push({ 
      field: 'name', 
      message: '指标名称只能包含字母、数字和下划线，且必须以字母或下划线开头' 
    })
  } else if (data.name.length > 50) {
    errors.push({ field: 'name', message: '指标名称长度不能超过50个字符' })
  }

  // 验证显示名称
  if (!data.displayName?.trim()) {
    errors.push({ field: 'displayName', message: '显示名称不能为空' })
  } else if (data.displayName.length > 100) {
    errors.push({ field: 'displayName', message: '显示名称长度不能超过100个字符' })
  }

  // 验证分类
  if (!data.category?.trim()) {
    errors.push({ field: 'category', message: '请选择或创建分类' })
  }

  // 验证数据源
  if (!data.datasourceId?.trim()) {
    errors.push({ field: 'datasourceId', message: '请选择数据源' })
  }

  // 验证计算公式
  if (data.type === 'custom' && !data.formula?.trim()) {
    errors.push({ field: 'formula', message: '自定义类型必须提供计算公式' })
  }

  // 验证公式安全性
  if (data.formula) {
    const dangerousKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE']
    const upperFormula = data.formula.toUpperCase()
    
    for (const keyword of dangerousKeywords) {
      if (upperFormula.includes(keyword)) {
        errors.push({ 
          field: 'formula', 
          message: `计算公式不能包含危险操作：${keyword}` 
        })
        break
      }
    }
  }

  // 验证描述长度
  if (data.description && data.description.length > 500) {
    errors.push({ field: 'description', message: '描述长度不能超过500个字符' })
  }

  // 验证单位长度
  if (data.unit && data.unit.length > 20) {
    errors.push({ field: 'unit', message: '单位长度不能超过20个字符' })
  }

  // 验证标签
  if (data.tags) {
    if (data.tags.length > 10) {
      errors.push({ field: 'tags', message: '标签数量不能超过10个' })
    }
    
    for (const tag of data.tags) {
      if (tag.length > 20) {
        errors.push({ field: 'tags', message: '单个标签长度不能超过20个字符' })
        break
      }
    }
  }

  return errors
}

// 生成指标建议
export interface MetricSuggestion {
  type?: Metric['type']
  category?: string
  unit?: string
  formula?: string
  tags?: string[]
}

export function generateMetricSuggestions(
  name: string,
  displayName: string
): MetricSuggestion {
  const combinedText = `${name} ${displayName}`.toLowerCase()
  
  const suggestions: MetricSuggestion = {
    tags: []
  }

  // 类型建议
  if (combinedText.includes('count') || combinedText.includes('number') || 
      combinedText.includes('数量') || combinedText.includes('个数')) {
    suggestions.type = 'count'
    suggestions.unit = '个'
  } else if (combinedText.includes('amount') || combinedText.includes('total') || 
             combinedText.includes('sum') || combinedText.includes('金额') || 
             combinedText.includes('总额')) {
    suggestions.type = 'sum'
    suggestions.unit = '元'
  } else if (combinedText.includes('avg') || combinedText.includes('average') || 
             combinedText.includes('平均')) {
    suggestions.type = 'avg'
  } else if (combinedText.includes('rate') || combinedText.includes('ratio') || 
             combinedText.includes('percentage') || combinedText.includes('率') || 
             combinedText.includes('比')) {
    suggestions.type = 'ratio'
    suggestions.unit = '%'
  }

  // 分类建议
  if (combinedText.includes('sales') || combinedText.includes('order') || 
      combinedText.includes('revenue') || combinedText.includes('销售') || 
      combinedText.includes('订单') || combinedText.includes('收入')) {
    suggestions.category = '销售'
    suggestions.tags?.push('销售', '收入')
  } else if (combinedText.includes('user') || combinedText.includes('customer') || 
             combinedText.includes('用户') || combinedText.includes('客户')) {
    suggestions.category = '用户'
    suggestions.tags?.push('用户')
  } else if (combinedText.includes('marketing') || combinedText.includes('campaign') || 
             combinedText.includes('营销') || combinedText.includes('推广')) {
    suggestions.category = '营销'
    suggestions.tags?.push('营销', '推广')
  } else if (combinedText.includes('financial') || combinedText.includes('profit') || 
             combinedText.includes('cost') || combinedText.includes('财务') || 
             combinedText.includes('利润') || combinedText.includes('成本')) {
    suggestions.category = '财务'
    suggestions.tags?.push('财务')
  }

  // 公式建议
  if (suggestions.type) {
    suggestions.formula = getFormulaTemplate(suggestions.type)
  }

  // 特定关键词的标签建议
  if (combinedText.includes('core') || combinedText.includes('key') || 
      combinedText.includes('核心') || combinedText.includes('关键')) {
    suggestions.tags?.push('核心指标')
  }
  
  if (combinedText.includes('conversion') || combinedText.includes('转化')) {
    suggestions.tags?.push('转化')
  }
  
  if (combinedText.includes('retention') || combinedText.includes('留存')) {
    suggestions.tags?.push('留存')
  }

  return suggestions
}

// 获取公式模板
export function getFormulaTemplate(type: Metric['type']): string {
  switch (type) {
    case 'count':
      return 'COUNT(table.column)'
    case 'sum':
      return 'SUM(table.column)'
    case 'avg':
      return 'AVG(table.column)'
    case 'max':
      return 'MAX(table.column)'
    case 'min':
      return 'MIN(table.column)'
    case 'ratio':
      return '(COUNT(table.column1) / COUNT(table.column2)) * 100'
    case 'custom':
      return '-- 请输入自定义SQL表达式\n-- 例如：SUM(CASE WHEN condition THEN value ELSE 0 END)'
    default:
      return ''
  }
}

// 格式化指标值
export function formatMetricValue(value: number | string, metric: Metric): string {
  if (typeof value === 'string') return value
  
  // 根据单位格式化
  switch (metric.unit) {
    case '%':
      return `${value.toFixed(2)}%`
    case '元':
      return `¥${value.toLocaleString()}`
    case '万元':
      return `¥${(value / 10000).toFixed(2)}万`
    case '次':
    case '个':
    case '人':
      return `${Math.round(value).toLocaleString()}${metric.unit}`
    default:
      return value.toLocaleString()
  }
}

// 获取指标类型图标和颜色
export function getMetricTypeDisplay(type: Metric['type']) {
  const displays = {
    count: { icon: '📊', color: 'blue', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
    sum: { icon: '➕', color: 'green', bgColor: 'bg-green-50', textColor: 'text-green-600' },
    avg: { icon: '📈', color: 'purple', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
    max: { icon: '⬆️', color: 'red', bgColor: 'bg-red-50', textColor: 'text-red-600' },
    min: { icon: '⬇️', color: 'orange', bgColor: 'bg-orange-50', textColor: 'text-orange-600' },
    ratio: { icon: '📐', color: 'pink', bgColor: 'bg-pink-50', textColor: 'text-pink-600' },
    custom: { icon: '⚙️', color: 'gray', bgColor: 'bg-gray-50', textColor: 'text-gray-600' }
  }
  
  return displays[type] || displays.custom
}

// 搜索指标
export function searchMetrics(metrics: Metric[], searchTerm: string): Metric[] {
  if (!searchTerm.trim()) return metrics
  
  const term = searchTerm.toLowerCase()
  
  return metrics.filter(metric => 
    metric.name.toLowerCase().includes(term) ||
    metric.displayName.toLowerCase().includes(term) ||
    metric.description?.toLowerCase().includes(term) ||
    metric.category.toLowerCase().includes(term) ||
    metric.tags.some(tag => tag.toLowerCase().includes(term))
  )
}

// 按分类过滤指标
export function filterMetricsByCategory(metrics: Metric[], category: string): Metric[] {
  if (!category) return metrics
  return metrics.filter(metric => metric.category === category)
}

// 按标签过滤指标
export function filterMetricsByTags(metrics: Metric[], tags: string[]): Metric[] {
  if (!tags.length) return metrics
  return metrics.filter(metric =>
    tags.some(tag => metric.tags.includes(tag))
  )
}

// 排序指标
export type MetricSortOption = 'name' | 'displayName' | 'category' | 'type' | 'createdAt' | 'updatedAt'

export function sortMetrics(metrics: Metric[], sortBy: MetricSortOption, ascending = true): Metric[] {
  const sorted = [...metrics].sort((a, b) => {
    let aValue: any = a[sortBy]
    let bValue: any = b[sortBy]
    
    // 处理日期类型
    if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
      aValue = new Date(aValue).getTime()
      bValue = new Date(bValue).getTime()
    }
    
    // 处理字符串类型
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }
    
    if (aValue < bValue) return ascending ? -1 : 1
    if (aValue > bValue) return ascending ? 1 : -1
    return 0
  })
  
  return sorted
}