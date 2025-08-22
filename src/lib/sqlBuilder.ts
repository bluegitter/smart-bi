import type { 
  SQLQueryConfig, 
  SelectField, 
  TableConfig, 
  JoinConfig, 
  WhereCondition, 
  OrderByConfig,
  MetricParameter 
} from '@/types'

/**
 * SQL查询构建器
 * 将可视化配置转换为SQL语句
 */
export class SQLQueryBuilder {
  private config: SQLQueryConfig
  private parameters: Record<string, any> = {}

  constructor(config: SQLQueryConfig) {
    this.config = config
  }

  /**
   * 设置参数值
   */
  setParameters(params: Record<string, any>): void {
    this.parameters = { ...this.parameters, ...params }
  }

  /**
   * 构建完整的SQL查询
   */
  build(): string {
    const selectClause = this.buildSelectClause()
    const fromClause = this.buildFromClause()
    const joinClause = this.buildJoinClause()
    const whereClause = this.buildWhereClause()
    const groupByClause = this.buildGroupByClause()
    const havingClause = this.buildHavingClause()
    const orderByClause = this.buildOrderByClause()
    const limitClause = this.buildLimitClause()

    return [
      selectClause,
      fromClause,
      joinClause,
      whereClause,
      groupByClause,
      havingClause,
      orderByClause,
      limitClause
    ].filter(clause => clause.trim().length > 0).join('\n')
  }

  /**
   * 构建SELECT子句
   */
  private buildSelectClause(): string {
    if (!this.config.select || this.config.select.length === 0) {
      return 'SELECT *'
    }

    const fields = this.config.select.map(field => {
      let fieldStr = ''
      
      if (field.table) {
        fieldStr = `${field.table}.${field.field}`
      } else {
        fieldStr = field.field
      }

      if (field.aggregation) {
        fieldStr = `${field.aggregation}(${fieldStr})`
      }

      if (field.alias) {
        fieldStr += ` AS ${field.alias}`
      }

      return fieldStr
    })

    return `SELECT ${fields.join(', ')}`
  }

  /**
   * 构建FROM子句
   */
  private buildFromClause(): string {
    if (!this.config.from || this.config.from.length === 0) {
      return ''
    }

    const tables = this.config.from.map(table => {
      let tableStr = table.name
      
      if (table.schema) {
        tableStr = `${table.schema}.${table.name}`
      }

      if (table.alias) {
        tableStr += ` AS ${table.alias}`
      }

      return tableStr
    })

    return `FROM ${tables.join(', ')}`
  }

  /**
   * 构建JOIN子句
   */
  private buildJoinClause(): string {
    if (!this.config.joins || this.config.joins.length === 0) {
      return ''
    }

    return this.config.joins.map(join => {
      let joinStr = `${join.type} JOIN ${join.table}`
      
      if (join.alias) {
        joinStr += ` AS ${join.alias}`
      }
      
      joinStr += ` ON ${join.condition}`
      
      return joinStr
    }).join('\n')
  }

  /**
   * 构建WHERE子句
   */
  private buildWhereClause(): string {
    if (!this.config.where || this.config.where.length === 0) {
      return ''
    }

    const conditions = this.buildConditions(this.config.where)
    return conditions ? `WHERE ${conditions}` : ''
  }

  /**
   * 构建HAVING子句
   */
  private buildHavingClause(): string {
    if (!this.config.having || this.config.having.length === 0) {
      return ''
    }

    const conditions = this.buildConditions(this.config.having)
    return conditions ? `HAVING ${conditions}` : ''
  }

  /**
   * 构建条件语句
   */
  private buildConditions(conditions: WhereCondition[]): string {
    if (conditions.length === 0) return ''

    return conditions.map((condition, index) => {
      let conditionStr = ''
      
      // 添加逻辑连接符（除了第一个条件）
      if (index > 0) {
        conditionStr += `${condition.logic || 'AND'} `
      }

      let value = condition.value
      
      // 处理参数化查询
      if (condition.isParameter && condition.parameterName) {
        value = this.parameters[condition.parameterName] || condition.value
      }

      // 根据操作符构建条件
      switch (condition.operator) {
        case 'eq':
          conditionStr += `${condition.field} = ${this.formatValue(value)}`
          break
        case 'ne':
          conditionStr += `${condition.field} != ${this.formatValue(value)}`
          break
        case 'gt':
          conditionStr += `${condition.field} > ${this.formatValue(value)}`
          break
        case 'gte':
          conditionStr += `${condition.field} >= ${this.formatValue(value)}`
          break
        case 'lt':
          conditionStr += `${condition.field} < ${this.formatValue(value)}`
          break
        case 'lte':
          conditionStr += `${condition.field} <= ${this.formatValue(value)}`
          break
        case 'like':
          conditionStr += `${condition.field} LIKE ${this.formatValue(value)}`
          break
        case 'in':
          if (Array.isArray(value)) {
            const values = value.map(v => this.formatValue(v)).join(', ')
            conditionStr += `${condition.field} IN (${values})`
          } else {
            conditionStr += `${condition.field} IN (${this.formatValue(value)})`
          }
          break
        case 'between':
          if (Array.isArray(value) && value.length === 2) {
            conditionStr += `${condition.field} BETWEEN ${this.formatValue(value[0])} AND ${this.formatValue(value[1])}`
          }
          break
        default:
          conditionStr += `${condition.field} = ${this.formatValue(value)}`
      }

      return conditionStr
    }).join(' ')
  }

