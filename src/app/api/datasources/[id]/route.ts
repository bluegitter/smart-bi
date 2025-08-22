import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { DataSource } from '@/models/DataSource'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'
import { ObjectId } from 'mongodb'

// 数据源更新验证模式
const updateDataSourceSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['mysql', 'postgresql', 'mongodb', 'api', 'csv']).optional(),
  config: z.object({
    host: z.string().optional(),
    port: z.number().optional(),
    database: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    apiUrl: z.string().url().optional(),
    headers: z.record(z.string()).optional(),
    filePath: z.string().optional(),
  }).optional(),
  isActive: z.boolean().optional()
})

// GET - 获取单个数据源
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: '无效的令牌' }, { status: 401 })
    }

    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: '无效的数据源ID' }, { status: 400 })
    }

    const dataSource = await DataSource.findOne({
      _id: new ObjectId(id),
      userId: user._id
    }).select('-config.password').lean()

    if (!dataSource) {
      return NextResponse.json({ error: '数据源不存在' }, { status: 404 })
    }

    return NextResponse.json(dataSource)
  } catch (error) {
    console.error('获取数据源失败:', error)
    return NextResponse.json(
      { error: '获取数据源失败' },
      { status: 500 }
    )
  }
}

// PUT - 更新数据源
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: '无效的令牌' }, { status: 401 })
    }

    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: '无效的数据源ID' }, { status: 400 })
    }

    const body = await request.json()
    
    // 验证请求数据
    const validationResult = updateDataSourceSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: '数据验证失败',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    // 检查数据源是否存在
    const existingDataSource = await DataSource.findOne({
      _id: new ObjectId(id),
      userId: user._id
    })

    if (!existingDataSource) {
      return NextResponse.json({ error: '数据源不存在' }, { status: 404 })
    }

    // 如果要更新名称，检查是否与其他数据源重名
    if (updateData.name && updateData.name !== existingDataSource.name) {
      const duplicateDataSource = await DataSource.findOne({
        name: updateData.name,
        userId: user._id,
        _id: { $ne: new ObjectId(id) }
      })

      if (duplicateDataSource) {
        return NextResponse.json(
          { error: '数据源名称已存在' },
          { status: 409 }
        )
      }
    }

    // 更新数据源
    const updatedDataSource = await DataSource.findOneAndUpdate(
      { _id: new ObjectId(id), userId: user._id },
      {
        ...updateData,
        updatedAt: new Date()
      },
      { new: true }
    ).select('-config.password')

    return NextResponse.json(updatedDataSource)
  } catch (error) {
    console.error('更新数据源失败:', error)
    return NextResponse.json(
      { error: '更新数据源失败' },
      { status: 500 }
    )
  }
}

// DELETE - 删除数据源
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: '无效的令牌' }, { status: 401 })
    }

    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: '无效的数据源ID' }, { status: 400 })
    }

    // 检查数据源是否存在
    const dataSource = await DataSource.findOne({
      _id: new ObjectId(id),
      userId: user._id
    })

    if (!dataSource) {
      return NextResponse.json({ error: '数据源不存在' }, { status: 404 })
    }

    // TODO: 检查是否有指标在使用这个数据源
    // const metricsUsingDataSource = await Metric.countDocuments({
    //   datasourceId: new ObjectId(id)
    // })

    // if (metricsUsingDataSource > 0) {
    //   return NextResponse.json(
    //     { error: '数据源正在被指标使用，无法删除' },
    //     { status: 409 }
    //   )
    // }

    // 删除数据源
    await DataSource.findOneAndDelete({
      _id: new ObjectId(id),
      userId: user._id
    })

    return NextResponse.json({ message: '数据源删除成功' })
  } catch (error) {
    console.error('删除数据源失败:', error)
    return NextResponse.json(
      { error: '删除数据源失败' },
      { status: 500 }
    )
  }
}