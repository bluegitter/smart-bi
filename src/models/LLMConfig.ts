import mongoose from 'mongoose'
import type { LLMConfig, LLMProvider } from '@/types/llm'

const LLMConfigSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  provider: {
    type: String,
    required: true,
    enum: ['openai', 'anthropic', 'zhipu', 'baidu', 'alibaba', 'tencent', 'moonshot', 'deepseek', 'custom']
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isDefault: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // 连接配置
  config: {
    apiKey: {
      type: String,
      required: true,
      select: false // 默认不返回敏感信息
    },
    apiUrl: {
      type: String,
      trim: true
    },
    model: {
      type: String,
      required: true,
      trim: true
    },
    temperature: {
      type: Number,
      min: 0,
      max: 2,
      default: 0.7
    },
    maxTokens: {
      type: Number,
      min: 1,
      max: 200000
    },
    topP: {
      type: Number,
      min: 0,
      max: 1
    },
    frequencyPenalty: {
      type: Number,
      min: -2,
      max: 2
    },
    presencePenalty: {
      type: Number,
      min: -2,
      max: 2
    }
  },
  
  // 功能支持
  capabilities: {
    chat: {
      type: Boolean,
      default: true
    },
    completion: {
      type: Boolean,
      default: true
    },
    embedding: {
      type: Boolean,
      default: false
    },
    vision: {
      type: Boolean,
      default: false
    },
    functionCalling: {
      type: Boolean,
      default: false
    }
  },
  
  // 使用限制
  limits: {
    maxRequestsPerMinute: Number,
    maxRequestsPerDay: Number,
    maxContextLength: Number
  },
  
  // 元数据
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  version: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // 审计字段
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: {
    transform: function(doc, ret) {
      // 转换_id为字符串
      ret._id = ret._id.toString()
      ret.userId = ret.userId.toString()
      return ret
    }
  }
})

// 创建复合索引
LLMConfigSchema.index({ userId: 1, name: 1 }, { unique: true })
LLMConfigSchema.index({ userId: 1, isActive: 1 })
LLMConfigSchema.index({ userId: 1, provider: 1 })

// 确保每个用户只有一个默认配置
LLMConfigSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('isDefault')) {
    if (this.isDefault) {
      // 将其他默认配置设为非默认
      await mongoose.model('LLMConfig').updateMany(
        { 
          userId: this.userId, 
          _id: { $ne: this._id },
          isDefault: true 
        },
        { isDefault: false }
      )
    }
  }
  next()
})

// 实例方法
LLMConfigSchema.methods.hasPermission = function(userId: string, permission: 'viewer' | 'editor' | 'owner' = 'viewer'): boolean {
  if (this.userId.toString() === userId) {
    return true
  }
  return false
}

// 静态方法
LLMConfigSchema.statics.findByUser = function(userId: string) {
  return this.find({ userId }).sort({ createdAt: -1 })
}

LLMConfigSchema.statics.findActiveByUser = function(userId: string) {
  return this.find({ userId, isActive: true }).sort({ createdAt: -1 })
}

LLMConfigSchema.statics.getDefaultForUser = function(userId: string) {
  return this.findOne({ userId, isDefault: true, isActive: true })
}

// 文本搜索索引
LLMConfigSchema.index({
  name: 'text',
  displayName: 'text',
  description: 'text'
})

export const LLMConfig = mongoose.models.LLMConfig || mongoose.model<LLMConfig>('LLMConfig', LLMConfigSchema)