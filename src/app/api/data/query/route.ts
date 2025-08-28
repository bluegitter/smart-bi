import { NextRequest, NextResponse } from 'next/server'
import { executeQuery, executeMetricQuery } from '@/lib/mysql'
import { requireAuth } from '@/lib/middleware/auth'

export async function POST(request: NextRequest) {
  try {
    // 验证认证
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }
    
    const body = await request.json()
    const { query, params = [], datasourceId } = body

    // 验证必要参数
    if (!query) {
      return NextResponse.json(
        { error: '缺少查询语句' },
        { status: 400 }
      )
    }

    // 安全检查 - 只允许SELECT查询
    const trimmedQuery = query.trim().toLowerCase()
    if (!trimmedQuery.startsWith('select')) {
      return NextResponse.json(
        { error: '只允许SELECT查询' },
        { status: 400 }
      )
    }

    console.log('执行查询:', query)
    console.log('参数:', params)

    // 执行查询
    const data = await executeQuery(query, params)
    
    return NextResponse.json({
      success: true,
      data,
      count: Array.isArray(data) ? data.length : 0
    })

  } catch (error) {
    console.error('数据查询错误:', error)
    return NextResponse.json(
      { 
        error: '查询执行失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

// 获取预定义的指标查询
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const metricType = searchParams.get('metric')

  try {
    let query = ''
    let data = []

    switch (metricType) {
      case 'daily_sales':
        query = `
          SELECT 
            DATE(date) as date,
            SUM(sales_amount) as total_sales,
            SUM(quantity) as total_quantity,
            COUNT(DISTINCT customer_count) as customer_count
          FROM sales_data 
          GROUP BY DATE(date) 
          ORDER BY date DESC 
          LIMIT 10
        `
        data = await executeQuery(query)
        break

      case 'category_sales':
        query = `
          SELECT 
            category,
            SUM(sales_amount) as total_sales,
            SUM(quantity) as total_quantity
          FROM sales_data 
          GROUP BY category 
          ORDER BY total_sales DESC
        `
        data = await executeQuery(query)
        break

      case 'region_sales':
        query = `
          SELECT 
            region,
            SUM(sales_amount) as total_sales,
            COUNT(*) as order_count
          FROM sales_data 
          GROUP BY region 
          ORDER BY total_sales DESC
        `
        data = await executeQuery(query)
        break

      case 'top_products':
        query = `
          SELECT 
            product_name,
            SUM(sales_amount) as total_sales,
            SUM(quantity) as total_quantity
          FROM sales_data 
          GROUP BY product_name 
          ORDER BY total_sales DESC 
          LIMIT 10
        `
        data = await executeQuery(query)
        break

      case 'financial_overview':
        query = `
          SELECT 
            department,
            SUM(revenue) as total_revenue,
            SUM(cost) as total_cost,
            SUM(profit) as total_profit,
            ROUND(SUM(profit) / SUM(revenue) * 100, 2) as profit_margin
          FROM financial_data 
          GROUP BY department 
          ORDER BY total_revenue DESC
        `
        data = await executeQuery(query)
        break

      case 'user_behavior':
        query = `
          SELECT 
            action_type,
            device_type,
            COUNT(*) as count,
            AVG(duration_seconds) as avg_duration
          FROM user_behavior 
          GROUP BY action_type, device_type 
          ORDER BY count DESC
        `
        data = await executeQuery(query)
        break

      case 'sales_trend':
        query = `
          SELECT 
            DATE(date) as date,
            SUM(sales_amount) as sales,
            LAG(SUM(sales_amount)) OVER (ORDER BY DATE(date)) as prev_sales,
            ROUND(
              (SUM(sales_amount) - LAG(SUM(sales_amount)) OVER (ORDER BY DATE(date))) / 
              LAG(SUM(sales_amount)) OVER (ORDER BY DATE(date)) * 100, 2
            ) as growth_rate
          FROM sales_data 
          GROUP BY DATE(date) 
          ORDER BY date
        `
        data = await executeQuery(query)
        break

      default:
        return NextResponse.json(
          { error: '未知的指标类型' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      metric: metricType,
      data,
      count: Array.isArray(data) ? data.length : 0
    })

  } catch (error) {
    console.error('指标查询错误:', error)
    return NextResponse.json(
      { 
        error: '指标查询失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}