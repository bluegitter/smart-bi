'use client'

import React from 'react'
import { Search, Filter, X, Database, ChevronDown, ChevronRight, Box, RefreshCw } from 'lucide-react'
import { useDrag } from 'react-dnd'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { CompactMetricCard } from './CompactMetricCard'
import { cn } from '@/lib/utils'
import { getAuthHeaders } from '@/lib/authUtils'
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

// Dynamic categories will be computed from metrics

// 容器组件拖拽卡片
function DraggableContainerCard() {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'component',
    item: {
      type: 'component',
      id: 'container',
      data: { type: 'container', name: '容器组件' }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }))

  return (
    <div
      ref={drag}
      className={cn(
        "p-3 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 hover:bg-blue-100 transition-all cursor-move",
        isDragging && "opacity-50 scale-95"
      )}
    >
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-md bg-blue-100 text-blue-600">
          <Box className="w-4 h-4" />
        </div>
        <div>
          <div className="font-medium text-sm text-blue-800">容器组件</div>
          <div className="text-xs text-blue-600">拖拽到画布创建容器</div>
        </div>
      </div>
    </div>
  )
}

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
  const [expandedCategories, setExpandedCategories] = React.useState<Record<string, boolean>>({})
  const [isDragging, setIsDragging] = React.useState(false)
  const [isResizing, setIsResizing] = React.useState(false)
  const [metrics, setMetrics] = React.useState<Metric[]>([])
  const [loading, setLoading] = React.useState(false)
  const panelRef = React.useRef<HTMLDivElement>(null)

  // Load metrics from API
  const loadMetrics = React.useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/metrics?limit=100', {
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        setMetrics(data.metrics || [])
        
        // Initialize expanded categories
        const categories = [...new Set((data.metrics || []).map((m: Metric) => m.category))]
        const initialExpanded: Record<string, boolean> = {}
        categories.forEach(cat => {
          initialExpanded[cat] = true
        })
        setExpandedCategories(initialExpanded)
      }
    } catch (error) {
      console.error('Failed to load metrics:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load metrics when component mounts or opens
  React.useEffect(() => {
    if (isOpen) {
      loadMetrics()
    }
  }, [isOpen, loadMetrics])

  // Compute dynamic categories
  const categories = React.useMemo(() => {
    const uniqueCategories = [...new Set(metrics.map(m => m.category))].sort()
    return ['全部', ...uniqueCategories]
  }, [metrics])

  // Filter metrics based on search and category
  const filteredMetrics = React.useMemo(() => {
    let filtered = metrics

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
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={loadMetrics}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
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

      {/* Container Component */}
      <div className="px-3 pb-2">
        <DraggableContainerCard />
      </div>

      {/* Metrics List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-2">
          {loading ? (
            <div className="text-center py-8 text-slate-500">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-50 animate-spin" />
              <p>加载指标中...</p>
            </div>
          ) : Object.keys(groupedMetrics).length === 0 ? (
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