import mongoose, { Schema, Document } from 'mongoose'
import type { DataSource as DataSourceType } from '@/types'

// DataSource 接口
interface IDataSource extends Omit<DataSourceType, '_id'>, Document {}

// DataSource 模式
const DataSourceSchema = new Schema<IDataSource>({
  name: {
    type: String,
    required: [true, '数据源名称不能为空'],
    trim: true,
    maxlength: [100, '数据源名称不能超过100个字符']
  },
  type: {
    type: String,
    required: [true, '数据源类型不能为空'],
    enum: {
      values: ['mysql', 'postgresql', 'mongodb', 'api', 'csv'],
      message: '无效的数据源类型'
    }
  },
  config: {
    host: {
      type: String,
      trim: true
    },
    port: {
      type: Number,
      min: [1, '端口号必须大于0'],
      max: [65535, '端口号不能超过65535']
    },
    database: {
      type: String,
      trim: true
    },
    username: {
      type: String,
      trim: true
    },
    password: {
      type: String,
      select: false // 默认不返回密码字段
    },
    apiUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          if (!v) return true // 可选字段
          try {
            new URL(v)
            return true
          } catch {
            return false
          }
        },
        message: '无效的API URL格式'
      }
    },
    headers: {
      type: Map,
      of: String,
      default: new Map()
    },
    filePath: {
      type: String,
      trim: true
    }
  },
  schemaInfo: {
    tables: [{
      name: {
        type: String,
        required: true
      },
      columns: [{
        name: {
          type: String,
          required: true
        },
        type: {
          type: String,
          required: true
        },
        nullable: {
          type: Boolean,
          default: true
        }
      }]
    }]
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用户ID不能为空']
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
  collection: 'datasources'
})

// 索引
DataSourceSchema.index({ userId: 1, name: 1 }, { unique: true })
DataSourceSchema.index({ userId: 1, type: 1 })
DataSourceSchema.index({ userId: 1, isActive: 1 })
DataSourceSchema.index({ createdAt: -1 })

// 中间件：更新时自动设置 updatedAt
DataSourceSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: new Date() })
})

// 静态方法：根据用户ID获取活跃的数据源
DataSourceSchema.statics.findActiveByUserId = function(userId: string) {
  return this.find({ userId, isActive: true }).sort({ createdAt: -1 })
}

// 实例方法：测试连接
DataSourceSchema.methods.testConnection = async function() {
  // 这里可以实现具体的连接测试逻辑
  return { success: true, message: '连接测试成功' }
}


// JSON 序列化时的转换
DataSourceSchema.set('toJSON', {
  transform: function(doc, ret) {
    try {
      // 转换 _id 为 id
      if (ret._id) {
        ret.id = ret._id
        delete ret._id
      }
      delete ret.__v
      
      // 确保不返回密码
      if (ret.config && typeof ret.config === 'object' && ret.config.password) {
        delete ret.config.password
      }
      
      return ret
    } catch (error) {
      console.error('Error in DataSource toJSON transform:', error)
      return ret || {}
    }
  }
})

// 导出模型
export const DataSource = mongoose.models.DataSource || mongoose.model<IDataSource>('DataSource', DataSourceSchema)