import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth'
import { ensureDefaultUsers } from '@/lib/middleware/initializeUsers'
import { z } from 'zod'

// 登录请求验证schema
const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '密码不能为空')
})

export async function POST(request: NextRequest) {
  try {
    // 确保默认用户已初始化
    await ensureDefaultUsers()

    const body = await request.json()
    
    // 验证请求数据
    const validationResult = loginSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: '请求数据格式错误', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { email, password } = validationResult.data

    // 使用新的认证服务
    const authResult = await authenticateUser(email, password)
    
    if (!authResult) {
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      )
    }

    const { user, token } = authResult

    // 设置Cookie
    const response = NextResponse.json({
      message: '登录成功',
      user,
      token
    })

    // 设置auth-token cookie
    response.cookies.set('auth-token', token, {
      httpOnly: false, // 允许JavaScript访问
      secure: process.env.NODE_ENV === 'production', // 生产环境使用HTTPS
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24小时
      path: '/'
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