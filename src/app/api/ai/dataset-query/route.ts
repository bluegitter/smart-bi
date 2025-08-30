import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { Dataset } from '@/models/Dataset'
import { executeQuery } from '@/lib/mysql'

interface QueryRequest {
  datasetId: string
  sql: string
  limit?: number
}

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const authResult = verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestBody = await request.json() as QueryRequest
    const { datasetId, sql, limit = 100 } = requestBody

    // 验证必需参数
    if (!datasetId || !sql) {
      return NextResponse.json(
        { error: '缺少必需参数：datasetId 和 sql' },
        { status: 400 }
      )
    }

    // 验证limit参数
    if (limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: 'limit 必须在 1-1000 之间' },
        { status: 400 }
      )
    }

    // 获取数据集信息
    const dataset = await Dataset.findById(datasetId)
    if (!dataset) {
      return NextResponse.json(
        { error: '数据集不存在' },
        { status: 404 }
      )
    }

    // 验证用户权限（这里简化处理，实际应该检查用户对数据集的访问权限）
    // TODO: 实现更详细的权限检查

    // SQL安全检查 - 防止危险操作
    const dangerousKeywords = [
      'DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 
      'CREATE', 'TRUNCATE', 'REPLACE', 'MERGE',
      'EXEC', 'EXECUTE', 'CALL', 'DECLARE'
    ]
    
    const upperSQL = sql.toUpperCase()
    for (const keyword of dangerousKeywords) {
      if (upperSQL.includes(keyword)) {
        return NextResponse.json(
          { error: `不允许执行包含 ${keyword} 的SQL语句，仅支持查询操作` },
          { status: 400 }
        )
      }
    }

    // 确保SQL以SELECT开头
    if (!upperSQL.trim().startsWith('SELECT')) {
      return NextResponse.json(
        { error: '仅支持SELECT查询语句' },
        { status: 400 }
      )
    }

    // 添加LIMIT限制
    let finalSQL = sql.trim()
    if (!upperSQL.includes('LIMIT')) {
      finalSQL += ` LIMIT ${limit}`
    }

    // 执行查询
    const startTime = Date.now()
    let result
    
    try {
      switch (dataset.type) {
        case 'table':
          // 对于表类型，需要构建完整的查询
          const tableQuery = finalSQL.replace(
            /FROM\s+[\w_]+/gi,
            `FROM ${dataset.dataSource?.schema ? `${dataset.dataSource.schema}.` : ''}${dataset.config?.table || dataset.name}`
          )
          result = await executeQuery(dataset.dataSource!._id, tableQuery)
          break
          
        case 'sql':
          // 对于SQL类型，可能需要包装用户的查询
          if (dataset.config?.sql) {
            // 如果用户查询是简单的字段选择，包装到数据集的SQL中
            if (finalSQL.toLowerCase().includes('from') === false) {
              finalSQL = `${finalSQL} FROM (${dataset.config.sql}) AS dataset_view LIMIT ${limit}`
            }
          }
          result = await executeQuery(dataset.dataSource!._id, finalSQL)
          break
          
        case 'view':
          // 视图类型处理
          const viewQuery = finalSQL.replace(
            /FROM\s+[\w_]+/gi,
            `FROM ${dataset.config?.view || dataset.name}`
          )
          result = await executeQuery(dataset.dataSource!._id, viewQuery)
          break
          
        default:
          throw new Error(`不支持的数据集类型: ${dataset.type}`)
      }
    } catch (error) {
      console.error('查询执行失败:', error)
      return NextResponse.json(
        { 
          error: '查询执行失败',
          details: error instanceof Error ? error.message : '未知错误'
        },
        { status: 500 }
      )
    }

    const executionTime = Date.now() - startTime

    // 格式化结果
    const response = {
      success: true,
      data: {
        columns: result.columns || [],
        rows: result.rows || [],
        rowCount: result.rows?.length || 0,
        executionTime,
        sql: finalSQL,
        datasetInfo: {
          id: dataset._id,
          name: dataset.name,
          displayName: dataset.displayName,
          type: dataset.type
        }
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json(
      { 
        error: '服务器内部错误',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}