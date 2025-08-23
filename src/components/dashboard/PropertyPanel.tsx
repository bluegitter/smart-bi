'use client'

import React from 'react'
import { X, Settings, Palette, Database, Filter, ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useDrop } from 'react-dnd'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { useSidebarCollapsed, useIsFullscreen } from '@/store/useAppStore'
import type { ComponentLayout, DragItem } from '@/types'

interface PropertyPanelProps {
  isOpen: boolean
  onClose: () => void
  selectedComponent: ComponentLayout | null
  onUpdateComponent: (componentId: string, updates: Partial<ComponentLayout>) => void
  onUpdateChild?: (containerId: string, childId: string, updates: Partial<ComponentLayout>) => void
  parentContainerId?: string // 如果选中的是子组件，这里存储父容器ID
}

const chartTypeOptions = [
  { value: 'line-chart', label: '折线图', icon: '📈' },
  { value: 'bar-chart', label: '柱状图', icon: '📊' },
  { value: 'pie-chart', label: '饼图', icon: '🥧' },
  { value: 'table', label: '数据表', icon: '📋' },
  { value: 'kpi-card', label: '指标卡片', icon: '📌' },
  { value: 'gauge', label: '仪表盘', icon: '⏰' },
  { value: 'container', label: '容器组件', icon: '📦' }
]

