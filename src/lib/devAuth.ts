import { NextRequest } from 'next/server'
import { verifyToken } from './auth'

/**
 * 开发环境专用认证中间件
 * 在开发环境中，如果token验证失败，自动返回开发用户
 */
export async function verifyDevAuth(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  
  // 在开发环境中，如果没有token，直接返回开发用户
  if (process.env.NODE_ENV === 'development' && !token) {
    console.log('Development mode: No token provided, using default dev user')
    return {
      _id: '507f1f77bcf86cd799439011',
      email: 'dev@example.com',
      name: 'Development User'
    }
  }
  
  // 尝试验证token
  if (token) {
    try {
      const user = await verifyToken(token)
      if (user) {
        return user
      }
    } catch (error) {
      console.warn('Token verification failed:', error)
    }
  }
  
  // 在开发环境中，如果token验证失败，返回开发用户
  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode: Token verification failed, using fallback dev user')
    return {
      _id: '507f1f77bcf86cd799439011',
      email: 'dev@example.com',
      name: 'Development User'
    }
  }
  
  // 生产环境中返回null
  return null
}

/**
 * 检查请求是否已认证（开发环境友好）
 */
export async function requireAuth(request: NextRequest) {
  const user = await verifyDevAuth(request)
  
  if (!user) {
    return { user: null, error: { error: '未授权访问', status: 401 } }
  }
  
  return { user, error: null }
}