import mysql from 'mysql2/promise'

// MySQL连接配置
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'root',
  database: process.env.MYSQL_DATABASE || 'smart_bi_test',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  timezone: '+08:00',
  acquireTimeout: 60000,
  timeout: 60000,
  charset: 'utf8mb4'
}

// 创建连接池
let pool: mysql.Pool | null = null

export function createPool() {
  if (!pool) {
    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    })
  }
  return pool
}

// 获取数据库连接
export async function getConnection() {
  const pool = createPool()
  return await pool.getConnection()
}

// 执行查询（使用自定义配置或默认配置）
export async function executeQuery(configOrSql: any, sqlOrParams?: string | any[], params?: any[]) {
  // 支持两种调用方式：
  // 1. executeQuery(sql, params) - 使用默认配置
  // 2. executeQuery(config, sql, params) - 使用自定义配置
  
  let sql: string
  let queryParams: any[] = []
  let config: any = null
  
  if (typeof configOrSql === 'string') {
    // 方式1：executeQuery(sql, params)
    sql = configOrSql
    queryParams = (sqlOrParams as any[]) || []
  } else {
    // 方式2：executeQuery(config, sql, params)
    config = configOrSql
    sql = sqlOrParams as string
    queryParams = params || []
  }
  
  let connection: mysql.PoolConnection | null = null
  let customPool: mysql.Pool | null = null
  
  try {
    if (config) {
      // 使用自定义数据源配置
      customPool = mysql.createPool({
        host: config.host,
        user: config.username || config.user, // 支持两种字段名
        password: config.password,
        database: config.database,
        port: config.port,
        timezone: '+08:00',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      })
      connection = await customPool.getConnection()
    } else {
      // 使用默认配置
      connection = await getConnection()
    }
    
    const [rows, fields] = await connection.execute(sql, queryParams)
    
    // 返回包含列信息的结果
    return {
      data: rows,
      columns: fields,
      total: Array.isArray(rows) ? rows.length : 0
    }
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  } finally {
    if (connection) {
      connection.release()
    }
    if (customPool) {
      await customPool.end()
    }
  }
}

// 测试数据库连接
export async function testConnection() {
  try {
    const connection = await getConnection()
    await connection.ping()
    connection.release()
    return true
  } catch (error) {
    console.error('Database connection test failed:', error)
    return false
  }
}

// 数据源接口 - 支持不同类型的数据库查询
export interface DataSourceConfig {
  id: string
  name: string
  type: 'mysql' | 'postgresql' | 'mongodb'
  config: {
    host: string
    port: number
    database: string
    username: string
    password: string
  }
}

// 执行指标查询
export async function executeMetricQuery(
  query: string, 
  params: any[] = [],
  datasourceConfig?: DataSourceConfig
) {
  if (datasourceConfig && datasourceConfig.type === 'mysql') {
    // 使用自定义数据源配置
    const customPool = mysql.createPool({
      host: datasourceConfig.config.host,
      user: datasourceConfig.config.username,
      password: datasourceConfig.config.password,
      database: datasourceConfig.config.database,
      port: datasourceConfig.config.port,
      timezone: '+08:00',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    })
    
    const connection = await customPool.getConnection()
    try {
      const [rows] = await connection.execute(query, params)
      return rows
    } finally {
      connection.release()
      await customPool.end()
    }
  } else {
    // 使用默认连接
    return await executeQuery(query, params)
  }
}

// 获取表结构信息
export async function getTableSchema(tableName: string) {
  const sql = `
    SELECT 
      COLUMN_NAME as name,
      DATA_TYPE as type,
      IS_NULLABLE as nullable,
      COLUMN_DEFAULT as defaultValue,
      COLUMN_COMMENT as comment
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
    ORDER BY ORDINAL_POSITION
  `
  
  const result = await executeQuery(sql, [dbConfig.database, tableName])
  return result.data
}

// 获取所有表名
export async function getAllTables() {
  const sql = `
    SELECT TABLE_NAME as name, TABLE_COMMENT as comment
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
    ORDER BY TABLE_NAME
  `
  
  const result = await executeQuery(sql, [dbConfig.database])
  return result.data
}