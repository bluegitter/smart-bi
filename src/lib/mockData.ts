import type { Dashboard } from '@/types'

// 共享的Mock数据存储
export let mockDashboards: Dashboard[] = [
  {
    _id: '1',
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
        },
        {
          id: 'comp-2',
          type: 'line-chart',
          title: '销售趋势',
          position: { x: 320, y: 0 },
          size: { width: 500, height: 300 },
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
            query: 'SELECT DATE(created_at) as date, SUM(amount) as amount FROM orders GROUP BY DATE(created_at)',
            metrics: ['sales_amount'],
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
    shareToken: undefined,
    permissions: [
      {
        userId: 'user1',
        role: 'owner'
      }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: '2',
    name: '用户分析看板',
    description: '用户行为和活跃度分析',
    layout: {
      grid: { columns: 12, rows: 8 },
      components: [
        {
          id: 'comp-3',
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
    shareToken: undefined,
    permissions: [
      {
        userId: 'user1',
        role: 'owner'
      }
    ],
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  }
]

// 生成分享令牌
export function generateShareToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}