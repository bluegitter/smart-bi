import { NextRequest, NextResponse } from 'next/server'
import { MetricQueryService } from '@/lib/services/metricQueryService'
import { verifyToken } from '@/lib/auth'
import { requireAuth } from '@/lib/middleware/auth'
import { connectDB } from '@/lib/mongodb'
import type { SQLQueryConfig } from '@/types'

/**
 * 指标查询预览API
 * POST /api/metrics/preview
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // 验证认证
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    const body = await request.json()
    const { queryConfig, parameters = {}, datasourceId } = body

    // 验证请求参数
    if (!queryConfig) {
      return NextResponse.json(
        { error: '缺少查询配置' },
        { status: 400 }
      )
    }

    // 预览查询结果
    const result = await MetricQueryService.previewMetricQuery(queryConfig, parameters, datasourceId)

    return NextResponse.json(result)

  } catch (error) {
    console.error('预览查询失败:', error)
    return NextResponse.json(
      { 
        error: '预览查询失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}