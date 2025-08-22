import { NextRequest, NextResponse } from 'next/server'
import { MetricQueryService } from '@/lib/services/metricQueryService'
import type { SQLQueryConfig } from '@/types'

/**
 * 指标查询预览API
 * POST /api/metrics/preview
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { queryConfig, parameters = {} } = body

    // 验证请求参数
    if (!queryConfig) {
      return NextResponse.json(
        { error: '缺少查询配置' },
        { status: 400 }
      )
    }

    // 预览查询结果
    const result = await MetricQueryService.previewMetricQuery(queryConfig, parameters)

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