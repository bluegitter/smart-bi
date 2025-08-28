import { NextRequest, NextResponse } from 'next/server'
import type { Dashboard } from '@/types'
import { dashboardModel } from '@/lib/db/dashboardModel'
import { requireAuth } from '@/lib/middleware/auth'

// POST /api/dashboards/[id] - 获取单个看板
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证认证
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }
    
    const { id } = await params
    const userId = user._id
    
    const dashboard = await dashboardModel.getDashboard(id, userId)
    return NextResponse.json(dashboard)
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Dashboard not found') {
        return NextResponse.json(
          { error: 'Dashboard not found' },
          { status: 404 }
        )
      }
      if (error.message === 'Access denied') {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch dashboard' },
      { status: 500 }
    )
  }
}

// PUT /api/dashboards/[id] - 更新看板
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const userId = body.userId || 'user1'
    
    const updatedDashboard = await dashboardModel.updateDashboard(id, body, userId)
    return NextResponse.json(updatedDashboard)
  } catch (error) {
    console.error('Error updating dashboard:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Dashboard not found') {
        return NextResponse.json(
          { error: 'Dashboard not found' },
          { status: 404 }
        )
      }
      if (error.message === 'No permission to edit this dashboard') {
        return NextResponse.json(
          { error: 'No permission to edit this dashboard' },
          { status: 403 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to update dashboard' },
      { status: 500 }
    )
  }
}

// DELETE /api/dashboards/[id] - 删除看板
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.nextUrl.searchParams.get('userId') || 'user1'
    
    await dashboardModel.deleteDashboard(id, userId)
    return NextResponse.json({ message: 'Dashboard deleted successfully' })
  } catch (error) {
    console.error('Error deleting dashboard:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Dashboard not found') {
        return NextResponse.json(
          { error: 'Dashboard not found' },
          { status: 404 }
        )
      }
      if (error.message === 'Only dashboard owner can delete it') {
        return NextResponse.json(
          { error: 'Only dashboard owner can delete it' },
          { status: 403 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to delete dashboard' },
      { status: 500 }
    )
  }
}