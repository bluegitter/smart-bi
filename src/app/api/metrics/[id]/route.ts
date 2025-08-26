import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Metric } from '@/models/Metric'
import { DataSource } from '@/models/DataSource'
import { verifyToken } from '@/lib/auth'
import { requireAuth } from '@/lib/middleware/auth'
import { z } from 'zod'
import { ObjectId } from 'mongodb'

// 指标更新验证模式
const updateMetricSchema = z.object({
  name: z.string().min(1, '指标名称不能为空').regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, '指标名称只能包含字母、数字和下划线，且必须以字母开头').optional(),
  displayName: z.string().min(1, '显示名称不能为空').optional(),
  description: z.string().optional(),
  type: z.enum(['count', 'sum', 'avg', 'max', 'min', 'ratio', 'custom'], {
    errorMap: () => ({ message: '无效的指标类型' })
  }).optional(),
  formula: z.string().optional(),
  datasourceId: z.string().refine((val) => ObjectId.isValid(val), {
    message: '无效的数据源ID'
  }).optional(),
  category: z.string().min(1, '分类不能为空').optional(),
  unit: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  // 新增：SQL构建器字段
  queryConfig: z.object({
    select: z.array(z.object({
      field: z.string(),
      alias: z.string().optional(),
      aggregation: z.enum(['SUM', 'AVG', 'COUNT', 'MAX', 'MIN', 'DISTINCT']).optional(),
      table: z.string().optional()
    })).optional(),
    from: z.array(z.object({
      name: z.string(),
      alias: z.string().optional(),
      schema: z.string().optional()
    })).optional(),
    joins: z.array(z.object({
      type: z.enum(['INNER', 'LEFT', 'RIGHT', 'FULL']),
      table: z.string(),
      alias: z.string().optional(),
      condition: z.string()
    })).optional(),
    where: z.array(z.object({
      field: z.string().optional(),
      operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'like', 'between']).optional(),
      value: z.any().optional(),
      logic: z.enum(['AND', 'OR']).optional(),
      isParameter: z.boolean().optional(),
      parameterName: z.string().optional()
    })).optional(),
    groupBy: z.array(z.string()).optional(),
    having: z.array(z.object({
      field: z.string().optional(),
      operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'like', 'between']).optional(),
      value: z.any().optional(),
      logic: z.enum(['AND', 'OR']).optional()
    })).optional(),
    orderBy: z.array(z.object({
      field: z.string(),
      direction: z.enum(['ASC', 'DESC'])
    })).optional(),
    limit: z.number().optional(),
    customSql: z.string().optional()
  }).optional(),
  parameters: z.array(z.object({
    name: z.string(),
    displayName: z.string(),
    type: z.enum(['string', 'number', 'date', 'boolean', 'list']),
    required: z.boolean().optional(),
    defaultValue: z.any().optional(),
    options: z.array(z.object({
      label: z.string(),
      value: z.any()
    })).optional(),
    validation: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional()
    }).optional()
  })).optional(),
  version: z.number().optional()
})

// GET - 获取单个指标
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: '无效的指标ID' }, { status: 400 })
    }

    // 通过数据源关联查询指标，确保用户只能访问自己的指标
    const metric = await Metric.aggregate([
      {
        $match: { _id: new ObjectId(id) }
      },
      {
        $lookup: {
          from: 'datasources',
          localField: 'datasourceId',
          foreignField: '_id',
          as: 'dataSource'
        }
      },
      {
        $match: {
          'dataSource.userId': user._id
        }
      },
      {
        $project: {
          name: 1,
          displayName: 1,
          description: 1,
          type: 1,
          formula: 1,
          datasourceId: 1,
          category: 1,
          unit: 1,
          tags: 1,
          isActive: 1,
          queryConfig: 1,
          parameters: 1,
          version: 1,
          createdAt: 1,
          updatedAt: 1,
          dataSource: { $arrayElemAt: ['$dataSource', 0] }
        }
      }
    ])

    if (!metric || metric.length === 0) {
      return NextResponse.json({ error: '指标不存在或无权访问' }, { status: 404 })
    }

    return NextResponse.json(metric[0])
  } catch (error) {
    console.error('获取指标失败:', error)
    return NextResponse.json(
      { error: '获取指标失败' },
      { status: 500 }
    )
  }
}

