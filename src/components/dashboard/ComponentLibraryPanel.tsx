'use client'

import React from 'react'
import { X, Layout, Search, Grid3x3 } from 'lucide-react'
import { useDrag } from 'react-dnd'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

interface ComponentLibraryPanelProps {
  className?: string
  isOpen: boolean
  onClose: () => void
  position?: { x: number; y: number }
  onMove?: (position: { x: number; y: number }) => void
  height?: number
  onHeightChange?: (height: number) => void
}

// 组件类型定义
const componentTypes = [
  {
    type: 'line-chart',
    name: '折线图',
    icon: '📈',
    description: '显示数据趋势变化',
    category: '图表'
  },
  {
    type: 'bar-chart',
    name: '柱状图',
    icon: '📊',
    description: '比较不同类别数据',
    category: '图表'
  },
  {
    type: 'pie-chart',
    name: '饼图',
    icon: '🥧',
    description: '显示数据占比关系',
    category: '图表'
  },
  {
    type: 'table',
    name: '数据表',
    icon: '📋',
    description: '详细展示表格数据',
    category: '数据'
  },
  {
    type: 'kpi-card',
    name: '指标卡片',
    icon: '📌',
    description: '突出显示关键指标',
    category: '数据'
  },
  {
    type: 'gauge',
    name: '仪表盘',
    icon: '⏰',
    description: '显示进度或比例',
    category: '图表'
  },
  {
    type: 'map',
    name: '地图',
    icon: '🗺️',
    description: '地理数据可视化',
    category: '图表'
  },
  {
    type: 'container',
    name: '容器',
    icon: '📦',
    description: '容纳其他组件',
    category: '布局'
  }
]

// 可拖拽的组件卡片
function DraggableComponentCard({ component }: { component: typeof componentTypes[0] }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'component',
    item: {
      type: 'component',
      id: component.type,
      data: { type: component.type, name: component.name }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }))

  return (
    <div
      ref={drag}
      className={cn(
        "group p-3 border-2 border-dashed border-slate-300 rounded-lg",
        "bg-white hover:bg-blue-50 hover:border-blue-400 transition-all cursor-move",
        "flex flex-col items-center gap-2 min-h-[90px] relative",
        isDragging && "opacity-50 scale-95 border-blue-500"
      )}
      title={`${component.description} - 拖拽到画布创建`}
    >
      {/* 组件图标 */}
      <div className={cn(
        "text-2xl transition-transform",
        "group-hover:scale-110"
      )}>
        {component.icon}
      </div>
      
      {/* 组件名称 */}
      <div className={cn(
        "text-xs font-medium text-center leading-tight transition-colors",
        "text-slate-700 group-hover:text-blue-700"
      )}>
        {component.name}
      </div>
    </div>
  )
}

export function ComponentLibraryPanel({ 
  className, 
  isOpen, 
  onClose, 
  position = { x: 50, y: 100 },
  onMove,
  height = 500,
  onHeightChange
}: ComponentLibraryPanelProps) {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState('全部')
  const [isDragging, setIsDragging] = React.useState(false)
  const [isResizing, setIsResizing] = React.useState(false)
  const [windowSize, setWindowSize] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  })
  const panelRef = React.useRef<HTMLDivElement>(null)

  // 获取所有分类
  const categories = React.useMemo(() => {
    const uniqueCategories = [...new Set(componentTypes.map(c => c.category))].sort()
    return ['全部', ...uniqueCategories]
  }, [])

  // 过滤组件
  const filteredComponents = React.useMemo(() => {
    let filtered = componentTypes

    if (searchTerm) {
      filtered = filtered.filter(component =>
        component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        component.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== '全部') {
      filtered = filtered.filter(component => component.category === selectedCategory)
    }

    return filtered
  }, [searchTerm, selectedCategory])

  // 按分类分组
  const groupedComponents = React.useMemo(() => {
    if (selectedCategory !== '全部') {
      return { [selectedCategory]: filteredComponents }
    }

    const groups: Record<string, typeof componentTypes> = {}
    filteredComponents.forEach(component => {
      if (!groups[component.category]) {
        groups[component.category] = []
      }
      groups[component.category].push(component)
    })
    return groups
  }, [filteredComponents, selectedCategory])

  // 计算最佳面板高度
  const calculateOptimalHeight = React.useCallback(() => {
    const bottomPadding = 20
    const maxAvailableHeight = windowSize.height - position.y - bottomPadding
    
    // 最小高度400px，最大为可用高度
    return Math.max(400, Math.min(800, maxAvailableHeight))
  }, [windowSize.height, position.y])

  // 监听窗口大小变化
  React.useEffect(() => {
    const handleResize = () => {
      const newSize = {
        width: window.innerWidth,
        height: window.innerHeight
      }
      setWindowSize(newSize)
      
      // 当窗口大小变化时，自动调整面板高度
      if (isOpen) {
        const newHeight = Math.max(400, Math.min(800, newSize.height - position.y - 20))
        if (newHeight !== height) {
          onHeightChange?.(newHeight)
        }
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isOpen, position.y, height, onHeightChange])

  // 当面板打开或位置改变时，自动调整高度
  React.useEffect(() => {
    if (isOpen) {
      const optimalHeight = calculateOptimalHeight()
      if (optimalHeight !== height) {
        onHeightChange?.(optimalHeight)
      }
    }
  }, [isOpen, calculateOptimalHeight, height, onHeightChange])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.panel-header')) {
      setIsDragging(true)
      const startX = e.clientX - position.x
      const startY = e.clientY - position.y

      const handleMouseMove = (e: MouseEvent) => {
        const newX = e.clientX - startX
        const newY = e.clientY - startY
        const adjustedPosition = { x: Math.max(0, newX), y: Math.max(0, newY) }
        
        onMove?.(adjustedPosition)
        
        // 当拖拽到新位置时，自动调整高度以适应可用空间
        const bottomPadding = 20
        const maxAvailableHeight = windowSize.height - adjustedPosition.y - bottomPadding
        const newHeight = Math.max(400, Math.min(800, maxAvailableHeight))
        
        if (newHeight !== height) {
          onHeightChange?.(newHeight)
        }
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
      
      // 使用窗口状态计算最大高度，防止超出屏幕
      const panelTop = position.y
      const bottomPadding = 20
      const maxAvailableHeight = windowSize.height - panelTop - bottomPadding
      
      newHeight = Math.max(400, Math.min(Math.min(800, maxAvailableHeight), newHeight))
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
        width: 360,
        height: height
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Panel Header */}
      <div className="panel-header cursor-move border-b border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid3x3 className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">组件库</h3>
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
      <div className="p-3 border-b border-slate-200 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="搜索组件..."
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

      {/* Components List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-4">
          {Object.keys(groupedComponents).length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Grid3x3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>未找到匹配的组件</p>
            </div>
          ) : (
            Object.entries(groupedComponents).map(([category, components]) => (
              <div key={category}>
                {selectedCategory === '全部' && (
                  <div className="flex items-center gap-2 mb-3">
                    <Layout className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-sm text-slate-700">{category}</span>
                    <span className="text-xs text-slate-500">({components.length})</span>
                  </div>
                )}
                
                <div className="grid grid-cols-3 gap-2">
                  {components.map((component) => (
                    <DraggableComponentCard
                      key={component.type}
                      component={component}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 p-2 text-center flex-shrink-0">
        <p className="text-xs text-slate-500">
          拖拽组件到画布创建图表
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