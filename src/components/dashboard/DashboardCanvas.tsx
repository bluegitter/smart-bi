'use client'

import React from 'react'
import { useDrop } from 'react-dnd'
import { Plus, Layout, Save, Eye, Settings, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { PropertyPanel } from './PropertyPanel'
import { cn } from '@/lib/utils'
import type { DragItem, ComponentLayout } from '@/types'

interface DashboardCanvasProps {
  className?: string
  dashboardName?: string
  onSave?: (components: ComponentLayout[]) => void
  initialComponents?: ComponentLayout[]
  initialPreviewMode?: boolean
}

export function DashboardCanvas({ 
  className, 
  dashboardName = '未命名看板',
  onSave,
  initialComponents = [],
  initialPreviewMode = false
}: DashboardCanvasProps) {
  const [components, setComponents] = React.useState<ComponentLayout[]>(initialComponents)
  
  const [selectedComponent, setSelectedComponent] = React.useState<ComponentLayout | null>(null)
  const [isPropertyPanelOpen, setIsPropertyPanelOpen] = React.useState(false)
  const [isPreviewMode, setIsPreviewMode] = React.useState(initialPreviewMode)
  
  // Create a ref for the canvas element
  const canvasRef = React.useRef<HTMLDivElement>(null)
  
  // Debug components state changes
  React.useEffect(() => {
    console.log('Components state updated:', components.length, components)
  }, [components])

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ['component', 'metric'],
    drop: (item: DragItem, monitor) => {
      console.log('Drop zone triggered with item:', item)
      const offset = monitor.getSourceClientOffset()
      console.log('Source client offset:', offset)
      if (offset) {
        console.log('Calling handleDrop with:', item, offset)
        try {
          handleDrop(item, offset)
          console.log('handleDrop completed successfully')
        } catch (error) {
          console.error('Error in handleDrop:', error)
        }
      } else {
        console.log('No offset available for drop')
      }
    },
    hover: (item: DragItem, monitor) => {
      console.log('Hovering over drop zone with:', item.type)
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }))

  const handleDrop = (item: DragItem, offset: { x: number; y: number }) => {
    console.log('Drop event received:', item)
    console.log('Offset:', offset)
    console.log('Canvas ref current:', canvasRef.current)
    
    const canvasRect = canvasRef.current?.getBoundingClientRect()
    console.log('Canvas rect:', canvasRect)
    
    if (!canvasRect) {
      console.log('No canvas rect found, returning early')
      return
    }

    const relativeX = offset.x - canvasRect.left
    const relativeY = offset.y - canvasRect.top

    // 网格对齐（24px 网格）
    const gridSize = 24
    const x = Math.max(0, Math.round(relativeX / gridSize) * gridSize)
    const y = Math.max(0, Math.round(relativeY / gridSize) * gridSize)

    console.log(`Drop position: x=${x}, y=${y}, item type: ${item.type}`)

    console.log('Checking item type:', item.type, typeof item.type)
    console.log('Is metric?', item.type === 'metric')
    console.log('Is component?', item.type === 'component')

    if (item.type === 'component') {
      // 从侧边栏拖拽组件
      const componentData = item.data as { type: ComponentLayout['type'], name: string }
      const newComponent: ComponentLayout = {
        id: `component-${Date.now()}`,
        type: componentData.type || 'line-chart',
        title: componentData.name || '新图表',
        position: { x, y },
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
          filters: [],
        },
      }
      setComponents(prev => [...prev, newComponent])
      // 自动选择新创建的组件
      setSelectedComponent(newComponent)
      setIsPropertyPanelOpen(true)
    } else if (item.type === 'metric') {
      // 从指标面板拖拽指标到画布，自动创建对应的图表组件
      console.log('Creating component from metric drag')
      const metricData = item.data as { id: string; name: string; category: string; type: string; unit: string }
      console.log('Metric data:', metricData)
      
      // 根据指标类型选择合适的图表类型
      const getChartTypeForMetric = (metricType: string, metricCategory: string): ComponentLayout['type'] => {
        // 根据指标类型和类别智能选择图表类型
        if (metricType === 'ratio' || metricCategory === '营销') {
          return 'pie-chart'
        } else if (metricType === 'count') {
          return 'bar-chart'
        } else if (metricType === 'sum') {
          return 'line-chart'
        } else {
          return 'kpi-card'
        }
      }
      
      const chartType = getChartTypeForMetric(metricData.type, metricData.category)
      console.log('Selected chart type:', chartType)
      
      const newComponent: ComponentLayout = {
        id: `metric-${metricData.id}-${Date.now()}`,
        type: chartType,
        title: `${metricData.name} (${metricData.unit})`,
        position: { x, y },
        size: chartType === 'kpi-card' ? { width: 300, height: 150 } : { width: 400, height: 300 },
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
          metrics: [metricData.name], // 预设该指标
          dimensions: [],
          filters: [],
        },
      }
      
      console.log('Creating new component:', newComponent)
      setComponents(prev => {
        const updated = [...prev, newComponent]
        console.log('Updated components array:', updated)
        return updated
      })
      // 自动选择新创建的组件
      setSelectedComponent(newComponent)
      setIsPropertyPanelOpen(true)
      console.log('Component creation completed')
    }
  }

  const handleComponentMove = (id: string, newPosition: { x: number; y: number }) => {
    setComponents(prev => prev.map(comp => 
      comp.id === id ? { ...comp, position: newPosition } : comp
    ))
    // 更新选中组件的状态
    if (selectedComponent?.id === id) {
      setSelectedComponent(prev => prev ? { ...prev, position: newPosition } : null)
    }
  }

  const handleComponentResize = (id: string, newSize: { width: number; height: number }) => {
    setComponents(prev => prev.map(comp => 
      comp.id === id ? { ...comp, size: newSize } : comp
    ))
    // 更新选中组件的状态
    if (selectedComponent?.id === id) {
      setSelectedComponent(prev => prev ? { ...prev, size: newSize } : null)
    }
  }

  const handleComponentSelect = (component: ComponentLayout) => {
    setSelectedComponent(component)
    setIsPropertyPanelOpen(true)
  }

  const handleComponentDelete = (id: string) => {
    setComponents(prev => prev.filter(comp => comp.id !== id))
    // 如果删除的是选中组件，清除选择
    if (selectedComponent?.id === id) {
      setSelectedComponent(null)
      setIsPropertyPanelOpen(false)
    }
  }

  const handleComponentUpdate = (componentId: string, updates: Partial<ComponentLayout>) => {
    setComponents(prev => prev.map(comp => 
      comp.id === componentId ? { ...comp, ...updates } : comp
    ))
    // 更新选中组件的状态
    if (selectedComponent?.id === componentId) {
      setSelectedComponent(prev => prev ? { ...prev, ...updates } : null)
    }
  }

  const handleSave = () => {
    if (onSave) {
      onSave(components)
    }
    console.log('Saving dashboard:', components)
  }

  const handlePreviewToggle = () => {
    setIsPreviewMode(!isPreviewMode)
    if (!isPreviewMode) {
      // 进入预览模式时关闭属性面板
      setIsPropertyPanelOpen(false)
    }
  }

  return (
    <div className={cn("flex-1 bg-white flex", className)}>
      <div className="flex-1 flex flex-col">
        {/* 工具栏 */}
        <div className="h-12 border-b border-slate-200 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold">{dashboardName}</h1>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => setIsPropertyPanelOpen(!isPropertyPanelOpen)}
                disabled={!selectedComponent}
              >
                <Settings className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={handlePreviewToggle}
              >
                {isPreviewMode ? <Layout className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handlePreviewToggle}
              className={cn(isPreviewMode && "bg-blue-50 text-blue-700")}
            >
              {isPreviewMode ? (
                <>
                  <Layout className="h-3 w-3 mr-1" />
                  编辑
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3 mr-1" />
                  预览
                </>
              )}
            </Button>
            <Button 
              size="sm"
              onClick={handleSave}
              className="flex items-center gap-1"
            >
              <Save className="h-3 w-3" />
              保存
            </Button>
          </div>
        </div>

        {/* 画布区域 */}
        <div 
          ref={(node) => {
            canvasRef.current = node
            drop(node)
          }}
          className={cn(
            "flex-1 relative p-6 min-h-[600px]",
            isPreviewMode ? "bg-white" : "bg-slate-50",
            !isPreviewMode && "bg-grid-pattern",
            isOver && !isPreviewMode && "bg-blue-50 ring-2 ring-blue-300 ring-inset"
          )}
          style={!isPreviewMode ? {
            backgroundImage: `radial-gradient(circle, #e2e8f0 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          } : {}}
          onClick={() => {
            if (!isPreviewMode) {
              setSelectedComponent(null)
              setIsPropertyPanelOpen(false)
            }
          }}
        >
          {components.length === 0 && !isPreviewMode ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Card className="w-96">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="font-semibold mb-2">开始创建你的看板</h3>
                  <p className="text-slate-500 text-sm mb-4">
                    从左侧拖拽组件到画布，或使用AI智能生成看板
                  </p>
                  <Button className="w-full">
                    使用AI生成看板
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            components.map((component) => (
              <DraggableComponent
                key={component.id}
                component={component}
                isSelected={selectedComponent?.id === component.id}
                isPreviewMode={isPreviewMode}
                onMove={handleComponentMove}
                onResize={handleComponentResize}
                onSelect={handleComponentSelect}
                onDelete={handleComponentDelete}
              />
            ))
          )}
        </div>
      </div>
      
      {/* 属性面板 */}
      <PropertyPanel
        isOpen={isPropertyPanelOpen && !isPreviewMode}
        onClose={() => setIsPropertyPanelOpen(false)}
        selectedComponent={selectedComponent}
        onUpdateComponent={handleComponentUpdate}
      />
    </div>
  )
}

// 可拖拽的组件
interface DraggableComponentProps {
  component: ComponentLayout
  isSelected: boolean
  isPreviewMode: boolean
  onMove: (id: string, position: { x: number; y: number }) => void
  onResize: (id: string, size: { width: number; height: number }) => void
  onSelect: (component: ComponentLayout) => void
  onDelete: (id: string) => void
}

function DraggableComponent({ 
  component, 
  isSelected,
  isPreviewMode,
  onMove, 
  onResize,
  onSelect,
  onDelete 
}: DraggableComponentProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPreviewMode) return
    
    e.preventDefault()
    e.stopPropagation()
    
    // 选择组件
    onSelect(component)
    
    setIsDragging(true)

    const startX = e.clientX - component.position.x
    const startY = e.clientY - component.position.y

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - startX
      const newY = e.clientY - startY
      
      // 网格对齐
      const gridSize = 24
      const alignedX = Math.max(0, Math.round(newX / gridSize) * gridSize)
      const alignedY = Math.max(0, Math.round(newY / gridSize) * gridSize)
      
      onMove(component.id, { x: alignedX, y: alignedY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleClick = (e: React.MouseEvent) => {
    if (isPreviewMode) return
    e.stopPropagation()
    onSelect(component)
  }

  return (
    <div
      className={cn(
        "absolute bg-white rounded-lg shadow-sm transition-all",
        !isPreviewMode && "border border-slate-200",
        !isPreviewMode && "hover:shadow-md cursor-move",
        !isPreviewMode && isSelected && "ring-2 ring-blue-500 border-blue-300",
        !isPreviewMode && isDragging && "shadow-lg ring-2 ring-blue-400",
        isPreviewMode && "border-0 shadow-none"
      )}
      style={{
        left: component.position.x,
        top: component.position.y,
        width: component.size.width,
        height: component.size.height,
        opacity: component.config?.style?.opacity || 1
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onMouseEnter={() => !isPreviewMode && setIsHovered(true)}
      onMouseLeave={() => !isPreviewMode && setIsHovered(false)}
    >
      {/* 组件头部 */}
      {!isPreviewMode && (
        <div className="h-10 border-b border-slate-100 px-3 flex items-center justify-between">
          <span className="text-sm font-medium truncate">{component.title}</span>
          <div className={cn(
            "flex items-center gap-1 transition-opacity",
            (!isHovered && !isSelected) && "opacity-0"
          )}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-slate-400 hover:text-blue-500"
              onClick={(e) => {
                e.stopPropagation()
                onSelect(component)
              }}
            >
              <Settings className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-slate-400 hover:text-red-500"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(component.id)
              }}
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* 组件内容 */}
      <div className={cn(
        "p-4 flex items-center justify-center text-slate-400",
        isPreviewMode ? "h-full" : "h-[calc(100%-40px)]"
      )}>
        <div className="text-center">
          <div className="text-2xl mb-2">
            {component.type === 'line-chart' && '📈'}
            {component.type === 'bar-chart' && '📊'}
            {component.type === 'pie-chart' && '🥧'}
            {component.type === 'table' && '📋'}
            {component.type === 'kpi-card' && '📌'}
            {component.type === 'gauge' && '⏰'}
          </div>
          {isPreviewMode && (
            <div className="text-lg font-medium text-slate-700 mb-1">
              {component.title}
            </div>
          )}
          <div className={cn(
            "text-sm",
            isPreviewMode ? "text-slate-500" : "text-slate-400"
          )}>
            {component.type === 'line-chart' && '折线图'}
            {component.type === 'bar-chart' && '柱状图'}
            {component.type === 'pie-chart' && '饼图'}
            {component.type === 'table' && '数据表'}
            {component.type === 'kpi-card' && '指标卡片'}
            {component.type === 'gauge' && '仪表盘'}
          </div>
        </div>
      </div>

      {/* 调整尺寸手柄 - 只在编辑模式显示 */}
      {!isPreviewMode && (isSelected || isHovered) && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-60 hover:opacity-100 transition-opacity"
          style={{
            background: 'linear-gradient(-45deg, transparent 30%, #3b82f6 30%, #3b82f6 70%, transparent 70%)',
          }}
          onMouseDown={(e) => {
            e.stopPropagation()
            e.preventDefault()

            const startX = e.clientX
            const startY = e.clientY
            const startWidth = component.size.width
            const startHeight = component.size.height

            const handleMouseMove = (e: MouseEvent) => {
              const deltaX = e.clientX - startX
              const deltaY = e.clientY - startY
              
              const gridSize = 24
              const newWidth = Math.max(200, Math.round((startWidth + deltaX) / gridSize) * gridSize)
              const newHeight = Math.max(150, Math.round((startHeight + deltaY) / gridSize) * gridSize)
              
              onResize(component.id, { width: newWidth, height: newHeight })
            }

            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove)
              document.removeEventListener('mouseup', handleMouseUp)
            }

            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
          }}
        />
      )}
    </div>
  )
}