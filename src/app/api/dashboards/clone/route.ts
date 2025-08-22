import { NextRequest, NextResponse } from 'next/server'
import { dashboardModel } from '@/lib/db/dashboardModel'

// POST /api/dashboards/clone - 克隆看板
export async function POST(request: NextRequest) {
  try {
    const { id, newName, userId } = await request.json()
    
    if (!id || !newName) {
      return NextResponse.json(
        { error: 'Dashboard ID and new name are required' },
        { status: 400 }
      )
    }

    const clonedDashboard = await dashboardModel.cloneDashboard(id, newName, userId)
    return NextResponse.json(clonedDashboard, { status: 201 })
  } catch (error) {
    console.error('Error cloning dashboard:', error)
    
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
      { error: 'Failed to clone dashboard' },
      { status: 500 }
    )
  }
}