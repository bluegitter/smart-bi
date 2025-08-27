import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/services/userService'
import { requireAuth } from '@/lib/middleware/auth'

// GET /api/users/stats - 获取用户统计信息
export async function GET(request: NextRequest) {
  try {
    // 验证用户权限
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }
    
    // 只有管理员可以查看用户统计
    if (user!.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }
    
    const stats = await UserService.getUserStats()
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('获取用户统计失败:', error)
    return NextResponse.json(
      { error: '获取用户统计失败' },
      { status: 500 }
    )
  }
}