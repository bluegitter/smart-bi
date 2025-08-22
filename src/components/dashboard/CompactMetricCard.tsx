'use client'

import React from 'react'
import { useDrag } from 'react-dnd'
import { Database, TrendingUp, BarChart3, Calculator, Percent } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/lib/permissionsService'
import type { Metric } from '@/types'

interface CompactMetricCardProps {
  metric: Metric
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

export function CompactMetricCard({ metric, className }: CompactMetricCardProps) {
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

  return (
    <div 
      ref={drag}
      className={cn(
        "group p-2 border border-slate-200 rounded hover:shadow-md transition-all duration-200 bg-white",
        accessLevel !== 'none' ? "cursor-move hover:border-blue-300" : "cursor-not-allowed opacity-60",
        isDragging && "opacity-50 scale-95",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {/* 指标类型图标 */}
        <div className={cn("p-1 rounded", typeColorClass)}>
          <TypeIcon className="w-3 h-3" />
        </div>
        
        {/* 指标信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-xs text-gray-900 truncate">
              {metric.displayName}
            </h4>
            <div className="flex items-center gap-1">
              {/* 指标类型标签 */}
              <span className="text-xs px-1 py-0.5 bg-slate-100 text-slate-600 rounded">
                {metric.type.toUpperCase()}
              </span>
              {metric.unit && (
                <span className="text-xs px-1 py-0.5 bg-green-100 text-green-700 rounded">
                  {metric.unit}
                </span>
              )}
            </div>
          </div>
          
          {/* 分类信息 */}
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-slate-500 truncate">
              {metric.category}
            </span>
            {metric.tags.length > 0 && (
              <div className="flex gap-1">
                {metric.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-1 py-0.5 bg-slate-50 text-slate-600 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {metric.tags.length > 2 && (
                  <span className="text-xs text-slate-400">
                    +{metric.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}