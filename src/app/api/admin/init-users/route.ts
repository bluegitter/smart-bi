import { NextRequest, NextResponse } from 'next/server'
import { initializeDefaultUsers } from '@/lib/db/initUsers'

// POST /api/admin/init-users - 初始化默认用户
export async function POST(request: NextRequest) {
  try {
    await initializeDefaultUsers()
    
    return NextResponse.json({
      message: '默认用户初始化成功',
      users: [
        { email: 'admin@smartbi.com', password: 'admin123', role: 'admin' },
        { email: 'user@smartbi.com', password: 'user123', role: 'user' },
        { email: 'viewer@smartbi.com', password: 'viewer123', role: 'viewer' }
      ]
    })
  } catch (error) {
    console.error('初始化用户失败:', error)
    return NextResponse.json(
      { error: '初始化用户失败' },
      { status: 500 }
    )
  }
}