import { NextRequest, NextResponse } from 'next/server'
import { getAllTables, getTableSchema } from '@/lib/mysql'
import { requireAuth } from '@/lib/middleware/auth'

// 获取所有表信息
export async function POST(request: NextRequest) {
  try {
    // 验证认证
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }
    
    // 从请求体获取参数
    let bodyParams = {}
    try {
      bodyParams = await request.json()
    } catch {
      // 如果没有请求体，使用默认值
    }
    
    const tableName = bodyParams.table

  try {
    if (tableName) {
      // 获取特定表的结构信息
      const schema = await getTableSchema(tableName)
      
      return NextResponse.json({
        success: true,
        table: tableName,
        schema
      })
    } else {
      // 获取所有表
      const tables = await getAllTables()
      
      return NextResponse.json({
        success: true,
        tables
      })
    }
  } catch (error) {
    console.error('获取表信息错误:', error)
    return NextResponse.json(
      { 
        error: '获取表信息失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}