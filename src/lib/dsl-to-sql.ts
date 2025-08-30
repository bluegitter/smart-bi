/**
 * DSL到SQL转换引擎
 * 将结构化查询意图(QueryIntent)转换为DSL，再生成最终的SQL查询语句
 */

import { QueryIntent, QueryDSL, TimeRange, Metric, Dimension, Filter } from '@/types/query-intent'
import type { Dataset } from '@/types/dataset'

/**
 * 将查询意图转换为DSL
 */
export function intentToDSL(intent: QueryIntent, dataset: Dataset): QueryDSL {
  const dsl: QueryDSL = {
    select: [],
    from: getTableName(dataset)
  }

  // 构建SELECT字段
  // 1. 添加维度字段
  intent.dimensions.forEach(dimension => {
    dsl.select.push({
      field: dimension.field,
      alias: dimension.displayName !== dimension.field ? dimension.displayName : undefined
    })
  })

  // 2. 添加指标字段（带聚合），过滤无意义字段
  intent.metrics.forEach(metric => {
    // 再次过滤，确保不添加无意义的聚合字段
    const shouldSkip = 
      metric.field.toLowerCase().includes('id') ||
      metric.displayName.includes('主键') ||
      metric.displayName.includes('自增') ||
      metric.displayName.includes('时间') ||
      metric.displayName.includes('创建') ||
      metric.displayName.includes('日期') ||
      metric.field.toLowerCase().includes('date') ||
      metric.field.toLowerCase().includes('created') ||
      metric.field.toLowerCase().includes('updated')
    
    if (!shouldSkip) {
      dsl.select.push({
        field: metric.field,
        aggregation: metric.aggregation,
        alias: metric.alias || metric.displayName
      })
      console.log(`[DSL转换] 添加有效指标字段: ${metric.field} (${metric.displayName})`)
    } else {
      console.log(`[DSL转换] 跳过无意义字段: ${metric.field} (${metric.displayName})`)
    }
  })

  // 如果没有指定字段，默认查询所有字段或前几个主要字段
  if (dsl.select.length === 0) {
    if (intent.limit && intent.limit <= 50) {
      // 对于限制数量的查询，选择前几个重要字段
      const importantFields = dataset.fields.slice(0, 5)
      importantFields.forEach(field => {
        dsl.select.push({
          field: field.name,
          alias: field.displayName !== field.name ? field.displayName : undefined
        })
      })
    } else {
      // 否则查询所有字段
      dsl.select.push({ field: '*' })
    }
  }

  // 构建WHERE条件
  const whereConditions: Array<{ field: string; operator: string; value: unknown | unknown[] }> = []

  // 1. 添加时间范围条件
  if (intent.timeRange) {
    const timeCondition = buildTimeCondition(intent.timeRange, dataset)
    if (timeCondition) {
      whereConditions.push(timeCondition)
    }
  }

  // 2. 添加过滤条件
  intent.filters.forEach(filter => {
    whereConditions.push({
      field: filter.field,
      operator: filter.operator,
      value: filter.value
    })
  })

  if (whereConditions.length > 0) {
    dsl.where = whereConditions
  }

  // 构建GROUP BY
  if (intent.dimensions.filter(d => d.groupBy).length > 0) {
    dsl.groupBy = intent.dimensions
      .filter(d => d.groupBy)
      .map(d => d.field)
  }

  // 构建ORDER BY
  if (intent.orderBy) {
    dsl.orderBy = [{
      field: intent.orderBy.field,
      direction: intent.orderBy.direction
    }]
  } else {
    // 默认排序：维度字段按升序，指标字段按降序
    const orderByFields: Array<{ field: string; direction: 'asc' | 'desc' }> = []
    
    intent.dimensions.forEach(dimension => {
      if (dimension.orderBy) {
        orderByFields.push({
          field: dimension.field,
          direction: dimension.orderBy
        })
      }
    })

    if (orderByFields.length > 0) {
      dsl.orderBy = orderByFields
    }
  }

  // 设置LIMIT
  if (intent.limit && intent.limit > 0) {
    dsl.limit = intent.limit
  } else {
    // 默认限制100条记录
    dsl.limit = 100
  }

  return dsl
}

/**
 * 将DSL转换为SQL查询语句
 */
