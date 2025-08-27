import { UserService } from '@/lib/services/userService'
import connectDB from '@/lib/db'

// 初始化默认用户
export async function initializeDefaultUsers() {
  await connectDB()

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
      const existingUser = await UserService.getUserByEmail(userData.email)
      if (!existingUser) {
        await UserService.createUser(userData)
        console.log(`✅ 创建默认用户: ${userData.email}`)
      } else {
        console.log(`ℹ️  用户已存在: ${userData.email}`)
      }
    } catch (error: any) {
      if (error.message === '邮箱已被注册') {
        console.log(`ℹ️  用户已存在: ${userData.email}`)
      } else {
        console.error(`❌ 创建用户失败 ${userData.email}:`, error)
      }
    }
  }
}

// 如果直接运行此脚本，则执行初始化
if (require.main === module) {
  initializeDefaultUsers()
    .then(() => {
      console.log('✅ 用户初始化完成')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ 用户初始化失败:', error)
      process.exit(1)
    })
}