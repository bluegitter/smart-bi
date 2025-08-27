import { UserService } from '@/lib/services/userService'
import connectDB from '@/lib/db'

let initializationPromise: Promise<void> | null = null

// 检查并初始化默认用户（只执行一次）
export async function ensureDefaultUsers(): Promise<void> {
  // 如果已经在初始化中，等待完成
  if (initializationPromise) {
    return initializationPromise
  }

  initializationPromise = performInitialization()
  return initializationPromise
}

async function performInitialization(): Promise<void> {
  try {
    await connectDB()

    // 检查是否已有用户
    const stats = await UserService.getUserStats()
    
    if (stats.total === 0) {
      console.log('🚀 检测到系统首次启动，开始初始化默认用户...')
      
      const defaultUsers = [
        {
          email: 'admin@smartbi.com',
          name: '系统管理员',
          password: 'admin123',
          role: 'admin' as const
        },
        {
          email: 'user@smartbi.com',
          name: '普通用户',
          password: 'user123',
          role: 'user' as const
        },
        {
          email: 'viewer@smartbi.com',
          name: '观察者',
          password: 'viewer123',
          role: 'viewer' as const
        }
      ]

      for (const userData of defaultUsers) {
        try {
          await UserService.createUser(userData)
          console.log(`✅ 创建默认用户: ${userData.email}`)
        } catch (error: any) {
          if (error.message !== '邮箱已被注册') {
            console.error(`❌ 创建用户失败 ${userData.email}:`, error)
          }
        }
      }

      console.log('✅ 默认用户初始化完成')
      console.log('📋 默认登录信息:')
      console.log('   管理员: admin@smartbi.com / admin123')
      console.log('   普通用户: user@smartbi.com / user123')
      console.log('   观察者: viewer@smartbi.com / viewer123')
    } 
  } catch (error) {
    console.error('❌ 用户初始化失败:', error)
    // 重置 promise 以便下次重试
    initializationPromise = null
    throw error
  }
}