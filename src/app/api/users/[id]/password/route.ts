import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/services/userService'
import { requireAuth } from '@/lib/middleware/auth'
import { z } from 'zod'

// 更新密码的验证schema
const updatePasswordSchema = z.object({
  newPassword: z.string().min(6, '新密码长度至少6位').max(100, '密码长度不能超过100个字符'),
  currentPassword: z.string().optional() // 用户修改自己的密码时需要提供当前密码
})

// PUT /api/users/[id]/password - 更新用户密码
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户权限
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }
    
    const userId = params.id
    const isOwnPassword = user!._id === userId
    const isAdmin = user!.role === 'admin'
    
    // 用户只能修改自己的密码，管理员可以修改所有用户密码
    if (!isOwnPassword && !isAdmin) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const validationResult = updatePasswordSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: '请求数据格式错误', details: validationResult.error.errors },
        { status: 400 }
      )
    }
    
    const { newPassword, currentPassword } = validationResult.data
    
    // 如果是用户修改自己的密码，需要验证当前密码
    if (isOwnPassword && !isAdmin) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: '请提供当前密码' },
          { status: 400 }
        )
      }
      
      // 验证当前密码
      const isCurrentPasswordValid = await UserService.verifyPassword(user!.email, currentPassword)
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: '当前密码错误' },
          { status: 400 }
        )
      }
    }
    
    const success = await UserService.updatePassword(userId, newPassword)
    
    if (!success) {
      return NextResponse.json(
        { error: '用户不存在或密码更新失败' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      message: '密码更新成功'
    })
  } catch (error) {
    console.error('更新密码失败:', error)
    return NextResponse.json(
      { error: '更新密码失败' },
      { status: 500 }
    )
  }
}