export function dslToSQL(dsl: QueryDSL): string {
  let sql = 'SELECT '

  // 构建SELECT子句
  const selectFields = dsl.select.map(field => {
    let fieldExpr = field.field

    // 添加聚合函数
    if (field.aggregation && field.field !== '*') {
      switch (field.aggregation) {
        case 'sum':
          fieldExpr = `SUM(${escapeFieldName(field.field)})`
          break
        case 'count':
          fieldExpr = field.field === '*' ? 'COUNT(*)' : `COUNT(${escapeFieldName(field.field)})`
          break
        case 'avg':
          fieldExpr = `AVG(${escapeFieldName(field.field)})`
          break
        case 'max':
          fieldExpr = `MAX(${escapeFieldName(field.field)})`
          break
        case 'min':
          fieldExpr = `MIN(${escapeFieldName(field.field)})`
          break
        case 'distinct_count':
          fieldExpr = `COUNT(DISTINCT ${escapeFieldName(field.field)})`
          break
        default:
          fieldExpr = escapeFieldName(field.field)
      }
    } else if (field.field !== '*') {
      fieldExpr = escapeFieldName(field.field)
    }

    // 添加别名
    if (field.alias && field.field !== '*') {
      fieldExpr += ` AS ${escapeFieldName(field.alias)}`
    }

    return fieldExpr
  })

  sql += selectFields.join(', ')

  // 构建FROM子句
  sql += ` FROM ${escapeTableName(dsl.from)}`

  // 构建WHERE子句
  if (dsl.where && dsl.where.length > 0) {
    const whereConditions = dsl.where.map(condition => {
      return buildWhereCondition(condition)
    })
    sql += ` WHERE ${whereConditions.join(' AND ')}`
  }

  // 构建GROUP BY子句
  if (dsl.groupBy && dsl.groupBy.length > 0) {
    sql += ` GROUP BY ${dsl.groupBy.map(field => escapeFieldName(field)).join(', ')}`
  }

  // 构建ORDER BY子句
  if (dsl.orderBy && dsl.orderBy.length > 0) {
    const orderFields = dsl.orderBy.map(order => 
      `${escapeFieldName(order.field)} ${order.direction.toUpperCase()}`
    )
    sql += ` ORDER BY ${orderFields.join(', ')}`
  }

  // 构建LIMIT子句
  if (dsl.limit && dsl.limit > 0) {
    sql += ` LIMIT ${dsl.limit}`
  }

  return sql
}

/**
 * 完整的意图到SQL转换流程
 */
export function intentToSQL(intent: QueryIntent, dataset: Dataset): { dsl: QueryDSL; sql: string } {
  console.log('[DSL转换] 开始转换查询意图:', intent)

  // 第一步：意图转DSL
  const dsl = intentToDSL(intent, dataset)
  console.log('[DSL转换] 生成DSL:', dsl)

  // 第二步：DSL转SQL
  const sql = dslToSQL(dsl)
  console.log('[DSL转换] 生成SQL:', sql)

  return { dsl, sql }
}

// === 辅助函数 ===

/**
 * 获取数据集的实际表名
 */
function getTableName(dataset: Dataset): string {
  if (dataset.type === 'table' && dataset.config?.tableName) {
    return dataset.config.tableName
  }
  if (dataset.type === 'sql' && dataset.config?.sql) {
    return `(${dataset.config.sql}) AS subquery`
  }
  if (dataset.type === 'view' && dataset.config?.viewName) {
    return dataset.config.viewName
  }
  
  // 默认使用数据集名称
  return dataset.name
}

/**
 * 构建时间条件
 */
