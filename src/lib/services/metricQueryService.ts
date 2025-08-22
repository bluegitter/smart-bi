import { Metric } from '@/models/Metric'
import { DataSource } from '@/models/DataSource'
import { SQLQueryBuilder } from '@/lib/sqlBuilder'
import { executeQuery } from '@/lib/mysql'
import type { SQLQueryConfig, MetricParameter } from '@/types'

/**
 * 指标查询服务
 * 负责动态执行指标查询，支持参数化和缓存
 */
export class MetricQueryService {
  private static cache = new Map<string, { data: any[], timestamp: number, ttl: number }>()
  
  /**
   * 根据指标ID执行查询
   */
  static async executeMetricQuery(
    metricId: string, 
    parameters: Record<string, any> = {},
    useCache: boolean = true
  ): Promise<{
    success: boolean
    data: any[]
    metricId: string
    count: number
    timestamp: string
    cached?: boolean
    error?: string
  }> {
    try {
      // 检查缓存
      if (useCache) {
        const cacheKey = `${metricId}_${JSON.stringify(parameters)}`
        const cached = this.getCachedResult(cacheKey)
        if (cached) {
          return {
            success: true,
            data: cached.data,
            metricId,
            count: cached.data.length,
            timestamp: new Date().toISOString(),
            cached: true
          }
        }
      }

      // 获取指标配置
      let metric
      try {
        // 尝试使用ObjectId查询
        metric = await Metric.findById(metricId)
          .populate('datasourceId')
          .exec()
      } catch (castError) {
        // 如果metricId不是有效的ObjectId，尝试按name字段查询
        console.log(`metricId "${metricId}" 不是有效的ObjectId，尝试按name查询`)
        metric = await Metric.findOne({ name: metricId })
          .populate('datasourceId')
          .exec()
      }
      
      if (!metric) {
        return {
          success: false,
          data: [],
          metricId,
          count: 0,
          timestamp: new Date().toISOString(),
          error: '指标不存在'
        }
      }

      if (!metric.isActive) {
        return {
          success: false,
          data: [],
          metricId,
          count: 0,
          timestamp: new Date().toISOString(),
          error: '指标已禁用'
        }
      }

      // 验证参数
      const validation = this.validateParameters(metric.parameters || [], parameters)
      if (!validation.valid) {
        return {
          success: false,
          data: [],
          metricId,
          count: 0,
          timestamp: new Date().toISOString(),
          error: `参数验证失败: ${validation.errors.join(', ')}`
        }
      }

      let sql: string
      let queryData: any[]

      // 如果有queryConfig，使用SQL构建器
      if (metric.queryConfig) {
        try {
          const builder = new SQLQueryBuilder(metric.queryConfig)
          builder.setParameters(parameters)
          sql = builder.build()
          
          // 验证生成的SQL不为空
          if (!sql || sql.trim().length === 0) {
            return {
              success: false,
              data: [],
              metricId,
              count: 0,
              timestamp: new Date().toISOString(),
              error: '无法生成有效的SQL查询语句，请检查指标配置'
            }
          }
          
          console.log(`执行指标查询 (${metricId}):`, sql)
          queryData = await executeQuery(sql)
        } catch (buildError) {
          console.error(`构建SQL失败 (${metricId}):`, buildError)
          return {
            success: false,
            data: [],
            metricId,
            count: 0,
            timestamp: new Date().toISOString(),
            error: `SQL构建失败: ${buildError instanceof Error ? buildError.message : '未知错误'}`
          }
        }
      } 
      // 否则使用传统的formula
      else if (metric.formula) {
        sql = this.interpolateParameters(metric.formula, parameters)
        console.log(`执行遗留指标查询 (${metricId}):`, sql)
        queryData = await executeQuery(sql)
      } 
      // 都没有则返回错误
      else {
        return {
          success: false,
          data: [],
          metricId,
          count: 0,
          timestamp: new Date().toISOString(),
          error: '指标未配置查询逻辑'
        }
      }

      // 数据质量检查
      const qualityCheck = this.performQualityChecks(queryData, metric.qualityChecks || [])
      if (!qualityCheck.passed) {
        console.warn(`指标 ${metricId} 数据质量检查失败:`, qualityCheck.errors)
      }

      // 格式化数据
      const formattedData = this.formatQueryResult(queryData, metric.type)

      // 缓存结果（5分钟TTL）
      if (useCache) {
        const cacheKey = `${metricId}_${JSON.stringify(parameters)}`
        this.setCacheResult(cacheKey, formattedData, 5 * 60 * 1000)
      }

      return {
        success: true,
        data: formattedData,
        metricId,
        count: formattedData.length,
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      console.error(`执行指标查询失败 (${metricId}):`, error)
      return {
        success: false,
        data: [],
        metricId,
        count: 0,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : '查询执行失败'
      }
    }
  }

  /**
   * 批量执行多个指标查询
   */
  static async executeBatchMetricQuery(
    metricIds: string[],
    parameters: Record<string, any> = {}
  ): Promise<Record<string, any>> {
    const results: Record<string, any> = {}
    
    // 并行执行所有查询
    const promises = metricIds.map(async (metricId) => {
      const result = await this.executeMetricQuery(metricId, parameters)
      return { metricId, result }
    })

    const batchResults = await Promise.all(promises)
    
    // 组织结果
    batchResults.forEach(({ metricId, result }) => {
      results[metricId] = result
    })

    return results
  }

  /**
   * 预览指标查询结果
   */
  static async previewMetricQuery(
    queryConfig: SQLQueryConfig,
    parameters: Record<string, any> = {},
    datasourceId?: string
  ): Promise<{
    success: boolean
    data: any[]
    sql: string
    count: number
    error?: string
  }> {
    try {
      let sql: string

      // 如果使用自定义SQL模式
      if (queryConfig.customSql) {
        sql = queryConfig.customSql
        // 限制预览结果数量
        if (!sql.toUpperCase().includes('LIMIT')) {
          sql += ' LIMIT 100'
        }
      } else {
        const builder = new SQLQueryBuilder(queryConfig)
        builder.setParameters(parameters)
        
        // 限制预览结果数量
        const previewConfig = { ...queryConfig, limit: Math.min(queryConfig.limit || 100, 100) }
        const previewBuilder = new SQLQueryBuilder(previewConfig)
        previewBuilder.setParameters(parameters)
        
        sql = previewBuilder.build()
      }

      console.log('预览SQL:', sql)

      // 如果没有配置有效的查询
      if (!sql.trim()) {
        return {
          success: false,
          data: [],
          sql: '',
          count: 0,
          error: '请配置有效的SQL查询'
        }
      }

      // 执行查询
      const data = await executeQuery(sql)

      return {
        success: true,
        data,
        sql,
        count: data.length
      }
    } catch (error) {
      console.error('预览查询失败:', error)
      return {
        success: false,
        data: [],
        sql: '',
        count: 0,
        error: error instanceof Error ? error.message : '预览失败'
      }
    }
  }

  /**
   * 验证指标参数
   */
  private static validateParameters(
    parameterDefs: MetricParameter[], 
    values: Record<string, any>
  ): { valid: boolean, errors: string[] } {
    const errors: string[] = []

    parameterDefs.forEach(param => {
      const value = values[param.name]

      // 检查必填参数
      if (param.required && (value === undefined || value === null || value === '')) {
        errors.push(`参数 "${param.displayName}" 是必填的`)
        return
      }

      // 如果值为空且非必填，跳过验证
      if (value === undefined || value === null || value === '') {
        return
      }

      // 类型验证
      switch (param.type) {
        case 'number':
          if (isNaN(Number(value))) {
            errors.push(`参数 "${param.displayName}" 必须是数字`)
          } else if (param.validation?.min !== undefined && Number(value) < param.validation.min) {
            errors.push(`参数 "${param.displayName}" 不能小于 ${param.validation.min}`)
          } else if (param.validation?.max !== undefined && Number(value) > param.validation.max) {
            errors.push(`参数 "${param.displayName}" 不能大于 ${param.validation.max}`)
          }
          break
          
        case 'string':
          if (typeof value !== 'string') {
            errors.push(`参数 "${param.displayName}" 必须是字符串`)
          } else if (param.validation?.pattern) {
            const regex = new RegExp(param.validation.pattern)
            if (!regex.test(value)) {
              errors.push(`参数 "${param.displayName}" 格式不正确`)
            }
          }
          break
          
        case 'date':
          if (!(value instanceof Date) && isNaN(Date.parse(value))) {
            errors.push(`参数 "${param.displayName}" 必须是有效日期`)
          }
          break
          
        case 'boolean':
          if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
            errors.push(`参数 "${param.displayName}" 必须是布尔值`)
          }
          break
          
        case 'list':
          if (param.options && param.options.length > 0) {
            const validValues = param.options.map(opt => opt.value)
            if (!validValues.includes(value)) {
              errors.push(`参数 "${param.displayName}" 值不在允许的选项中`)
            }
          }
          break
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 参数插值（用于传统formula）
   */
  private static interpolateParameters(formula: string, parameters: Record<string, any>): string {
    let sql = formula

    // 替换参数占位符 #{paramName}
    Object.entries(parameters).forEach(([key, value]) => {
      const placeholder = new RegExp(`#{${key}}`, 'g')
      
      // 根据值类型进行适当的格式化
      let formattedValue: string
      if (typeof value === 'string') {
        formattedValue = `'${value.replace(/'/g, "''")}'`
      } else if (value instanceof Date) {
        formattedValue = `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`
      } else {
        formattedValue = String(value)
      }
      
      sql = sql.replace(placeholder, formattedValue)
    })

    return sql
  }

  /**
   * 执行数据质量检查
   */
  private static performQualityChecks(
    data: any[], 
    checks: any[]
  ): { passed: boolean, errors: string[] } {
    const errors: string[] = []

    checks.forEach(check => {
      switch (check.type) {
        case 'null':
          const nullCount = data.filter(row => row[check.field] === null || row[check.field] === undefined).length
          if (nullCount > 0) {
            errors.push(`字段 "${check.field}" 包含 ${nullCount} 个空值`)
          }
          break
          
        case 'range':
          if (check.rule.min !== undefined || check.rule.max !== undefined) {
            data.forEach((row, index) => {
              const value = row[check.field]
              if (typeof value === 'number') {
                if (check.rule.min !== undefined && value < check.rule.min) {
                  errors.push(`第${index + 1}行字段 "${check.field}" 值 ${value} 小于最小值 ${check.rule.min}`)
                }
                if (check.rule.max !== undefined && value > check.rule.max) {
                  errors.push(`第${index + 1}行字段 "${check.field}" 值 ${value} 大于最大值 ${check.rule.max}`)
                }
              }
            })
          }
          break
          
        case 'duplicate':
          const values = data.map(row => row[check.field])
          const uniqueValues = [...new Set(values)]
          if (values.length !== uniqueValues.length) {
            errors.push(`字段 "${check.field}" 包含重复值`)
          }
          break
      }
    })

    return {
      passed: errors.length === 0,
      errors
    }
  }

  /**
   * 格式化查询结果
   */
  private static formatQueryResult(data: any[], metricType: string): any[] {
    return data.map((row: any) => {
      // 确保日期字段格式正确
      Object.keys(row).forEach(key => {
        if (row[key] instanceof Date) {
          row[key] = row[key].toISOString().split('T')[0]
        }
      })
      return row
    })
  }

  /**
   * 获取缓存结果
   */
  private static getCachedResult(key: string): { data: any[] } | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return { data: cached.data }
    }
    
    // 清理过期缓存
    if (cached) {
      this.cache.delete(key)
    }
    
    return null
  }

  /**
   * 设置缓存结果
   */
  private static setCacheResult(key: string, data: any[], ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  /**
   * 清理所有缓存
   */
  static clearCache(): void {
    this.cache.clear()
  }

  /**
   * 清理指定指标的缓存
   */
  static clearMetricCache(metricId: string): void {
    for (const [key] of this.cache) {
      if (key.startsWith(metricId)) {
        this.cache.delete(key)
      }
    }
  }
}