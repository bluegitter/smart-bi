import { Dataset } from '@/models/Dataset'
import { DataSource } from '@/models/DataSource'
import { connectDB } from '@/lib/mongodb'
import { executeQuery } from '@/lib/mysql'
import { datasetCache, queryCache, CacheKeys } from '@/lib/cache/CacheManager'
import type { 
  Dataset as DatasetType, 
  DatasetField, 
  DatasetPreview, 
  DatasetStats,
  FieldStats,
  CreateDatasetRequest,
  UpdateDatasetRequest,
  DatasetSearchParams,
  DataQualityIssue
} from '@/types/dataset'

export class DatasetService {
  // 创建数据集
  static async createDataset(userId: string, request: CreateDatasetRequest): Promise<DatasetType> {
    await connectDB()
    
    // 验证数据源
    let datasourceId: string = ''
    if (request.tableConfig) {
      datasourceId = request.tableConfig.datasourceId
    } else if (request.sqlConfig) {
      datasourceId = request.sqlConfig.datasourceId
    }
    
    if (datasourceId) {
      const datasource = await DataSource.findOne({ _id: datasourceId, userId })
      if (!datasource) {
        throw new Error('数据源不存在或无权限访问')
      }
    }
    
    // 创建数据集
    const dataset = new Dataset({
      ...request,
      userId,
      status: 'active', // 确保状态为active
      // 使用前端传递的字段，如果没有则使用临时字段
      fields: request.fields && request.fields.length > 0 ? request.fields : [{
        name: 'temp',
        displayName: '临时字段',
        type: 'string',
        fieldType: 'dimension',
        isNullable: true
      }],
      metadata: {
        columns: request.fields ? request.fields.length : 1,
        recordCount: 0
      },
      permissions: [{
        userId,
        role: 'owner'
      }]
    })
    
    // 保存数据集（跳过验证以允许临时状态）
    const savedDataset = await dataset.save({ validateBeforeSave: false })
    
    // 异步分析字段结构
    setImmediate(() => {
      this.analyzeDatasetFields(savedDataset._id.toString()).catch(console.error)
    })
    
    return savedDataset.toJSON()
  }
  
  // 更新数据集
  static async updateDataset(userId: string, datasetId: string, request: UpdateDatasetRequest): Promise<DatasetType> {
    await connectDB()
    
    console.log('DatasetService接收到的更新数据:', JSON.stringify(request, null, 2))
    console.log('字段单位信息:', request.fields?.map(f => ({ name: f.name, fieldType: f.fieldType, unit: f.unit })))
    
    const dataset = await Dataset.findOne({ _id: datasetId })
    if (!dataset) {
      throw new Error('数据集不存在')
    }
    
    if (!dataset.hasPermission(userId, 'editor')) {
      throw new Error('无权限编辑此数据集')
    }
    
    console.log('准备更新的数据:', { ...request })
    
    const updatedDataset = await Dataset.findOneAndUpdate(
      { _id: datasetId },
      { ...request },
      { new: true }
    )
    
    if (!updatedDataset) {
      throw new Error('更新失败')
    }
    
    console.log('更新后的数据集字段:', updatedDataset.fields?.map(f => ({ name: f.name, fieldType: f.fieldType, unit: f.unit })))
    
    // 清除相关缓存
    this.invalidateDatasetCache(datasetId)
    
    // 注意：更新数据集时不重新触发字段分析，以保留用户自定义设置
    
    return updatedDataset.toJSON()
  }
  
