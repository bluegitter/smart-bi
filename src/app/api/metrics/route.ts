import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Metric } from '@/models/Metric'
import { DataSource } from '@/models/DataSource'
import { verifyToken } from '@/lib/auth'
import { requireAuth } from '@/lib/middleware/auth'
import { z } from 'zod'
import { ObjectId } from 'mongodb'

// 指标创建验证模式
const createMetricSchema = z.object({
  name: z.string().min(1, '指标名称不能为空').regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, '指标名称只能包含字母、数字和下划线，且必须以字母开头'),
  displayName: z.string().min(1, '显示名称不能为空'),
  description: z.string().optional(),
  type: z.enum(['count', 'sum', 'avg', 'max', 'min', 'ratio', 'custom'], {
    errorMap: () => ({ message: '无效的指标类型' })
  }),
  formula: z.string().optional(),
  datasourceId: z.string().refine((val) => ObjectId.isValid(val), {
    message: '无效的数据源ID'
  }),
  category: z.string().min(1, '分类不能为空'),
  unit: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
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

// 测试数据库指标定义
const testDbMetrics = [
  {
    _id: 'sales_001',
    name: 'daily_sales_amount',
    displayName: '日销售额',
    description: '每日销售总金额',
    type: 'sum',
    formula: 'SELECT DATE(date) as date, SUM(sales_amount) as value FROM sales_data GROUP BY DATE(date) ORDER BY date DESC',
    datasourceId: 'mysql_test',
    category: '销售',
    unit: '元',
    tags: ['销售', '金额', '趋势'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: 'sales_002',
    name: 'category_sales',
    displayName: '分类销售额',
    description: '按产品分类的销售额分布',
    type: 'sum',
    formula: 'SELECT category, SUM(sales_amount) as value FROM sales_data GROUP BY category ORDER BY value DESC',
    datasourceId: 'mysql_test',
    category: '销售',
    unit: '元',
    tags: ['销售', '分类', '分布'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: 'sales_003',
    name: 'region_performance',
    displayName: '地区销售表现',
    description: '各地区销售额对比',
    type: 'sum',
    formula: 'SELECT region, SUM(sales_amount) as value FROM sales_data GROUP BY region ORDER BY value DESC',
    datasourceId: 'mysql_test',
    category: '销售',
    unit: '元',
    tags: ['销售', '地区', '对比'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: 'sales_004',
    name: 'top_products',
    displayName: '热销产品',
    description: '销售额前10的产品',
    type: 'sum',
    formula: 'SELECT product_name, SUM(sales_amount) as value FROM sales_data GROUP BY product_name ORDER BY value DESC LIMIT 10',
    datasourceId: 'mysql_test',
    category: '产品',
    unit: '元',
    tags: ['产品', '热销', 'TOP10'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: 'finance_001',
    name: 'profit_margin',
    displayName: '利润率',
    description: '各部门利润率对比',
    type: 'ratio',
    formula: 'SELECT department, ROUND(SUM(profit) / SUM(revenue) * 100, 2) as value FROM financial_data GROUP BY department',
    datasourceId: 'mysql_test',
    category: '财务',
    unit: '%',
    tags: ['财务', '利润率', '部门'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: 'finance_002',
    name: 'revenue_trend',
    displayName: '收入趋势',
    description: '每日收入变化趋势',
    type: 'sum',
    formula: 'SELECT DATE(date) as date, SUM(revenue) as value FROM financial_data GROUP BY DATE(date) ORDER BY date',
    datasourceId: 'mysql_test',
    category: '财务',
    unit: '元',
    tags: ['财务', '收入', '趋势'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: 'user_001',
    name: 'user_device_distribution',
    displayName: '用户设备分布',
    description: '用户使用设备类型分布',
    type: 'count',
    formula: 'SELECT device_type, COUNT(*) as value FROM user_behavior GROUP BY device_type',
    datasourceId: 'mysql_test',
    category: '用户行为',
    unit: '次',
    tags: ['用户', '设备', '分布'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: 'user_002',
    name: 'action_analysis',
    displayName: '用户行为分析',
    description: '用户行为类型统计',
    type: 'count',
    formula: 'SELECT action_type, COUNT(*) as value FROM user_behavior GROUP BY action_type ORDER BY value DESC',
    datasourceId: 'mysql_test',
    category: '用户行为',
    unit: '次',
    tags: ['用户', '行为', '统计'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
]

// Mock data store - keeping for fallback if needed
let mockMetrics = [
  {
    _id: '1',
    name: 'sales_amount',
    displayName: '销售额',
    description: '总销售金额',
    type: 'sum',
    formula: 'SUM(orders.amount)',
    datasourceId: 'ds1',
    category: '销售',
    unit: '元',
    tags: ['销售', '收入', '核心指标'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: '2',
    name: 'order_count',
    displayName: '订单数',
    description: '订单总数量',
    type: 'count',
    formula: 'COUNT(orders.id)',
    datasourceId: 'ds1',
    category: '销售',
    unit: '个',
    tags: ['销售', '订单'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: '3',
    name: 'conversion_rate',
    displayName: '转化率',
    description: '访问转化率',
    type: 'ratio',
    formula: 'COUNT(orders.id) / COUNT(sessions.id) * 100',
    datasourceId: 'ds1',
    category: '营销',
    unit: '%',
    tags: ['营销', '转化', '比率'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: '4',
    name: 'active_users',
    displayName: '活跃用户',
    description: '日活跃用户数',
    type: 'count',
    formula: 'COUNT(DISTINCT user_sessions.user_id)',
    datasourceId: 'ds1',
    category: '用户',
    unit: '人',
    tags: ['用户', '活跃度'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: '5',
    name: 'avg_order_value',
    displayName: '平均订单价值',
    description: '平均每单金额',
    type: 'avg',
    formula: 'AVG(orders.amount)',
    datasourceId: 'ds1',
    category: '销售',
    unit: '元',
    tags: ['销售', '平均值'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: '6',
    name: 'customer_retention',
    displayName: '客户留存率',
    description: '月度客户留存率',
    type: 'ratio',
    formula: 'COUNT(DISTINCT repeat_customers.id) / COUNT(DISTINCT all_customers.id) * 100',
    datasourceId: 'ds1',
    category: '客户',
    unit: '%',
    tags: ['客户', '留存', '忠诚度'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: '7',
    name: 'profit_margin',
    displayName: '利润率',
    description: '销售利润率',
    type: 'ratio',
    formula: '(SUM(orders.amount) - SUM(orders.cost)) / SUM(orders.amount) * 100',
    datasourceId: 'ds1',
    category: '财务',
    unit: '%',
    tags: ['财务', '利润', '成本'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: '8',
    name: 'page_views',
    displayName: '页面浏览量',
    description: '网站页面总浏览量',
    type: 'count',
    formula: 'COUNT(page_views.id)',
    datasourceId: 'ds1',
    category: '网站',
    unit: '次',
    tags: ['网站', '浏览', '流量'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
]

// POST - 获取指标列表
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    // 从请求体获取查询参数
    let queryParams = {}
    try {
      queryParams = await request.json()
    } catch {
      // 如果没有请求体，使用默认值
    }

    const page = parseInt(queryParams.page || '1')
    const limit = parseInt(queryParams.limit || '20')
    const category = queryParams.category
    const type = queryParams.type
    const search = queryParams.search
    const datasourceId = queryParams.datasourceId
    const tags = queryParams.tags ? (Array.isArray(queryParams.tags) ? queryParams.tags : queryParams.tags.split(',').filter(Boolean)) : undefined

    const skip = (page - 1) * limit

    // 构建查询条件 - 通过数据源关联查询用户的指标
    const pipeline: any[] = [
      // 关联数据源表
      {
        $lookup: {
          from: 'datasources',
          localField: 'datasourceId',
          foreignField: '_id',
          as: 'dataSource'
        }
      },
      // 过滤出属于当前用户的指标
      {
        $match: {
          'dataSource.userId': new ObjectId(user._id)
        }
      }
    ]

    // 添加额外的过滤条件
    const matchConditions: any = {}
    
    if (category) {
      matchConditions.category = category
    }
    
    if (type) {
      matchConditions.type = type
    }
    
    if (datasourceId && ObjectId.isValid(datasourceId)) {
      matchConditions.datasourceId = new ObjectId(datasourceId)
    }
    
    if (search) {
      matchConditions.$or = [
        { name: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }
    
    if (tags && tags.length > 0) {
      matchConditions.tags = { $in: tags }
    }

    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions })
    }

    // 添加排序
    pipeline.push({ $sort: { createdAt: -1 } })

    // 分页
    const [metrics, totalResult] = await Promise.all([
      Metric.aggregate([
        ...pipeline,
        { $skip: skip },
        { $limit: limit },
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
      ]),
      Metric.aggregate([
        ...pipeline,
        { $count: 'total' }
      ])
    ])

    const total = totalResult[0]?.total || 0

    // 获取分类和标签统计
    const [categories, allTags] = await Promise.all([
      Metric.aggregate([
        ...pipeline.slice(0, 2), // 只用前两个步骤（lookup和用户过滤）
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Metric.aggregate([
        ...pipeline.slice(0, 2),
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ])

    return NextResponse.json({
      metrics,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      categories: categories.map(c => ({ name: c._id, count: c.count })),
      tags: allTags.map(t => ({ name: t._id, count: t.count }))
    })
  } catch (error) {
    console.error('获取指标列表失败:', error)
    
    // 如果是MongoDB连接超时或其他连接错误，返回测试数据库指标
    if (error instanceof Error && (
      error.message.includes('buffering timed out') || 
      error.message.includes('connection') ||
      error.name === 'MongooseError'
    )) {
      console.warn('MongoDB连接失败，返回测试数据库指标')
      
      // 过滤和分页测试指标
      let filteredMetrics = testDbMetrics
      
      if (category) {
        filteredMetrics = filteredMetrics.filter(m => m.category === category)
      }
      if (type) {
        filteredMetrics = filteredMetrics.filter(m => m.type === type)
      }
      if (search) {
        const searchLower = search.toLowerCase()
        filteredMetrics = filteredMetrics.filter(m => 
          m.name.toLowerCase().includes(searchLower) ||
          m.displayName.toLowerCase().includes(searchLower) ||
          m.description?.toLowerCase().includes(searchLower)
        )
      }
      if (tags && tags.length > 0) {
        filteredMetrics = filteredMetrics.filter(m => 
          tags.some(tag => m.tags.includes(tag))
        )
      }
      
      const total = filteredMetrics.length
      const start = (page - 1) * limit
      const paginatedMetrics = filteredMetrics.slice(start, start + limit)
      
      // 统计分类和标签
      const categories = [...new Set(testDbMetrics.map(m => m.category))]
        .map(cat => ({
          name: cat,
          count: testDbMetrics.filter(m => m.category === cat).length
        }))
      
      const allTags = testDbMetrics.flatMap(m => m.tags)
      const uniqueTags = [...new Set(allTags)]
        .map(tag => ({
          name: tag,
          count: allTags.filter(t => t === tag).length
        }))
      
      return NextResponse.json({
        metrics: paginatedMetrics,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        categories,
        tags: uniqueTags,
        warning: 'MongoDB连接失败，当前显示测试数据库指标'
      })
    }
    
    return NextResponse.json(
      { error: '获取指标列表失败' },
      { status: 500 }
    )
  }
}

// PUT - 创建指标
export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    const body = await request.json()
    
    // 验证请求数据
    const validationResult = createMetricSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: '数据验证失败',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { name, displayName, description, type, formula, datasourceId, category, unit, tags, isActive, queryConfig, parameters, version } = validationResult.data

    // 验证数据源是否存在且属于当前用户
    const dataSource = await DataSource.findOne({
      _id: new ObjectId(datasourceId),
      userId: user._id
    })

    if (!dataSource) {
      return NextResponse.json(
        { error: '数据源不存在或无权访问' },
        { status: 404 }
      )
    }

    // 检查指标名称是否已存在（在同一数据源下）
    const existingMetric = await Metric.findOne({
      name,
      datasourceId: new ObjectId(datasourceId)
    })

    if (existingMetric) {
      return NextResponse.json(
        { error: '指标名称在该数据源下已存在' },
        { status: 409 }
      )
    }

    // 创建新指标
    const metricData: any = {
      name,
      displayName,
      description,
      type,
      datasourceId: new ObjectId(datasourceId),
      category,
      unit,
      tags,
      isActive,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // 传统formula或新的queryConfig
    if (formula) {
      metricData.formula = formula
    }
    if (queryConfig) {
      metricData.queryConfig = queryConfig
    }
    if (parameters) {
      metricData.parameters = parameters
    }
    if (version) {
      metricData.version = version
    }

    const metric = new Metric(metricData)

    await metric.save()

    // 返回创建的指标（包含数据源信息）
    const result = await Metric.findById(metric._id).populate('datasourceId', 'name type')

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('创建指标失败:', error)
    return NextResponse.json(
      { error: '创建指标失败' },
      { status: 500 }
    )
  }
}