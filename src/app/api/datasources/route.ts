import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { DataSource } from '@/models/DataSource'
import { verifyToken } from '@/lib/auth'
import { requireAuth } from '@/lib/devAuth'
import { z } from 'zod'

// 数据源创建验证模式
const createDataSourceSchema = z.object({
  name: z.string().min(1, '数据源名称不能为空'),
  type: z.enum(['mysql', 'postgresql', 'mongodb', 'api', 'csv'], {
    errorMap: () => ({ message: '无效的数据源类型' })
  }),
  config: z.object({
    host: z.string().optional(),
    port: z.number().optional(),
    database: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    apiUrl: z.string().url().optional(),
    headers: z.record(z.string()).optional(),
    filePath: z.string().optional(),
  }),
  isActive: z.boolean().default(true)
})

// GET - 获取数据源列表
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // 构建查询条件
    const query: any = { userId: user._id }
    
    if (type) {
      query.type = type
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'config.database': { $regex: search, $options: 'i' } }
      ]
    }

    const [dataSources, total] = await Promise.all([
      DataSource.find(query)
        .select('-config.password') // 不返回密码字段
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DataSource.countDocuments(query)
    ])

    return NextResponse.json({
      dataSources,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('获取数据源列表失败:', error)
    
    // 如果是MongoDB连接超时或其他连接错误，返回空数据
    if (error instanceof Error && (
      error.message.includes('buffering timed out') || 
      error.message.includes('connection') ||
      error.name === 'MongooseError'
    )) {
      console.warn('MongoDB连接失败，返回空数据源列表')
      return NextResponse.json({
        dataSources: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        },
        warning: 'MongoDB连接失败，请检查数据库连接'
      })
    }
    
    return NextResponse.json(
      { error: '获取数据源列表失败' },
      { status: 500 }
    )
  }
}

// POST - 创建数据源
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    const body = await request.json()
    
    // 验证请求数据
    const validationResult = createDataSourceSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: '数据验证失败',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { name, type, config, isActive } = validationResult.data

    // 检查数据源名称是否已存在
    const existingDataSource = await DataSource.findOne({
      name,
      userId: user._id
    })

    if (existingDataSource) {
      return NextResponse.json(
        { error: '数据源名称已存在' },
        { status: 409 }
      )
    }

    // 创建新数据源
    const dataSource = new DataSource({
      name,
      type,
      config,
      userId: user._id,
      isActive,
      schemaInfo: { tables: [] }, // 初始化为空，后续通过测试连接获取
      createdAt: new Date(),
      updatedAt: new Date()
    })

    await dataSource.save()

    // 返回数据源信息（不包含密码）
    const result = dataSource.toObject()
    if (result.config.password) {
      delete result.config.password
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('创建数据源失败:', error)
    return NextResponse.json(
      { error: '创建数据源失败' },
      { status: 500 }
    )
  }
}