import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = NextResponse.json({ 
      message: '退出登录成功' 
    })

    // 清除认证Cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0 // 立即过期
    })

    return response

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: '退出登录失败' },
      { status: 500 }
    )
  }
}