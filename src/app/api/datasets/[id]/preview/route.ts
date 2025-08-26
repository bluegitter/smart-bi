import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { DatasetService } from '@/lib/services/datasetService'

// GET /api/datasets/[id]/preview - 预览数据集数据
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')

    const { id } = await params
    const preview = await DatasetService.previewDataset(user._id, id, limit)
    
    return NextResponse.json({ preview })
  } catch (error) {
    console.error('预览数据集失败:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '预览数据集失败' 
    }, { status: 500 })
  }
}