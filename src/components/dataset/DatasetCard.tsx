'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { 
  Table, 
  FileCode, 
  Eye, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Play, 
  Calendar,
  Hash,
  Type,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DatasetChatButton } from '@/components/ai/DatasetChatButton'
import { getAuthHeaders } from '@/lib/authUtils'
import { cn } from '@/lib/utils'
import type { Dataset } from '@/types/dataset'

interface DatasetCardProps {
  dataset: Dataset
  onRefresh?: () => void
}

export function DatasetCard({ dataset, onRefresh }: DatasetCardProps) {
  const router = useRouter()
  const [showMenu, setShowMenu] = React.useState(false)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const { showConfirm, confirmDialog } = useConfirmDialog()

  const getTypeInfo = () => {
    switch (dataset.type) {
      case 'table':
        return {
          icon: <Table className="h-4 w-4" />,
          label: '数据表',
          color: 'text-blue-600 bg-blue-100'
        }
      case 'sql':
        return {
          icon: <FileCode className="h-4 w-4" />,
          label: 'SQL查询',
          color: 'text-green-600 bg-green-100'
        }
      case 'view':
        return {
          icon: <Eye className="h-4 w-4" />,
          label: '数据视图',
          color: 'text-purple-600 bg-purple-100'
        }
    }
  }

  const getStatusInfo = () => {
    switch (dataset.status) {
      case 'active':
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          label: '正常',
          color: 'text-green-600'
        }
      case 'processing':
        return {
          icon: <div className="h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />,
          label: '处理中',
          color: 'text-blue-600'
        }
      case 'error':
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          label: '错误',
          color: 'text-red-600'
        }
      case 'inactive':
        return {
          icon: <div className="h-3 w-3 rounded-full bg-gray-400" />,
          label: '未激活',
          color: 'text-gray-600'
        }
    }
  }

  const typeInfo = getTypeInfo()
  const statusInfo = getStatusInfo()

  const handleEdit = () => {
    router.push(`/datasets/editor?id=${dataset._id}&mode=edit`)
    setShowMenu(false)
  }

  const handleView = () => {
    router.push(`/datasets/editor?id=${dataset._id}&mode=view`)
    setShowMenu(false)
  }

  const handleDelete = () => {
    setShowMenu(false)
    showConfirm({
      title: '删除数据集',
      message: `确定要删除数据集"${dataset.displayName}"吗？此操作不可恢复。`,
      confirmText: '确认删除',
      cancelText: '取消',
      type: 'danger',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/datasets/${dataset._id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          })
          
          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || '删除失败')
          }
          
          onRefresh?.()
        } catch (error) {
          console.error('删除失败:', error)
          throw error
        }
      }
    })
  }

  const handleRefreshStats = async () => {
    setIsRefreshing(true)
    setShowMenu(false)
    try {
      const response = await fetch(`/api/datasets/${dataset._id}/refresh`, {
        method: 'POST',
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '刷新失败')
      }
      
      // 刷新父组件数据
      onRefresh?.()
    } catch (error) {
      console.error('刷新统计失败:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Card className="group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 relative border-slate-200/60 hover:border-slate-300/60 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-3 rounded-xl shadow-sm transition-all duration-200 group-hover:shadow-md", typeInfo.color)}>
              {typeInfo.icon}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 mb-1 group-hover:text-slate-800 transition-colors">
                {dataset.displayName}
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center px-2.5 py-1 bg-slate-100 rounded-full">
                  <span className="text-xs font-medium text-slate-700">{typeInfo.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {statusInfo.icon}
                  <span className={cn("text-xs font-medium", statusInfo.color)}>
                    {statusInfo.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
            
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-9 z-20 bg-white border border-slate-200 rounded-xl shadow-xl py-2 min-w-[140px] backdrop-blur-sm">
                  <button
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-3 text-slate-700 transition-colors"
                    onClick={handleView}
                  >
                    <Eye className="h-4 w-4 text-slate-500" />
                    查看详情
                  </button>
                  <button
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-3 text-slate-700 transition-colors"
                    onClick={handleEdit}
                  >
                    <Edit className="h-4 w-4 text-slate-500" />
                    编辑设置
                  </button>
                  <button
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-3 text-slate-700 transition-colors"
                    onClick={handleRefreshStats}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-4 w-4 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? '刷新中...' : '刷新统计'}
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 text-red-600 flex items-center gap-3 transition-colors"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                    删除数据集
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-5">
        {/* 描述 */}
        {dataset.description && (
          <div className="bg-slate-50/50 rounded-lg p-3 border border-slate-100">
            <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed">
              {dataset.description}
            </p>
          </div>
        )}
        
        {/* 字段统计 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200/30">
            <div className="text-2xl font-bold text-slate-900 mb-1">
              {dataset.fields?.length || 0}
            </div>
            <div className="text-xs font-medium text-slate-600">总字段</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl border border-purple-200/30">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Type className="h-4 w-4 text-purple-600" />
              <span className="text-2xl font-bold text-slate-900">
                {dataset.fields?.filter(f => f.fieldType === 'dimension').length || 0}
              </span>
            </div>
            <div className="text-xs font-medium text-slate-600">维度字段</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-200/30">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Hash className="h-4 w-4 text-emerald-600" />
              <span className="text-2xl font-bold text-slate-900">
                {dataset.fields?.filter(f => f.fieldType === 'measure').length || 0}
              </span>
            </div>
            <div className="text-xs font-medium text-slate-600">度量字段</div>
          </div>
        </div>
        
        {/* 元数据 */}
        <div className="flex items-center justify-between text-sm border-t border-slate-200/60 pt-4">
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center px-2.5 py-1 bg-slate-100 rounded-full">
              <span className="text-xs font-medium text-slate-700">{dataset.category}</span>
            </div>
            {dataset.metadata?.recordCount !== undefined && dataset.metadata.recordCount !== null ? (
              <div className="flex items-center gap-1.5 text-slate-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium">
                  {dataset.metadata.recordCount.toLocaleString()} 行数据
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-400">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <span className="text-xs font-medium">正在统计...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Calendar className="h-3.5 w-3.5" />
            <div className="text-xs">
              <div className="font-medium">
                {new Date(dataset.updatedAt).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
              {dataset.metadata?.lastRefreshed && (
                <div className="text-slate-400 text-[10px]">
                  统计于 {new Date(dataset.metadata.lastRefreshed).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* AI问答快捷按钮 */}
        <div className="border-t border-slate-200/60 pt-4">
          <DatasetChatButton
            dataset={dataset}
            variant="outline"
            size="sm"
            className="w-full opacity-0 group-hover:opacity-100 transition-all duration-200"
          />
        </div>
      </CardContent>
      {confirmDialog}
    </Card>
  )
}