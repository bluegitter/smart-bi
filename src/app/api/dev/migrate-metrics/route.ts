import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { Metric } from '@/models/Metric'
import { DataSource } from '@/models/DataSource'

// 遗留指标定义
const legacyMetrics = [
  {
    name: '1',
    displayName: '每日销售趋势',
    description: '按日期统计销售总额',
    type: 'sum' as const,
    category: '销售指标',
    formula: 'SELECT DATE(date) as date, SUM(sales_amount) as value FROM sales_data GROUP BY DATE(date) ORDER BY date DESC LIMIT 10'
  },
  {
    name: '2',
    displayName: '销售分类分析',
    description: '按产品分类统计销售额',
    type: 'sum' as const,
    category: '销售指标',
    formula: 'SELECT category, SUM(sales_amount) as value FROM sales_data GROUP BY category ORDER BY value DESC'
  },
  {
    name: '3',
    displayName: '区域销售分布',
    description: '按地区统计销售额',
    type: 'sum' as const,
    category: '销售指标',
    formula: 'SELECT region, SUM(sales_amount) as value FROM sales_data GROUP BY region ORDER BY value DESC'
  },
  {
    name: '4',
    displayName: '热销产品TOP10',
    description: '销售额最高的10个产品',
    type: 'sum' as const,
    category: '销售指标',
    formula: 'SELECT product_name as name, SUM(sales_amount) as value FROM sales_data GROUP BY product_name ORDER BY value DESC LIMIT 10'
  },
  {
    name: '5',
    displayName: '部门利润率',
    description: '各部门的利润率分析',
    type: 'ratio' as const,
    category: '财务指标',
    formula: 'SELECT department, ROUND(SUM(profit) / SUM(revenue) * 100, 2) as value FROM financial_data GROUP BY department'
  },
  {
    name: '6',
    displayName: '营收趋势',
    description: '按日期统计营收变化',
    type: 'sum' as const,
    category: '财务指标',
    formula: 'SELECT DATE(date) as date, SUM(revenue) as value FROM financial_data GROUP BY DATE(date) ORDER BY date'
  },
  {
    name: '7',
    displayName: '用户设备分析',
    description: '用户使用设备类型分布',
    type: 'count' as const,
    category: '用户行为',
    formula: 'SELECT device_type as name, COUNT(*) as value FROM user_behavior GROUP BY device_type'
  },
  {
    name: '8',
    displayName: '用户行为统计',
    description: '用户操作行为统计',
    type: 'count' as const,
    category: '用户行为',
    formula: 'SELECT action_type as name, COUNT(*) as value FROM user_behavior GROUP BY action_type ORDER BY value DESC'
  }
]

/**
 * 迁移遗留指标到数据库
 * POST /api/dev/migrate-metrics
 */
export async function POST(request: NextRequest) {
  try {
    // 查找或创建默认数据源
    let defaultDataSource = await DataSource.findOne({ type: 'mysql' })
    
    if (!defaultDataSource) {
      defaultDataSource = new DataSource({
        name: 'MySQL默认数据源',
        type: 'mysql',
        config: {
          host: 'localhost',
          port: 3306,
          database: 'smartbi',
          username: 'root'
        },
        schemaInfo: { tables: [] },
        userId: new mongoose.Types.ObjectId(),
        isActive: true
      })
      await defaultDataSource.save()
      console.log('Created default data source')
    }

    let migratedCount = 0
    let skippedCount = 0
    const results = []

    // 迁移每个遗留指标
    for (const legacyMetric of legacyMetrics) {
      try {
        // 检查指标是否已存在
        const existingMetric = await Metric.findOne({ name: legacyMetric.name })
        
        if (existingMetric) {
          console.log(`Skipping existing metric: ${legacyMetric.name}`)
          skippedCount++
          results.push({
            name: legacyMetric.name,
            status: 'skipped',
            reason: 'already exists'
          })
          continue
        }

        // 创建新指标
        const metric = new Metric({
          name: legacyMetric.name,
          displayName: legacyMetric.displayName,
          description: legacyMetric.description,
          type: legacyMetric.type,
          formula: legacyMetric.formula,
          category: legacyMetric.category,
          datasourceId: defaultDataSource._id,
          unit: legacyMetric.type === 'ratio' ? '%' : '个',
          tags: [legacyMetric.category],
          version: 1,
          isActive: true
        })

        await metric.save()
        console.log(`Migrated metric: ${legacyMetric.name} - ${legacyMetric.displayName}`)
        migratedCount++
        results.push({
          name: legacyMetric.name,
          displayName: legacyMetric.displayName,
          id: metric._id,
          status: 'created'
        })

      } catch (error) {
        console.error(`Failed to migrate metric ${legacyMetric.name}:`, error)
        results.push({
          name: legacyMetric.name,
          status: 'error',
          error: error instanceof Error ? error.message : '未知错误'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: '指标迁移完成',
      summary: {
        total: legacyMetrics.length,
        migrated: migratedCount,
        skipped: skippedCount,
        failed: results.filter(r => r.status === 'error').length
      },
      results,
      datasourceId: defaultDataSource._id
    })

  } catch (error) {
    console.error('Migration failed:', error)
    return NextResponse.json(
      { 
        error: '迁移失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

/**
 * 获取迁移状态
 * GET /api/dev/migrate-metrics
 */
export async function GET(request: NextRequest) {
  try {
    const legacyMetricNames = legacyMetrics.map(m => m.name)
    
    // 检查哪些指标已存在
    const existingMetrics = await Metric.find({ 
      name: { $in: legacyMetricNames } 
    }).select('name displayName _id')

    const existingNames = existingMetrics.map(m => m.name)
    const missingNames = legacyMetricNames.filter(name => !existingNames.includes(name))

    return NextResponse.json({
      success: true,
      total: legacyMetrics.length,
      existing: existingMetrics.length,
      missing: missingNames.length,
      existingMetrics: existingMetrics.map(m => ({
        name: m.name,
        displayName: m.displayName,
        id: m._id
      })),
      missingMetrics: missingNames
    })

  } catch (error) {
    console.error('Failed to check migration status:', error)
    return NextResponse.json(
      { 
        error: '检查迁移状态失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}