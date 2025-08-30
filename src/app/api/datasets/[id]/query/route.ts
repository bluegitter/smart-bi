import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { DatasetService } from '@/lib/services/datasetService'

// POST /api/datasets/[id]/query - 查询数据集数据
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    // 从请求体获取查询参数
    let queryParams = {}
    try {
      queryParams = await request.json()
    } catch {
      // 如果没有请求体，使用默认值
    }
    
    const measures = queryParams.measures || []
    const dimensions = queryParams.dimensions || []
    const filters = queryParams.filters || []
    const limit = parseInt(queryParams.limit || '100')
    const sql = queryParams.sql // 支持直接SQL查询

    const { id } = await params
    
    // 获取数据集信息
    const dataset = await DatasetService.getDataset(user._id, id)
    if (!dataset) {
      return NextResponse.json({ error: '数据集不存在' }, { status: 404 })
    }

    // 如果提供了SQL查询，直接执行SQL
    if (sql) {
      console.log(`🔍 执行自定义SQL查询: ${sql}`)
      
      try {
        // 基本的SQL安全检查
        const upperSQL = sql.toUpperCase().trim()
        if (!upperSQL.startsWith('SELECT')) {
          return NextResponse.json({ error: '仅支持SELECT查询' }, { status: 400 })
        }
        
        // 危险操作检查
        const dangerousKeywords = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE', 'TRUNCATE']
        if (dangerousKeywords.some(keyword => upperSQL.includes(keyword))) {
          return NextResponse.json({ error: '包含危险操作，查询被拒绝' }, { status: 400 })
        }
        
        // 执行自定义SQL查询
        const result = await DatasetService.executeCustomSQL(user._id, id, sql)
        return NextResponse.json({ 
          data: result.rows || [],
          columns: result.columns || [],
          total: result.rows?.length || 0,
          executionTime: result.executionTime
        })
        
      } catch (error) {
        console.error('执行自定义SQL失败:', error)
        return NextResponse.json({ 
          error: error instanceof Error ? error.message : 'SQL执行失败' 
        }, { status: 500 })
      }
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