import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { DatasetService } from '@/lib/services/datasetService'
import type { CreateDatasetRequest, DatasetSearchParams } from '@/types/dataset'

// POST /api/datasets - 获取数据集列表
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    // 从请求体获取查询参数
    let bodyParams = {}
    try {
      bodyParams = await request.json()
    } catch {
      // 如果没有请求体，使用默认值
    }
    
    const params: DatasetSearchParams = {
      keyword: bodyParams.keyword || undefined,
      category: bodyParams.category || undefined,
      tags: bodyParams.tags ? (Array.isArray(bodyParams.tags) ? bodyParams.tags : bodyParams.tags.split(',')) : undefined,
      type: bodyParams.type as any || undefined,
      status: bodyParams.status as any || 'active',
      sortBy: bodyParams.sortBy as any || 'updatedAt',
      sortOrder: bodyParams.sortOrder as any || 'desc',
      page: parseInt(bodyParams.page || '1'),
      limit: parseInt(bodyParams.limit || '20')
    }

    const result = await DatasetService.searchDatasets(user._id, params)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('获取数据集列表失败:', error)
    
    // 临时在生产环境也提供详细错误信息用于调试
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '获取数据集列表失败',
      details: error instanceof Error ? error.stack : undefined,
      type: error?.constructor?.name,
      env: process.env.NODE_ENV
    }, { status: 500 })
  }
}

// PUT /api/datasets - 创建数据集
export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    const body: CreateDatasetRequest = await request.json()
    
    // 验证请求体
    if (!body.name || !body.displayName || !body.type) {
      return NextResponse.json({ 
        error: '缺少必填字段: name, displayName, type' 
      }, { status: 400 })
    }

    // 验证数据集配置
    if (body.type === 'table' && !body.tableConfig) {
      return NextResponse.json({ 
        error: '表类型数据集必须提供 tableConfig' 
      }, { status: 400 })
    }

    if (body.type === 'sql' && !body.sqlConfig) {
      return NextResponse.json({ 
        error: 'SQL类型数据集必须提供 sqlConfig' 
      }, { status: 400 })
    }

    if (body.type === 'view' && !body.viewConfig) {
      return NextResponse.json({ 
        error: '视图类型数据集必须提供 viewConfig' 
      }, { status: 400 })
    }

    const dataset = await DatasetService.createDataset(user._id, body)
    
    return NextResponse.json({ dataset }, { status: 201 })
  } catch (error) {
    console.error('创建数据集失败:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '创建数据集失败' 
    }, { status: 500 })
  }
}