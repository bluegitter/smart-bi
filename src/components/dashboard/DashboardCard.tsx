'use client'

import React from 'react'
import { Edit2, Eye, Copy, Trash2, Calendar, User, BarChart3, MoreHorizontal } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { Dashboard } from '@/types'

interface DashboardCardProps {
  dashboard: Dashboard
  onEdit: () => void
  onView: () => void
  onClone: () => void
  onDelete: () => void
  formatDate: (date: Date | string) => string
}

export function DashboardCard({
  dashboard,
  onEdit,
  onView,
  onClone,
  onDelete,
  formatDate
}: DashboardCardProps) {
  const [showActions, setShowActions] = React.useState(false)

  const componentCount = dashboard.layout?.components?.length || 0

  return (
    <Card 
      className="group hover:shadow-md transition-all duration-200 cursor-pointer relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-medium truncate mb-1">
              {dashboard.name}
            </CardTitle>
            {dashboard.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {dashboard.description}
              </p>
            )}
          </div>
          
          {/* 操作按钮 */}
          <div className={cn(
            "flex items-center gap-1 transition-opacity ml-2",
            !showActions && "opacity-0 group-hover:opacity-100"
          )}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-blue-600"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              title="编辑"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-green-600"
              onClick={(e) => {
                e.stopPropagation()
                onView()
              }}
              title="预览"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-orange-600"
              onClick={(e) => {
                e.stopPropagation()
                onClone()
              }}
              title="克隆"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              title="删除"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* 统计信息 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <BarChart3 className="h-4 w-4" />
            <span>{componentCount} 个组件</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>私有</span>
          </div>
        </div>

        {/* 更新时间 */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar className="h-3 w-3" />
          <span>更新于 {formatDate(dashboard.updatedAt || dashboard.createdAt)}</span>
        </div>

        {/* 主题色条 */}
        {dashboard.globalConfig?.theme && (
          <div className="mt-3 h-1 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        )}
      </CardContent>

      {/* 点击整个卡片预览 */}
      <div 
        className="absolute inset-0 cursor-pointer"
        onClick={onView}
      />
    </Card>
  )
}