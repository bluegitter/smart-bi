import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

// 测试连接验证模式
const testConnectionSchema = z.object({
  type: z.enum(['mysql', 'postgresql', 'mongodb', 'api', 'csv']),
  config: z.object({
    host: z.string().optional(),
    port: z.number().optional(),
    database: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    apiUrl: z.string().url().optional(),
    headers: z.record(z.string()).optional(),
    filePath: z.string().optional(),
  })
})

// 真实测试连接函数
async function testDatabaseConnection(type: string, config: any) {
  switch (type) {
    case 'mysql':
      return await testMySQLConnection(config)
    case 'postgresql':
      return await testPostgreSQLConnection(config)
    case 'mongodb':
      return await testMongoDBConnection(config)
    case 'api':
      return await testAPIConnection(config)
    case 'csv':
      return await testCSVConnection(config)
    default:
      throw new Error('不支持的数据源类型')
  }
}

// MySQL连接测试
async function testMySQLConnection(config: any) {
  if (!config.host || !config.database) {
    throw new Error('缺少必要的连接参数：主机地址和数据库名称')
  }
  
  if (!config.username) {
    throw new Error('缺少必要的连接参数：用户名')
  }

  try {
    const mysql = await import('mysql2/promise')
    
    const connectionConfig = {
      host: config.host,
      user: config.username,
      password: config.password || '',
      database: config.database,
      port: config.port || 3306,
      connectTimeout: 5000, // 5秒连接超时
    }
    
    // 尝试建立连接
    const connection = await mysql.createConnection(connectionConfig)
    
    // 测试简单查询
    await connection.execute('SELECT 1 as test')
    
    // 获取数据库中的表数量（可选）
    const [tables] = await connection.execute(`
      SELECT COUNT(*) as table_count
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ?
    `, [config.database])
    
    const tableCount = (tables as any[])[0]?.table_count || 0
    
    await connection.end()
    
    return {
      success: true,
      message: `MySQL连接成功，数据库 "${config.database}" 包含 ${tableCount} 个表`,
      details: {
        host: config.host,
        port: config.port || 3306,
        database: config.database,
        tableCount
      }
    }
  } catch (error: any) {
    console.error('MySQL connection test failed:', error)
    
    let errorMessage = 'MySQL连接失败'
    
    if (error.code) {
      switch (error.code) {
        case 'ECONNREFUSED':
          errorMessage = `无法连接到MySQL服务器 (${config.host}:${config.port || 3306})，请检查服务器是否运行`
          break
        case 'ENOTFOUND':
          errorMessage = `找不到MySQL主机 "${config.host}"，请检查主机地址`
          break
        case 'ER_ACCESS_DENIED_ERROR':
          errorMessage = `MySQL认证失败，请检查用户名"${config.username}"和密码是否正确`
          break
        case 'ER_BAD_DB_ERROR':
          errorMessage = `MySQL数据库 "${config.database}" 不存在`
          break
        case 'ETIMEDOUT':
          errorMessage = `连接MySQL超时，请检查网络连接`
          break
        default:
          errorMessage = `MySQL连接错误 (${error.code}): ${error.message}`
      }
    } else if (error.message) {
      errorMessage = error.message
    }
    
    throw new Error(errorMessage)
  }
}

// PostgreSQL连接测试
async function testPostgreSQLConnection(config: any) {
  if (!config.host || !config.database) {
    throw new Error('缺少必要的连接参数')
  }
  
  // 这里可以实现真实的PostgreSQL连接测试
  // 目前返回模拟结果
  return {
    success: true,
    message: 'PostgreSQL连接测试（模拟）',
    details: { note: '需要实现真实的PostgreSQL连接测试' }
  }
}

// MongoDB连接测试  
async function testMongoDBConnection(config: any) {
  if (!config.host || !config.database) {
    throw new Error('缺少必要的连接参数')
  }
  
  // 这里可以实现真实的MongoDB连接测试
  // 目前返回模拟结果
  return {
    success: true,
    message: 'MongoDB连接测试（模拟）',
    details: { note: '需要实现真实的MongoDB连接测试' }
  }
}

// API连接测试
async function testAPIConnection(config: any) {
  if (!config.apiUrl) {
    throw new Error('缺少API URL')
  }
  
  try {
    const response = await fetch(config.apiUrl, {
      method: 'GET',
      headers: config.headers || {},
      signal: AbortSignal.timeout(10000) // 10秒超时
    })
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
    }
    
    return {
      success: true,
      message: `API连接成功，状态码: ${response.status}`,
      details: {
        url: config.apiUrl,
        status: response.status,
        statusText: response.statusText
      }
    }
  } catch (error: any) {
    console.error('API connection test failed:', error)
    
    let errorMessage = 'API连接失败'
    
    if (error.name === 'AbortError') {
      errorMessage = 'API请求超时'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    throw new Error(errorMessage)
  }
}

// CSV连接测试
async function testCSVConnection(config: any) {
  if (!config.filePath) {
    throw new Error('缺少文件路径')
  }
  
  try {
    const fs = await import('fs/promises')
    
    // 检查文件是否存在
    await fs.access(config.filePath)
    
    // 读取文件的前几行来验证
    const content = await fs.readFile(config.filePath, 'utf-8')
    const lines = content.split('\n').slice(0, 5) // 只读前5行
    
    if (lines.length === 0) {
      throw new Error('CSV文件为空')
    }
    
    return {
      success: true,
      message: `CSV文件读取成功，包含 ${lines.length} 行数据（预览）`,
      details: {
        filePath: config.filePath,
        previewLines: lines.length
      }
    }
  } catch (error: any) {
    console.error('CSV connection test failed:', error)
    
    let errorMessage = 'CSV文件读取失败'
    
    if (error.code === 'ENOENT') {
      errorMessage = `找不到CSV文件: ${config.filePath}`
    } else if (error.code === 'EACCES') {
      errorMessage = `没有权限读取CSV文件: ${config.filePath}`
    } else if (error.message) {
      errorMessage = error.message
    }
    
    throw new Error(errorMessage)
  }
}

// POST - 测试数据源连接
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: '无效的令牌' }, { status: 401 })
    }

    const body = await request.json()
    
    // 验证请求数据
    const validationResult = testConnectionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: '数据验证失败',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { type, config } = validationResult.data

    try {
      const result = await testDatabaseConnection(type, config)
      return NextResponse.json(result)
    } catch (connectionError) {
      return NextResponse.json(
        { 
          success: false,
          error: connectionError instanceof Error ? connectionError.message : '连接测试失败'
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('测试连接失败:', error)
    return NextResponse.json(
      { error: '测试连接失败' },
      { status: 500 }
    )
  }
}