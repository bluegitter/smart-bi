import UserModel from '@/lib/db/userModel'
import connectDB from '@/lib/db'
import bcrypt from 'bcryptjs'
import { User } from '@/types'
import crypto from 'crypto'

// 用户服务类
export class UserService {
  
  // 创建用户
  static async createUser(userData: {
    email: string
    name: string
    password?: string
    role?: User['role']
    createdBy?: string
  }): Promise<User> {
    await connectDB()
    
    const { email, name, password, role = 'user', createdBy } = userData
    
    // 检查邮箱是否已存在
    const existingUser = await UserModel.findByEmail(email)
    if (existingUser) {
      throw new Error('邮箱已被注册')
    }
    
    const userDoc: any = {
      email: email.toLowerCase(),
      name,
      role,
      preferences: {
        theme: 'light',
        language: 'zh-CN',
        timezone: 'Asia/Shanghai'
      },
      isActive: true,
      emailVerified: false
    }
    
    // 如果提供了密码，进行哈希处理
    if (password) {
      const saltRounds = 12
      userDoc.passwordHash = await bcrypt.hash(password, saltRounds)
    }
    
    // 如果有创建者信息
    if (createdBy) {
      userDoc.createdBy = createdBy
    }
    
    const user = new UserModel(userDoc)
    await user.save()
    
    return user.toPublicJSON()
  }
  
  // 获取用户列表
  static async getUsers(options: {
    page?: number
    limit?: number
    role?: User['role']
    search?: string
    isActive?: boolean
  } = {}): Promise<{
    users: User[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    await connectDB()
    
    const {
      page = 1,
      limit = 20,
      role,
      search,
      isActive = true
    } = options
    
    // 构建查询条件
    const query: any = { isActive }
    
    if (role) {
      query.role = role
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }
    
    // 计算分页
    const skip = (page - 1) * limit
    
    // 执行查询
    const [users, total] = await Promise.all([
      UserModel.find(query)
        .select('-passwordHash -emailVerificationToken -passwordResetToken -passwordResetExpires')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserModel.countDocuments(query)
    ])
    
    return {
      users: users.map(user => ({
        ...user,
        _id: user._id.toString()
      })) as User[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }
  
  // 获取单个用户
  static async getUserById(userId: string): Promise<User | null> {
    await connectDB()
    
    const user = await UserModel.findById(userId)
      .select('-passwordHash -emailVerificationToken -passwordResetToken -passwordResetExpires')
      .populate('createdBy', 'name email')
      .lean()
    
    if (!user) {
      return null
    }
    
    return {
      ...user,
      _id: user._id.toString()
    } as User
  }
  
  // 通过邮箱获取用户
  static async getUserByEmail(email: string): Promise<User | null> {
    await connectDB()
    
    const user = await UserModel.findByEmail(email)
    
    if (!user) {
      return null
    }
    
    return user.toPublicJSON()
  }
  
  // 更新用户信息
  static async updateUser(userId: string, updateData: {
    name?: string
    role?: User['role']
    avatarUrl?: string
    preferences?: User['preferences']
    isActive?: boolean
  }): Promise<User | null> {
    await connectDB()
    
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-passwordHash -emailVerificationToken -passwordResetToken -passwordResetExpires')
    
    if (!user) {
      return null
    }
    
    return user.toPublicJSON()
  }
  
  // 更新用户密码
  static async updatePassword(userId: string, newPassword: string): Promise<boolean> {
    await connectDB()
    
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(newPassword, saltRounds)
    
    const result = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { passwordHash } }
    )
    
    return !!result
  }
  
  // 验证用户密码
  static async verifyPassword(email: string, password: string): Promise<User | null> {
    await connectDB()
    
    const user = await UserModel.findOne({ 
      email: email.toLowerCase(), 
      isActive: true 
    }).select('+passwordHash')
    
    if (!user || !user.passwordHash) {
      return null
    }
    
    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    
    if (!isValidPassword) {
      return null
    }
    
    // 更新最后登录时间
    await UserModel.findByIdAndUpdate(user._id, {
      $set: { lastLoginAt: new Date() }
    })
    
    return user.toPublicJSON()
  }
  
  // 删除用户（软删除）
  static async deleteUser(userId: string): Promise<boolean> {
    await connectDB()
    
    const result = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { isActive: false } }
    )
    
    return !!result
  }
  
  // 恢复用户
  static async restoreUser(userId: string): Promise<boolean> {
    await connectDB()
    
    const result = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { isActive: true } }
    )
    
    return !!result
  }
  
  // 生成密码重置token
  static async generatePasswordResetToken(email: string): Promise<string | null> {
    await connectDB()
    
    const user = await UserModel.findByEmail(email)
    if (!user) {
      return null
    }
    
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后过期
    
    await UserModel.findByIdAndUpdate(user._id, {
      $set: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires
      }
    })
    
    return resetToken
  }
  
  // 通过重置token重置密码
  static async resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
    await connectDB()
    
    const user = await UserModel.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }
    })
    
    if (!user) {
      return false
    }
    
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(newPassword, saltRounds)
    
    await UserModel.findByIdAndUpdate(user._id, {
      $set: { passwordHash },
      $unset: {
        passwordResetToken: 1,
        passwordResetExpires: 1
      }
    })
    
    return true
  }
  
  // 获取用户统计信息
  static async getUserStats(): Promise<{
    total: number
    active: number
    inactive: number
    byRole: Record<User['role'], number>
    recentUsers: number
  }> {
    await connectDB()
    
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const [
      total,
      active,
      inactive,
      roleStats,
      recentUsers
    ] = await Promise.all([
      UserModel.countDocuments({}),
      UserModel.countDocuments({ isActive: true }),
      UserModel.countDocuments({ isActive: false }),
      UserModel.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      UserModel.countDocuments({
        createdAt: { $gte: sevenDaysAgo },
        isActive: true
      })
    ])
    
    const byRole: Record<User['role'], number> = {
      admin: 0,
      user: 0,
      viewer: 0
    }
    
    roleStats.forEach((stat: any) => {
      byRole[stat._id as User['role']] = stat.count
    })
    
    return {
      total,
      active,
      inactive,
      byRole,
      recentUsers
    }
  }
}