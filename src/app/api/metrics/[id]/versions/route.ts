import { NextRequest, NextResponse } from 'next/server'
import { Metric } from '@/models/Metric'
import { requireAuth } from '@/lib/middleware/auth'

/**
 * 获取指标的版本历史
 * POST /api/metrics/{id}/versions
 */
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
    
    if (!id) {
      return NextResponse.json(
        { error: '缺少指标ID' },
        { status: 400 }
      )
    }

    // 获取当前指标
    const currentMetric = await Metric.findById(id)
    if (!currentMetric) {
      return NextResponse.json(
        { error: '指标不存在' },
        { status: 404 }
      )
    }

    // 获取所有版本（包括当前版本和历史版本）
    const versions = await Metric.find({
      $or: [
        { _id: id }, // 当前版本
        { parentVersion: id }, // 以当前版本为父版本的版本
        { parentVersion: { $in: await getParentVersionIds(id) } } // 递归查找所有相关版本
      ]
    })
    .sort({ version: -1, createdAt: -1 })
    .select('-queryConfig -parameters') // 不返回详细配置，提高性能

    return NextResponse.json({
      success: true,
      metricId: id,
      currentVersion: currentMetric.version,
      versions: versions.map(v => ({
        _id: v._id,
        version: v.version,
        displayName: v.displayName,
        description: v.description,
        parentVersion: v.parentVersion,
        isActive: v.isActive,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt
      })),
      count: versions.length
    })

  } catch (error) {
    console.error('获取指标版本失败:', error)
    return NextResponse.json(
      { 
        error: '获取版本历史失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

/**
 * 创建指标新版本
 * PUT /api/metrics/{id}/versions
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: '缺少指标ID' },
        { status: 400 }
      )
    }

    // 获取当前指标
    const currentMetric = await Metric.findById(id)
    if (!currentMetric) {
      return NextResponse.json(
        { error: '指标不存在' },
        { status: 404 }
      )
    }

    // 创建新版本
    const newVersion = new Metric({
      ...currentMetric.toObject(),
      _id: undefined, // 让MongoDB生成新的ID
      version: currentMetric.version + 1,
      parentVersion: id,
      ...body, // 应用更新的字段
      createdAt: new Date(),
      updatedAt: new Date()
    })

    await newVersion.save()

    // 可选：禁用旧版本
    if (body.deactivateOldVersion) {
      await Metric.findByIdAndUpdate(id, { isActive: false })
    }

    return NextResponse.json({
      success: true,
      message: '新版本创建成功',
      newVersion: {
        _id: newVersion._id,
        version: newVersion.version,
        parentVersion: newVersion.parentVersion
      }
    })

  } catch (error) {
    console.error('创建指标版本失败:', error)
    return NextResponse.json(
      { 
        error: '创建版本失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

// 辅助函数：递归获取所有父版本ID
async function getParentVersionIds(metricId: string): Promise<string[]> {
  const metric = await Metric.findById(metricId)
  if (!metric || !metric.parentVersion) {
    return []
  }
  
  const parentIds = await getParentVersionIds(metric.parentVersion.toString())
  return [metric.parentVersion.toString(), ...parentIds]
}