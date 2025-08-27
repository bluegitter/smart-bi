import { NextRequest, NextResponse } from 'next/server'
import { DataSource } from '@/models/DataSource'
import { executeQuery } from '@/lib/mysql'
import { verifyToken } from '@/lib/auth'
import { requireAuth } from '@/lib/middleware/auth'
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

    // 获取数据源配置，需要显式包含密码字段
    // 使用lean()并手动处理密码字段
    const datasourceRaw = await DataSource.findById(id).lean()
    if (!datasourceRaw) {
      return NextResponse.json(
        { error: '数据源不存在' },
        { status: 404 }
      )
    }
    
    // 重新查询包含密码的完整配置
    const datasourceWithPassword = await DataSource.findById(id).select('+config.password').lean()
    const datasource = {
      ...datasourceRaw,
      config: {
        ...datasourceRaw.config,
        password: datasourceWithPassword?.config?.password
      }
    } as any

    const tables: any[] = []

    // 根据数据源类型获取表结构
    if (datasource.type === 'mysql') {
      // 检查数据源配置完整性
      if (!datasource.config) {
        throw new Error('数据源配置为空')
      }

      const config = datasource.config
      
      // 验证密码字段是否正确获取
      if (!config.password) {
        console.warn('Password field is missing from datasource config')
        console.log('Available config keys:', Object.keys(config))
      }

      // 调试：打印连接信息（不包括密码）
      console.log('Attempting to connect to MySQL with config:', {
        host: config.host || config.hostname || 'localhost',
        user: config.username || config.user || 'root',
        database: config.database,
        port: config.port || 3306,
        hasPassword: !!config.password
      })

      // 验证必要的连接信息
      if (!config.host && !config.hostname) {
        throw new Error('缺少数据库主机地址配置')
      }
      if (!config.username && !config.user) {
        throw new Error('缺少数据库用户名配置')
      }
      if (!config.database) {
        throw new Error('缺少数据库名称配置')
      }

      // 实际查询数据库获取表结构
      try {
        const mysql = await import('mysql2/promise')
        const connection = await mysql.createConnection({
          host: config.host || config.hostname || 'localhost',
          user: config.username || config.user || 'root',
          password: config.password || '',
          database: config.database,
          port: config.port || 3306
        })

          // 获取所有表和视图的名称和注释
          const [tablesResult] = await connection.execute(`
            SELECT 
              TABLE_NAME as table_name,
              TABLE_COMMENT as table_comment,
              TABLE_SCHEMA as schema_name,
              TABLE_TYPE as table_type
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_TYPE IN ('BASE TABLE', 'VIEW')
            ORDER BY TABLE_TYPE, TABLE_NAME
          `, [datasource.config.database])
          
          // 为每个表和视图获取列信息
          for (const tableRow of tablesResult as any[]) {
            const tableName = tableRow.table_name
            const tableComment = tableRow.table_comment
            const schemaName = tableRow.schema_name
            const tableType = tableRow.table_type
            
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
              schema: schemaName || datasource.config.database,
              comment: tableComment,
              displayName: tableComment && tableComment.trim() ? tableComment.trim() : tableName,
              type: tableType === 'BASE TABLE' ? 'table' : 'view',
              columns
            })
          }

        await connection.end()
      } catch (queryError) {
        console.error('MySQL query failed:', queryError)
        throw new Error(`数据库查询失败: ${queryError instanceof Error ? queryError.message : '未知错误'}`)
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