import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { DatasetService } from '@/lib/services/datasetService'

// GET /api/datasets/[id]/query - 查询数据集数据
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    const { searchParams } = new URL(request.url)
    const measures = searchParams.get('measures')?.split(',') || []
    const dimensions = searchParams.get('dimensions')?.split(',') || []
    const filters = searchParams.get('filters') ? JSON.parse(searchParams.get('filters')!) : []
    const limit = parseInt(searchParams.get('limit') || '100')

    const { id } = await params
    
    // 获取数据集信息
    const dataset = await DatasetService.getDataset(user._id, id)
    if (!dataset) {
      return NextResponse.json({ error: '数据集不存在' }, { status: 404 })
    }

    // 如果没有指定度量和维度，使用预览API
    if (measures.length === 0 && dimensions.length === 0) {
      const preview = await DatasetService.previewDataset(user._id, id, limit)
      return NextResponse.json({ 
        data: preview?.rows || [],
        columns: preview?.columns || [],
        total: preview?.rows?.length || 0
      })
    }

    // 执行数据查询
    const result = await DatasetService.queryDataset(user._id, id, {
      measures,
      dimensions,
      filters,
      limit
    })
    
    return NextResponse.json({
      data: result.data || [],
      columns: result.columns || [],
      total: result.total || 0
    })
  } catch (error) {
    console.error('查询数据集失败:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '查询数据集失败' 
    }, { status: 500 })
  }
}