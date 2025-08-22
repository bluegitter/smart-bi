import { NextRequest, NextResponse } from 'next/server'
import type { User } from '@/types'

// Mock用户数据
const mockUsers: User[] = [
  {
    _id: 'user1',
    email: 'admin@smartbi.com',
    name: '管理员',
    role: 'admin',
    avatarUrl: '',
    preferences: {
      theme: 'light',
      language: 'zh-CN',
      timezone: 'Asia/Shanghai'
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  },
  {
    _id: 'user2',
    email: 'user@smartbi.com',
    name: '普通用户',
    role: 'user',
    avatarUrl: '',
    preferences: {
      theme: 'light',
      language: 'zh-CN',
      timezone: 'Asia/Shanghai'
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  },
  {
    _id: 'user3',
    email: 'viewer@smartbi.com',
    name: '观察者',
    role: 'viewer',
    avatarUrl: '',
    preferences: {
      theme: 'light',
      language: 'zh-CN',
      timezone: 'Asia/Shanghai'
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  }
]

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // 验证输入
    if (!email || !password) {
      return NextResponse.json(
        { error: '邮箱和密码不能为空' },
        { status: 400 }
      )
    }

    // 查找用户（在实际应用中应该对密码进行哈希验证）
    const user = mockUsers.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 401 }
      )
    }

    // 简单的密码验证（实际应用中应该使用bcrypt等加密库）
    const validPasswords = {
      'admin@smartbi.com': 'admin123',
      'user@smartbi.com': 'user123',
      'viewer@smartbi.com': 'viewer123'
    }

    if (validPasswords[email as keyof typeof validPasswords] !== password) {
      return NextResponse.json(
        { error: '密码错误' },
        { status: 401 }
      )
    }

    // 生成简单的JWT令牌（实际应用中应该使用真正的JWT库）
    const token = Buffer.from(JSON.stringify({ 
      userId: user._id, 
      email: user.email, 
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24小时过期
    })).toString('base64')

    // 设置Cookie
    const response = NextResponse.json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        preferences: user.preferences
      },
      token
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24小时
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    )
  }
}