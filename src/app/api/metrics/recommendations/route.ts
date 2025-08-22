import { NextRequest, NextResponse } from 'next/server'
import { metricRecommendationService } from '@/lib/metricRecommendationService'
import type { Metric } from '@/types'

// Mock metrics data - 在实际项目中应该从数据库获取
const mockMetrics: Metric[] = [
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
    tags: ['营销', '转化', '核心指标'],
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
    tags: ['客户', '留存', '核心指标'],
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
    tags: ['财务', '利润'],
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

// POST /api/metrics/recommendations - 获取指标推荐
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, query, componentType, baseMetrics, context } = body

    let result

    switch (type) {
      case 'query':
        // 根据查询推荐指标
        if (!query) {
          return NextResponse.json(
            { error: 'Query is required for query-based recommendations' },
            { status: 400 }
          )
        }
        result = await metricRecommendationService.recommendMetricsForQuery(
          query,
          mockMetrics
        )
        break

      case 'component':
        // 根据组件类型推荐指标
        if (!componentType) {
          return NextResponse.json(
            { error: 'Component type is required for component-based recommendations' },
            { status: 400 }
          )
        }
        result = await metricRecommendationService.recommendMetricsForComponent(
          componentType,
          mockMetrics,
          context
        )
        break

      case 'combination':
        // 推荐指标组合
        if (!baseMetrics || !Array.isArray(baseMetrics)) {
          return NextResponse.json(
            { error: 'Base metrics array is required for combination recommendations' },
            { status: 400 }
          )
        }
        
        // 从ID数组获取实际的指标对象
        const baseMetricObjects = mockMetrics.filter(metric =>
          baseMetrics.includes(metric._id)
        )
        
        result = await metricRecommendationService.recommendMetricCombinations(
          baseMetricObjects,
          mockMetrics
        )
        break

      case 'dashboard':
        // 生成智能看板布局
        if (!query) {
          return NextResponse.json(
            { error: 'Query is required for dashboard layout generation' },
            { status: 400 }
          )
        }
        result = await metricRecommendationService.generateDashboardLayout(
          query,
          mockMetrics
        )
        break

      default:
        return NextResponse.json(
          { error: 'Invalid recommendation type. Supported types: query, component, combination, dashboard' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      type,
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}

// GET /api/metrics/recommendations - 获取推荐配置信息
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const info = searchParams.get('info')

    if (info === 'types') {
      // 返回支持的推荐类型
      return NextResponse.json({
        types: [
          {
            type: 'query',
            name: '查询推荐',
            description: '根据自然语言查询推荐相关指标',
            requiredParams: ['query']
          },
          {
            type: 'component',
            name: '组件推荐',
            description: '根据图表组件类型推荐适合的指标',
            requiredParams: ['componentType']
          },
          {
            type: 'combination',
            name: '组合推荐',
            description: '根据已选指标推荐相关的指标组合',
            requiredParams: ['baseMetrics']
          },
          {
            type: 'dashboard',
            name: '看板生成',
            description: '根据查询自动生成完整的看板布局',
            requiredParams: ['query']
          }
        ]
      })
    }

    if (info === 'components') {
      // 返回支持的组件类型
      return NextResponse.json({
        components: [
          { type: 'line-chart', name: '折线图', suitableFor: ['趋势', '时间序列'] },
          { type: 'bar-chart', name: '柱状图', suitableFor: ['对比', '分类'] },
          { type: 'pie-chart', name: '饼图', suitableFor: ['占比', '分布'] },
          { type: 'table', name: '数据表', suitableFor: ['详细数据', '列表'] },
          { type: 'kpi-card', name: '指标卡片', suitableFor: ['核心指标', '关键数值'] },
          { type: 'gauge', name: '仪表盘', suitableFor: ['进度', '完成率'] }
        ]
      })
    }

    // 返回推荐服务的统计信息
    return NextResponse.json({
      availableMetrics: mockMetrics.length,
      categories: [...new Set(mockMetrics.map(m => m.category))],
      metricTypes: [...new Set(mockMetrics.map(m => m.type))],
      tags: [...new Set(mockMetrics.flatMap(m => m.tags))],
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error getting recommendation info:', error)
    return NextResponse.json(
      { error: 'Failed to get recommendation info' },
      { status: 500 }
    )
  }
}