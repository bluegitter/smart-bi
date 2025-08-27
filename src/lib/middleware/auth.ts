import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { User } from '@/types'
import { ensureDefaultUsers } from './initializeUsers'

export async function requireAuth(request: NextRequest): Promise<{ user: User | null; error: { error: string; status: number } | null }> {
  // 确保默认用户已初始化
  try {
    await ensureDefaultUsers()
  } catch (error) {
    console.error('用户初始化失败:', error)
    // 继续执行，不因初始化失败而阻断认证流程
  }

  // 优先从Authorization头获取token
  let token = request.headers.get('authorization')?.replace('Bearer ', '')
  
  // 如果没有Authorization头，尝试从cookie获取
  if (!token) {
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      const cookies = cookieHeader.split(';')
      const authTokenCookie = cookies.find(c => c.trim().startsWith('auth-token='))
      if (authTokenCookie) {
        token = authTokenCookie.split('=')[1]
      }
    }
  }
  
  const user = await verifyToken(token || '')
  
  if (!user) {
    return { user: null, error: { error: '未授权访问', status: 401 } }
  }
  
  return { user, error: null }
}

// 检查用户是否具有管理员权限
export async function requireAdmin(request: NextRequest): Promise<{ user: User | null; error: { error: string; status: number } | null }> {
  const { user, error } = await requireAuth(request)
  
  if (error) {
    return { user, error }
  }
  
  if (user!.role !== 'admin') {
    return { user: null, error: { error: '需要管理员权限', status: 403 } }
  }
  
  return { user, error: null }
}

// 检查用户角色权限
export async function requireRole(request: NextRequest, allowedRoles: User['role'][]): Promise<{ user: User | null; error: { error: string; status: number } | null }> {
  const { user, error } = await requireAuth(request)
  
  if (error) {
    return { user, error }
  }
  
  if (!allowedRoles.includes(user!.role)) {
    return { user: null, error: { error: '权限不足', status: 403 } }
  }
  
  return { user, error: null }
}