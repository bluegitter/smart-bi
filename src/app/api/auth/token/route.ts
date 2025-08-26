import { NextResponse } from 'next/server'
import { generateToken } from '@/lib/auth'

// 生产环境token生成端点 - 仅用于测试和管理
export async function POST() {
  try {
    // 创建默认管理员用户token
    const defaultUser = {
      _id: '507f1f77bcf86cd799439011',
      email: 'admin@smartbi.com',
      name: 'Smart-BI管理员'
    }
    
    const token = generateToken(defaultUser)
    
    return NextResponse.json({
      token,
      user: defaultUser,
      message: 'Production token generated. Use this token in Authorization header as "Bearer {token}"'
    })
  } catch (error) {
    console.error('Token generation failed:', error)
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    )
  }
}