function buildTimeCondition(timeRange: TimeRange, dataset: Dataset): { field: string; operator: string; value: unknown } | null {
  // 查找时间字段
  const timeField = dataset.fields.find(f => f.isTimeField)
  if (!timeField) {
    console.warn('[DSL转换] 未找到时间字段，跳过时间条件')
    return null
  }

  switch (timeRange.type) {
    case 'absolute':
      if (timeRange.start && timeRange.end) {
        // 范围查询：BETWEEN
        return {
          field: timeField.name,
          operator: 'between',
          value: [timeRange.start, timeRange.end]
        }
      } else if (timeRange.start) {
        // 大于等于
        return {
          field: timeField.name,
          operator: '>=',
          value: timeRange.start
        }
      } else if (timeRange.end) {
        // 小于等于
        return {
          field: timeField.name,
          operator: '<=',
          value: timeRange.end
        }
      }
      break

    case 'relative':
      if (timeRange.value && timeRange.value > 0) {
        // 相对时间：最近N天/月等
        const unit = timeRange.period || 'day'
        const intervalExpr = `INTERVAL ${timeRange.value} ${unit.toUpperCase()}`
        
        return {
          field: timeField.name,
          operator: '>=',
          value: `DATE_SUB(NOW(), ${intervalExpr})`
        }
      }
      break

    case 'period':
      // 周期性查询：特定时间段
      if (timeRange.period && timeRange.value) {
        const condition = buildPeriodCondition(timeField.name, timeRange.period, timeRange.value)
        return condition
      }
      break
  }

  return null
}

/**
 * 构建周期性时间条件
 */
function buildPeriodCondition(timeField: string, period: string, value: number): { field: string; operator: string; value: string } {
  switch (period) {
    case 'year':
      return {
        field: `YEAR(${timeField})`,
        operator: '=',
        value: value.toString()
      }
    case 'month':
      return {
        field: `DATE_FORMAT(${timeField}, '%Y%m')`,
        operator: '=',
        value: value.toString()
      }
    case 'quarter':
      return {
        field: `QUARTER(${timeField})`,
        operator: '=',
        value: value.toString()
      }
    default:
      return {
        field: timeField,
        operator: '=',
        value: value.toString()
      }
  }
}

/**
 * 构建WHERE条件
 */
function buildWhereCondition(condition: { field: string; operator: string; value: unknown | unknown[] }): string {
  const field = escapeFieldName(condition.field)
  const { operator, value } = condition

  switch (operator) {
    case '=':
    case '!=':
    case '>':
    case '<':
    case '>=':
    case '<=':
      return `${field} ${operator} ${escapeValue(value)}`

    case 'in':
      if (Array.isArray(value)) {
        const values = value.map(v => escapeValue(v)).join(', ')
        return `${field} IN (${values})`
      }
      return `${field} = ${escapeValue(value)}`

    case 'not_in':
      if (Array.isArray(value)) {
        const values = value.map(v => escapeValue(v)).join(', ')
        return `${field} NOT IN (${values})`
      }
      return `${field} != ${escapeValue(value)}`

    case 'like':
      return `${field} LIKE ${escapeValue(value)}`

    case 'between':
      if (Array.isArray(value) && value.length >= 2) {
        return `${field} BETWEEN ${escapeValue(value[0])} AND ${escapeValue(value[1])}`
      }
      return `${field} = ${escapeValue(value)}`

    default:
      console.warn(`[DSL转换] 未知的操作符: ${operator}`)
      return `${field} = ${escapeValue(value)}`
  }
}

/**
 * 转义字段名
 */
function escapeFieldName(fieldName: string): string {
  if (fieldName === '*') return fieldName
  
  // 如果字段名包含特殊字符或空格，使用双引号包围
  if (/[\s\-\(\)\+\*\/\%\!\@\#\$\^\&\|\\\[\]\{\}\;\:\'\"\?\>\<\,\.]/.test(fieldName)) {
    return `"${fieldName.replace(/"/g, '""')}"`
  }
  
  return fieldName
}

/**
 * 转义表名
 */
function escapeTableName(tableName: string): string {
  // 如果是子查询，直接返回
  if (tableName.includes('(') && tableName.includes(')')) {
    return tableName
  }
  
  return escapeFieldName(tableName)
}

/**
 * 转义数值
 */
function escapeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'NULL'
  }
  
  if (typeof value === 'number') {
    return value.toString()
  }
  
  if (typeof value === 'boolean') {
    return value ? '1' : '0'
  }
  
  // 字符串需要单引号包围，并转义内部的单引号
  const stringValue = String(value)
  
  // 如果是SQL函数表达式（如 DATE_SUB(NOW(), INTERVAL 30 DAY)），不加引号
  if (stringValue.includes('(') && stringValue.includes(')') && 
      /^[A-Z_]+\s*\(/.test(stringValue)) {
    return stringValue
  }
  
  return `'${stringValue.replace(/'/g, "''")}'`
}