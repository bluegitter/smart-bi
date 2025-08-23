import mongoose, { Schema, Document } from 'mongoose'
import type { Dataset as DatasetType } from '@/types/dataset'

// Dataset 接口
interface IDataset extends Omit<DatasetType, '_id'>, Document {}

// 数据集字段模式
const DatasetFieldSchema = new Schema({
  name: { type: String, required: true },
  displayName: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ['string', 'number', 'date', 'boolean']
  },
  isPrimaryKey: { type: Boolean, default: false },
  isNullable: { type: Boolean, default: true },
  fieldType: {
    type: String,
    required: true,
    enum: ['dimension', 'measure', 'calculated']
  },
  aggregationType: {
    type: String,
    enum: ['SUM', 'AVG', 'COUNT', 'MAX', 'MIN', 'DISTINCT']
  },
  dimensionLevel: {
    type: String,
    enum: ['categorical', 'ordinal', 'temporal']
  },
  expression: String,
  format: {
    type: {
      type: String,
      enum: ['number', 'percentage', 'currency', 'date', 'custom']
    },
    pattern: String,
    decimalPlaces: Number,
    thousandsSeparator: Boolean
  },
  description: String,
  sampleValues: [Schema.Types.Mixed]
}, { _id: false })

// 表配置模式
const TableConfigSchema = new Schema({
  datasourceId: {
    type: Schema.Types.ObjectId,
    ref: 'DataSource',
    required: true
  },
  schema: String,
  tableName: { type: String, required: true },
  alias: String
}, { _id: false })

// SQL配置模式
const DatasetSQLConfigSchema = new Schema({
  datasourceId: {
    type: Schema.Types.ObjectId,
    ref: 'DataSource',
    required: true
  },
  sql: { type: String, required: true },
  parameters: [{
    name: { type: String, required: true },
    displayName: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['string', 'number', 'date', 'boolean', 'list']
    },
    required: { type: Boolean, default: false },
    defaultValue: Schema.Types.Mixed,
    options: [{
      label: String,
      value: Schema.Types.Mixed
    }],
    validation: {
      min: Number,
      max: Number,
      pattern: String
    }
  }]
}, { _id: false })

// 视图配置模式
const ViewConfigSchema = new Schema({
  baseDatasetId: {
    type: Schema.Types.ObjectId,
    ref: 'Dataset',
    required: true
  },
  filters: [{
    field: { type: String, required: true },
    operator: {
      type: String,
      required: true,
      enum: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'like', 'between', 'is_null', 'is_not_null']
    },
    value: Schema.Types.Mixed,
    logic: {
      type: String,
      enum: ['AND', 'OR'],
      default: 'AND'
    }
  }],
  computedFields: [{
    name: { type: String, required: true },
    displayName: { type: String, required: true },
    expression: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['string', 'number', 'date', 'boolean']
    },
    description: String
  }]
}, { _id: false })

// 数据质量问题模式
const DataQualityIssueSchema = new Schema({
  type: {
    type: String,
    required: true,
    enum: ['missing_values', 'duplicate_records', 'format_errors', 'outliers']
  },
  field: String,
  count: { type: Number, required: true },
  percentage: { type: Number, required: true },
  description: { type: String, required: true },
  severity: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high']
  }
}, { _id: false })

// Dataset 主模式
const DatasetSchema = new Schema<IDataset>({
  name: {
    type: String,
    required: [true, '数据集名称不能为空'],
    trim: true,
    maxlength: [100, '数据集名称不能超过100个字符'],
    validate: {
      validator: function(v: string) {
        return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(v)
      },
      message: '数据集名称只能包含字母、数字和下划线，且必须以字母开头'
    }
  },
  displayName: {
    type: String,
    required: [true, '显示名称不能为空'],
    trim: true,
    maxlength: [200, '显示名称不能超过200个字符']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, '描述不能超过1000个字符']
  },
  type: {
    type: String,
    required: [true, '数据集类型不能为空'],
    enum: {
      values: ['table', 'sql', 'view'],
      message: '无效的数据集类型'
    }
  },
  
  // 不同类型的配置
  tableConfig: {
    type: TableConfigSchema,
    required: function() { return this.type === 'table' }
  },
  sqlConfig: {
    type: DatasetSQLConfigSchema,
    required: function() { return this.type === 'sql' }
  },
  viewConfig: {
    type: ViewConfigSchema,
    required: function() { return this.type === 'view' }
  },
  
  // 数据集字段
  fields: {
    type: [DatasetFieldSchema],
    required: true,
    validate: {
      validator: function(v: any[]) {
        return v.length > 0
      },
      message: '数据集必须至少包含一个字段'
    }
  },
  
  // 元数据
  metadata: {
    recordCount: Number,
    lastRefreshed: Date,
    dataSize: Number,
    columns: {
      type: Number,
      required: true,
      min: 1
    }
  },
  
  // 分类和标签
  category: {
    type: String,
    required: [true, '分类不能为空'],
    trim: true,
    maxlength: [100, '分类名称不能超过100个字符']
  },
  tags: {
    type: [String],
    default: [],
    validate: {
      validator: function(v: string[]) {
        return v.length <= 20
      },
      message: '标签数量不能超过20个'
    }
  },
  
  // 权限控制
  permissions: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'owner'],
      required: true
    }
  }],
  
  // 缓存配置
  cacheConfig: {
    enabled: { type: Boolean, default: true },
    ttl: { type: Number, default: 3600 }, // 1小时默认缓存
    refreshSchedule: String // cron表达式
  },
  
  // 数据质量
  qualityScore: {
    type: Number,
    min: 0,
    max: 100
  },
  qualityIssues: [DataQualityIssueSchema],
  
  // 版本控制
  version: {
    type: Number,
    default: 1,
    min: 1
  },
  parentDatasetId: {
    type: Schema.Types.ObjectId,
    ref: 'Dataset'
  },
  
  // 状态管理
  status: {
    type: String,
    enum: ['active', 'inactive', 'processing', 'error'],
    default: 'active'
  },
  lastError: String,
  
  // 审计字段
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'datasets'
})

