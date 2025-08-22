import { connectToDatabase } from '../lib/mongodb'
import { ObjectId } from 'mongodb'

async function initializeDatabase() {
  try {
    console.log('Connecting to MongoDB...')
    const { db } = await connectToDatabase()
    
    console.log('Connected successfully!')
    
    // 检查dashboards集合
    const dashboardsCollection = db.collection('dashboards')
    const count = await dashboardsCollection.countDocuments()
    
    console.log(`Current dashboards count: ${count}`)
    
    // 如果没有数据，创建一些示例数据
    if (count === 0) {
      console.log('Creating sample dashboards...')
      
      const sampleDashboards = [
        {
          _id: new ObjectId(),
          name: '销售数据看板',
          description: '展示销售相关核心指标',
          layout: {
            grid: { columns: 12, rows: 8 },
            components: [
              {
                id: 'comp-1',
                type: 'kpi-card',
                title: '总销售额',
                position: { x: 0, y: 0 },
                size: { width: 300, height: 150 },
                config: {
                  style: {
                    colorScheme: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'],
                    showBackground: true,
                    showBorder: true,
                    showShadow: false,
                    opacity: 1
                  }
                },
                dataConfig: {
                  datasourceId: 'ds1',
                  query: 'SELECT SUM(amount) as total FROM orders',
                  metrics: ['sales_amount'],
                  dimensions: [],
                  filters: []
                }
              }
            ]
          },
          globalConfig: {
            theme: 'light',
            refreshInterval: 300000,
            timezone: 'Asia/Shanghai'
          },
          userId: 'user1',
          isPublic: false,
          permissions: [
            {
              userId: 'user1',
              role: 'owner'
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId(),
          name: '用户分析看板',
          description: '用户行为和活跃度分析',
          layout: {
            grid: { columns: 12, rows: 8 },
            components: [
              {
                id: 'comp-2',
                type: 'bar-chart',
                title: '用户活跃度',
                position: { x: 0, y: 0 },
                size: { width: 400, height: 300 },
                config: {
                  style: {
                    colorScheme: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'],
                    showBackground: true,
                    showBorder: true,
                    showShadow: false,
                    opacity: 1
                  }
                },
                dataConfig: {
                  datasourceId: 'ds1',
                  query: 'SELECT DATE(login_time) as date, COUNT(DISTINCT user_id) as users FROM user_sessions GROUP BY DATE(login_time)',
                  metrics: ['active_users'],
                  dimensions: ['date'],
                  filters: []
                }
              }
            ]
          },
          globalConfig: {
            theme: 'light',
            refreshInterval: 300000,
            timezone: 'Asia/Shanghai'
          },
          userId: 'user1',
          isPublic: false,
          permissions: [
            {
              userId: 'user1',
              role: 'owner'
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      
      await dashboardsCollection.insertMany(sampleDashboards)
      console.log('Sample dashboards created!')
    }
    
    console.log('Database initialization completed!')
  } catch (error) {
    console.error('Database initialization failed:', error)
    process.exit(1)
  }
}

// 运行初始化
if (require.main === module) {
  initializeDatabase()
}