import { NextRequest, NextResponse } from 'next/server'
import type { Dashboard } from '@/types'
import { dashboardModel } from '@/lib/db/dashboardModel'

// GET /api/dashboards - 获取看板列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'user1'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || undefined

    const result = await dashboardModel.getDashboards({
      userId,
      page,
      limit,
      search
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching dashboards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboards' },
      { status: 500 }
    )
  }
}

// POST /api/dashboards - 创建新看板
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 验证必需字段
    if (!body.name) {
      return NextResponse.json(
        { error: 'Dashboard name is required' },
        { status: 400 }
      )
    }

    // 验证看板数据
    const validation = dashboardModel.validateDashboard(body)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      )
    }

    const newDashboard = await dashboardModel.createDashboard({
      name: body.name,
      description: body.description || '',
      layout: body.layout || {
        grid: { columns: 12, rows: 8 },
        components: []
      },
      globalConfig: body.globalConfig || {
        theme: 'light',
        refreshInterval: 300000,
        timezone: 'Asia/Shanghai'
      },
      userId: body.userId || 'user1',
      isPublic: body.isPublic || false
    })

    return NextResponse.json(newDashboard, { status: 201 })
  } catch (error) {
    console.error('Error creating dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to create dashboard' },
      { status: 500 }
    )
  }
}