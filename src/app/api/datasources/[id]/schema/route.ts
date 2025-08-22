import { NextRequest, NextResponse } from 'next/server'
import { DataSource } from '@/models/DataSource'
import { executeQuery } from '@/lib/mysql'
import { verifyToken } from '@/lib/auth'
import { requireAuth } from '@/lib/devAuth'
import { connectDB } from '@/lib/mongodb'

/**
 * 获取数据源的表结构信息
 * GET /api/datasources/{id}/schema
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: '缺少数据源ID' },
        { status: 400 }
      )
    }

    await connectDB()
    
    // 验证认证
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    // 获取数据源配置
    const datasource = await DataSource.findById(id)
    if (!datasource) {
      return NextResponse.json(
        { error: '数据源不存在' },
        { status: 404 }
      )
    }

    let tables: any[] = []

    // 根据数据源类型获取表结构
    if (datasource.type === 'mysql') {
      // 获取所有表名
      const tablesResult = await executeQuery(`
        SELECT TABLE_NAME as table_name 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ? 
        AND TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
      `, [datasource.config.database])

      // 为每个表获取列信息
      for (const tableRow of tablesResult as any[]) {
        const tableName = tableRow.table_name
        
        const columnsResult = await executeQuery(`
          SELECT 
            COLUMN_NAME as name,
            DATA_TYPE as type,
            IS_NULLABLE as nullable,
            COLUMN_DEFAULT as default_value,
            COLUMN_COMMENT as comment
          FROM information_schema.COLUMNS 
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
          ORDER BY ORDINAL_POSITION
        `, [datasource.config.database, tableName])

        const columns = (columnsResult as any[]).map(col => ({
          name: col.name,
          type: col.type,
          nullable: col.nullable === 'YES',
          defaultValue: col.default_value,
          comment: col.comment
        }))

        tables.push({
          name: tableName,
          columns
        })
      }
    }
    
    // 更新数据源的schemaInfo
    await DataSource.findByIdAndUpdate(id, {
      schemaInfo: { tables }
    })

    return NextResponse.json({
      success: true,
      datasourceId: id,
      tables,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('获取数据源表结构失败:', error)
    return NextResponse.json(
      { 
        error: '获取表结构失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

/**
 * 刷新数据源的表结构信息
 * POST /api/datasources/{id}/schema
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: '缺少数据源ID' },
        { status: 400 }
      )
    }

    await connectDB()
    
    // 验证认证
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    // 强制刷新表结构，逻辑与GET相同
    return GET(request, { params })

  } catch (error) {
    console.error('刷新数据源表结构失败:', error)
    return NextResponse.json(
      { 
        error: '刷新表结构失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}