  // 获取数据集
  static async getDataset(userId: string, datasetId: string): Promise<DatasetType> {
    const cacheKey = CacheKeys.dataset(datasetId)
    
    // 尝试从缓存获取
    const cached = datasetCache.get<DatasetType>(cacheKey)
    if (cached) {
      // 仍需验证权限，但避免数据库查询
      return cached
    }
    
    return datasetCache.getOrSet(cacheKey, async () => {
      await connectDB()
      
      try {
        const dataset = await Dataset.findOne({ _id: datasetId })
        
        if (!dataset) {
          throw new Error('数据集不存在')
        }
        
        if (!dataset.hasPermission(userId, 'viewer')) {
          throw new Error('无权限访问此数据集')
        }
        
        // 先转换为JSON，避免populate引起的序列化问题
        const datasetJson = dataset.toJSON()
        
        // 手动获取关联的数据源信息（如果需要）
        if (datasetJson.tableConfig?.datasourceId) {
          try {
            const datasource = await DataSource.findById(datasetJson.tableConfig.datasourceId).select('name type')
            if (datasource) {
              datasetJson.tableConfig.datasourceId = {
                _id: datasource._id,
                name: datasource.name,
                type: datasource.type
              }
            }
          } catch (dsError) {
            console.warn('Failed to populate tableConfig datasource:', dsError)
          }
        }
        
        if (datasetJson.sqlConfig?.datasourceId) {
          try {
            const datasource = await DataSource.findById(datasetJson.sqlConfig.datasourceId).select('name type')
            if (datasource) {
              datasetJson.sqlConfig.datasourceId = {
                _id: datasource._id,
                name: datasource.name,
                type: datasource.type
              }
            }
          } catch (dsError) {
            console.warn('Failed to populate sqlConfig datasource:', dsError)
          }
        }
        
        return datasetJson
      } catch (error) {
        console.error('Error in getDataset:', error)
        throw error
      }
    }, {
      ttl: 10 * 60 * 1000, // 10 minutes
      tags: [`dataset:${datasetId}`, `user:${userId}`]
    })
  }
  
