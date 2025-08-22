import { NextResponse } from 'next/server'
import { generateDevToken } from '@/lib/auth'

// 仅在开发环境可用的测试token端点
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  try {
    const token = generateDevToken()
    
    return NextResponse.json({
      token,
      user: {
        _id: '507f1f77bcf86cd799439011',
        email: 'dev@example.com',
        name: 'Development User'
      },
      message: 'Development token generated. Use this token in Authorization header as "Bearer {token}"'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    )
  }
}