import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { DatasetService } from '@/lib/services/datasetService'

// POST /api/datasets/[id]/refresh - 刷新数据集统计信息
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    const { id: datasetId } = await params

    // 验证用户是否有权限访问该数据集
    try {
      await DatasetService.getDataset(user._id, datasetId)
    } catch (error) {
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : '数据集不存在或无权限访问' 
      }, { status: 403 })
    }

    // 异步刷新字段分析，立即返回响应
    setImmediate(() => {
      DatasetService.analyzeDatasetFields(datasetId).catch(console.error)
    })

    return NextResponse.json({ 
      message: '统计刷新已开始，请稍后刷新页面查看最新数据',
      status: 'started'
    })

  } catch (error) {
    console.error('刷新数据集统计失败:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '刷新统计失败' 
    }, { status: 500 })
  }
}