  // 搜索数据集
  static async searchDatasets(userId: string, params: DatasetSearchParams) {
    try {
      await connectDB()
      
      const {
        keyword,
        category,
        tags,
        type,
        status = process.env.NODE_ENV === 'development' ? undefined : 'active', // 开发环境显示所有状态
        sortBy = 'updatedAt',
        sortOrder = 'desc',
        page = 1,
        limit = 20
      } = params
    
    // 构建查询条件
    const query: any = {
      $or: [
        { userId },
        { 'permissions.userId': userId }
      ]
    }
    
    // 只在指定status时才添加状态过滤
    if (status) {
      query.status = status
    }
    
    if (keyword) {
      query.$text = { $search: keyword }
    }
    
    if (category) {
      query.category = category
    }
    
    if (tags && tags.length > 0) {
      query.tags = { $in: tags }
    }
    
    if (type) {
      query.type = type
    }
    
    // 构建排序
    const sortObj: any = {}
    if (keyword && sortBy === 'relevance') {
      sortObj.score = { $meta: 'textScore' }
    } else {
      sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1
    }
    
    // 执行查询
    const [datasets, total] = await Promise.all([
      Dataset.find(query)
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('tableConfig.datasourceId', 'name type')
        .populate('sqlConfig.datasourceId', 'name type')
        .lean(),
      Dataset.countDocuments(query)
    ])
    
    // 获取过滤选项的基础查询条件
    const baseFilterQuery = { 
      $or: [{ userId }, { 'permissions.userId': userId }]
    }
    
    // 在生产环境中只显示active状态的过滤选项
    if (process.env.NODE_ENV !== 'development') {
      (baseFilterQuery as any).status = 'active'
    }
    
    const [categories, allTags, types] = await Promise.all([
      Dataset.distinct('category', baseFilterQuery),
      Dataset.distinct('tags', baseFilterQuery),
      Dataset.distinct('type', baseFilterQuery)
    ])
    
      return {
        datasets,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        filters: {
          categories,
          tags: allTags.flat(),
          types
        }
      }
    } catch (error) {
      console.error('搜索数据集失败:', error)
      
      // 在开发环境返回空结果而不是抛出错误
      if (process.env.NODE_ENV === 'development') {
        return {
          datasets: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0
          },
          filters: {
            categories: [],
            tags: [],
            types: []
          }
        }
      }
      
      throw error
    }
  }
  
  // 预览数据集
  static async previewDataset(userId: string, datasetId: string, limit: number = 100): Promise<DatasetPreview> {
    const cacheKey = CacheKeys.datasetPreview(datasetId, limit)
    
    return queryCache.getOrSet(cacheKey, async () => {
      const dataset = await this.getDataset(userId, datasetId)
      console.log('🔍 预览数据集:', dataset.name, 'ID:', datasetId)
      console.log('🔍 数据集配置:', {
        type: dataset.type,
        tableConfig: dataset.tableConfig,
        sqlConfig: dataset.sqlConfig,
        fieldsCount: dataset.fields?.length
      })
      
      const startTime = Date.now()
      
      try {
        let query = ''
        let params: any[] = []
        
        if (dataset.type === 'table' && dataset.tableConfig) {
          const tableName = dataset.tableConfig.schema 
            ? `${dataset.tableConfig.schema}.${dataset.tableConfig.tableName}`
            : dataset.tableConfig.tableName
          query = `SELECT * FROM ${tableName} LIMIT ${limit}`
          params = []
        } else if (dataset.type === 'sql' && dataset.sqlConfig) {
          // 包装用户SQL以限制返回行数
          query = `SELECT * FROM (${dataset.sqlConfig.sql}) AS subquery LIMIT ${limit}`
          params = []
        } else if (dataset.type === 'view' && dataset.viewConfig) {
          // 基于父数据集构建查询
          const baseDataset = await this.getDataset(userId, dataset.viewConfig.baseDatasetId)
          // 这里需要根据过滤条件构建查询 - 简化实现
          query = `SELECT * FROM (${this.buildViewQuery(baseDataset, dataset.viewConfig)}) AS view_query LIMIT ${limit}`
          params = []
        } else {
          throw new Error('不支持的数据集类型')
        }
        
        // 获取数据源连接信息
        const datasourceId = dataset.tableConfig?.datasourceId || dataset.sqlConfig?.datasourceId
        if (!datasourceId) {
          throw new Error('缺少数据源配置')
        }
        
        // 获取包含密码的数据源配置
        const datasourceRaw = await DataSource.findById(datasourceId).lean()
        if (!datasourceRaw) {
          throw new Error('数据源不存在')
        }
        
        const datasourceWithPassword = await DataSource.findById(datasourceId).select('+config.password').lean()
        const datasource = {
          ...datasourceRaw,
          config: {
            ...datasourceRaw.config,
            password: datasourceWithPassword?.config?.password
          }
        } as any
        
        // 执行查询
        console.log('🔍 执行预览查询:', query)
        console.log('🔍 查询参数:', params)
        
        const result = await executeQuery(datasource.config, query, params)
        console.log('🔍 查询结果:', {
          dataLength: result.data?.length,
          columnsLength: result.columns?.length,
          total: result.total
        })
        
        return {
          columns: dataset.fields,
          rows: result.data,
          totalCount: result.total,
          executionTime: Date.now() - startTime
        }
      } catch (error) {
        return {
          columns: dataset.fields,
          rows: [],
          totalCount: 0,
          executionTime: Date.now() - startTime,
          errors: [error instanceof Error ? error.message : '查询失败']
        }
      }
    }, {
      ttl: 5 * 60 * 1000, // 5 minutes
      tags: [`dataset:${datasetId}`, 'preview']
    })
  }
  
  // 分析数据集字段（自动识别度量和维度）
  static async analyzeDatasetFields(datasetId: string): Promise<void> {
    try {
      await connectDB()
      
      const dataset = await Dataset.findById(datasetId)
      if (!dataset) return
      
      // 获取数据源
      let datasourceId: string = ''
      if (dataset.tableConfig) {
        datasourceId = dataset.tableConfig.datasourceId.toString()
      } else if (dataset.sqlConfig) {
        datasourceId = dataset.sqlConfig.datasourceId.toString()
      }
      
      if (!datasourceId) return
      
      // 获取包含密码的数据源配置
      const datasourceRaw = await DataSource.findById(datasourceId).lean()
      if (!datasourceRaw) return
      
      const datasourceWithPassword = await DataSource.findById(datasourceId).select('+config.password').lean()
      const datasource = {
        ...datasourceRaw,
        config: {
          ...datasourceRaw.config,
          password: datasourceWithPassword?.config?.password
        }
      } as any
      
      // 构建查询获取字段信息和样本数据
      let query = ''
      if (dataset.type === 'table' && dataset.tableConfig) {
        const tableName = dataset.tableConfig.schema 
          ? `${dataset.tableConfig.schema}.${dataset.tableConfig.tableName}`
          : dataset.tableConfig.tableName
        query = `SELECT * FROM ${tableName} LIMIT 1000`
      } else if (dataset.type === 'sql' && dataset.sqlConfig) {
        query = `SELECT * FROM (${dataset.sqlConfig.sql}) AS subquery LIMIT 1000`
      }
      
      if (!query) return
      
      const result = await executeQuery(datasource.config, query)
      if (!result.data || result.data.length === 0) return
      
      // 分析字段类型
      const analyzedFields = this.analyzeFieldTypes(result.columns, result.data)
      
      // 保留现有字段的用户自定义属性（如显示名称）
      const existingFieldsMap = new Map(dataset.fields.map(f => [f.name, f]))
      
      const mergedFields = analyzedFields.map(analyzedField => {
        const existingField = existingFieldsMap.get(analyzedField.name)
        if (existingField) {
          // 保留用户设置的属性，但更新分析得出的类型和样本值
          const merged = {
            ...analyzedField,
            displayName: existingField.displayName || analyzedField.displayName, // 保留用户设置的显示名称
            description: existingField.description || analyzedField.description, // 保留用户设置的描述
            fieldType: existingField.fieldType || analyzedField.fieldType, // 保留用户设置的字段类型
            aggregationType: existingField.aggregationType || analyzedField.aggregationType, // 保留用户设置的聚合类型
            dimensionLevel: existingField.dimensionLevel || analyzedField.dimensionLevel, // 保留用户设置的维度级别
            expression: existingField.expression, // 保留计算字段的表达式
            format: existingField.format, // 保留格式设置
            hidden: existingField.hidden // 保留隐藏状态
          }
          return merged
        }
        return analyzedField
      })
      
      
      // 计算数据质量
      const qualityIssues = this.analyzeDataQuality(mergedFields, result.data)
      const qualityScore = this.calculateQualityScore(qualityIssues)
      
      // 更新数据集
      await Dataset.findByIdAndUpdate(datasetId, {
        fields: mergedFields,
        metadata: {
          recordCount: result.total,
          lastRefreshed: new Date(),
          dataSize: JSON.stringify(result.data).length,
          columns: result.columns.length
        },
        qualityIssues,
        qualityScore,
        status: 'active'
      })
      
    } catch (error) {
      console.error('字段分析失败:', error)
      // 更新状态为错误
      await Dataset.findByIdAndUpdate(datasetId, {
        status: 'error',
        lastError: error instanceof Error ? error.message : '字段分析失败'
      })
    }
  }
  
  // 分析字段类型和特征
  private static analyzeFieldTypes(columns: any[], sampleData: any[]): DatasetField[] {
    return columns.map(col => {
      const fieldName = col.name
      const values = sampleData.map(row => row[fieldName]).filter(v => v != null)
      
      if (values.length === 0) {
        return {
          name: fieldName,
          displayName: fieldName,
          type: 'string' as const,
          fieldType: 'dimension' as const,
          isNullable: true,
          sampleValues: []
        }
      }
      
      // 分析数据类型
      const dataType = this.inferDataType(values)
      
      // 判断是度量还是维度
      const fieldType = this.inferFieldType(fieldName, dataType, values)
      
      // 生成样本值
      const uniqueValues = [...new Set(values)]
      const sampleValues = uniqueValues.slice(0, 10)
      
      const field: DatasetField = {
        name: fieldName,
        displayName: this.generateDisplayName(fieldName),
        type: dataType,
        fieldType,
        isNullable: sampleData.some(row => row[fieldName] == null),
        sampleValues
      }
      
      // 如果是度量，推断聚合类型
      if (fieldType === 'measure') {
        field.aggregationType = this.inferAggregationType(fieldName, values)
      }
      
      // 如果是维度，推断维度级别
      if (fieldType === 'dimension') {
        field.dimensionLevel = this.inferDimensionLevel(fieldName, dataType, values)
      }
      
      return field
    })
  }
  
  // 推断数据类型
  private static inferDataType(values: any[]): 'string' | 'number' | 'date' | 'boolean' {
    const sample = values.slice(0, 100) // 只分析前100个值
    
    // 检查是否为布尔值
    if (sample.every(v => typeof v === 'boolean' || v === 0 || v === 1 || v === '0' || v === '1' || v === 'true' || v === 'false')) {
      return 'boolean'
    }
    
    // 检查是否为数字
    const numericCount = sample.filter(v => !isNaN(Number(v)) && isFinite(Number(v))).length
    if (numericCount / sample.length > 0.8) {
      return 'number'
    }
    
    // 检查是否为日期
    const dateCount = sample.filter(v => {
      const date = new Date(v)
      return !isNaN(date.getTime()) && typeof v === 'string' && v.length > 8
    }).length
    if (dateCount / sample.length > 0.8) {
      return 'date'
    }
    
    return 'string'
  }
  
  // 推断字段类型（度量或维度）
  private static inferFieldType(fieldName: string, dataType: string, values: any[]): 'dimension' | 'measure' {
    // 字段名包含度量关键词
    const measureKeywords = ['count', 'sum', 'total', 'amount', 'price', 'cost', 'revenue', 'profit', 'qty', 'quantity', 'rate', 'percentage', '数量', '金额', '总额', '费用', '价格', '比率']
    if (measureKeywords.some(keyword => fieldName.toLowerCase().includes(keyword))) {
      return 'measure'
    }
    
    // 数字类型且唯一值较多，可能是度量
    if (dataType === 'number') {
      const uniqueCount = new Set(values).size
      const totalCount = values.length
      
      // 如果唯一值比例很高，可能是度量
      if (uniqueCount / totalCount > 0.5) {
        return 'measure'
      }
    }
    
    // 其他情况默认为维度
    return 'dimension'
  }
  
  // 推断聚合类型
  private static inferAggregationType(fieldName: string, values: any[]): 'SUM' | 'AVG' | 'COUNT' | 'MAX' | 'MIN' {
    const name = fieldName.toLowerCase()
    
    if (name.includes('count') || name.includes('num') || name.includes('数量')) {
      return 'COUNT'
    }
    
    if (name.includes('total') || name.includes('sum') || name.includes('amount') || name.includes('总')) {
      return 'SUM'
    }
    
    if (name.includes('avg') || name.includes('average') || name.includes('rate') || name.includes('平均')) {
      return 'AVG'
    }
    
    // 默认使用SUM
    return 'SUM'
  }
  
  // 推断维度级别
  private static inferDimensionLevel(fieldName: string, dataType: string, values: any[]): 'categorical' | 'ordinal' | 'temporal' {
    if (dataType === 'date') {
      return 'temporal'
    }
    
    const name = fieldName.toLowerCase()
    if (name.includes('date') || name.includes('time') || name.includes('年') || name.includes('月') || name.includes('日')) {
      return 'temporal'
    }
    
    // 检查是否为有序分类
    const ordinalKeywords = ['level', 'grade', 'rating', 'priority', 'rank', '等级', '级别', '评分']
    if (ordinalKeywords.some(keyword => name.includes(keyword))) {
      return 'ordinal'
    }
    
    return 'categorical'
  }
  
  // 生成显示名称
  private static generateDisplayName(fieldName: string): string {
    // 简单的驼峰转换和美化
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim()
  }
  
  // 分析数据质量
  private static analyzeDataQuality(fields: DatasetField[], sampleData: any[]): DataQualityIssue[] {
    const issues: DataQualityIssue[] = []
    const totalRecords = sampleData.length
    
    fields.forEach(field => {
      const fieldName = field.name
      const values = sampleData.map(row => row[fieldName])
      
      // 检查缺失值
      const nullCount = values.filter(v => v == null || v === '').length
      if (nullCount > 0) {
        const percentage = (nullCount / totalRecords) * 100
        issues.push({
          type: 'missing_values',
          field: fieldName,
          count: nullCount,
          percentage,
          description: `字段 ${field.displayName} 有 ${nullCount} 个缺失值`,
          severity: percentage > 50 ? 'high' : percentage > 20 ? 'medium' : 'low'
        })
      }
      
      // 检查重复记录（仅对主键字段）
      if (field.isPrimaryKey) {
        const nonNullValues = values.filter(v => v != null && v !== '')
        const uniqueCount = new Set(nonNullValues).size
        const duplicateCount = nonNullValues.length - uniqueCount
        
        if (duplicateCount > 0) {
          const percentage = (duplicateCount / totalRecords) * 100
          issues.push({
            type: 'duplicate_records',
            field: fieldName,
            count: duplicateCount,
            percentage,
            description: `主键字段 ${field.displayName} 有 ${duplicateCount} 个重复值`,
            severity: 'high'
          })
        }
      }
    })
    
    return issues
  }
  
  // 计算质量评分
  private static calculateQualityScore(issues: DataQualityIssue[]): number {
    if (issues.length === 0) return 100
    
    let score = 100
    
    issues.forEach(issue => {
      let penalty = 0
      
      switch (issue.severity) {
        case 'high':
          penalty = Math.min(issue.percentage * 0.8, 30)
          break
        case 'medium':
          penalty = Math.min(issue.percentage * 0.5, 20)
          break
        case 'low':
          penalty = Math.min(issue.percentage * 0.2, 10)
          break
      }
      
      score -= penalty
    })
    
    return Math.max(0, Math.round(score))
  }
  
  // 构建视图查询（简化版）
  private static buildViewQuery(baseDataset: DatasetType, viewConfig: any): string {
    // 这里是简化实现，实际应该根据viewConfig的filters和computedFields构建复杂查询
    if (baseDataset.type === 'table' && baseDataset.tableConfig) {
      const tableName = baseDataset.tableConfig.schema 
        ? `${baseDataset.tableConfig.schema}.${baseDataset.tableConfig.tableName}`
        : baseDataset.tableConfig.tableName
      return `SELECT * FROM ${tableName}`
    } else if (baseDataset.type === 'sql' && baseDataset.sqlConfig) {
      return baseDataset.sqlConfig.sql
    }
    
    throw new Error('无法构建视图查询')
  }
  
  // 查询数据集数据（支持度量、维度和筛选器）
  static async queryDataset(userId: string, datasetId: string, options: {
    measures: string[]
    dimensions: string[]
    filters: any[]
    limit: number
  }) {
    // 创建查询参数的哈希作为缓存键
    const queryHash = this.createQueryHash(options)
    const cacheKey = CacheKeys.datasetQuery(datasetId, queryHash)
    
    return queryCache.getOrSet(cacheKey, async () => {
      const dataset = await this.getDataset(userId, datasetId)
      const startTime = Date.now()
      
      try {
        let query = ''
        let params: any[] = []
        
        // 构建SELECT子句
        const selectFields = []
        
        // 添加维度字段
        options.dimensions.forEach(dim => {
          selectFields.push(dim)
        })
        
        // 添加度量字段（带聚合函数）
        options.measures.forEach(measure => {
          const field = dataset.fields.find(f => f.name === measure)
          const aggType = field?.aggregationType || 'SUM'
          selectFields.push(`${aggType}(${measure}) as ${measure}`)
        })
        
        // 如果没有指定字段，选择所有字段
        if (selectFields.length === 0) {
          selectFields.push('*')
        }
        
        const selectClause = selectFields.join(', ')
        
        // 构建FROM子句
        let fromClause = ''
        if (dataset.type === 'table' && dataset.tableConfig) {
          fromClause = dataset.tableConfig.schema 
            ? `${dataset.tableConfig.schema}.${dataset.tableConfig.tableName}`
            : dataset.tableConfig.tableName
        } else if (dataset.type === 'sql' && dataset.sqlConfig) {
          fromClause = `(${dataset.sqlConfig.sql}) AS subquery`
        } else if (dataset.type === 'view' && dataset.viewConfig) {
          const baseDataset = await this.getDataset(userId, dataset.viewConfig.baseDatasetId)
          fromClause = `(${this.buildViewQuery(baseDataset, dataset.viewConfig)}) AS view_query`
        } else {
          throw new Error('不支持的数据集类型')
        }
        
        // 构建WHERE子句（处理筛选器）
        const whereConditions = []
        options.filters.forEach((filter, index) => {
          if (filter.field && filter.operator && filter.value !== undefined) {
            switch (filter.operator) {
              case 'equals':
                whereConditions.push(`${filter.field} = ?`)
                params.push(filter.value)
                break
              case 'not_equals':
                whereConditions.push(`${filter.field} != ?`)
                params.push(filter.value)
                break
              case 'greater_than':
                whereConditions.push(`${filter.field} > ?`)
                params.push(filter.value)
                break
              case 'less_than':
                whereConditions.push(`${filter.field} < ?`)
                params.push(filter.value)
                break
              case 'contains':
                whereConditions.push(`${filter.field} LIKE ?`)
                params.push(`%${filter.value}%`)
                break
              case 'in':
                if (Array.isArray(filter.value) && filter.value.length > 0) {
                  const placeholders = filter.value.map(() => '?').join(', ')
                  whereConditions.push(`${filter.field} IN (${placeholders})`)
                  params.push(...filter.value)
                }
                break
            }
          }
        })
        
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''
        
        // 构建GROUP BY子句（如果有维度字段）
        const groupByClause = options.dimensions.length > 0 ? `GROUP BY ${options.dimensions.join(', ')}` : ''
        
        // 构建ORDER BY子句
        let orderByClause = ''
        if (options.measures.length > 0) {
          orderByClause = `ORDER BY ${options.measures[0]} DESC`
        } else if (options.dimensions.length > 0) {
          orderByClause = `ORDER BY ${options.dimensions[0]}`
        }
        
        // 构建完整查询
        query = [
          `SELECT ${selectClause}`,
          `FROM ${fromClause}`,
          whereClause,
          groupByClause,
          orderByClause,
          `LIMIT ?`
        ].filter(Boolean).join(' ')
        
        params.push(options.limit)
        
        // 获取数据源连接信息
        const datasourceId = dataset.tableConfig?.datasourceId || dataset.sqlConfig?.datasourceId
        if (!datasourceId) {
          throw new Error('缺少数据源配置')
        }
        
        // 获取包含密码的数据源配置
        const datasourceRaw = await DataSource.findById(datasourceId).lean()
        if (!datasourceRaw) {
          throw new Error('数据源不存在')
        }
        
        const datasourceWithPassword = await DataSource.findById(datasourceId).select('+config.password').lean()
        const datasource = {
          ...datasourceRaw,
          config: {
            ...datasourceRaw.config,
            password: datasourceWithPassword?.config?.password
          }
        } as any
        
        // 执行查询
        const result = await executeQuery(datasource.config, query, params)
        
        return {
          data: result.data,
          columns: result.columns || dataset.fields,
          total: result.total || result.data?.length || 0,
          executionTime: Date.now() - startTime
        }
      } catch (error) {
        console.error('数据集查询失败:', error)
        return {
          data: [],
          columns: dataset.fields,
          total: 0,
          executionTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : '查询失败'
        }
      }
    }, {
      ttl: 3 * 60 * 1000, // 3 minutes
      tags: [`dataset:${datasetId}`, 'query']
    })
  }

  // 删除数据集
  static async deleteDataset(userId: string, datasetId: string): Promise<void> {
    await connectDB()
    
    const dataset = await Dataset.findOne({ _id: datasetId })
    if (!dataset) {
      throw new Error('数据集不存在')
    }
    
    if (!dataset.hasPermission(userId, 'owner')) {
      throw new Error('无权限删除此数据集')
    }
    
    await Dataset.findByIdAndDelete(datasetId)
    
    // 清除相关缓存
    this.invalidateDatasetCache(datasetId)
  }

  // 缓存辅助方法

  /**
   * 创建查询参数的哈希值
   */
  private static createQueryHash(options: {
    measures: string[]
    dimensions: string[]
    filters: any[]
    limit: number
  }): string {
    const hashObject = {
      measures: options.measures.sort(),
      dimensions: options.dimensions.sort(),
      filters: options.filters.map(f => ({
        field: f.field,
        operator: f.operator,
        value: f.value
      })).sort((a, b) => a.field.localeCompare(b.field)),
      limit: options.limit
    }
    
    // 简单的哈希实现
    return Buffer.from(JSON.stringify(hashObject)).toString('base64')
  }

  /**
   * 清除数据集相关的所有缓存
   */
  private static invalidateDatasetCache(datasetId: string): void {
    // 清除数据集本身的缓存
    datasetCache.removeByTags([`dataset:${datasetId}`])
    
    // 清除查询缓存
    queryCache.removeByTags([`dataset:${datasetId}`])
    
    console.log(`清除数据集 ${datasetId} 相关缓存`)
  }

  /**
   * 获取缓存统计信息
   */
  static getCacheStats() {
    return {
      datasetCache: datasetCache.getStats(),
      queryCache: queryCache.getStats()
    }
  }

  /**
   * 手动清理过期缓存
   */
  static cleanupCache() {
    const datasetCleaned = datasetCache.cleanup()
    const queryCleaned = queryCache.cleanup()
    
    return {
      datasetCleaned,
      queryCleaned,
      total: datasetCleaned + queryCleaned
    }
  }

  // 检查数据集权限（静态方法，不依赖Mongoose实例）
  private static checkDatasetPermission(dataset: any, userId: string, requiredRole: 'viewer' | 'editor' | 'owner' = 'viewer'): boolean {
    // 数据集拥有者拥有所有权限
    if (dataset.userId?.toString() === userId || dataset.userId === userId) {
      return true
    }
    
    // 检查权限列表
    if (!dataset.permissions || !Array.isArray(dataset.permissions)) {
      return false
    }
    
    const permission = dataset.permissions.find((p: any) => {
      const permissionUserId = p.userId?.toString() || p.userId
      return permissionUserId === userId
    })
    
    if (!permission) return false
    
    // 权限级别检查
    const roleLevel = { viewer: 1, editor: 2, owner: 3 }
    return roleLevel[permission.role] >= roleLevel[requiredRole]
  }

  // 执行自定义SQL查询
  static async executeCustomSQL(userId: string, datasetId: string, sql: string): Promise<{
    rows: any[]
    columns: Array<{ name: string; displayName?: string }>
    executionTime: number
  }> {
    const startTime = Date.now()
    
    try {
      // 获取数据集信息
      const dataset = await this.getDataset(userId, datasetId)
      if (!dataset) {
        throw new Error('数据集不存在')
      }

      // 检查用户权限（手动实现，避免依赖Mongoose实例方法）
      const hasPermission = this.checkDatasetPermission(dataset, userId, 'viewer')
      if (!hasPermission) {
        throw new Error('没有访问权限')
      }

      // 获取数据源信息
      let datasourceId: any
      if (dataset.type === 'table' && dataset.tableConfig) {
        datasourceId = dataset.tableConfig.datasourceId
      } else if (dataset.type === 'sql' && dataset.sqlConfig) {
        datasourceId = dataset.sqlConfig.datasourceId
      } else if (dataset.type === 'view' && dataset.viewConfig) {
        // 视图类型需要获取基础数据集的数据源
        const baseDataset = await this.getDataset(userId, dataset.viewConfig.baseDatasetId)
        if (baseDataset?.type === 'table' && baseDataset.tableConfig) {
          datasourceId = baseDataset.tableConfig.datasourceId
        } else if (baseDataset?.type === 'sql' && baseDataset.sqlConfig) {
          datasourceId = baseDataset.sqlConfig.datasourceId
        }
      }
      
      if (!datasourceId) {
        throw new Error('数据源配置缺失')
      }

      // 调试日志：检查datasourceId的类型和值
      console.log(`🔍 datasourceId 类型: ${typeof datasourceId}, 值:`, datasourceId)
      console.log(`🔍 datasourceId 字符串表示: ${JSON.stringify(datasourceId)}`)

      console.log(`🔍 执行自定义SQL - 数据集: ${dataset.displayName}, SQL: ${sql.substring(0, 100)}...`)

      // 获取数据源配置信息（需要包含密码）
      let datasourceIdString: string
      if (typeof datasourceId === 'string') {
        datasourceIdString = datasourceId
      } else if (datasourceId && typeof datasourceId === 'object') {
        // 如果是对象，尝试获取 _id 或 id 字段
        datasourceIdString = datasourceId._id || datasourceId.id || datasourceId.toString()
      } else {
        datasourceIdString = String(datasourceId)
      }

      console.log(`🔍 提取的datasourceIdString: ${datasourceIdString}`)
      
      const DataSource = (await import('@/models/DataSource')).DataSource
      const datasource = await DataSource.findById(datasourceIdString).select('+config.password').lean()
      
      if (!datasource) {
        throw new Error('数据源不存在')
      }

      // 构建数据源配置对象
      const datasourceConfig = {
        host: datasource.config.host,
        port: datasource.config.port,
        database: datasource.config.database,
        username: datasource.config.username,
        password: datasource.config.password
      }

      // 执行SQL查询，使用config, sql, params的调用方式
      const result = await executeQuery(datasourceConfig, sql, [])
      
      const executionTime = Date.now() - startTime
      
      console.log(`✅ SQL执行完成 - 耗时: ${executionTime}ms, 返回行数: ${result.data?.length || 0}`)

      return {
        rows: result.data || [],
        columns: result.columns || [],
        executionTime
      }

    } catch (error) {
      const executionTime = Date.now() - startTime
      console.error(`❌ SQL执行失败 - 耗时: ${executionTime}ms, 错误:`, error)
      throw error
    }
  }
}