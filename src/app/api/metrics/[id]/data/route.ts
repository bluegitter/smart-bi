import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/mysql'

// 指标ID到SQL查询的映射
const metricQueries: Record<string, string> = {
  'sales_001': 'SELECT DATE(date) as date, SUM(sales_amount) as value FROM sales_data GROUP BY DATE(date) ORDER BY date DESC LIMIT 10',
  'sales_002': 'SELECT category, SUM(sales_amount) as value FROM sales_data GROUP BY category ORDER BY value DESC',
  'sales_003': 'SELECT region, SUM(sales_amount) as value FROM sales_data GROUP BY region ORDER BY value DESC',
  'sales_004': 'SELECT product_name as name, SUM(sales_amount) as value FROM sales_data GROUP BY product_name ORDER BY value DESC LIMIT 10',
  'finance_001': 'SELECT department, ROUND(SUM(profit) / SUM(revenue) * 100, 2) as value FROM financial_data GROUP BY department',
  'finance_002': 'SELECT DATE(date) as date, SUM(revenue) as value FROM financial_data GROUP BY DATE(date) ORDER BY date',
  'user_001': 'SELECT device_type as name, COUNT(*) as value FROM user_behavior GROUP BY device_type',
  'user_002': 'SELECT action_type as name, COUNT(*) as value FROM user_behavior GROUP BY action_type ORDER BY value DESC'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: metricId } = await params
    
    if (!metricId) {
      return NextResponse.json(
        { error: '缺少指标ID' },
        { status: 400 }
      )
    }

    // 获取查询SQL
    const query = metricQueries[metricId]
    if (!query) {
      return NextResponse.json(
        { error: '未知的指标ID' },
        { status: 404 }
      )
    }

    console.log(`获取指标 ${metricId} 的数据:`, query)

    // 执行查询
    const data = await executeQuery(query)
    
    // 数据格式化
    const formattedData = Array.isArray(data) ? data.map((row: any) => {
      // 确保数据格式一致
      if (row.date) {
        return {
          ...row,
          date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date
        }
      }
      return row
    }) : []

    return NextResponse.json({
      success: true,
      metricId,
      data: formattedData,
      count: formattedData.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error(`获取指标 ${params.id} 数据失败:`, error)
    return NextResponse.json(
      { 
        error: '获取指标数据失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

// POST方法用于自定义查询
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: metricId } = await params
    const body = await request.json()
    const { timeRange, filters, customQuery } = body

    console.log(`自定义查询指标 ${metricId}:`, { timeRange, filters, customQuery })

    let query = metricQueries[metricId]
    if (!query) {
      return NextResponse.json(
        { error: '未知的指标ID' },
        { status: 404 }
      )
    }

    // 应用时间范围过滤
    if (timeRange) {
      const { startDate, endDate } = timeRange
      if (query.includes('FROM sales_data')) {
        query = query.replace(
          'FROM sales_data',
          `FROM sales_data WHERE date >= '${startDate}' AND date <= '${endDate}'`
        )
      } else if (query.includes('FROM financial_data')) {
        query = query.replace(
          'FROM financial_data',
          `FROM financial_data WHERE date >= '${startDate}' AND date <= '${endDate}'`
        )
      }
    }

    // 应用其他过滤条件
    if (filters && Object.keys(filters).length > 0) {
      const whereClause = Object.entries(filters)
        .map(([key, value]) => `${key} = '${value}'`)
        .join(' AND ')
      
      if (query.includes('WHERE')) {
        query = query.replace('WHERE', `WHERE ${whereClause} AND`)
      } else {
        const groupByIndex = query.indexOf('GROUP BY')
        if (groupByIndex > -1) {
          query = query.slice(0, groupByIndex) + `WHERE ${whereClause} ` + query.slice(groupByIndex)
        }
      }
    }

    console.log('最终查询SQL:', query)

    // 执行查询
    const data = await executeQuery(query)
    
    const formattedData = Array.isArray(data) ? data.map((row: any) => {
      if (row.date) {
        return {
          ...row,
          date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date
        }
      }
      return row
    }) : []

    return NextResponse.json({
      success: true,
      metricId,
      data: formattedData,
      count: formattedData.length,
      query: query,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error(`自定义查询指标 ${params.id} 失败:`, error)
    return NextResponse.json(
      { 
        error: '自定义查询失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}