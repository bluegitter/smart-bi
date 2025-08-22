import { NextRequest, NextResponse } from 'next/server'
import type { User } from '@/types'

// Mock用户数据（与login中相同）
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

export async function GET(request: NextRequest) {
  try {
    // 从Cookie获取认证令牌
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      )
    }

    try {
      // 解析简单的token（实际应用中应该使用JWT库验证）
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
      
      // 检查token是否过期
      if (Date.now() > decoded.exp) {
        return NextResponse.json(
          { error: 'Token已过期' },
          { status: 401 }
        )
      }

      // 查找用户
      const user = mockUsers.find(u => u._id === decoded.userId)
      
      if (!user) {
        return NextResponse.json(
          { error: '用户不存在' },
          { status: 401 }
        )
      }

      return NextResponse.json({
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
          preferences: user.preferences
        }
      })

    } catch (error) {
      return NextResponse.json(
        { error: '无效的认证信息' },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('Auth verification error:', error)
    return NextResponse.json(
      { error: '认证验证失败' },
      { status: 500 }
    )
  }
}