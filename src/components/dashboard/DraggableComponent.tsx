'use client'

import React from 'react'
import { Settings, Star, Zap, TrendingUp, Target, BarChart3, PieChart, Activity, Database, Globe, Users, ShoppingCart, DollarSign, Calendar, Clock, Mail, Phone, MapPin, Home, Heart, Award, Bookmark, Camera, File, Folder, Image, Music, Play, Video, Wifi, Bluetooth, Battery, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { 
  SimpleLineChart, 
  SimpleBarChart, 
  SimplePieChart, 
  SimpleTable, 
  SimpleKPICard, 
  SimpleGauge,
  ContainerComponent,
  generateMockData 
} from '@/components/charts/ChartComponents'
import { SimpleMapComponent } from '@/components/charts/MapComponent'
import { 
  RealLineChart, 
  RealBarChart, 
  RealPieChart, 
  RealKPICard 
} from '@/components/charts/RealDataCharts'
import {
  DatasetLineChart,
  DatasetBarChart,
  DatasetKPICard,
  DatasetPieChart,
  DatasetTable
} from '@/components/charts/DatasetCharts'
import type { ComponentLayout, DragItem } from '@/types'

// 图标映射
const iconMap = {
  TrendingUp, BarChart3, PieChart, Activity, Target, Database, DollarSign, 
  Users, ShoppingCart, Globe, Calendar, Clock, Mail, Phone, MapPin, 
  Star, Zap, Settings, Home, Heart, Award, Bookmark, Camera, File, 
  Folder, Image, Music, Play, Video, Wifi, Bluetooth, Battery, Volume2
}

// 渲染图标的函数
function renderIcon(iconName?: string, className?: string) {
  if (!iconName) return null
  const IconComponent = iconMap[iconName as keyof typeof iconMap]
  if (!IconComponent) return null
  return <IconComponent className={className} />
}

interface DraggableComponentProps {
  component: ComponentLayout
  isSelected: boolean
  isMultiSelected?: boolean
  isPreviewMode: boolean
  selectedChildId?: string
  onMove: (id: string, position: { x: number; y: number }, disableGrid?: boolean) => void
  onResize: (id: string, size: { width: number; height: number }, disableGrid?: boolean) => void
  onSelect: (component: ComponentLayout, isMultiSelect?: boolean) => void
  onOpenProperties: (component: ComponentLayout) => void
  onDelete: (id: string) => void
  onDropToContainer: (item: DragItem, containerId: string, position?: { x: number; y: number }) => void
  onSelectChild: (childComponent: ComponentLayout) => void
  onUpdateChild: (containerId: string, childId: string, updates: Partial<ComponentLayout>) => void
  onDeleteChild: (containerId: string, childId: string) => void
  onMoveChild: (containerId: string, dragIndex: number, hoverIndex: number) => void
  onDragEnd?: () => void
}

export function DraggableComponent({ 
  component, 
  isSelected,
  isMultiSelected = false,
  isPreviewMode,
  selectedChildId,
  onMove, 
  onResize,
  onSelect,
  onOpenProperties,
  onDelete,
  onDropToContainer,
  onSelectChild,
  onUpdateChild,
  onDeleteChild,
  onMoveChild,
  onDragEnd
}: DraggableComponentProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)

  const mockLineChartData = React.useMemo(() => generateMockData.lineChart(), [component.id])
  const mockBarChartData = React.useMemo(() => generateMockData.barChart(), [component.id])
  const mockPieChartData = React.useMemo(() => generateMockData.pieChart(), [component.id])
  const mockTableData = React.useMemo(() => generateMockData.tableData(), [component.id])
  const mockKpiData = React.useMemo(() => generateMockData.kpiData(), [component.id])
  const mockGaugeData = React.useMemo(() => generateMockData.gaugeData(), [component.id])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPreviewMode) return
    
    const target = e.target as HTMLElement
    const isChildComponent = target.closest('[data-container-child="true"]')
    if (isChildComponent) return
    
    e.preventDefault()
    e.stopPropagation()
    
    setIsDragging(true)

    const startX = e.clientX - component.position.x
    const startY = e.clientY - component.position.y

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - startX
      const newY = e.clientY - startY
      
      const disableGrid = e.altKey
      onMove(component.id, { x: newX, y: newY }, disableGrid)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      onDragEnd?.()
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleClick = (e: React.MouseEvent) => {
    if (isPreviewMode) return
    e.stopPropagation()
    
    const isMultiSelect = e.shiftKey
    onSelect(component, isMultiSelect)
  }

  const getCustomBackgroundType = () => {
    switch (component.type) {
      case 'kpi-card':
        return component.config?.kpi?.backgroundType
      case 'line-chart':
        return component.config?.lineChart?.backgroundType
      case 'bar-chart':
        return component.config?.barChart?.backgroundType
      case 'pie-chart':
        return component.config?.pieChart?.backgroundType
      default:
        return undefined
    }
  }
  
  const customBackgroundType = getCustomBackgroundType()
  const isComponentWithCustomBackground = component.dataConfig?.datasetId && 
    customBackgroundType && 
    customBackgroundType !== 'default'
  
  const hasColorScheme = component.config?.style?.colorScheme && component.config?.style?.colorScheme.length > 0
  const shouldApplyTitleBackground = isComponentWithCustomBackground || hasColorScheme
  
  const getComponentOuterStyles = () => {
    if (!isComponentWithCustomBackground) return {}
    
    const colors = component.config?.style?.colorScheme || ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
    const primaryColor = colors[0] || '#3b82f6'
    const secondaryColor = colors[1] || '#ef4444'
    
    switch (customBackgroundType) {
      case 'solid':
        return {
          backgroundColor: primaryColor,
          borderColor: primaryColor
        }
      case 'gradient':
        return {
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          borderColor: primaryColor
        }
      default:
        return {
          background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}05)`,
          borderColor: primaryColor
        }
    }
  }

  const renderComponentContent = () => {
    const getContentStyle = () => {
      if (!shouldApplyTitleBackground) return {}
      
      if (isComponentWithCustomBackground) {
        return getComponentOuterStyles()
      } else {
        const colors = component.config?.style?.colorScheme || ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
        const primaryColor = colors[0] || '#3b82f6'
        const secondaryColor = colors[1] || '#ef4444'
        return {
          background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}05)`,
          borderColor: primaryColor,
          borderWidth: '1px',
          borderStyle: 'solid'
        }
      }
    }

    const contentStyle = getContentStyle()
    const commonProps = {
      width: component.size.width - 10,
      height: component.size.height - 50,
      config: component.config
    }

    switch (component.type) {
      case 'line-chart':
        return (
          <div className="w-full h-full flex items-center justify-center rounded-b-lg" style={contentStyle}>
            {component.dataConfig?.datasetId ? (
              <DatasetLineChart 
                key={`${component.id}-${JSON.stringify(component.config?.style?.colorScheme)}-${component.config?.lineChart?.backgroundType}-${JSON.stringify(component.config?.chart)}`}
                component={component} 
                {...commonProps} 
              />
            ) : component.dataConfig?.metrics?.length > 0 && component.id.includes('metric-') ? (
              <RealLineChart metricId={component.id.split('-')[1]} {...commonProps} />
            ) : (
              <SimpleLineChart data={mockLineChartData} {...commonProps} />
            )}
          </div>
        )
      
      case 'bar-chart':
        return (
          <div className="w-full h-full flex items-center justify-center rounded-b-lg" style={contentStyle}>
            {component.dataConfig?.datasetId ? (
              <DatasetBarChart 
                key={`${component.id}-${JSON.stringify(component.config?.style?.colorScheme)}-${component.config?.barChart?.backgroundType}-${JSON.stringify(component.config?.chart)}`}
                component={component} 
                {...commonProps} 
              />
            ) : component.dataConfig?.metrics?.length > 0 && component.id.includes('metric-') ? (
              <RealBarChart metricId={component.id.split('-')[1]} {...commonProps} />
            ) : (
              <SimpleBarChart data={mockBarChartData} {...commonProps} />
            )}
          </div>
        )
      
      case 'pie-chart':
        return (
          <div className="w-full h-full flex items-center justify-center rounded-b-lg" style={contentStyle}>
            {component.dataConfig?.datasetId ? (
              <DatasetPieChart 
                key={`${component.id}-${JSON.stringify(component.config?.style?.colorScheme)}-${component.config?.pieChart?.backgroundType}-${JSON.stringify(component.config?.chart)}`}
                component={component} 
                {...commonProps} 
              />
            ) : component.dataConfig?.metrics?.length > 0 && component.id.includes('metric-') ? (
              <RealPieChart metricId={component.id.split('-')[1]} {...commonProps} />
            ) : (
              <SimplePieChart data={mockPieChartData} {...commonProps} />
            )}
          </div>
        )
      
      case 'table':
        return (
          <div className="w-full h-full overflow-hidden rounded-b-lg" style={contentStyle}>
            {component.dataConfig?.datasetId ? (
              <DatasetTable 
                key={`${component.id}-${JSON.stringify(component.config?.style?.colorScheme)}-${JSON.stringify(component.dataConfig?.selectedMeasures)}-${JSON.stringify(component.dataConfig?.selectedDimensions)}-${JSON.stringify(component.config?.table)}`}
                component={component} 
              />
            ) : (
              <SimpleTable data={mockTableData} config={component.config} />
            )}
          </div>
        )
      
      case 'kpi-card':
        return (
          <div className="w-full h-full rounded-b-lg" style={shouldApplyTitleBackground ? contentStyle : {}}>
            {component.dataConfig?.datasetId ? (
              <DatasetKPICard 
                key={`${component.id}-${JSON.stringify(component.config?.style?.colorScheme)}-${component.config?.kpi?.backgroundType}-${component.config?.kpi?.unit}-${JSON.stringify(component.config?.chart)}`}
                component={component} 
              />
            ) : component.dataConfig?.metrics?.length > 0 && component.id.includes('metric-') ? (
              <RealKPICard metricId={component.id.split('-')[1]} title={undefined} config={component.config} />
            ) : (
              <SimpleKPICard 
                key={`${component.id}-${JSON.stringify(component.config?.style?.colorScheme)}-${component.config?.kpi?.backgroundType}`}
                data={mockKpiData} 
                title={undefined}
                config={component.config}
              />
            )}
          </div>
        )
      
      case 'gauge':
        return (
          <div className="w-full h-full flex items-center justify-center rounded-b-lg" style={contentStyle}>
            <SimpleGauge 
              key={`${component.id}-${JSON.stringify(component.config?.style?.colorScheme)}-${component.config?.gauge?.backgroundType}-${JSON.stringify(component.config?.gauge)}`}
              data={mockGaugeData} 
              width={component.size.width}
              height={component.size.height - 40}
              config={component.config}
            />
          </div>
        )
      
      case 'map':
        return (
          <div 
            className="w-full h-full rounded-b-lg" 
            style={shouldApplyTitleBackground ? contentStyle : { backgroundColor: '#ffffff' }}
          >
            <SimpleMapComponent component={component} className="w-full h-full rounded-b-lg" />
          </div>
        )
      
      case 'container':
        return (
          <div className="w-full h-full">
            <ContainerComponent
              component={component}
              isPreviewMode={isPreviewMode}
              isSelected={isSelected}
              selectedChildId={selectedChildId}
              onDropToContainer={onDropToContainer}
              onSelectChild={onSelectChild}
              onUpdateChild={onUpdateChild}
              onDeleteChild={onDeleteChild}
              onMoveChild={onMoveChild}
              className="h-full"
            />
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div
      data-component-id={component.id}
      className={cn(
        "absolute rounded-lg transition-all",
        shouldApplyTitleBackground ? "bg-transparent" : "bg-white border border-slate-200",
        !isPreviewMode && "cursor-move",
        !isPreviewMode && !shouldApplyTitleBackground && "shadow-sm hover:shadow-md",
        !isPreviewMode && isMultiSelected && !isSelected && "ring-2 ring-orange-400",
        !isPreviewMode && isSelected && "ring-2 ring-blue-500",
        !isPreviewMode && isSelected && !shouldApplyTitleBackground && "border-blue-300",
        !isPreviewMode && isDragging && "shadow-lg ring-2 ring-blue-400",
        isPreviewMode && !shouldApplyTitleBackground && "shadow-sm"
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
      <div 
        className={cn(
          "h-10 px-3 flex items-center justify-between border-b rounded-t-lg",
          shouldApplyTitleBackground ? "border-white/20" : "border-slate-100"
        )}
        style={(() => {
          if (!shouldApplyTitleBackground) return {}
          
          const colors = component.config?.style?.colorScheme || ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
          
          const darkestColor = colors.reduce((darkest, color) => {
            const hex = color.replace('#', '')
            const r = parseInt(hex.substr(0, 2), 16)
            const g = parseInt(hex.substr(2, 2), 16)  
            const b = parseInt(hex.substr(4, 2), 16)
            const brightness = (r * 299 + g * 587 + b * 114) / 1000
            
            const darkestHex = darkest.replace('#', '')
            const dr = parseInt(darkestHex.substr(0, 2), 16)
            const dg = parseInt(darkestHex.substr(2, 2), 16)
            const db = parseInt(darkestHex.substr(4, 2), 16)
            const darkestBrightness = (dr * 299 + dg * 587 + db * 114) / 1000
            
            return brightness < darkestBrightness ? color : darkest
          }, colors[0])
          
          return {
            backgroundColor: darkestColor,
            borderColor: darkestColor
          }
        })()}
      >
        <div className={cn(
          "flex items-center gap-2 flex-1 min-w-0",
          component.titleAlign === 'center' && "justify-center",
          component.titleAlign === 'right' && "justify-end"
        )}>
          {renderIcon(component.titleIcon, cn(
            "h-4 w-4 shrink-0",
            shouldApplyTitleBackground ? "text-white" : "text-gray-700"
          ))}
          <span className={cn(
            "text-sm font-medium truncate",
            shouldApplyTitleBackground ? "text-white" : "text-gray-900"
          )}>
            {component.title}
          </span>
        </div>
        {!isPreviewMode && (
          <div className={cn(
            "flex items-center gap-1 transition-opacity",
            (!isHovered && !isSelected) && "opacity-0"
          )}>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6",
                shouldApplyTitleBackground 
                  ? "text-white/70 hover:text-white" 
                  : "text-slate-400 hover:text-blue-500"
              )}
              onClick={(e) => {
                e.stopPropagation()
                onOpenProperties(component)
              }}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6",
                shouldApplyTitleBackground 
                  ? "text-white/70 hover:text-red-300" 
                  : "text-slate-400 hover:text-red-500"
              )}
              onClick={(e) => {
                e.stopPropagation()
                onDelete(component.id)
              }}
            >
              ×
            </Button>
          </div>
        )}
      </div>

      {/* 组件内容 */}
      <div className={cn(
        component.type === 'map' ? "overflow-hidden" : "flex items-center justify-center overflow-hidden",
        "h-[calc(100%-40px)]",
        !shouldApplyTitleBackground && component.type !== 'map' && "p-2"
      )}>
        {renderComponentContent()}
      </div>

      {/* 调整尺寸手柄 */}
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
              
              const newWidth = Math.max(100, startWidth + deltaX)
              const newHeight = Math.max(80, startHeight + deltaY)
              
              const disableGrid = e.altKey
              onResize(component.id, { width: newWidth, height: newHeight }, disableGrid)
            }

            const handleMouseUp = () => {
              onDragEnd?.()
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