  /**
   * 构建GROUP BY子句
   */
  private buildGroupByClause(): string {
    if (!this.config.groupBy || this.config.groupBy.length === 0) {
      return ''
    }

    return `GROUP BY ${this.config.groupBy.join(', ')}`
  }

  /**
   * 构建ORDER BY子句
   */
  private buildOrderByClause(): string {
    if (!this.config.orderBy || this.config.orderBy.length === 0) {
      return ''
    }

    const orderFields = this.config.orderBy.map(order => 
      `${order.field} ${order.direction}`
    )

    return `ORDER BY ${orderFields.join(', ')}`
  }

  /**
   * 构建LIMIT子句
   */
  private buildLimitClause(): string {
    if (!this.config.limit) {
      return ''
    }

    return `LIMIT ${this.config.limit}`
  }

  /**
   * 格式化值（添加引号、转义等）
   */
  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return 'NULL'
    }

    if (typeof value === 'string') {
      // 转义单引号
      const escaped = value.replace(/'/g, "''")
      return `'${escaped}'`
    }

    if (typeof value === 'number') {
      return value.toString()
    }

    if (typeof value === 'boolean') {
      return value ? 'TRUE' : 'FALSE'
    }

    if (value instanceof Date) {
      return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`
    }

    return `'${value.toString()}'`
  }

  /**
   * 验证SQL配置
   */
  static validate(config: SQLQueryConfig): { valid: boolean, errors: string[] } {
    const errors: string[] = []

    // 检查SELECT字段
    if (!config.select || config.select.length === 0) {
      errors.push('至少需要一个SELECT字段')
    }

    // 检查FROM表
    if (!config.from || config.from.length === 0) {
      errors.push('至少需要一个FROM表')
    }

    // 检查JOIN配置
    if (config.joins) {
      config.joins.forEach((join, index) => {
        if (!join.table) {
          errors.push(`JOIN ${index + 1}: 表名不能为空`)
        }
        if (!join.condition) {
          errors.push(`JOIN ${index + 1}: 连接条件不能为空`)
        }
      })
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 从现有SQL语句解析配置（简单版本）
   */
  static parseSQL(sql: string): SQLQueryConfig {
    // 这里可以实现SQL解析逻辑
    // 暂时返回基本结构
    return {
      select: [{ field: '*' }],
      from: [{ name: 'table' }],
      joins: [],
      where: [],
      groupBy: [],
      having: [],
      orderBy: [],
      limit: undefined
    }
  }
}

/**
 * 动态SQL执行器
 */
export class DynamicSQLExecutor {
  /**
   * 执行指标查询
   */
  static async executeMetricQuery(
    metricId: string, 
    parameters: Record<string, any> = {}
  ): Promise<any[]> {
    // 这里需要实现从数据库获取指标配置并执行查询的逻辑
    // 暂时返回空数组
    return []
  }

  /**
   * 预览查询结果（限制记录数）
   */
  static async previewQuery(
    config: SQLQueryConfig,
    parameters: Record<string, any> = {},
    limit: number = 100
  ): Promise<{ data: any[], preview: boolean }> {
    const builder = new SQLQueryBuilder(config)
    builder.setParameters(parameters)
    
    // 强制设置预览限制
    const previewConfig = { ...config, limit: Math.min(limit, config.limit || limit) }
    const previewBuilder = new SQLQueryBuilder(previewConfig)
    previewBuilder.setParameters(parameters)
    
    const sql = previewBuilder.build()
    console.log('Preview SQL:', sql)
    
    // 这里需要实际执行SQL查询
    return {
      data: [],
      preview: true
    }
  }

  /**
   * 验证SQL语法
   */
  static async validateSQL(sql: string): Promise<{ valid: boolean, error?: string }> {
    try {
      // 这里可以实现SQL语法验证
      // 可以使用数据库的EXPLAIN功能或SQL解析库
      return { valid: true }
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : '未知错误' 
      }
    }
  }
}