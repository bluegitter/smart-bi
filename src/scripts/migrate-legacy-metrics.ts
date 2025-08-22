import mongoose from 'mongoose'
import { Metric } from '../models/Metric'
import { DataSource } from '../models/DataSource'

// 遗留指标定义
const legacyMetrics = [
  {
    name: '1',
    displayName: '每日销售趋势',
    description: '按日期统计销售总额',
    type: 'sum',
    category: '销售指标',
    formula: 'SELECT DATE(date) as date, SUM(sales_amount) as value FROM sales_data GROUP BY DATE(date) ORDER BY date DESC LIMIT 10'
  },
  {
    name: '2',
    displayName: '销售分类分析',
    description: '按产品分类统计销售额',
    type: 'sum',
    category: '销售指标',
    formula: 'SELECT category, SUM(sales_amount) as value FROM sales_data GROUP BY category ORDER BY value DESC'
  },
  {
    name: '3',
    displayName: '区域销售分布',
    description: '按地区统计销售额',
    type: 'sum',
    category: '销售指标',
    formula: 'SELECT region, SUM(sales_amount) as value FROM sales_data GROUP BY region ORDER BY value DESC'
  },
  {
    name: '4',
    displayName: '热销产品TOP10',
    description: '销售额最高的10个产品',
    type: 'sum',
    category: '销售指标',
    formula: 'SELECT product_name as name, SUM(sales_amount) as value FROM sales_data GROUP BY product_name ORDER BY value DESC LIMIT 10'
  },
  {
    name: '5',
    displayName: '部门利润率',
    description: '各部门的利润率分析',
    type: 'ratio',
    category: '财务指标',
    formula: 'SELECT department, ROUND(SUM(profit) / SUM(revenue) * 100, 2) as value FROM financial_data GROUP BY department'
  },
  {
    name: '6',
    displayName: '营收趋势',
    description: '按日期统计营收变化',
    type: 'sum',
    category: '财务指标',
    formula: 'SELECT DATE(date) as date, SUM(revenue) as value FROM financial_data GROUP BY DATE(date) ORDER BY date'
  },
  {
    name: '7',
    displayName: '用户设备分析',
    description: '用户使用设备类型分布',
    type: 'count',
    category: '用户行为',
    formula: 'SELECT device_type as name, COUNT(*) as value FROM user_behavior GROUP BY device_type'
  },
  {
    name: '8',
    displayName: '用户行为统计',
    description: '用户操作行为统计',
    type: 'count',
    category: '用户行为',
    formula: 'SELECT action_type as name, COUNT(*) as value FROM user_behavior GROUP BY action_type ORDER BY value DESC'
  },
  {
    name: 'sales_001',
    displayName: '销售日报',
    description: '每日销售数据汇总',
    type: 'sum',
    category: '销售指标',
    formula: 'SELECT DATE(date) as date, SUM(sales_amount) as value FROM sales_data GROUP BY DATE(date) ORDER BY date DESC LIMIT 10'
  },
  {
    name: 'sales_002',
    displayName: '产品销售排行',
    description: '产品类别销售排名',
    type: 'sum',
    category: '销售指标',
    formula: 'SELECT category, SUM(sales_amount) as value FROM sales_data GROUP BY category ORDER BY value DESC'
  },
  {
    name: 'sales_003',
    displayName: '销售区域分析',
    description: '各地区销售业绩对比',
    type: 'sum',
    category: '销售指标',
    formula: 'SELECT region, SUM(sales_amount) as value FROM sales_data GROUP BY region ORDER BY value DESC'
  },
  {
    name: 'sales_004',
    displayName: '明星产品',
    description: '销量最高的产品列表',
    type: 'sum',
    category: '销售指标',
    formula: 'SELECT product_name as name, SUM(sales_amount) as value FROM sales_data GROUP BY product_name ORDER BY value DESC LIMIT 10'
  },
  {
    name: 'finance_001',
    displayName: '部门盈利能力',
    description: '各部门利润率对比',
    type: 'ratio',
    category: '财务指标',
    formula: 'SELECT department, ROUND(SUM(profit) / SUM(revenue) * 100, 2) as value FROM financial_data GROUP BY department'
  },
  {
    name: 'finance_002',
    displayName: '收入增长趋势',
    description: '营业收入时间序列分析',
    type: 'sum',
    category: '财务指标',
    formula: 'SELECT DATE(date) as date, SUM(revenue) as value FROM financial_data GROUP BY DATE(date) ORDER BY date'
  },
  {
    name: 'user_001',
    displayName: '设备使用偏好',
    description: '用户设备使用情况统计',
    type: 'count',
    category: '用户行为',
    formula: 'SELECT device_type as name, COUNT(*) as value FROM user_behavior GROUP BY device_type'
  },
  {
    name: 'user_002',
    displayName: '操作行为分析',
    description: '用户操作类型分布',
    type: 'count',
    category: '用户行为',
    formula: 'SELECT action_type as name, COUNT(*) as value FROM user_behavior GROUP BY action_type ORDER BY value DESC'
  }
]

async function migrateLegacyMetrics() {
  try {
    // 连接数据库
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set')
    }
    
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // 查找默认数据源
    let defaultDataSource = await DataSource.findOne({ name: 'MySQL测试数据源' })
    
    // 如果没有默认数据源，创建一个
    if (!defaultDataSource) {
      defaultDataSource = new DataSource({
        name: 'MySQL测试数据源',
        type: 'mysql',
        config: {
          host: 'localhost',
          port: 3306,
          database: 'smartbi',
          username: 'root',
          password: ''
        },
        schemaInfo: { tables: [] },
        userId: new mongoose.Types.ObjectId(), // 临时用户ID
        isActive: true
      })
      await defaultDataSource.save()
      console.log('Created default data source')
    }

    let migratedCount = 0
    let skippedCount = 0

    // 迁移每个遗留指标
    for (const legacyMetric of legacyMetrics) {
      // 检查指标是否已存在
      const existingMetric = await Metric.findOne({ name: legacyMetric.name })
      
      if (existingMetric) {
        console.log(`Skipping existing metric: ${legacyMetric.name}`)
        skippedCount++
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
    }

    console.log(`\n迁移完成:`)
    console.log(`- 新创建: ${migratedCount} 个指标`)
    console.log(`- 跳过重复: ${skippedCount} 个指标`)
    console.log(`- 总计: ${legacyMetrics.length} 个指标`)

  } catch (error) {
    console.error('Migration failed:', error)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  migrateLegacyMetrics()
}

export { migrateLegacyMetrics }