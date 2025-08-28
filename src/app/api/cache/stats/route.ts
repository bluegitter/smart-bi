import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { CacheInvalidator } from '@/lib/cache/CacheInvalidator'
import { datasetCache, metricsCache, queryCache } from '@/lib/cache/CacheManager'

// POST /api/cache/stats - 获取缓存统计信息
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    // 只有管理员可以查看缓存统计
    if (!user.isAdmin) {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      )
    }

    const stats = CacheInvalidator.getAllCacheStats()
    
    // 添加更多详细信息
    const detailedStats = {
      ...stats,
      summary: {
        totalHits: stats.dataset.hits + stats.metrics.hits + stats.query.hits,
        totalMisses: stats.dataset.misses + stats.metrics.misses + stats.query.misses,
        totalMemoryMB: Math.round((stats.dataset.totalMemoryUsed + stats.metrics.totalMemoryUsed + stats.query.totalMemoryUsed) / 1024 / 1024 * 100) / 100,
        totalEntries: stats.dataset.entryCount + stats.metrics.entryCount + stats.query.entryCount
      },
      health: {
        dataset: stats.dataset.memoryUsagePercent < 80 ? 'healthy' : 'warning',
        metrics: stats.metrics.memoryUsagePercent < 80 ? 'healthy' : 'warning',
        query: stats.query.memoryUsagePercent < 80 ? 'healthy' : 'warning'
      }
    }

    // 计算总体命中率
    const totalRequests = detailedStats.summary.totalHits + detailedStats.summary.totalMisses
    detailedStats.summary.overallHitRate = totalRequests > 0 
      ? Math.round((detailedStats.summary.totalHits / totalRequests) * 100 * 100) / 100
      : 0

    return NextResponse.json({
      success: true,
      data: detailedStats
    })

  } catch (error) {
    console.error('Failed to get cache stats:', error)
    return NextResponse.json(
      { 
        error: '获取缓存统计失败',
        details: error instanceof Error ? error.message : '未知错误'
      }, 
      { status: 500 }
    )
  }
}

// PUT /api/cache/stats - 清理过期缓存或执行缓存操作
export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    // 只有管理员可以操作缓存
    if (!user.isAdmin) {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action } = body

    let result

    switch (action) {
      case 'cleanup':
        result = {
          datasetCleaned: datasetCache.cleanup(),
          metricsCleaned: metricsCache.cleanup(),
          queryCleaned: queryCache.cleanup()
        }
        result.total = result.datasetCleaned + result.metricsCleaned + result.queryCleaned
        break

      case 'clear_all':
        const reason = body.reason || 'Manual admin operation'
        CacheInvalidator.emergencyClearAll(reason)
        result = { message: '所有缓存已清理', reason }
        break

      case 'clear_dataset':
        if (body.datasetId) {
          CacheInvalidator.onDatasetUpdated(body.datasetId, body.updateType || 'data')
          result = { message: `数据集 ${body.datasetId} 缓存已清理` }
        } else {
          datasetCache.clear()
          result = { message: '所有数据集缓存已清理' }
        }
        break

      case 'clear_metrics':
        if (body.metricId) {
          CacheInvalidator.onMetricUpdated(body.metricId, body.updateType || 'data')
          result = { message: `指标 ${body.metricId} 缓存已清理` }
        } else {
          metricsCache.clear()
          result = { message: '所有指标缓存已清理' }
        }
        break

      case 'clear_queries':
        queryCache.clear()
        result = { message: '所有查询缓存已清理' }
        break

      default:
        return NextResponse.json(
          { error: '不支持的操作' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Failed to perform cache operation:', error)
    return NextResponse.json(
      { 
        error: '缓存操作失败',
        details: error instanceof Error ? error.message : '未知错误'
      }, 
      { status: 500 }
    )
  }
}