import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/services/userService'
import { requireAuth } from '@/lib/middleware/auth'
import { z } from 'zod'

// 更新用户的验证schema
const updateUserSchema = z.object({
  name: z.string().min(1, '姓名不能为空').max(50, '姓名长度不能超过50个字符').optional(),
  role: z.enum(['admin', 'user', 'viewer']).optional(),
  avatarUrl: z.string().url('头像URL格式不正确').optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark']).optional(),
    language: z.string().optional(),
    timezone: z.string().optional()
  }).optional(),
  isActive: z.boolean().optional()
})

// POST /api/users/[id] - 获取单个用户信息
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证用户权限
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }
    
    const { id: userId } = await params
    
    // 用户只能查看自己的信息，管理员可以查看所有用户
    if (user!.role !== 'admin' && user!._id !== userId) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }
    
    const targetUser = await UserService.getUserById(userId)
    
    if (!targetUser) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ user: targetUser })
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return NextResponse.json(
      { error: '获取用户信息失败' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - 更新用户信息
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证用户权限
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }
    
    const { id: userId } = await params
    
    // 用户只能编辑自己的信息（除了role和isActive），管理员可以编辑所有用户
    const isOwnProfile = user!._id === userId
    const isAdmin = user!.role === 'admin'
    
    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const validationResult = updateUserSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: '请求数据格式错误', details: validationResult.error.errors },
        { status: 400 }
      )
    }
    
    const updateData = validationResult.data
    
    // 如果不是管理员，限制可修改的字段
    if (!isAdmin) {
      delete updateData.role
      delete updateData.isActive
    }
    
    const updatedUser = await UserService.updateUser(userId, updateData)
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      message: '用户信息更新成功',
      user: updatedUser
    })
  } catch (error) {
    console.error('更新用户信息失败:', error)
    return NextResponse.json(
      { error: '更新用户信息失败' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - 删除用户（软删除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证用户权限
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }
    
    // 只有管理员可以删除用户
    if (user!.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }
    
    const { id: userId } = await params
    
    // 不能删除自己
    if (user!._id === userId) {
      return NextResponse.json(
        { error: '不能删除自己的账户' },
        { status: 400 }
      )
    }
    
    const success = await UserService.deleteUser(userId)
    
    if (!success) {
      return NextResponse.json(
        { error: '用户不存在或删除失败' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      message: '用户删除成功'
    })
  } catch (error) {
    console.error('删除用户失败:', error)
    return NextResponse.json(
      { error: '删除用户失败' },
      { status: 500 }
    )
  }
}