const colorSchemes = [
  { name: '默认', colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'] },
  { name: '蓝色系', colors: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'] },
  { name: '绿色系', colors: ['#166534', '#16a34a', '#22c55e', '#4ade80', '#bbf7d0'] },
  { name: '紫色系', colors: ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#e9d5ff'] },
  { name: '暖色系', colors: ['#dc2626', '#ea580c', '#f59e0b', '#eab308', '#84cc16'] }
]

// 可拖拽区域组件
function DropZone({ 
  type, 
  items = [], 
  onDrop, 
  onRemove,
  placeholder = "拖拽项目到这里"
}: {
  type: 'metrics' | 'dimensions'
  items: string[]
  onDrop: (item: DragItem) => void
  onRemove: (index: number) => void
  placeholder?: string
}) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'dataset-field',
    drop: (item: DragItem) => {
      // 检查字段类型是否匹配拖拽区域类型
      const fieldType = item.data?.field?.fieldType
      const isValidDrop = (type === 'metrics' && fieldType === 'measure') || 
                         (type === 'dimensions' && fieldType === 'dimension')
      
      if (isValidDrop) {
        onDrop(item)
      }
    },
    canDrop: (item: DragItem) => {
      const fieldType = item.data?.field?.fieldType
      return (type === 'metrics' && fieldType === 'measure') || 
             (type === 'dimensions' && fieldType === 'dimension')
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  }))

  return (
    <div
      ref={drop}
      className={cn(
        "min-h-[60px] p-3 border-2 border-dashed rounded-lg transition-colors",
        canDrop ? "border-blue-300 bg-blue-50" : "border-slate-200",
        isOver && canDrop ? "border-blue-400 bg-blue-100" : "",
        !canDrop && isOver ? "border-red-300 bg-red-50" : ""
      )}
    >
      {items.length === 0 ? (
        <div className="text-sm text-slate-500 text-center py-2">
          {placeholder}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded">
              <span className="text-sm flex-1 truncate">{item}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => onRemove(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function PropertyPanel({ isOpen, onClose, selectedComponent, onUpdateComponent, onUpdateChild, parentContainerId }: PropertyPanelProps) {
  const [activeSection, setActiveSection] = React.useState<string>('basic')
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    basic: true,
    style: true,
    data: true,
    advanced: false
  })
  
  // 过滤器状态
  const [filters, setFilters] = React.useState<Array<{
    field: string
    operator: string
    value: string
    id: string
  }>>(selectedComponent?.dataConfig?.filters || [])

  // 获取sidebar和全屏状态
  const sidebarCollapsed = useSidebarCollapsed()
  const isFullscreen = useIsFullscreen()

  if (!isOpen || !selectedComponent) return null

  // 计算属性面板的位置
  // 当sidebar折叠或全屏时，面板位置为 right-0
  // 当sidebar展开时，面板位置需要考虑sidebar的宽度(320px)
  const panelRight = (sidebarCollapsed || isFullscreen) ? 0 : 0

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleUpdate = (updates: Partial<ComponentLayout>) => {
    // 如果选中的是容器子组件，使用特殊的更新逻辑
    if (parentContainerId && onUpdateChild) {
      onUpdateChild(parentContainerId, selectedComponent.id, updates)
    } else {
      // 普通组件更新
      onUpdateComponent(selectedComponent.id, updates)
    }
  }

  const handleChartTypeChange = (newType: ComponentLayout['type']) => {
    handleUpdate({ type: newType })
  }

  const handleTitleChange = (newTitle: string) => {
    handleUpdate({ title: newTitle })
  }

  const handleStyleUpdate = (styleUpdates: any) => {
    handleUpdate({
      config: {
        ...selectedComponent.config,
        style: {
          ...selectedComponent.config.style,
          ...styleUpdates
        }
      }
    })
  }

  const handleChartConfigUpdate = (chartUpdates: any) => {
    handleUpdate({
      config: {
        ...selectedComponent.config,
        chart: {
          ...selectedComponent.config?.chart,
          ...chartUpdates
        }
      }
    })
  }

  const handleTableConfigUpdate = (tableUpdates: any) => {
    handleUpdate({
      config: {
        ...selectedComponent.config,
        table: {
          ...selectedComponent.config?.table,
          ...tableUpdates
        }
      }
    })
  }

  const handleKPIConfigUpdate = (kpiUpdates: any) => {
    handleUpdate({
      config: {
        ...selectedComponent.config,
        kpi: {
          ...selectedComponent.config?.kpi,
          ...kpiUpdates
        }
      }
    })
  }

  const handleGaugeConfigUpdate = (gaugeUpdates: any) => {
    handleUpdate({
      config: {
        ...selectedComponent.config,
        gauge: {
          ...selectedComponent.config?.gauge,
          ...gaugeUpdates
        }
      }
    })
  }

  const handleContainerConfigUpdate = (containerUpdates: any) => {
    handleUpdate({
      containerConfig: {
        ...selectedComponent.containerConfig,
        ...containerUpdates
      }
    })
  }

  // 处理数据配置更新
  const handleDataConfigUpdate = (dataUpdates: any) => {
    const currentDataConfig = selectedComponent.dataConfig || {}
    handleUpdate({
      dataConfig: {
        ...currentDataConfig,
        ...dataUpdates
      }
    })
  }

  // 处理指标拖拽
  const handleMetricDrop = (item: DragItem) => {
    const field = item.data?.field
    if (!field) return
    
    const currentDataConfig = selectedComponent.dataConfig || {}
    const currentMetrics = currentDataConfig.metrics || []
    const currentDimensions = currentDataConfig.dimensions || []
    const currentFilters = currentDataConfig.filters || []
    const currentFieldDisplayNames = currentDataConfig.fieldDisplayNames || {}
    const fieldDisplayName = field.displayName || field.name
    
    // 检查是否已存在
    if (!currentMetrics.includes(fieldDisplayName)) {
      const newMetrics = [...currentMetrics, fieldDisplayName]
      
      // 完整更新，确保不丢失其他数据
      handleDataConfigUpdate({
        metrics: newMetrics,
        dimensions: currentDimensions, // 保持维度不变
        filters: currentFilters, // 保持过滤器不变
        fieldDisplayNames: {
          ...currentFieldDisplayNames,
          [field.name]: field.displayName
        }
      })
    }
  }

  // 处理维度拖拽
  const handleDimensionDrop = (item: DragItem) => {
    const field = item.data?.field
    if (!field) return
    
    const currentDataConfig = selectedComponent.dataConfig || {}
    const currentMetrics = currentDataConfig.metrics || []
    const currentDimensions = currentDataConfig.dimensions || []
    const currentFilters = currentDataConfig.filters || []
    const currentFieldDisplayNames = currentDataConfig.fieldDisplayNames || {}
    const fieldDisplayName = field.displayName || field.name
    
    // 检查是否已存在
    if (!currentDimensions.includes(fieldDisplayName)) {
      const newDimensions = [...currentDimensions, fieldDisplayName]
      
      // 完整更新，确保不丢失其他数据
      handleDataConfigUpdate({
        metrics: currentMetrics, // 保持指标不变
        dimensions: newDimensions,
        filters: currentFilters, // 保持过滤器不变
        fieldDisplayNames: {
          ...currentFieldDisplayNames,
          [field.name]: field.displayName
        }
      })
    }
  }

  // 移除指标
  const handleRemoveMetric = (index: number) => {
    const currentDataConfig = selectedComponent.dataConfig || {}
    const currentMetrics = currentDataConfig.metrics || []
    const currentDimensions = currentDataConfig.dimensions || []
    const currentFilters = currentDataConfig.filters || []
    const currentFieldDisplayNames = currentDataConfig.fieldDisplayNames || {}
    
    const newMetrics = currentMetrics.filter((_, i) => i !== index)
    
    handleDataConfigUpdate({
      metrics: newMetrics,
      dimensions: currentDimensions, // 保持维度不变
      filters: currentFilters, // 保持过滤器不变
      fieldDisplayNames: currentFieldDisplayNames // 保持显示名称映射不变
    })
  }

  // 移除维度
  const handleRemoveDimension = (index: number) => {
    const currentDataConfig = selectedComponent.dataConfig || {}
    const currentMetrics = currentDataConfig.metrics || []
    const currentDimensions = currentDataConfig.dimensions || []
    const currentFilters = currentDataConfig.filters || []
    const currentFieldDisplayNames = currentDataConfig.fieldDisplayNames || {}
    
    const newDimensions = currentDimensions.filter((_, i) => i !== index)
    
    handleDataConfigUpdate({
      metrics: currentMetrics, // 保持指标不变
      dimensions: newDimensions,
      filters: currentFilters, // 保持过滤器不变
      fieldDisplayNames: currentFieldDisplayNames // 保持显示名称映射不变
    })
  }

  // 添加过滤器
  const handleAddFilter = () => {
    const currentDataConfig = selectedComponent.dataConfig || {}
    const currentMetrics = currentDataConfig.metrics || []
    const currentDimensions = currentDataConfig.dimensions || []
    const currentFieldDisplayNames = currentDataConfig.fieldDisplayNames || {}
    
    const newFilter = {
      id: `filter-${Date.now()}`,
      field: '',
      operator: '=',
      value: ''
    }
    const newFilters = [...filters, newFilter]
    setFilters(newFilters)
    
    handleDataConfigUpdate({
      metrics: currentMetrics, // 保持指标不变
      dimensions: currentDimensions, // 保持维度不变
      filters: newFilters,
      fieldDisplayNames: currentFieldDisplayNames // 保持显示名称映射不变
    })
  }

  // 移除过滤器
  const handleRemoveFilter = (filterId: string) => {
    const currentDataConfig = selectedComponent.dataConfig || {}
    const currentMetrics = currentDataConfig.metrics || []
    const currentDimensions = currentDataConfig.dimensions || []
    const currentFieldDisplayNames = currentDataConfig.fieldDisplayNames || {}
    
    const newFilters = filters.filter(f => f.id !== filterId)
    setFilters(newFilters)
    
    handleDataConfigUpdate({
      metrics: currentMetrics, // 保持指标不变
      dimensions: currentDimensions, // 保持维度不变
      filters: newFilters,
      fieldDisplayNames: currentFieldDisplayNames // 保持显示名称映射不变
    })
  }

  // 更新过滤器
  const handleUpdateFilter = (filterId: string, updates: Partial<typeof filters[0]>) => {
    const currentDataConfig = selectedComponent.dataConfig || {}
    const currentMetrics = currentDataConfig.metrics || []
    const currentDimensions = currentDataConfig.dimensions || []
    const currentFieldDisplayNames = currentDataConfig.fieldDisplayNames || {}
    
    const newFilters = filters.map(f => 
      f.id === filterId ? { ...f, ...updates } : f
    )
    setFilters(newFilters)
    
    handleDataConfigUpdate({
      metrics: currentMetrics, // 保持指标不变
      dimensions: currentDimensions, // 保持维度不变
      filters: newFilters,
      fieldDisplayNames: currentFieldDisplayNames // 保持显示名称映射不变
    })
  }

  const currentChartType = chartTypeOptions.find(option => option.value === selectedComponent.type)

  const handleScrollCapture = (e: React.UIEvent) => {
    // 阻止滚动事件向上传播到画布区域
    e.stopPropagation()
  }

  return (
    <div 
      className="fixed w-80 bg-white border-l border-slate-200 flex flex-col z-50 shadow-lg"
      style={{ 
        top: isFullscreen ? '0' : '64px', // Header高度64px，全屏时从顶部开始
        height: isFullscreen ? '100vh' : 'calc(100vh - 64px)',
        right: panelRight,
        transition: 'right 0.3s ease-in-out'
      }}
    >
      {/* 头部 */}
      <div className="h-16 border-b border-slate-200 px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-slate-600" />
          <span className="font-medium">组件属性</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* 内容区域 - 独立滚动容器 */}
      <div 
        className="flex-1 overflow-y-auto min-h-0"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 transparent',
        }}
        onScroll={handleScrollCapture}
      >
        <div className="p-4 space-y-4">
          {/* 基础设置 */}
          <Card>
            <CardHeader 
              className="pb-2 cursor-pointer"
              onClick={() => toggleSection('basic')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  基础设置
                </CardTitle>
                {expandedSections.basic ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </CardHeader>
            {expandedSections.basic && (
              <CardContent className="pt-2 space-y-4">
                {/* 组件类型 */}
                <div>
                  <label className="block text-sm font-medium mb-2">组件类型</label>
                  <div className="grid grid-cols-2 gap-2">
                    {chartTypeOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={selectedComponent.type === option.value ? 'default' : 'outline'}
                        size="sm"
                        className="flex flex-col items-center gap-1 h-auto py-2"
                        onClick={() => handleChartTypeChange(option.value as ComponentLayout['type'])}
                      >
                        <span className="text-sm">{option.icon}</span>
                        <span className="text-xs">{option.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 标题 */}
                <div>
                  <label className="block text-sm font-medium mb-2">标题</label>
                  <Input
                    value={selectedComponent.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="输入组件标题"
                  />
                </div>

                {/* 位置和尺寸 */}
                <div>
                  <label className="block text-sm font-medium mb-2">位置和尺寸</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">X坐标</label>
                      <Input
                        type="number"
                        value={selectedComponent.position.x.toString()}
                        onChange={(e) => handleUpdate({
                          position: { ...selectedComponent.position, x: parseInt(e.target.value) || 0 }
                        })}
                        size="sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Y坐标</label>
                      <Input
                        type="number"
                        value={selectedComponent.position.y.toString()}
                        onChange={(e) => handleUpdate({
                          position: { ...selectedComponent.position, y: parseInt(e.target.value) || 0 }
                        })}
                        size="sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">宽度</label>
                      <Input
                        type="number"
                        value={selectedComponent.size.width.toString()}
                        onChange={(e) => handleUpdate({
                          size: { ...selectedComponent.size, width: parseInt(e.target.value) || 200 }
                        })}
                        size="sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">高度</label>
                      <Input
                        type="number"
                        value={selectedComponent.size.height.toString()}
                        onChange={(e) => handleUpdate({
                          size: { ...selectedComponent.size, height: parseInt(e.target.value) || 150 }
                        })}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* 样式设置 */}
          <Card>
            <CardHeader 
              className="pb-2 cursor-pointer"
              onClick={() => toggleSection('style')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  样式设置
                </CardTitle>
                {expandedSections.style ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </CardHeader>
            {expandedSections.style && (
              <CardContent className="pt-2 space-y-4">
                {/* 配色方案 */}
                <div>
                  <label className="block text-sm font-medium mb-2">配色方案</label>
                  <div className="space-y-2">
                    {colorSchemes.map((scheme) => (
                      <div
                        key={scheme.name}
                        className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer"
                        onClick={() => handleStyleUpdate({ colorScheme: scheme.colors })}
                      >
                        <div className="flex gap-1">
                          {scheme.colors.map((color, index) => (
                            <div
                              key={index}
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <span className="text-sm">{scheme.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 图表专属设置 */}
                {selectedComponent.type === 'line-chart' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">折线图设置</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showGrid"
                          className="rounded"
                          defaultChecked={true}
                          onChange={(e) => handleChartConfigUpdate({ showGrid: e.target.checked })}
                        />
                        <label htmlFor="showGrid" className="text-sm">显示网格</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showPoints"
                          className="rounded"
                          defaultChecked={true}
                          onChange={(e) => handleChartConfigUpdate({ showPoints: e.target.checked })}
                        />
                        <label htmlFor="showPoints" className="text-sm">显示数据点</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showArea"
                          className="rounded"
                          defaultChecked={false}
                          onChange={(e) => handleChartConfigUpdate({ showArea: e.target.checked })}
                        />
                        <label htmlFor="showArea" className="text-sm">面积填充</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="smooth"
                          className="rounded"
                          defaultChecked={false}
                          onChange={(e) => handleChartConfigUpdate({ smooth: e.target.checked })}
                        />
                        <label htmlFor="smooth" className="text-sm">平滑曲线</label>
                      </div>
                    </div>
                  </div>
                )}

                {selectedComponent.type === 'bar-chart' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">柱状图设置</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showValues"
                          className="rounded"
                          defaultChecked={false}
                          onChange={(e) => handleChartConfigUpdate({ showValues: e.target.checked })}
                        />
                        <label htmlFor="showValues" className="text-sm">显示数值</label>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">柱子样式</label>
                        <select 
                          className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
                          onChange={(e) => handleChartConfigUpdate({ barStyle: e.target.value })}
                        >
                          <option value="rounded">圆角</option>
                          <option value="square">方角</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">方向</label>
                        <select 
                          className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
                          onChange={(e) => handleChartConfigUpdate({ orientation: e.target.value })}
                        >
                          <option value="vertical">垂直</option>
                          <option value="horizontal">水平</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {selectedComponent.type === 'pie-chart' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">饼图设置</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showLabels"
                          className="rounded"
                          defaultChecked={true}
                          onChange={(e) => handleChartConfigUpdate({ showLabels: e.target.checked })}
                        />
                        <label htmlFor="showLabels" className="text-sm">显示标签</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showLegend"
                          className="rounded"
                          defaultChecked={true}
                          onChange={(e) => handleChartConfigUpdate({ showLegend: e.target.checked })}
                        />
                        <label htmlFor="showLegend" className="text-sm">显示图例</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showPercentage"
                          className="rounded"
                          defaultChecked={true}
                          onChange={(e) => handleChartConfigUpdate({ showPercentage: e.target.checked })}
                        />
                        <label htmlFor="showPercentage" className="text-sm">显示百分比</label>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">内圆半径 (%)</label>
                        <input
                          type="range"
                          min="0"
                          max="80"
                          defaultValue="0"
                          className="w-full"
                          onChange={(e) => handleChartConfigUpdate({ innerRadius: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedComponent.type === 'table' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">数据表设置</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showHeader"
                          className="rounded"
                          defaultChecked={true}
                          onChange={(e) => handleTableConfigUpdate({ showHeader: e.target.checked })}
                        />
                        <label htmlFor="showHeader" className="text-sm">显示表头</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showBorder"
                          className="rounded"
                          defaultChecked={false}
                          onChange={(e) => handleTableConfigUpdate({ showBorder: e.target.checked })}
                        />
                        <label htmlFor="showBorder" className="text-sm">显示边框</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showStripes"
                          className="rounded"
                          defaultChecked={false}
                          onChange={(e) => handleTableConfigUpdate({ showStripes: e.target.checked })}
                        />
                        <label htmlFor="showStripes" className="text-sm">斑马纹</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="compact"
                          className="rounded"
                          defaultChecked={false}
                          onChange={(e) => handleTableConfigUpdate({ compact: e.target.checked })}
                        />
                        <label htmlFor="compact" className="text-sm">紧凑模式</label>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">最大行数</label>
                        <input
                          type="number"
                          min="3"
                          max="20"
                          defaultValue="6"
                          className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
                          onChange={(e) => handleTableConfigUpdate({ maxRows: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedComponent.type === 'kpi-card' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">指标卡设置</label>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">卡片样式</label>
                        <select 
                          className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
                          onChange={(e) => handleKPIConfigUpdate({ style: e.target.value })}
                        >
                          <option value="modern">现代</option>
                          <option value="minimal">简约</option>
                          <option value="colorful">彩色</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showIcon"
                          className="rounded"
                          defaultChecked={true}
                          onChange={(e) => handleKPIConfigUpdate({ showIcon: e.target.checked })}
                        />
                        <label htmlFor="showIcon" className="text-sm">显示图标</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showTrend"
                          className="rounded"
                          defaultChecked={true}
                          onChange={(e) => handleKPIConfigUpdate({ showTrend: e.target.checked })}
                        />
                        <label htmlFor="showTrend" className="text-sm">显示趋势</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showDescription"
                          className="rounded"
                          defaultChecked={true}
                          onChange={(e) => handleKPIConfigUpdate({ showDescription: e.target.checked })}
                        />
                        <label htmlFor="showDescription" className="text-sm">显示描述</label>
                      </div>
                    </div>
                  </div>
                )}

                {selectedComponent.type === 'gauge' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">仪表盘设置</label>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">样式</label>
                        <select 
                          className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
                          onChange={(e) => handleGaugeConfigUpdate({ style: e.target.value })}
                        >
                          <option value="modern">现代</option>
                          <option value="classic">经典</option>
                          <option value="minimal">简约</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showLabels"
                          className="rounded"
                          defaultChecked={true}
                          onChange={(e) => handleGaugeConfigUpdate({ showLabels: e.target.checked })}
                        />
                        <label htmlFor="showLabels" className="text-sm">显示刻度</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showThresholds"
                          className="rounded"
                          defaultChecked={false}
                          onChange={(e) => handleGaugeConfigUpdate({ showThresholds: e.target.checked })}
                        />
                        <label htmlFor="showThresholds" className="text-sm">显示阈值</label>
                      </div>
                    </div>
                  </div>
                )}

                {selectedComponent.type === 'container' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">容器设置</label>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">布局方式</label>
                        <select 
                          className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
                          value={selectedComponent.containerConfig?.layout || 'flex'}
                          onChange={(e) => handleContainerConfigUpdate({ layout: e.target.value })}
                        >
                          <option value="flex">弹性布局</option>
                          <option value="grid">网格布局</option>
                          <option value="absolute">绝对定位</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">内边距 (px)</label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={selectedComponent.containerConfig?.padding || 16}
                          className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
                          onChange={(e) => handleContainerConfigUpdate({ padding: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">间距 (px)</label>
                        <input
                          type="number"
                          min="0"
                          max="30"
                          value={selectedComponent.containerConfig?.gap || 12}
                          className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
                          onChange={(e) => handleContainerConfigUpdate({ gap: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">边框样式</label>
                        <select 
                          className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
                          value={selectedComponent.containerConfig?.borderStyle || 'solid'}
                          onChange={(e) => handleContainerConfigUpdate({ borderStyle: e.target.value })}
                        >
                          <option value="solid">实线</option>
                          <option value="dashed">虚线</option>
                          <option value="none">无边框</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">边框颜色</label>
                        <input
                          type="color"
                          value={selectedComponent.containerConfig?.borderColor || '#e2e8f0'}
                          className="w-full h-8 border border-slate-200 rounded"
                          onChange={(e) => handleContainerConfigUpdate({ borderColor: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">背景颜色</label>
                        <input
                          type="color"
                          value={selectedComponent.containerConfig?.backgroundColor || '#ffffff'}
                          className="w-full h-8 border border-slate-200 rounded"
                          onChange={(e) => handleContainerConfigUpdate({ backgroundColor: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 通用背景设置 */}
                <div>
                  <label className="block text-sm font-medium mb-2">背景</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showBackground"
                        className="rounded"
                        defaultChecked={true}
                        onChange={(e) => handleStyleUpdate({ showBackground: e.target.checked })}
                      />
                      <label htmlFor="showBackground" className="text-sm">显示背景</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showBorder"
                        className="rounded"
                        defaultChecked={true}
                        onChange={(e) => handleStyleUpdate({ showBorder: e.target.checked })}
                      />
                      <label htmlFor="showBorder" className="text-sm">显示边框</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showShadow"
                        className="rounded"
                        defaultChecked={false}
                        onChange={(e) => handleStyleUpdate({ showShadow: e.target.checked })}
                      />
                      <label htmlFor="showShadow" className="text-sm">显示阴影</label>
                    </div>
                  </div>
                </div>

                {/* 透明度 */}
                <div>
                  <label className="block text-sm font-medium mb-2">透明度</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="100"
                    className="w-full"
                    onChange={(e) => handleStyleUpdate({ opacity: Number(e.target.value) / 100 })}
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* 数据配置 */}
          <Card>
            <CardHeader 
              className="pb-2 cursor-pointer"
              onClick={() => toggleSection('data')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  数据配置
                </CardTitle>
                {expandedSections.data ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </CardHeader>
            {expandedSections.data && (
              <CardContent className="pt-2 space-y-4">

                {/* 指标设置 */}
                <div>
                  <label className="block text-sm font-medium mb-2">指标</label>
                  <DropZone 
                    type="metrics"
                    items={selectedComponent.dataConfig?.metrics || []}
                    onDrop={handleMetricDrop}
                    onRemove={handleRemoveMetric}
                    placeholder="从数据集面板拖拽度量字段到这里"
                  />
                </div>

                {/* 维度设置 */}
                <div>
                  <label className="block text-sm font-medium mb-2">维度</label>
                  <DropZone 
                    type="dimensions"
                    items={selectedComponent.dataConfig?.dimensions || []}
                    onDrop={handleDimensionDrop}
                    onRemove={handleRemoveDimension}
                    placeholder="从数据集面板拖拽维度字段到这里"
                  />
                </div>

                {/* 过滤器 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">过滤器</label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs"
                      onClick={handleAddFilter}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      添加
                    </Button>
                  </div>
                  
                  {filters.length === 0 ? (
                    <div className="text-sm text-slate-500 text-center py-4 border border-dashed border-slate-200 rounded">
                      暂无过滤器
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filters.map((filter) => (
                        <div key={filter.id} className="p-3 border border-slate-200 rounded-lg space-y-2">
                          {/* 字段选择 */}
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">字段</label>
                            <select 
                              className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
                              value={filter.field}
                              onChange={(e) => handleUpdateFilter(filter.id, { field: e.target.value })}
                            >
                              <option value="">选择字段</option>
                              {/* 显示所有可用的维度和指标 */}
                              {selectedComponent.dataConfig?.dimensions?.map((dim) => (
                                <option key={`dim-${dim}`} value={dim}>{dim} (维度)</option>
                              ))}
                              {selectedComponent.dataConfig?.metrics?.map((metric) => (
                                <option key={`metric-${metric}`} value={metric}>{metric} (指标)</option>
                              ))}
                            </select>
                          </div>
                          
                          {/* 操作符选择 */}
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="block text-xs text-slate-500 mb-1">条件</label>
                              <select 
                                className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
                                value={filter.operator}
                                onChange={(e) => handleUpdateFilter(filter.id, { operator: e.target.value })}
                              >
                                <option value="=">等于</option>
                                <option value="!=">不等于</option>
                                <option value=">">大于</option>
                                <option value=">=">大于等于</option>
                                <option value="<">小于</option>
                                <option value="<=">小于等于</option>
                                <option value="like">包含</option>
                                <option value="not like">不包含</option>
                                <option value="in">在范围内</option>
                                <option value="not in">不在范围内</option>
                              </select>
                            </div>
                            
                            {/* 删除按钮 */}
                            <div className="flex items-end">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleRemoveFilter(filter.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* 值输入 */}
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">值</label>
                            {filter.operator === 'in' || filter.operator === 'not in' ? (
                              <Input
                                placeholder="用逗号分隔多个值，如: 值1,值2,值3"
                                value={filter.value}
                                onChange={(e) => handleUpdateFilter(filter.id, { value: e.target.value })}
                                size="sm"
                              />
                            ) : (
                              <Input
                                placeholder="输入过滤值"
                                value={filter.value}
                                onChange={(e) => handleUpdateFilter(filter.id, { value: e.target.value })}
                                size="sm"
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* 高级设置 */}
          <Card>
            <CardHeader 
              className="pb-2 cursor-pointer"
              onClick={() => toggleSection('advanced')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">高级设置</CardTitle>
                {expandedSections.advanced ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </CardHeader>
            {expandedSections.advanced && (
              <CardContent className="pt-2 space-y-4">
                {/* 刷新设置 */}
                <div>
                  <label className="block text-sm font-medium mb-2">自动刷新</label>
                  <select className="w-full h-10 px-3 py-2 border border-slate-200 rounded-md text-sm">
                    <option value="0">关闭</option>
                    <option value="30">30秒</option>
                    <option value="60">1分钟</option>
                    <option value="300">5分钟</option>
                    <option value="900">15分钟</option>
                  </select>
                </div>

                {/* 缓存设置 */}
                <div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="enableCache"
                      className="rounded"
                      defaultChecked={true}
                    />
                    <label htmlFor="enableCache" className="text-sm">启用缓存</label>
                  </div>
                </div>

                {/* 导出设置 */}
                <div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="allowExport"
                      className="rounded"
                      defaultChecked={true}
                    />
                    <label htmlFor="allowExport" className="text-sm">允许导出</label>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      {/* 底部操作按钮 */}
      <div className="border-t border-slate-200 p-4 flex-shrink-0">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            重置
          </Button>
          <Button size="sm" className="flex-1">
            应用
          </Button>
        </div>
      </div>
    </div>
  )
}