import { NextRequest, NextResponse } from 'next/server'
import type { Dashboard } from '@/types'
import { dashboardModel } from '@/lib/db/dashboardModel'
import { requireAuth } from '@/lib/middleware/auth'

// POST /api/dashboards - 获取看板列表
export async function POST(request: NextRequest) {
  try {
    // 验证认证
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }
    
    // 从请求体获取参数
    let queryParams = {}
    try {
      queryParams = await request.json()
    } catch {
      // 如果没有请求体，使用默认值
    }
    
    const userId = user._id
    const page = parseInt(queryParams.page || '1')
    const limit = parseInt(queryParams.limit || '20')
    const search = queryParams.search || undefined

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

// PUT /api/dashboards - 创建新看板
export async function PUT(request: NextRequest) {
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