import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { User } from '@/types'
import { UserService } from '@/lib/services/userService'

// JWT密钥 - 在生产环境中应该从环境变量获取
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function verifyToken(token: string): Promise<User | null> {
  try {
    if (!token) {
      throw new Error('No token provided')
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // 从数据库验证用户是否存在且处于活跃状态
    const user = await UserService.getUserById(decoded.userId || decoded.id)
    
    if (!user) {
      throw new Error('User not found or inactive')
    }
    
    return user
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  )
}

export function extractUserFromToken(token: string): Partial<User> | null {
  try {
    const decoded = jwt.decode(token) as any
    if (!decoded) return null
    
    return {
      _id: decoded.userId || decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    }
  } catch (error) {
    console.error('Token extraction failed:', error)
    return null
  }
}

// 用户登录验证
export async function authenticateUser(email: string, password: string): Promise<{ user: User; token: string } | null> {
  try {
    const user = await UserService.verifyPassword(email, password)
    
    if (!user) {
      return null
    }
    
    const token = generateToken(user)
    
    return { user, token }
  } catch (error) {
    console.error('Authentication failed:', error)
    return null
  }
}


