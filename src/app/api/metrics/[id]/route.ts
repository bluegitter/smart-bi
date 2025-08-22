import { NextRequest, NextResponse } from 'next/server'
import type { Metric } from '@/types'

// Mock data store - 在实际项目中应该从外部导入或连接数据库
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
  }
]

// GET /api/metrics/[id] - 获取单个指标
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const metric = mockMetrics.find(m => m._id === id)
    
    if (!metric) {
      return NextResponse.json(
        { error: 'Metric not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(metric)
  } catch (error) {
    console.error('Error fetching metric:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metric' },
      { status: 500 }
    )
  }
}

// PUT /api/metrics/[id] - 更新指标
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const metricIndex = mockMetrics.findIndex(m => m._id === id)
    if (metricIndex === -1) {
      return NextResponse.json(
        { error: 'Metric not found' },
        { status: 404 }
      )
    }

    // 如果更新指标名称，检查是否与其他指标冲突
    if (body.name && body.name !== mockMetrics[metricIndex].name) {
      const existingMetric = mockMetrics.find(m => m.name === body.name && m._id !== id)
      if (existingMetric) {
        return NextResponse.json(
          { error: 'Metric name already exists' },
          { status: 409 }
        )
      }
    }

    // 更新指标
    const updatedMetric: Metric = {
      ...mockMetrics[metricIndex],
      ...body,
      _id: id, // 确保ID不被覆盖
      updatedAt: new Date()
    }

    mockMetrics[metricIndex] = updatedMetric

    return NextResponse.json(updatedMetric)
  } catch (error) {
    console.error('Error updating metric:', error)
    return NextResponse.json(
      { error: 'Failed to update metric' },
      { status: 500 }
    )
  }
}

// DELETE /api/metrics/[id] - 删除指标（软删除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const metricIndex = mockMetrics.findIndex(m => m._id === id)
    if (metricIndex === -1) {
      return NextResponse.json(
        { error: 'Metric not found' },
        { status: 404 }
      )
    }

    // 软删除：标记为不活跃
    mockMetrics[metricIndex] = {
      ...mockMetrics[metricIndex],
      isActive: false,
      updatedAt: new Date()
    }

    return NextResponse.json({ message: 'Metric deleted successfully' })
  } catch (error) {
    console.error('Error deleting metric:', error)
    return NextResponse.json(
      { error: 'Failed to delete metric' },
      { status: 500 }
    )
  }
}