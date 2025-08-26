import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

interface User {
  _id: string
  email: string
  name: string
}

// JWT密钥 - 在生产环境中应该从环境变量获取
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function verifyToken(token: string): Promise<User | null> {
  try {
    if (!token) {
      throw new Error('No token provided')
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // 这里应该从数据库验证用户是否存在
    // 为了演示，我们返回一个模拟用户
    const user: User = {
      _id: decoded.userId || decoded.id || '507f1f77bcf86cd799439011',
      email: decoded.email || 'user@example.com',
      name: decoded.name || 'Test User'
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
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  )
}

export function extractUserFromToken(token: string): User | null {
  try {
    const decoded = jwt.decode(token) as any
    if (!decoded) return null
    
    return {
      _id: decoded.userId || decoded.id,
      email: decoded.email,
      name: decoded.name
    }
  } catch (error) {
    console.error('Token extraction failed:', error)
    return null
  }
}


