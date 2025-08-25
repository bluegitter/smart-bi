'use client'

import React from 'react'
import { Search, Filter, X, Database, ChevronDown, ChevronRight, RefreshCw, Hash, Type, Calendar } from 'lucide-react'
import { useDrag } from 'react-dnd'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CompactDatasetCard } from './CompactDatasetCard'
import { cn } from '@/lib/utils'
import { getAuthHeaders } from '@/lib/authUtils'
import { useDatasets } from '@/hooks/useDatasets'
import type { Dataset, DatasetField } from '@/types/dataset'

interface DatasetLibraryPanelProps {
  className?: string
  isOpen: boolean
  onClose: () => void
  position?: { x: number; y: number }
  onMove?: (position: { x: number; y: number }) => void
  height?: number
  onHeightChange?: (height: number) => void
}

// 可拖拽的数据集字段组件
function DraggableField({ field, dataset }: { field: DatasetField; dataset: Dataset }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'dataset-field',
    item: {
      type: 'dataset-field',
      id: `${dataset._id}-${field.name}`,
      data: {
        datasetId: dataset._id,
        datasetName: dataset.displayName,
        field: field,
        fieldType: field.fieldType
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }))

  const getFieldIcon = () => {
    if (field.fieldType === 'measure') {
      return <Hash className="h-3 w-3 text-green-600" />
    } else if (field.type === 'date') {
      return <Calendar className="h-3 w-3 text-blue-600" />
    } else {
      return <Type className="h-3 w-3 text-purple-600" />
    }
  }

  return (
    <div
      ref={drag}
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm cursor-move hover:bg-gray-50 rounded transition-all",
        isDragging && "opacity-50 scale-95"
      )}
      title={field.description || `${field.displayName} (${field.name})`}
    >
      {getFieldIcon()}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{field.displayName}</div>
        <div className="text-xs text-gray-500 truncate font-mono">{field.name}</div>
      </div>
      <div className="flex flex-col items-end text-xs text-gray-400">
        {field.fieldType === 'measure' && field.aggregationType && (
          <span className="bg-gray-100 px-1 rounded">{field.aggregationType}</span>
        )}
        {field.unit && (
          <span className="bg-green-100 text-green-700 px-1 rounded mt-0.5 font-medium">{field.unit}</span>
        )}
        {field.type && (
          <span className="mt-0.5 opacity-75">{field.type}</span>
        )}
      </div>
    </div>
  )
}

export function DatasetLibraryPanel({ 
  className, 
  isOpen, 
  onClose, 
  position = { x: 50, y: 100 },
  onMove,
  height = 400,
  onHeightChange
}: DatasetLibraryPanelProps) {
  const { datasets, loading, searchDatasets } = useDatasets()
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState('全部')
  const [selectedDataset, setSelectedDataset] = React.useState<Dataset | null>(null)
  const [expandedDatasets, setExpandedDatasets] = React.useState<Record<string, boolean>>({})
  const [isDragging, setIsDragging] = React.useState(false)
  const [isResizing, setIsResizing] = React.useState(false)
  const panelRef = React.useRef<HTMLDivElement>(null)

  // 计算分类
  const categories = React.useMemo(() => {
    const uniqueCategories = [...new Set(datasets.map(d => d.category))].sort()
    return ['全部', ...uniqueCategories]
  }, [datasets])

  // 过滤数据集
  const filteredDatasets = React.useMemo(() => {
    let filtered = datasets

    if (searchTerm) {
      filtered = filtered.filter(dataset =>
        dataset.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dataset.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dataset.fields.some(field => 
          field.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          field.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    if (selectedCategory !== '全部') {
      filtered = filtered.filter(dataset => dataset.category === selectedCategory)
    }

    return filtered.filter(d => d.status === 'active')
  }, [datasets, searchTerm, selectedCategory])

  const toggleDataset = (datasetId: string) => {
    setExpandedDatasets(prev => ({
      ...prev,
      [datasetId]: !prev[datasetId]
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
      
      const windowHeight = window.innerHeight
      const panelTop = position.y
      const bottomPadding = 20
      const maxAvailableHeight = windowHeight - panelTop - bottomPadding
      
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
            <h3 className="font-semibold">数据集库</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => searchDatasets()}
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
            placeholder="搜索数据集和字段..."
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

      {/* Datasets List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {loading ? (
            <div className="text-center py-8 text-slate-500">
              <RefreshCw className="h-6 w-6 mx-auto mb-2 opacity-50 animate-spin" />
              <p className="text-sm">加载数据集中...</p>
            </div>
          ) : filteredDatasets.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Database className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">未找到匹配的数据集</p>
            </div>
          ) : (
            filteredDatasets.map((dataset) => (
              <div key={dataset._id} className="border-b border-gray-100 last:border-b-0">
                <div
                  className="flex items-center gap-2 py-2 px-2 cursor-pointer hover:bg-slate-50 rounded"
                  onClick={() => toggleDataset(dataset._id)}
                >
                  {expandedDatasets[dataset._id] ? (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                  <Database className="h-4 w-4 text-blue-600" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{dataset.displayName}</div>
                    <div className="text-xs text-gray-500">
                      {dataset.dimensionCount || 0} 维度, {dataset.measureCount || 0} 度量
                    </div>
                  </div>
                </div>
                
                {expandedDatasets[dataset._id] && (
                  <div className="ml-6 mb-2 space-y-1">
                    {/* 显示维度 */}
                    {dataset.fields.filter(f => f.fieldType === 'dimension').length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500 font-medium mb-1 px-2">维度</div>
                        {dataset.fields
                          .filter(f => f.fieldType === 'dimension' && !f.hidden)
                          .map((field) => (
                            <DraggableField
                              key={field.name}
                              field={field}
                              dataset={dataset}
                            />
                          ))
                        }
                      </div>
                    )}
                    
                    {/* 显示度量 */}
                    {dataset.fields.filter(f => f.fieldType === 'measure').length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500 font-medium mb-1 px-2">度量</div>
                        {dataset.fields
                          .filter(f => f.fieldType === 'measure' && !f.hidden)
                          .map((field) => (
                            <DraggableField
                              key={field.name}
                              field={field}
                              dataset={dataset}
                            />
                          ))
                        }
                      </div>
                    )}
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
          拖拽字段到画布创建图表
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