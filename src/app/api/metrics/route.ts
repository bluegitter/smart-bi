import { NextRequest, NextResponse } from 'next/server'
import type { Metric } from '@/types'

// Mock data store (in production, this would be MongoDB)
let mockMetrics: Metric[] = [
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

// GET /api/metrics - 获取指标列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const tags = searchParams.get('tags')?.split(',')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    let filteredMetrics = mockMetrics.filter(metric => metric.isActive)

    // 按分类过滤
    if (category) {
      filteredMetrics = filteredMetrics.filter(metric => 
        metric.category.toLowerCase().includes(category.toLowerCase())
      )
    }

    // 按搜索关键词过滤
    if (search) {
      const searchLower = search.toLowerCase()
      filteredMetrics = filteredMetrics.filter(metric => 
        metric.name.toLowerCase().includes(searchLower) ||
        metric.displayName.toLowerCase().includes(searchLower) ||
        metric.description?.toLowerCase().includes(searchLower)
      )
    }

    // 按标签过滤
    if (tags && tags.length > 0) {
      filteredMetrics = filteredMetrics.filter(metric =>
        tags.some(tag => metric.tags.includes(tag))
      )
    }

    // 分页
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedMetrics = filteredMetrics.slice(startIndex, endIndex)

    // 获取所有可用的分类和标签
    const categories = [...new Set(mockMetrics.map(m => m.category))]
    const allTags = [...new Set(mockMetrics.flatMap(m => m.tags))]

    return NextResponse.json({
      metrics: paginatedMetrics,
      total: filteredMetrics.length,
      page,
      limit,
      categories,
      tags: allTags,
      hasMore: endIndex < filteredMetrics.length
    })
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}

// POST /api/metrics - 创建新指标
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 验证必需字段
    const requiredFields = ['name', 'displayName', 'type', 'datasourceId', 'category']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // 检查指标名称是否已存在
    const existingMetric = mockMetrics.find(m => m.name === body.name)
    if (existingMetric) {
      return NextResponse.json(
        { error: 'Metric name already exists' },
        { status: 409 }
      )
    }

    // 创建新指标
    const newMetric: Metric = {
      _id: Date.now().toString(), // 简单的ID生成
      name: body.name,
      displayName: body.displayName,
      description: body.description,
      type: body.type,
      formula: body.formula,
      datasourceId: body.datasourceId,
      category: body.category,
      unit: body.unit,
      tags: body.tags || [],
      isActive: body.isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    mockMetrics.push(newMetric)

    return NextResponse.json(newMetric, { status: 201 })
  } catch (error) {
    console.error('Error creating metric:', error)
    return NextResponse.json(
      { error: 'Failed to create metric' },
      { status: 500 }
    )
  }
}