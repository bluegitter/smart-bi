'use client'

import React from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { X, Settings, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { 
  SimpleLineChart, 
  SimpleBarChart, 
  SimplePieChart, 
  SimpleTable, 
  SimpleKPICard, 
  SimpleGauge,
  generateMockData 
} from './ChartComponents'
import type { ComponentLayout, DragItem } from '@/types'

interface ContainerChildComponentProps {
  component: ComponentLayout
  index: number
  containerId: string
  isPreviewMode: boolean
  isSelected?: boolean
  onSelect?: (component: ComponentLayout) => void
  onDelete?: (componentId: string) => void
  onMove?: (dragIndex: number, hoverIndex: number) => void
  className?: string
  style?: React.CSSProperties
}

export function ContainerChildComponent({
  component,
  index,
  containerId,
  isPreviewMode,
  isSelected = false,
  onSelect,
  onDelete,
  onMove,
  className,
  style
}: ContainerChildComponentProps) {
  const [isHovered, setIsHovered] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  // 拖拽功能 - 支持容器内调整顺序和拖拽到画布
  const [{ isDragging }, drag, preview] = useDrag({
    type: 'container-child',
    item: () => ({ 
      index, 
      component,
      data: {
        component,
        containerId,
        index
      }
    }),
    canDrag: !isPreviewMode,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      // 如果拖拽没有成功放置在容器内的其他位置，说明可能拖到画布了
      if (!monitor.didDrop()) {
        console.log('Drag ended without drop - potentially dragged to canvas')
      }
    }
  })

  // 放置功能 - 接受其他子组件的拖拽
  const [{ isOver }, drop] = useDrop({
    accept: 'container-child',
    hover: (item: { index: number; component: ComponentLayout }, monitor) => {
      if (!ref.current) return
      
      const dragIndex = item.index
      const hoverIndex = index

      if (dragIndex === hoverIndex) return

      const hoverBoundingRect = ref.current.getBoundingClientRect()
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
      const clientOffset = monitor.getClientOffset()
      
      if (!clientOffset) return
      
      const hoverClientY = clientOffset.y - hoverBoundingRect.top

      // 只有在跨越中线时才移动
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return

      onMove?.(dragIndex, hoverIndex)
      item.index = hoverIndex
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  })

  // 合并拖拽和放置的 ref
  drag(drop(ref))

  const handleClick = (e: React.MouseEvent) => {
    if (isPreviewMode) return
    e.stopPropagation()
    onSelect?.(component)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPreviewMode) return
    // 阻止事件冒泡到父容器，防止拖拽子组件时容器也被拖拽
    e.stopPropagation()
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(component.id)
  }

  // 渲染图表内容
  const renderChartContent = () => {
    const chartWidth = Math.min(component.size?.width || 200, 180)
    const chartHeight = Math.min(component.size?.height || 120, 100)

    // 使用组件ID和类型作为key的一部分来强制重新渲染
    const chartKey = `${component.id}-${component.type}`

    switch (component.type) {
      case 'line-chart':
        return (
          <SimpleLineChart 
            key={chartKey}
            data={React.useMemo(() => generateMockData.lineChart(), [chartKey])} 
            width={chartWidth}
            height={chartHeight}
            config={component.config}
          />
        )
      
      case 'bar-chart':
        return (
          <SimpleBarChart 
            key={chartKey}
            data={React.useMemo(() => generateMockData.barChart(), [chartKey])} 
            width={chartWidth}
            height={chartHeight}
            config={component.config}
          />
        )
      
      case 'pie-chart':
        return (
          <SimplePieChart 
            key={chartKey}
            data={React.useMemo(() => generateMockData.pieChart(), [chartKey])} 
            width={chartWidth}
            height={chartHeight}
            config={component.config}
          />
        )
      
      case 'table':
        return (
          <div key={chartKey} className="w-full h-full overflow-hidden">
            <SimpleTable 
              data={React.useMemo(() => generateMockData.tableData().slice(0, 3), [chartKey])} 
              config={{ ...component.config, table: { ...component.config?.table, compact: true, maxRows: 3 } }}
            />
          </div>
        )
      
      case 'kpi-card':
        return (
          <SimpleKPICard 
            key={chartKey}
            data={React.useMemo(() => generateMockData.kpiData(), [chartKey])} 
            title={undefined}
            config={{ ...component.config, kpi: { ...component.config?.kpi, showDescription: false } }}
          />
        )
      
      case 'gauge':
        return (
          <SimpleGauge 
            key={chartKey}
            data={React.useMemo(() => generateMockData.gaugeData(), [chartKey])} 
            width={Math.min(chartWidth, 120)}
            height={Math.min(chartHeight, 80)}
            config={component.config}
          />
        )
      
      default:
        return (
          <div className="flex items-center justify-center h-full text-slate-400 text-xs">
            未知图表类型
          </div>
        )
    }
  }

  return (
    <div
      ref={ref}
      data-container-child="true"
      className={cn(
        "relative bg-white border border-slate-200 rounded-md transition-all duration-200",
        !isPreviewMode && "hover:shadow-md cursor-pointer",
        isSelected && !isPreviewMode && "ring-2 ring-blue-500 border-blue-300",
        isDragging && "opacity-50 scale-95",
        isOver && "ring-2 ring-green-400 border-green-300",
        className
      )}
      style={{
        minHeight: '120px',
        opacity: isDragging ? 0.5 : 1,
        ...style
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => !isPreviewMode && setIsHovered(true)}
      onMouseLeave={() => !isPreviewMode && setIsHovered(false)}
    >
      {/* 拖拽手柄和操作按钮 - 仅编辑模式显示 */}
      {!isPreviewMode && (
        <div className={cn(
          "absolute top-1 right-1 flex items-center gap-1 z-10 transition-opacity",
          (!isHovered && !isSelected) && "opacity-0"
        )}>
          {/* 拖拽手柄 */}
          <div 
            ref={preview}
            className="p-1 hover:bg-slate-100 rounded cursor-move"
            title="拖拽调整顺序"
          >
            <GripVertical className="h-3 w-3 text-slate-400" />
          </div>
          
          {/* 设置按钮 */}
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-slate-400 hover:text-blue-500"
            onClick={(e) => {
              e.stopPropagation()
              onSelect?.(component)
            }}
            title="编辑属性"
          >
            <Settings className="h-3 w-3" />
          </Button>
          
          {/* 删除按钮 */}
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-slate-400 hover:text-red-500"
            onClick={handleDelete}
            title="删除组件"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* 图表内容区域 */}
      <div className="p-2 flex items-center justify-center h-full">
        {renderChartContent()}
      </div>

      {/* 拖拽指示器 */}
      {isOver && !isPreviewMode && (
        <div className="absolute inset-0 bg-green-50 border-2 border-dashed border-green-400 rounded-md flex items-center justify-center">
          <div className="text-green-600 text-xs font-medium">
            在此位置插入
          </div>
        </div>
      )}
    </div>
  )
}