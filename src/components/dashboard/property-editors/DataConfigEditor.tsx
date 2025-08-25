'use client'

import React from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { useDrop } from 'react-dnd'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import type { ComponentLayout, DragItem } from '@/types'

interface DataConfigEditorProps {
  selectedComponent: ComponentLayout
  onDataConfigUpdate: (dataUpdates: any) => void
  filters: Array<{
    field: string
    operator: string
    value: string
    id: string
  }>
  setFilters: React.Dispatch<React.SetStateAction<Array<{
    field: string
    operator: string
    value: string
    id: string
  }>>>
}

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

export function DataConfigEditor({ 
  selectedComponent, 
  onDataConfigUpdate, 
  filters, 
  setFilters 
}: DataConfigEditorProps) {
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
    
    if (!currentMetrics.includes(fieldDisplayName)) {
      const newMetrics = [...currentMetrics, fieldDisplayName]
      
      onDataConfigUpdate({
        metrics: newMetrics,
        dimensions: currentDimensions,
        filters: currentFilters,
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
    
    if (!currentDimensions.includes(fieldDisplayName)) {
      const newDimensions = [...currentDimensions, fieldDisplayName]
      
      onDataConfigUpdate({
        metrics: currentMetrics,
        dimensions: newDimensions,
        filters: currentFilters,
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
    
    onDataConfigUpdate({
      metrics: newMetrics,
      dimensions: currentDimensions,
      filters: currentFilters,
      fieldDisplayNames: currentFieldDisplayNames
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
    
    onDataConfigUpdate({
      metrics: currentMetrics,
      dimensions: newDimensions,
      filters: currentFilters,
      fieldDisplayNames: currentFieldDisplayNames
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
    
    onDataConfigUpdate({
      metrics: currentMetrics,
      dimensions: currentDimensions,
      filters: newFilters,
      fieldDisplayNames: currentFieldDisplayNames
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
    
    onDataConfigUpdate({
      metrics: currentMetrics,
      dimensions: currentDimensions,
      filters: newFilters,
      fieldDisplayNames: currentFieldDisplayNames
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
    
    onDataConfigUpdate({
      metrics: currentMetrics,
      dimensions: currentDimensions,
      filters: newFilters,
      fieldDisplayNames: currentFieldDisplayNames
    })
  }

  return (
    <div className="space-y-4">
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
    </div>
  )
}