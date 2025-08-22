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
      // 在开发环境返回模拟数据，避免数据库连接问题
      if (process.env.NODE_ENV === 'development') {
        tables = [
          {
            name: 'users',
            schema: datasource.config.database || 'main',
            columns: [
              { name: 'id', type: 'int', nullable: false },
              { name: 'name', type: 'varchar', nullable: false },
              { name: 'email', type: 'varchar', nullable: true },
              { name: 'created_at', type: 'datetime', nullable: false }
            ]
          },
          {
            name: 'orders',
            schema: datasource.config.database || 'main',
            columns: [
              { name: 'id', type: 'int', nullable: false },
              { name: 'user_id', type: 'int', nullable: false },
              { name: 'amount', type: 'decimal', nullable: false },
              { name: 'status', type: 'varchar', nullable: false },
              { name: 'created_at', type: 'datetime', nullable: false }
            ]
          },
          {
            name: 'products',
            schema: datasource.config.database || 'main',
            columns: [
              { name: 'id', type: 'int', nullable: false },
              { name: 'name', type: 'varchar', nullable: false },
              { name: 'price', type: 'decimal', nullable: false },
              { name: 'category', type: 'varchar', nullable: true }
            ]
          }
        ]
      } else {
        // 生产环境实际查询数据库
        try {
          const mysql = await import('mysql2/promise')
          const connection = await mysql.createConnection({
            host: datasource.config.host,
            user: datasource.config.username,
            password: datasource.config.password,
            database: datasource.config.database,
            port: datasource.config.port
          })

          // 获取所有表名
          const [tablesResult] = await connection.execute(`
            SELECT TABLE_NAME as table_name 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
          `, [datasource.config.database])

          // 为每个表获取列信息
          for (const tableRow of tablesResult as any[]) {
            const tableName = tableRow.table_name
            
            const [columnsResult] = await connection.execute(`
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
              schema: datasource.config.database,
              columns
            })
          }

          await connection.end()
        } catch (queryError) {
          console.error('MySQL query failed:', queryError)
          throw new Error(`数据库查询失败: ${queryError instanceof Error ? queryError.message : '未知错误'}`)
        }
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