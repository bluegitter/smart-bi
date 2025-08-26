import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

interface User {
  _id: string
  email: string
  name: string
}

export async function requireAuth(request: NextRequest): Promise<{ user: User | null; error: { error: string; status: number } | null }> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await verifyToken(token || '')
  
  if (!user) {
    return { user: null, error: { error: '未授权访问', status: 401 } }
  }
  
  return { user, error: null }
}