'use client'

import React, { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardCanvas } from '@/components/dashboard/DashboardCanvas'
import { dashboardService } from '@/lib/services/dashboardService'
import type { ComponentLayout, Dashboard } from '@/types'

export default function DashboardEditorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // 从 URL 参数获取看板信息
  const dashboardId = searchParams.get('id') // 现有看板ID
  const dashboardName = searchParams.get('name') || '未命名看板'
  const templateId = searchParams.get('template')
  const isPreview = searchParams.get('preview') === 'true'
  
  const [isNewDashboard, setIsNewDashboard] = useState(!dashboardId)
  
  // 根据模板 ID 获取初始组件
  const getInitialComponents = (templateId: string | null): ComponentLayout[] => {
    if (!templateId || templateId === 'blank') {
      return []
    }

    // 根据不同模板返回预设组件
    switch (templateId) {
      case 'sales-dashboard':
        return [
          {
            id: 'sales-kpi-1',
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
              datasourceId: '',
              query: '',
              metrics: [],
              dimensions: [],
              filters: []
            }
          },
          {
            id: 'sales-trend-1',
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
              datasourceId: '',
              query: '',
              metrics: [],
              dimensions: [],
              filters: []
            }
          },
          {
            id: 'sales-bar-1',
            type: 'bar-chart',
            title: '产品销量',
            position: { x: 0, y: 170 },
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
              datasourceId: '',
              query: '',
              metrics: [],
              dimensions: [],
              filters: []
            }
          },
          {
            id: 'sales-pie-1',
            type: 'pie-chart',
            title: '销售渠道分布',
            position: { x: 420, y: 320 },
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
              datasourceId: '',
              query: '',
              metrics: [],
              dimensions: [],
              filters: []
            }
          }
        ]
      
      case 'user-analytics':
        return [
          {
            id: 'user-kpi-1',
            type: 'kpi-card',
            title: '活跃用户',
            position: { x: 0, y: 0 },
            size: { width: 200, height: 120 },
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
              datasourceId: '',
              query: '',
              metrics: [],
              dimensions: [],
              filters: []
            }
          },
          {
            id: 'user-kpi-2',
            type: 'kpi-card',
            title: '新增用户',
            position: { x: 220, y: 0 },
            size: { width: 200, height: 120 },
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
              datasourceId: '',
              query: '',
              metrics: [],
              dimensions: [],
              filters: []
            }
          },
          {
            id: 'user-trend-1',
            type: 'line-chart',
            title: '用户活跃趋势',
            position: { x: 0, y: 140 },
            size: { width: 600, height: 300 },
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
              datasourceId: '',
              query: '',
              metrics: [],
              dimensions: [],
              filters: []
            }
          },
          {
            id: 'user-table-1',
            type: 'table',
            title: '用户行为明细',
            position: { x: 0, y: 460 },
            size: { width: 800, height: 250 },
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
              datasourceId: '',
              query: '',
              metrics: [],
              dimensions: [],
              filters: []
            }
          }
        ]

      case 'financial-report':
        return [
          {
            id: 'financial-kpi-1',
            type: 'kpi-card',
            title: '总收入',
            position: { x: 0, y: 0 },
            size: { width: 200, height: 120 },
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
              datasourceId: '',
              query: '',
              metrics: [],
              dimensions: [],
              filters: []
            }
          },
          {
            id: 'financial-kpi-2',
            type: 'kpi-card',
            title: '净利润',
            position: { x: 220, y: 0 },
            size: { width: 200, height: 120 },
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
              datasourceId: '',
              query: '',
              metrics: [],
              dimensions: [],
              filters: []
            }
          },
          {
            id: 'financial-kpi-3',
            type: 'kpi-card',
            title: '利润率',
            position: { x: 440, y: 0 },
            size: { width: 200, height: 120 },
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
              datasourceId: '',
              query: '',
              metrics: [],
              dimensions: [],
              filters: []
            }
          },
          {
            id: 'financial-bar-1',
            type: 'bar-chart',
            title: '月度收支',
            position: { x: 0, y: 140 },
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
              datasourceId: '',
              query: '',
              metrics: [],
              dimensions: [],
              filters: []
            }
          },
          {
            id: 'financial-pie-1',
            type: 'pie-chart',
            title: '成本结构',
            position: { x: 420, y: 140 },
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
              datasourceId: '',
              query: '',
              metrics: [],
              dimensions: [],
              filters: []
            }
          }
        ]

      case 'operations-dashboard':
        return [
          {
            id: 'ops-gauge-1',
            type: 'gauge',
            title: 'CPU使用率',
            position: { x: 0, y: 0 },
            size: { width: 300, height: 200 },
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
              datasourceId: '',
              query: '',
              metrics: [],
              dimensions: [],
              filters: []
            }
          },
          {
            id: 'ops-gauge-2',
            type: 'gauge',
            title: '内存使用率',
            position: { x: 320, y: 0 },
            size: { width: 300, height: 200 },
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
              datasourceId: '',
              query: '',
              metrics: [],
              dimensions: [],
              filters: []
            }
          },
          {
            id: 'ops-line-1',
            type: 'line-chart',
            title: '系统负载',
            position: { x: 0, y: 220 },
            size: { width: 620, height: 250 },
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
              datasourceId: '',
              query: '',
              metrics: [],
              dimensions: [],
              filters: []
            }
          },
          {
            id: 'ops-table-1',
            type: 'table',
            title: '告警日志',
            position: { x: 0, y: 490 },
            size: { width: 800, height: 200 },
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
              datasourceId: '',
              query: '',
              metrics: [],
              dimensions: [],
              filters: []
            }
          }
        ]

      default:
        return []
    }
  }

  const initialComponents = getInitialComponents(templateId)

  // 处理保存看板 
  const handleSave = async (dashboard: Dashboard) => {
    try {
      if (isNewDashboard || !dashboardId) {
        // 创建新看板
        const newDashboard = await dashboardService.createDashboard({
          name: dashboardName,
          description: dashboard.description || `使用模板 ${templateId || 'blank'} 创建的看板`,
          layout: {
            grid: { columns: 12, rows: 8 },
            components: dashboard.components || []
          },
          globalConfig: {
            theme: 'light',
            refreshInterval: 300000,
            timezone: 'Asia/Shanghai'
          }
        })
        
        console.log('Dashboard created successfully:', newDashboard)
        
        // 跳转到编辑页面，并更新URL
        router.replace(`/dashboards/editor?id=${newDashboard._id}&name=${encodeURIComponent(newDashboard.name)}`)
        setIsNewDashboard(false)
      } else {
        // 现有看板已经通过useDashboard hook自动保存
        console.log('Dashboard updated successfully:', dashboard)
      }
    } catch (error) {
      console.error('Failed to save dashboard:', error)
      alert('保存看板失败: ' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  // 处理看板删除后的跳转
  const handleDashboardDeleted = () => {
    router.push('/dashboards')
  }

  return (
    <ProtectedRoute>
      <DashboardCanvas
      dashboardId={dashboardId || undefined}
      dashboardName={dashboardName}
      onSave={handleSave}
      initialComponents={initialComponents}
      initialPreviewMode={isPreview}
      />
    </ProtectedRoute>
  )
}