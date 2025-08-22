import { NextRequest, NextResponse } from 'next/server'
import { getAllTables, getTableSchema } from '@/lib/mysql'

// 获取所有表信息
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tableName = searchParams.get('table')

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