import { Dataset } from '@/models/Dataset'
import { DataSource } from '@/models/DataSource'
import { connectDB } from '@/lib/mongodb'
import { executeQuery } from '@/lib/mysql'
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
      fields: [], // 初始为空，后续通过分析生成
      metadata: {
        columns: 0,
        recordCount: 0
      },
      permissions: [{
        userId,
        role: 'owner'
      }]
    })
    
    // 保存数据集
    const savedDataset = await dataset.save()
    
    // 异步分析字段结构
    setImmediate(() => {
      this.analyzeDatasetFields(savedDataset._id.toString()).catch(console.error)
    })
    
    return savedDataset.toJSON()
  }
  
  // 更新数据集
  static async updateDataset(userId: string, datasetId: string, request: UpdateDatasetRequest): Promise<DatasetType> {
    await connectDB()
    
    const dataset = await Dataset.findOne({ _id: datasetId })
    if (!dataset) {
      throw new Error('数据集不存在')
    }
    
    if (!dataset.hasPermission(userId, 'editor')) {
      throw new Error('无权限编辑此数据集')
    }
    
    const updatedDataset = await Dataset.findOneAndUpdate(
      { _id: datasetId },
      { ...request },
      { new: true }
    )
    
    if (!updatedDataset) {
      throw new Error('更新失败')
    }
    
    return updatedDataset.toJSON()
  }
  
  // 获取数据集
  static async getDataset(userId: string, datasetId: string): Promise<DatasetType> {
    await connectDB()
    
    const dataset = await Dataset.findOne({ _id: datasetId })
      .populate('tableConfig.datasourceId', 'name type')
      .populate('sqlConfig.datasourceId', 'name type')
      .populate('viewConfig.baseDatasetId', 'name displayName')
    
    if (!dataset) {
      throw new Error('数据集不存在')
    }
    
    if (!dataset.hasPermission(userId, 'viewer')) {
      throw new Error('无权限访问此数据集')
    }
    
    return dataset.toJSON()
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
        status = 'active',
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
      ],
      status
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
    
    // 获取过滤选项
    const [categories, allTags, types] = await Promise.all([
      Dataset.distinct('category', { 
        $or: [{ userId }, { 'permissions.userId': userId }],
        status: 'active' 
      }),
      Dataset.distinct('tags', { 
        $or: [{ userId }, { 'permissions.userId': userId }],
        status: 'active' 
      }),
      Dataset.distinct('type', { 
        $or: [{ userId }, { 'permissions.userId': userId }],
        status: 'active' 
      })
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
    const dataset = await this.getDataset(userId, datasetId)
    const startTime = Date.now()
    
    try {
      let query = ''
      let params: any[] = []
      
      if (dataset.type === 'table' && dataset.tableConfig) {
        const tableName = dataset.tableConfig.schema 
          ? `${dataset.tableConfig.schema}.${dataset.tableConfig.tableName}`
          : dataset.tableConfig.tableName
        query = `SELECT * FROM ${tableName} LIMIT ?`
        params = [limit]
      } else if (dataset.type === 'sql' && dataset.sqlConfig) {
        // 包装用户SQL以限制返回行数
        query = `SELECT * FROM (${dataset.sqlConfig.sql}) AS subquery LIMIT ?`
        params = [limit]
      } else if (dataset.type === 'view' && dataset.viewConfig) {
        // 基于父数据集构建查询
        const baseDataset = await this.getDataset(userId, dataset.viewConfig.baseDatasetId)
        // 这里需要根据过滤条件构建查询 - 简化实现
        query = `SELECT * FROM (${this.buildViewQuery(baseDataset, dataset.viewConfig)}) AS view_query LIMIT ?`
        params = [limit]
      } else {
        throw new Error('不支持的数据集类型')
      }
      
      // 获取数据源连接信息
      const datasourceId = dataset.tableConfig?.datasourceId || dataset.sqlConfig?.datasourceId
      if (!datasourceId) {
        throw new Error('缺少数据源配置')
      }
      
      const datasource = await DataSource.findById(datasourceId)
      if (!datasource) {
        throw new Error('数据源不存在')
      }
      
      // 执行查询
      const result = await executeQuery(datasource.config, query, params)
      
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
      
      const datasource = await DataSource.findById(datasourceId)
      if (!datasource) return
      
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
      
      const result = await executeQuery(datasource.config, query, [])
      if (!result.data || result.data.length === 0) return
      
      // 分析字段类型
      const analyzedFields = this.analyzeFieldTypes(result.columns, result.data)
      
      // 计算数据质量
      const qualityIssues = this.analyzeDataQuality(analyzedFields, result.data)
      const qualityScore = this.calculateQualityScore(qualityIssues)
      
      // 更新数据集
      await Dataset.findByIdAndUpdate(datasetId, {
        fields: analyzedFields,
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
  }
}