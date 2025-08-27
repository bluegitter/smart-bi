import mongoose, { Schema } from 'mongoose'
import { User } from '@/types'

// 用户Schema定义
const userSchema = new Schema<User>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'viewer'],
    default: 'user',
    required: true
  },
  avatarUrl: {
    type: String,
    required: false
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    language: {
      type: String,
      default: 'zh-CN'
    },
    timezone: {
      type: String,
      default: 'Asia/Shanghai'
    }
  },
  // 添加用户管理需要的额外字段
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date
  },
  // 密码字段 - 仅用于存储哈希后的密码
  passwordHash: {
    type: String,
    select: false // 查询时默认不返回密码
  },
  // 邮箱验证状态
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  // 密码重置
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  // 创建者信息
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true, // 自动添加 createdAt 和 updatedAt
  toJSON: {
    transform: (doc, ret) => {
      // 转换 _id 为 id
      ret.id = ret._id
      delete ret._id
      delete ret.__v
      // 确保不返回敏感信息
      delete ret.passwordHash
      delete ret.emailVerificationToken
      delete ret.passwordResetToken
      delete ret.passwordResetExpires
      return ret
    }
  }
})

// 添加索引
userSchema.index({ email: 1, isActive: 1 })
userSchema.index({ role: 1, isActive: 1 })
userSchema.index({ createdAt: -1 })

// 实例方法
userSchema.methods.toPublicJSON = function() {
  const userObject = this.toObject()
  delete userObject.passwordHash
  delete userObject.emailVerificationToken
  delete userObject.passwordResetToken
  delete userObject.passwordResetExpires
  return userObject
}

// 静态方法
userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true })
}

userSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase(), isActive: true })
}

userSchema.statics.findByRole = function(role: User['role']) {
  return this.find({ role, isActive: true })
}

// 创建用户模型
const UserModel = mongoose.models.User || mongoose.model<User>('User', userSchema)

export default UserModel
export { userSchema }