import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    return NextResponse.json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: 'admin', // 从JWT token获取用户信息，默认角色
        avatarUrl: '',
        preferences: {
          theme: 'light',
          language: 'zh-CN',
          timezone: 'Asia/Shanghai'
        }
      }
    })

  } catch (error) {
    console.error('Auth verification error:', error)
    return NextResponse.json(
      { error: '认证验证失败' },
      { status: 500 }
    )
  }
}