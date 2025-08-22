import { connectDB } from './mongodb'
import { DataSource } from '@/models/DataSource'
import { Metric } from '@/models/Metric'
import { ObjectId } from 'mongodb'

// 默认用户ID（用于开发环境）
const DEFAULT_USER_ID = '507f1f77bcf86cd799439011'

// 种子数据源
const seedDataSources = [
  {
    name: 'MySQL 生产环境',
    type: 'mysql',
    config: {
      host: 'localhost',
      port: 3306,
      database: 'production_db',
      username: 'admin',
      password: 'password'
    },
    schemaInfo: {
      tables: [
        {
          name: 'users',
          columns: [
            { name: 'id', type: 'int', nullable: false },
            { name: 'name', type: 'varchar', nullable: false },
            { name: 'email', type: 'varchar', nullable: true },
            { name: 'created_at', type: 'timestamp', nullable: false }
          ]
        },
        {
          name: 'orders',
          columns: [
            { name: 'id', type: 'int', nullable: false },
            { name: 'user_id', type: 'int', nullable: false },
            { name: 'amount', type: 'decimal', nullable: false },
            { name: 'status', type: 'varchar', nullable: false },
            { name: 'created_at', type: 'timestamp', nullable: false }
          ]
        }
      ]
    },
    userId: new ObjectId(DEFAULT_USER_ID),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'PostgreSQL 分析库',
    type: 'postgresql',
    config: {
      host: 'localhost',
      port: 5432,
      database: 'analytics_db',
      username: 'analyst',
      password: 'password'
    },
    schemaInfo: {
      tables: [
        {
          name: 'sales_summary',
          columns: [
            { name: 'date', type: 'date', nullable: false },
            { name: 'total_sales', type: 'decimal', nullable: false },
            { name: 'order_count', type: 'int', nullable: false }
          ]
        }
      ]
    },
    userId: new ObjectId(DEFAULT_USER_ID),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// 种子指标数据
const createSeedMetrics = (dataSourceId: string) => [
  {
    name: 'total_sales',
    displayName: '总销售额',
    description: '所有订单的总销售金额',
    type: 'sum',
    formula: 'SUM(orders.amount)',
    datasourceId: new ObjectId(dataSourceId),
    category: '销售',
    unit: '元',
    tags: ['核心指标', '财务'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'order_count',
    displayName: '订单数量',
    description: '总订单数量',
    type: 'count',
    formula: 'COUNT(orders.id)',
    datasourceId: new ObjectId(dataSourceId),
    category: '销售',
    unit: '个',
    tags: ['核心指标'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'avg_order_value',
    displayName: '平均订单价值',
    description: '平均每个订单的价值',
    type: 'avg',
    formula: 'AVG(orders.amount)',
    datasourceId: new ObjectId(dataSourceId),
    category: '销售',
    unit: '元',
    tags: ['核心指标', '财务'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'conversion_rate',
    displayName: '转化率',
    description: '访客到客户的转化率',
    type: 'ratio',
    formula: 'COUNT(orders.id) / COUNT(sessions.id) * 100',
    datasourceId: new ObjectId(dataSourceId),
    category: '营销',
    unit: '%',
    tags: ['营销指标'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

export async function initializeSeedData() {
  try {
    console.log('开始初始化种子数据...')
    await connectDB()

    // 检查是否已有数据源
    const existingDataSources = await DataSource.countDocuments()
    if (existingDataSources > 0) {
      console.log('数据源已存在，跳过初始化')
      return
    }

    // 创建种子数据源
    const createdDataSources = await DataSource.insertMany(seedDataSources)
    console.log(`创建了 ${createdDataSources.length} 个数据源`)

    // 为每个数据源创建指标
    for (const dataSource of createdDataSources) {
      const metrics = createSeedMetrics(dataSource._id.toString())
      const createdMetrics = await Metric.insertMany(metrics)
      console.log(`为数据源 "${dataSource.name}" 创建了 ${createdMetrics.length} 个指标`)
    }

    console.log('种子数据初始化完成')
  } catch (error) {
    console.error('种子数据初始化失败:', error)
    throw error
  }
}

// 清除所有数据（开发环境使用）
export async function clearAllData() {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('此操作仅在开发环境中可用')
  }

  try {
    await connectDB()
    await DataSource.deleteMany({})
    await Metric.deleteMany({})
    console.log('所有数据已清除')
  } catch (error) {
    console.error('清除数据失败:', error)
    throw error
  }
}