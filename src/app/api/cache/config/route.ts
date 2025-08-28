import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { datasetCache, metricsCache, queryCache } from '@/lib/cache/CacheManager'
import type { CacheConfig } from '@/lib/cache/CacheManager'

// POST /api/cache/config - 获取缓存配置
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    // 只有管理员可以查看缓存配置
    if (!user.isAdmin) {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      )
    }

    // 获取当前配置（这里是简化版本，实际应该从配置管理系统获取）
    const config = {
      dataset: {
        maxMemorySize: 50, // MB
        defaultTTL: 10 * 60 * 1000, // 10 minutes
        cleanupInterval: 2 * 60 * 1000, // 2 minutes
        enableMetrics: true
      },
      metrics: {
        maxMemorySize: 30, // MB
        defaultTTL: 5 * 60 * 1000, // 5 minutes
        cleanupInterval: 60 * 1000, // 1 minute
        enableMetrics: true
      },
      query: {
        maxMemorySize: 100, // MB
        defaultTTL: 3 * 60 * 1000, // 3 minutes
        cleanupInterval: 60 * 1000, // 1 minute
        enableMetrics: true
      },
      global: {
        enableCaching: true,
        enableAutoCleanup: true,
        logLevel: 'info'
      }
    }

    return NextResponse.json({
      success: true,
      data: config
    })

  } catch (error) {
    console.error('Failed to get cache config:', error)
    return NextResponse.json(
      { 
        error: '获取缓存配置失败',
        details: error instanceof Error ? error.message : '未知错误'
      }, 
      { status: 500 }
    )
  }
}

// PUT /api/cache/config - 更新缓存配置
export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    // 只有管理员可以修改缓存配置
    if (!user.isAdmin) {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { dataset: datasetConfig, metrics: metricsConfig, query: queryConfig } = body

    const results: any = {}

    // 更新数据集缓存配置
    if (datasetConfig) {
      try {
        datasetCache.updateConfig(datasetConfig)
        results.dataset = { success: true, config: datasetConfig }
      } catch (error) {
        results.dataset = { 
          success: false, 
          error: error instanceof Error ? error.message : '配置更新失败' 
        }
      }
    }

    // 更新指标缓存配置
    if (metricsConfig) {
      try {
        metricsCache.updateConfig(metricsConfig)
        results.metrics = { success: true, config: metricsConfig }
      } catch (error) {
        results.metrics = { 
          success: false, 
          error: error instanceof Error ? error.message : '配置更新失败' 
        }
      }
    }

    // 更新查询缓存配置
    if (queryConfig) {
      try {
        queryCache.updateConfig(queryConfig)
        results.query = { success: true, config: queryConfig }
      } catch (error) {
        results.query = { 
          success: false, 
          error: error instanceof Error ? error.message : '配置更新失败' 
        }
      }
    }

    // 检查是否有失败的更新
    const hasErrors = Object.values(results).some((r: any) => !r.success)

    return NextResponse.json({
      success: !hasErrors,
      results,
      message: hasErrors ? '部分配置更新失败' : '缓存配置更新成功',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Failed to update cache config:', error)
    return NextResponse.json(
      { 
        error: '更新缓存配置失败',
        details: error instanceof Error ? error.message : '未知错误'
      }, 
      { status: 500 }
    )
  }
}

// DELETE /api/cache/config - 重置缓存配置到默认值
export async function DELETE(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    // 只有管理员可以重置缓存配置
    if (!user.isAdmin) {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action } = body

    if (action !== 'reset') {
      return NextResponse.json(
        { error: '不支持的操作' },
        { status: 400 }
      )
    }

    // 重置为默认配置
    const defaultConfigs = {
      dataset: {
        maxMemorySize: 50,
        defaultTTL: 10 * 60 * 1000,
        cleanupInterval: 2 * 60 * 1000,
        enableMetrics: true
      },
      metrics: {
        maxMemorySize: 30,
        defaultTTL: 5 * 60 * 1000,
        cleanupInterval: 60 * 1000,
        enableMetrics: true
      },
      query: {
        maxMemorySize: 100,
        defaultTTL: 3 * 60 * 1000,
        cleanupInterval: 60 * 1000,
        enableMetrics: true
      }
    }

    try {
      datasetCache.updateConfig(defaultConfigs.dataset)
      metricsCache.updateConfig(defaultConfigs.metrics)
      queryCache.updateConfig(defaultConfigs.query)

      return NextResponse.json({
        success: true,
        message: '缓存配置已重置为默认值',
        configs: defaultConfigs,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      return NextResponse.json(
        { 
          error: '重置缓存配置失败',
          details: error instanceof Error ? error.message : '未知错误'
        }, 
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Failed to reset cache config:', error)
    return NextResponse.json(
      { 
        error: '重置缓存配置失败',
        details: error instanceof Error ? error.message : '未知错误'
      }, 
      { status: 500 }
    )
  }
}