// PUT - 更新指标
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: '无效的指标ID' }, { status: 400 })
    }

    const body = await request.json()
    
    // 验证请求数据
    const validationResult = updateMetricSchema.safeParse(body)
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

    // 通过数据源关联查询指标，确保用户只能更新自己的指标
    const existingMetric = await Metric.aggregate([
      {
        $match: { _id: new ObjectId(id) }
      },
      {
        $lookup: {
          from: 'datasources',
          localField: 'datasourceId',
          foreignField: '_id',
          as: 'dataSource'
        }
      },
      {
        $match: {
          'dataSource.userId': user._id
        }
      }
    ])

    if (!existingMetric || existingMetric.length === 0) {
      return NextResponse.json({ error: '指标不存在或无权访问' }, { status: 404 })
    }

    const originalMetric = existingMetric[0]

    // 如果要更新数据源，验证新数据源是否存在且属于当前用户
    if (updateData.datasourceId && updateData.datasourceId !== originalMetric.datasourceId.toString()) {
      const newDataSource = await DataSource.findOne({
        _id: new ObjectId(updateData.datasourceId),
        userId: user._id
      })

      if (!newDataSource) {
        return NextResponse.json(
          { error: '新数据源不存在或无权访问' },
          { status: 404 }
        )
      }
    }

    // 如果要更新指标名称，检查是否在同一数据源下重名
    if (updateData.name && updateData.name !== originalMetric.name) {
      const targetDatasourceId = updateData.datasourceId ? new ObjectId(updateData.datasourceId) : originalMetric.datasourceId
      
      const duplicateMetric = await Metric.findOne({
        name: updateData.name,
        datasourceId: targetDatasourceId,
        _id: { $ne: new ObjectId(id) }
      })

      if (duplicateMetric) {
        return NextResponse.json(
          { error: '指标名称在该数据源下已存在' },
          { status: 409 }
        )
      }
    }

    // 构建更新数据
    const finalUpdateData: any = {
      ...updateData,
      updatedAt: new Date()
    }

    // 如果有数据源ID，转换为ObjectId
    if (finalUpdateData.datasourceId) {
      finalUpdateData.datasourceId = new ObjectId(finalUpdateData.datasourceId)
    }

    // 更新指标
    const updatedMetric = await Metric.findOneAndUpdate(
      { _id: new ObjectId(id) },
      finalUpdateData,
      { new: true }
    ).populate('datasourceId', 'name type')

    return NextResponse.json(updatedMetric)
  } catch (error) {
    console.error('更新指标失败:', error)
    return NextResponse.json(
      { error: '更新指标失败' },
      { status: 500 }
    )
  }
}

// DELETE - 删除指标
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: '无效的指标ID' }, { status: 400 })
    }

    // 通过数据源关联查询指标，确保用户只能删除自己的指标
    const metric = await Metric.aggregate([
      {
        $match: { _id: new ObjectId(id) }
      },
      {
        $lookup: {
          from: 'datasources',
          localField: 'datasourceId',
          foreignField: '_id',
          as: 'dataSource'
        }
      },
      {
        $match: {
          'dataSource.userId': user._id
        }
      }
    ])

    if (!metric || metric.length === 0) {
      return NextResponse.json({ error: '指标不存在或无权访问' }, { status: 404 })
    }

    // TODO: 检查是否有仪表板或图表在使用这个指标
    // const dashboardsUsingMetric = await Dashboard.countDocuments({
    //   'components.metricId': new ObjectId(id)
    // })

    // if (dashboardsUsingMetric > 0) {
    //   return NextResponse.json(
    //     { error: '指标正在被仪表板使用，无法删除' },
    //     { status: 409 }
    //   )
    // }

    // 删除指标
    await Metric.findOneAndDelete({ _id: new ObjectId(id) })

    return NextResponse.json({ message: '指标删除成功' })
  } catch (error) {
    console.error('删除指标失败:', error)
    return NextResponse.json(
      { error: '删除指标失败' },
      { status: 500 }
    )
  }
}