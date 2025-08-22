'use client'

import React from 'react'
import { useDrag } from 'react-dnd'
import { Edit2, Trash2, Database, TrendingUp, BarChart3, Calculator, Percent, Lock, Eye } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/lib/permissionsService'
import type { Metric } from '@/types'

interface MetricCardProps {
  metric: Metric
  onEdit: (metric: Metric) => void
  onDelete: () => void
  onTagClick: (tag: string) => void
  className?: string
}

const metricTypeIcons = {
  count: BarChart3,
  sum: TrendingUp,
  avg: Calculator,
  max: TrendingUp,
  min: TrendingUp,
  ratio: Percent,
  custom: Database
}

const metricTypeColors = {
  count: 'text-blue-600 bg-blue-50',
  sum: 'text-green-600 bg-green-50',
  avg: 'text-purple-600 bg-purple-50',
  max: 'text-red-600 bg-red-50',
  min: 'text-orange-600 bg-orange-50',
  ratio: 'text-pink-600 bg-pink-50',
  custom: 'text-gray-600 bg-gray-50'
}

export function MetricCard({ metric, onEdit, onDelete, onTagClick, className }: MetricCardProps) {
  const permissions = usePermissions()
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'metric',
    item: {
      type: 'metric',
      id: metric._id,
      data: metric
    },
    canDrag: permissions.checkMetricPermission(metric, 'read'),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }))

  const TypeIcon = metricTypeIcons[metric.type] || Database
  const typeColorClass = metricTypeColors[metric.type] || metricTypeColors.custom
  const accessLevel = permissions.getMetricAccessLevel(metric)
  const canEdit = permissions.canEditMetric(metric)
  const canDelete = permissions.canDeleteMetric(metric)

  return (
    <Card 
      ref={drag}
      className={cn(
        "group hover:shadow-lg transition-all duration-200",
        accessLevel !== 'none' ? "cursor-move" : "cursor-not-allowed opacity-60",
        isDragging && "opacity-50 scale-95",
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn("p-2 rounded-lg", typeColorClass)}>
              <TypeIcon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900 truncate">{metric.displayName}</h3>
                {/* 权限指示器 */}
                {accessLevel === 'read' && (
                  <Eye className="h-3 w-3 text-gray-400" title="只读权限" />
                )}
                {accessLevel === 'none' && (
                  <Lock className="h-3 w-3 text-red-400" title="无访问权限" />
                )}
              </div>
              <p className="text-sm text-gray-500 font-mono">{metric.name}</p>
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(metric)
                }}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-700"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* 描述 */}
        {metric.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {metric.description}
          </p>
        )}
        
        {/* 公式 - 只有写权限以上才能看到 */}
        {metric.formula && (accessLevel === 'write' || accessLevel === 'full') && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">计算公式:</p>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono break-all">
              {metric.formula}
            </code>
          </div>
        )}
        
        {/* 元信息 */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span className="bg-gray-100 px-2 py-1 rounded">{metric.category}</span>
          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
            {metric.type.toUpperCase()}
          </span>
          {metric.unit && (
            <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
              {metric.unit}
            </span>
          )}
        </div>
        
        {/* 标签 */}
        {metric.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {metric.tags.slice(0, 3).map((tag) => (
              <button
                key={tag}
                onClick={(e) => {
                  e.stopPropagation()
                  onTagClick(tag)
                }}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                {tag}
              </button>
            ))}
            {metric.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-500">
                +{metric.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}