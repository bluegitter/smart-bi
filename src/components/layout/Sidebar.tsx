'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useDrag } from 'react-dnd'
import { 
  Home, 
  BarChart3, 
  Database, 
  Settings, 
  Plus,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Table,
  PieChart,
  Search
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { useSidebarCollapsed } from '@/store/useAppStore'
import type { ComponentLayout, Metric } from '@/types'

interface SidebarProps {
  className?: string
}

const sidebarItems = [
  { icon: Home, label: '首页', href: '/' },
  { icon: BarChart3, label: '看板', href: '/dashboards' },
  { icon: Database, label: '数据源', href: '/datasources' },
  { icon: TrendingUp, label: '指标库', href: '/metrics' },
  { icon: Settings, label: '设置', href: '/settings' },
]

const mockComponents = [
  { id: '1', name: '折线图', type: 'line-chart', icon: TrendingUp },
  { id: '2', name: '柱状图', type: 'bar-chart', icon: BarChart3 },
  { id: '3', name: '饼图', type: 'pie-chart', icon: PieChart },
  { id: '4', name: '数据表', type: 'table', icon: Table },
  { id: '5', name: '指标卡片', type: 'kpi-card', icon: TrendingUp },
  { id: '6', name: '仪表盘', type: 'gauge', icon: BarChart3 },
]

export function Sidebar({ className }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const sidebarCollapsed = useSidebarCollapsed()
  const [metricsExpanded, setMetricsExpanded] = useState(true)
  const [componentsExpanded, setComponentsExpanded] = useState(true)
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [metricsSearch, setMetricsSearch] = useState('')
  const [filteredMetrics, setFilteredMetrics] = useState<Metric[]>([])

  // 获取指标数据
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/metrics')
        if (response.ok) {
          const data = await response.json()
          setMetrics(data.metrics || [])
        }
      } catch (error) {
        console.error('Error fetching metrics:', error)
      }
    }

    fetchMetrics()
  }, [])

  // 过滤指标
  useEffect(() => {
    if (metricsSearch.trim()) {
      const search = metricsSearch.toLowerCase()
      setFilteredMetrics(
        metrics.filter(metric =>
          metric.name.toLowerCase().includes(search) ||
          metric.displayName.toLowerCase().includes(search) ||
          metric.category.toLowerCase().includes(search)
        )
      )
    } else {
      setFilteredMetrics(metrics.slice(0, 8)) // 只显示前8个
    }
  }, [metrics, metricsSearch])

  if (sidebarCollapsed) {
    return null
  }

  return (
    <aside className={cn(
      "w-80 bg-slate-50 border-r border-slate-200 flex flex-col h-full overflow-hidden",
      className
    )}>
      {/* 导航菜单 */}
      <div className="p-4 border-b border-slate-200">
        <nav className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Button
                key={item.label}
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  "w-full justify-start gap-3 h-10",
                  isActive && "bg-blue-50 text-blue-700 hover:bg-blue-50"
                )}
                onClick={() => router.push(item.href)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            )
          })}
        </nav>
      </div>

      {/* 可滚动内容区域 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* 指标面板 */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">指标库</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setMetricsExpanded(!metricsExpanded)}
                >
                  {metricsExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </CardHeader>
{metricsExpanded && (
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* 搜索框 */}
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                    <Input
                      placeholder="搜索指标..."
                      value={metricsSearch}
                      onChange={(e) => setMetricsSearch(e.target.value)}
                      className="pl-7 text-xs h-7"
                    />
                  </div>
                  
                  {/* 指标列表 */}
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {filteredMetrics.length === 0 ? (
                      <div className="text-xs text-gray-500 text-center py-4">
                        {metricsSearch ? '未找到匹配的指标' : '暂无指标'}
                      </div>
                    ) : (
                      filteredMetrics.map((metric) => (
                        <MetricDragSource
                          key={metric._id}
                          metric={metric}
                        >
                          <div className="p-2 rounded border border-slate-200 bg-white cursor-move hover:shadow-sm transition-shadow">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{metric.displayName}</div>
                                <div className="text-xs text-slate-500 truncate">
                                  {metric.category} • {metric.type}
                                </div>
                              </div>
                              {metric.unit && (
                                <div className="text-xs text-slate-400 ml-1">{metric.unit}</div>
                              )}
                            </div>
                            {/* 标签 */}
                            {metric.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {metric.tags.slice(0, 2).map(tag => (
                                  <span key={tag} className="text-xs bg-blue-100 text-blue-700 px-1 rounded">
                                    {tag}
                                  </span>
                                ))}
                                {metric.tags.length > 2 && (
                                  <span className="text-xs text-gray-400">+{metric.tags.length - 2}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </MetricDragSource>
                      ))
                    )}
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="flex space-x-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-xs h-7"
                      onClick={() => router.push('/metrics')}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      管理指标
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* 组件库 */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">组件库</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setComponentsExpanded(!componentsExpanded)}
                >
                  {componentsExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </CardHeader>
            {componentsExpanded && (
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-2">
                  {mockComponents.map((component) => {
                    const Icon = component.icon
                    return (
                      <ComponentDragSource
                        key={component.id}
                        component={component}
                      >
                        <div className="p-3 rounded border border-slate-200 bg-white cursor-move hover:shadow-sm transition-shadow flex flex-col items-center gap-2">
                          <Icon className="h-6 w-6 text-slate-600" />
                          <span className="text-xs text-center">{component.name}</span>
                        </div>
                      </ComponentDragSource>
                    )
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </aside>
  )
}

// 组件拖拽源
interface ComponentDragSourceProps {
  component: { id: string; name: string; type: string; icon: React.ComponentType<{ className?: string }> }
  children: React.ReactNode
}

function ComponentDragSource({ component, children }: ComponentDragSourceProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'component',
    item: { 
      type: 'component', 
      id: component.id, 
      data: { 
        type: component.type as ComponentLayout['type'], 
        name: component.name 
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }))

  return (
    <div 
      ref={drag} 
      className={cn(
        "transition-opacity",
        isDragging && "opacity-50"
      )}
    >
      {children}
    </div>
  )
}

// 指标拖拽源
interface MetricDragSourceProps {
  metric: Metric
  children: React.ReactNode
}

function MetricDragSource({ metric, children }: MetricDragSourceProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'metric',
    item: () => {
      console.log('Starting drag for metric:', metric)
      return { 
        type: 'metric', 
        id: metric._id, 
        data: metric
      }
    },
    end: (item, monitor) => {
      console.log('Drag ended:', { item, didDrop: monitor.didDrop() })
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }))

  return (
    <div 
      ref={drag} 
      className={cn(
        "transition-opacity",
        isDragging && "opacity-50"
      )}
    >
      {children}
    </div>
  )
}