// 复合索引
DatasetSchema.index({ userId: 1, name: 1 }, { unique: true }) // 用户内数据集名称唯一
DatasetSchema.index({ userId: 1, category: 1 })
DatasetSchema.index({ userId: 1, type: 1 })
DatasetSchema.index({ userId: 1, status: 1 })
DatasetSchema.index({ tags: 1 })
DatasetSchema.index({ qualityScore: -1 })
DatasetSchema.index({ createdAt: -1 })
DatasetSchema.index({ updatedAt: -1 })

// 文本搜索索引
DatasetSchema.index({
  name: 'text',
  displayName: 'text',
  description: 'text'
}, {
  weights: {
    displayName: 3,
    name: 2,
    description: 1
  }
})

// 中间件：更新时自动设置 updatedAt
DatasetSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: new Date() })
})

// 静态方法：根据用户ID获取活跃的数据集
DatasetSchema.statics.findActiveByUserId = function(userId: string) {
  return this.find({ 
    $or: [
      { userId },
      { 'permissions.userId': userId }
    ],
    status: 'active' 
  }).sort({ updatedAt: -1 })
}

// 静态方法：根据分类获取数据集
DatasetSchema.statics.findByCategory = function(category: string, userId: string) {
  return this.find({ 
    $or: [
      { userId },
      { 'permissions.userId': userId }
    ],
    category, 
    status: 'active' 
  }).sort({ displayName: 1 })
}

// 静态方法：搜索数据集
DatasetSchema.statics.search = function(query: string, userId: string, filters: any = {}) {
  const searchConditions = {
    $text: { $search: query },
    $or: [
      { userId },
      { 'permissions.userId': userId }
    ],
    status: 'active',
    ...filters
  }
  
  return this.find(searchConditions, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' }, updatedAt: -1 })
}

// 实例方法：获取相关数据集
DatasetSchema.methods.getRelatedDatasets = function(limit = 5) {
  return this.constructor.find({
    _id: { $ne: this._id },
    $or: [
      { userId: this.userId },
      { 'permissions.userId': this.userId }
    ],
    $or: [
      { category: this.category },
      { tags: { $in: this.tags } }
    ],
    status: 'active'
  }).limit(limit).sort({ updatedAt: -1 })
}

// 实例方法：检查用户权限
DatasetSchema.methods.hasPermission = function(userId: string, requiredRole: 'viewer' | 'editor' | 'owner' = 'viewer') {
  // 数据集拥有者拥有所有权限
  if (this.userId.toString() === userId) {
    return true
  }
  
  // 检查权限列表
  const permission = this.permissions.find(p => p.userId.toString() === userId)
  if (!permission) return false
  
  // 权限级别检查
  const roleLevel = { viewer: 1, editor: 2, owner: 3 }
  return roleLevel[permission.role] >= roleLevel[requiredRole]
}

// 虚拟字段：计算字段数量
DatasetSchema.virtual('fieldCount').get(function() {
  return this.fields ? this.fields.length : 0
})

// 虚拟字段：计算维度数量
DatasetSchema.virtual('dimensionCount').get(function() {
  return this.fields ? this.fields.filter(f => f && f.fieldType === 'dimension').length : 0
})

// 虚拟字段：计算度量数量
DatasetSchema.virtual('measureCount').get(function() {
  return this.fields ? this.fields.filter(f => f && f.fieldType === 'measure').length : 0
})

// JSON 序列化时的转换
DatasetSchema.set('toJSON', {
  transform: function(doc, ret) {
    // 转换 _id 为 id
    ret.id = ret._id
    delete ret._id
    delete ret.__v
    
    // 包含虚拟字段
    ret.fieldCount = doc.fieldCount
    ret.dimensionCount = doc.dimensionCount
    ret.measureCount = doc.measureCount
    
    return ret
  },
  virtuals: true
})

// 导出模型
export const Dataset = mongoose.models.Dataset || mongoose.model<IDataset>('Dataset', DatasetSchema)