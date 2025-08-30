import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { DataSource } from '@/models/DataSource'
import { executeQuery } from '@/lib/mysql'
import { connectDB } from '@/lib/mongodb'

// POST /api/datasets/preview-table - 预览数据表
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    const body = await request.json()
    const { datasourceId, schema, tableName, limit = 100 } = body
    
    if (!datasourceId || !tableName) {
      return NextResponse.json({ 
        error: '缺少必填参数: datasourceId, tableName' 
      }, { status: 400 })
    }

    await connectDB()
    
    // 验证数据源
    const datasource = await DataSource.findOne({ _id: datasourceId, userId: user._id })
    if (!datasource) {
      return NextResponse.json({ 
        error: '数据源不存在或无权限访问' 
      }, { status: 404 })
    }

    // 获取包含密码的数据源配置
    const datasourceWithPassword = await DataSource.findById(datasourceId).select('+config.password').lean()
    const datasourceConfig = {
      ...datasource.config,
      password: datasourceWithPassword?.config?.password
    }

    // 构建查询
    const fullTableName = schema ? `${schema}.${tableName}` : tableName
    const query = `SELECT * FROM ${fullTableName} LIMIT ${limit}`
    
    // 执行查询
    const result = await executeQuery(datasourceConfig, query, [])
    
    return NextResponse.json({
      columns: result.columns || [],
      rows: result.data || [],
      totalCount: result.total || 0
    })
    
  } catch (error) {
    console.error('预览数据表失败:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '预览数据表失败' 
    }, { status: 500 })
  }
}