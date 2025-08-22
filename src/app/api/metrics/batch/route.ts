import { NextRequest, NextResponse } from 'next/server'
import { MetricQueryService } from '@/lib/services/metricQueryService'

/**
 * 批量查询指标数据API
 * POST /api/metrics/batch
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { metricIds, parameters = {} } = body

    // 验证请求参数
    if (!metricIds || !Array.isArray(metricIds) || metricIds.length === 0) {
      return NextResponse.json(
        { error: '缺少指标ID列表' },
        { status: 400 }
      )
    }

    if (metricIds.length > 20) {
      return NextResponse.json(
        { error: '批量查询最多支持20个指标' },
        { status: 400 }
      )
    }

    console.log(`批量查询指标数据:`, metricIds, parameters)

    // 执行批量查询
    const results = await MetricQueryService.executeBatchMetricQuery(metricIds, parameters)

    return NextResponse.json({
      success: true,
      results,
      count: Object.keys(results).length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('批量查询失败:', error)
    return NextResponse.json(
      { 
        error: '批量查询失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}