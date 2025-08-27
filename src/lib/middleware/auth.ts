import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

interface User {
  _id: string
  email: string
  name: string
}

export async function requireAuth(request: NextRequest): Promise<{ user: User | null; error: { error: string; status: number } | null }> {
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