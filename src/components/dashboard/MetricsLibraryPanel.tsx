'use client'

import React from 'react'
import { Search, Filter, X, Database, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { CompactMetricCard } from './CompactMetricCard'
import { cn } from '@/lib/utils'
import type { Metric } from '@/types'

interface MetricsLibraryPanelProps {
  className?: string
  isOpen: boolean
  onClose: () => void
  position?: { x: number; y: number }
  onMove?: (position: { x: number; y: number }) => void
  height?: number
  onHeightChange?: (height: number) => void
}

// Mock metrics data - in real app this would come from an API
const mockMetrics: Metric[] = [
  {
    _id: '1',
    name: 'total_sales',
    displayName: '总销售额',
    description: '所有订单的总销售金额',
    type: 'sum',
    category: '销售',
    unit: '元',
    tags: ['核心指标', '财务'],
    isActive: true,
    datasourceId: 'ds1',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '2',
    name: 'order_count',
    displayName: '订单数量',
    description: '总订单数量',
    type: 'count',
    category: '销售',
    tags: ['核心指标'],
    isActive: true,
    datasourceId: 'ds1',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '3',
    name: 'avg_order_value',
    displayName: '平均订单价值',
    description: '平均每个订单的价值',
    type: 'avg',
    category: '销售',
    unit: '元',
    tags: ['核心指标', '财务'],
    isActive: true,
    datasourceId: 'ds1',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '4',
    name: 'customer_count',
    displayName: '客户数量',
    description: '总客户数量',
    type: 'count',
    category: '客户',
    tags: ['客户分析'],
    isActive: true,
    datasourceId: 'ds1',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '5',
    name: 'conversion_rate',
    displayName: '转化率',
    description: '访客到客户的转化率',
    type: 'ratio',
    category: '营销',
    unit: '%',
    tags: ['营销指标'],
    isActive: true,
    datasourceId: 'ds1',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '6',
    name: 'revenue_growth',
    displayName: '收入增长率',
    description: '月度收入增长率',
    type: 'ratio',
    category: '财务',
    unit: '%',
    tags: ['增长指标', '财务'],
    isActive: true,
    datasourceId: 'ds1',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

const categories = ['全部', '销售', '客户', '营销', '财务']

export function MetricsLibraryPanel({ 
  className, 
  isOpen, 
  onClose, 
  position = { x: 50, y: 100 },
  onMove,
  height = 400,
  onHeightChange
}: MetricsLibraryPanelProps) {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState('全部')
  const [expandedCategories, setExpandedCategories] = React.useState<Record<string, boolean>>({
    '销售': true,
    '客户': true,
    '营销': true,
    '财务': true
  })
  const [isDragging, setIsDragging] = React.useState(false)
  const [isResizing, setIsResizing] = React.useState(false)
  const panelRef = React.useRef<HTMLDivElement>(null)

  // Filter metrics based on search and category
  const filteredMetrics = React.useMemo(() => {
    let filtered = mockMetrics

    if (searchTerm) {
      filtered = filtered.filter(metric =>
        metric.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        metric.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        metric.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== '全部') {
      filtered = filtered.filter(metric => metric.category === selectedCategory)
    }

    return filtered
  }, [searchTerm, selectedCategory])

  // Group metrics by category
  const groupedMetrics = React.useMemo(() => {
    const groups: Record<string, Metric[]> = {}
    filteredMetrics.forEach(metric => {
      if (!groups[metric.category]) {
        groups[metric.category] = []
      }
      groups[metric.category].push(metric)
    })
    return groups
  }, [filteredMetrics])

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.panel-header')) {
      setIsDragging(true)
      const startX = e.clientX - position.x
      const startY = e.clientY - position.y

      const handleMouseMove = (e: MouseEvent) => {
        const newX = e.clientX - startX
        const newY = e.clientY - startY
        onMove?.({ x: Math.max(0, newX), y: Math.max(0, newY) })
      }

      const handleMouseUp = () => {
        setIsDragging(false)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
  }

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsResizing(true)
    
    const startY = e.clientY
    const startHeight = height

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY
      let newHeight = startHeight + deltaY
      
      // 动态计算最大高度，防止超出屏幕
      const windowHeight = window.innerHeight
      const panelTop = position.y
      const bottomPadding = 20 // 最小安全距离
      const maxAvailableHeight = windowHeight - panelTop - bottomPadding
      
      newHeight = Math.max(300, Math.min(Math.min(800, maxAvailableHeight), newHeight))
      onHeightChange?.(newHeight)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  if (!isOpen) return null

  return (
    <div
      ref={panelRef}
      className={cn(
        "fixed bg-white border border-slate-200 rounded-lg shadow-lg z-50 transition-all flex flex-col",
        (isDragging || isResizing) && "shadow-xl",
        isResizing && "select-none",
        className
      )}
      style={{
        left: position.x,
        top: position.y,
        width: 320,
        height: height
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Panel Header */}
      <div className="panel-header cursor-move border-b border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">指标库</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="p-3 border-b border-slate-200 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="搜索指标..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex flex-wrap gap-1">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="text-xs"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Metrics List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-2">
          {Object.keys(groupedMetrics).length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>未找到匹配的指标</p>
            </div>
          ) : (
            Object.entries(groupedMetrics).map(([category, metrics]) => (
              <div key={category}>
                <div
                  className="flex items-center gap-2 py-1 cursor-pointer hover:bg-slate-50 rounded"
                  onClick={() => toggleCategory(category)}
                >
                  {expandedCategories[category] ? (
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                  )}
                  <span className="font-medium text-xs text-slate-700">{category}</span>
                  <span className="text-xs text-slate-500">({metrics.length})</span>
                </div>
                
                {expandedCategories[category] && (
                  <div className="ml-4 space-y-1">
                    {metrics.map((metric) => (
                      <CompactMetricCard
                        key={metric._id}
                        metric={metric}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 p-2 text-center flex-shrink-0">
        <p className="text-xs text-slate-500">
          拖拽指标到画布创建图表
        </p>
      </div>

      {/* Resize Handle */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-blue-100 transition-colors",
          isResizing && "bg-blue-200"
        )}
        onMouseDown={handleResizeMouseDown}
        title="拖拽调整高度"
      >
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-slate-300 rounded-full"></div>
      </div>
    </div>
  )
}