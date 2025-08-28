import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/services/userService'
import { requireAuth } from '@/lib/middleware/auth'
import { z } from 'zod'

// 创建用户的验证schema
const createUserSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  name: z.string().min(1, '姓名不能为空').max(50, '姓名长度不能超过50个字符'),
  role: z.enum(['admin', 'user', 'viewer']).default('user'),
  password: z.string().min(6, '密码长度至少6位').optional()
})


// POST /api/users - 获取用户列表
export async function POST(request: NextRequest) {
  try {
    // 验证用户权限
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }
    
    // 只有管理员可以查看用户列表
    if (user!.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }
    
    // 解析查询参数 - 使用更简单的方法
    const { searchParams } = new URL(request.url)
    
    const options = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      role: searchParams.get('role') as 'admin' | 'user' | 'viewer' | undefined || undefined,
      search: searchParams.get('search') || undefined,
      isActive: searchParams.get('isActive') !== 'false' // 默认true，除非明确设为false
    }
    
    // 验证role参数
    if (options.role && !['admin', 'user', 'viewer'].includes(options.role)) {
      return NextResponse.json(
        { error: 'Invalid role parameter' },
        { status: 400 }
      )
    }
    
    // 清理空字符串
    if (options.search === '') options.search = undefined
    if (options.role === '') options.role = undefined
    
    
    const result = await UserService.getUsers(options)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('获取用户列表失败:', error)
    return NextResponse.json(
      { error: '获取用户列表失败' },
      { status: 500 }
    )
  }
}

// PUT /api/users - 创建用户
export async function PUT(request: NextRequest) {
  try {
    // 验证用户权限
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }
    
    // 只有管理员可以创建用户
    if (user!.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const validationResult = createUserSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: '请求数据格式错误', details: validationResult.error.errors },
        { status: 400 }
      )
    }
    
    const { email, name, role, password } = validationResult.data
    
    try {
      const newUser = await UserService.createUser({
        email,
        name,
        role,
        password,
        createdBy: user!._id
      })
      
      return NextResponse.json({
        message: '用户创建成功',
        user: newUser
      }, { status: 201 })
    } catch (serviceError: any) {
      if (serviceError.message === '邮箱已被注册') {
        return NextResponse.json(
          { error: serviceError.message },
          { status: 409 }
        )
      }
      throw serviceError
    }
  } catch (error) {
    console.error('创建用户失败:', error)
    return NextResponse.json(
      { error: '创建用户失败' },
      { status: 500 }
    )
  }
}