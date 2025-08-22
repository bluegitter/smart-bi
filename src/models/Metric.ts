import mongoose, { Schema, Document } from 'mongoose'
import type { Metric as MetricType } from '@/types'

// Metric 接口
interface IMetric extends Omit<MetricType, '_id'>, Document {}

// Metric 模式
const MetricSchema = new Schema<IMetric>({
  name: {
    type: String,
    required: [true, '指标名称不能为空'],
    trim: true,
    maxlength: [100, '指标名称不能超过100个字符'],
    validate: {
      validator: function(v: string) {
        return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(v)
      },
      message: '指标名称只能包含字母、数字和下划线，且必须以字母开头'
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
    required: [true, '指标类型不能为空'],
    enum: {
      values: ['count', 'sum', 'avg', 'max', 'min', 'ratio', 'custom'],
      message: '无效的指标类型'
    }
  },
  formula: {
    type: String,
    trim: true,
    maxlength: [2000, '计算公式不能超过2000个字符']
  },
  datasourceId: {
    type: Schema.Types.ObjectId,
    ref: 'DataSource',
    required: [true, '数据源ID不能为空']
  },
  category: {
    type: String,
    required: [true, '分类不能为空'],
    trim: true,
    maxlength: [100, '分类名称不能超过100个字符']
  },
  unit: {
    type: String,
    trim: true,
    maxlength: [50, '单位不能超过50个字符']
  },
  tags: {
    type: [String],
    default: [],
    validate: {
      validator: function(v: string[]) {
        return v.length <= 20 // 最多20个标签
      },
      message: '标签数量不能超过20个'
    }
  },
  isActive: {
    type: Boolean,
    default: true
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
  collection: 'metrics'
})

// 复合索引
MetricSchema.index({ datasourceId: 1, name: 1 }, { unique: true })
MetricSchema.index({ datasourceId: 1, category: 1 })
MetricSchema.index({ datasourceId: 1, type: 1 })
MetricSchema.index({ datasourceId: 1, isActive: 1 })
MetricSchema.index({ tags: 1 })
MetricSchema.index({ createdAt: -1 })

// 文本搜索索引
MetricSchema.index({
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
MetricSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: new Date() })
})

// 静态方法：根据数据源ID获取活跃的指标
MetricSchema.statics.findActiveByDataSourceId = function(datasourceId: string) {
  return this.find({ datasourceId, isActive: true }).sort({ createdAt: -1 })
}

// 静态方法：根据分类获取指标
MetricSchema.statics.findByCategory = function(category: string) {
  return this.find({ category, isActive: true }).sort({ displayName: 1 })
}

// 静态方法：搜索指标
MetricSchema.statics.search = function(query: string, filters: any = {}) {
  const searchConditions = {
    $text: { $search: query },
    isActive: true,
    ...filters
  }
  
  return this.find(searchConditions, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
}

// 实例方法：获取相关指标（同分类或同标签）
MetricSchema.methods.getRelatedMetrics = function(limit = 5) {
  return this.constructor.find({
    _id: { $ne: this._id },
    datasourceId: this.datasourceId,
    $or: [
      { category: this.category },
      { tags: { $in: this.tags } }
    ],
    isActive: true
  }).limit(limit).sort({ createdAt: -1 })
}

// 虚拟字段：计算标签数量
MetricSchema.virtual('tagCount').get(function() {
  return this.tags.length
})

// 虚拟字段：判断是否有公式
MetricSchema.virtual('hasFormula').get(function() {
  return !!(this.formula && this.formula.trim())
})

// JSON 序列化时的转换
MetricSchema.set('toJSON', {
  transform: function(doc, ret) {
    // 转换 _id 为 id
    ret.id = ret._id
    delete ret._id
    delete ret.__v
    
    // 包含虚拟字段
    ret.tagCount = doc.tagCount
    ret.hasFormula = doc.hasFormula
    
    return ret
  },
  virtuals: true
})

// 导出模型
export const Metric = mongoose.models.Metric || mongoose.model<IMetric>('Metric', MetricSchema)