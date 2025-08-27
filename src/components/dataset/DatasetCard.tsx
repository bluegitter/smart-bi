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
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { cn } from '@/lib/utils'
import type { Dataset } from '@/types/dataset'

interface DatasetCardProps {
  dataset: Dataset
  onRefresh?: () => void
}

export function DatasetCard({ dataset, onRefresh }: DatasetCardProps) {
  const router = useRouter()
  const [showMenu, setShowMenu] = React.useState(false)
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
            method: 'DELETE'
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

  return (
    <Card className="hover:shadow-md transition-shadow relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-lg", typeInfo.color)}>
              {typeInfo.icon}
            </div>
            <div>
              <CardTitle className="text-base">{dataset.displayName}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">{typeInfo.label}</span>
                <div className="flex items-center gap-1">
                  {statusInfo.icon}
                  <span className={cn("text-xs", statusInfo.color)}>
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
              className="h-6 w-6"
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
                <div className="absolute right-0 top-7 z-20 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[120px]">
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                    onClick={handleView}
                  >
                    <Eye className="h-4 w-4" />
                    查看
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                    onClick={handleEdit}
                  >
                    <Edit className="h-4 w-4" />
                    编辑
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                    删除
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* 描述 */}
        {dataset.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {dataset.description}
          </p>
        )}
        
        {/* 字段统计 */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {dataset.fields?.length || 0}
            </div>
            <div className="text-xs text-gray-500">总字段</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1">
              <Type className="h-3 w-3 text-purple-600" />
              <span className="text-lg font-semibold text-gray-900">
                {dataset.fields?.filter(f => f.fieldType === 'dimension').length || 0}
              </span>
            </div>
            <div className="text-xs text-gray-500">维度</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1">
              <Hash className="h-3 w-3 text-green-600" />
              <span className="text-lg font-semibold text-gray-900">
                {dataset.fields?.filter(f => f.fieldType === 'measure').length || 0}
              </span>
            </div>
            <div className="text-xs text-gray-500">度量</div>
          </div>
        </div>
        
        {/* 质量评分 */}
        {dataset.qualityScore && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">数据质量</span>
            <div className="flex items-center gap-2">
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div 
                  className={cn(
                    "h-2 rounded-full transition-all",
                    dataset.qualityScore >= 80 ? "bg-green-500" :
                    dataset.qualityScore >= 60 ? "bg-yellow-500" :
                    "bg-red-500"
                  )}
                  style={{ width: `${dataset.qualityScore}%` }}
                />
              </div>
              <span className="text-xs font-medium">
                {dataset.qualityScore}分
              </span>
            </div>
          </div>
        )}
        
        {/* 元数据 */}
        <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-3">
          <div className="flex items-center gap-3">
            <span>{dataset.category}</span>
            {dataset.metadata.recordCount && (
              <span>{dataset.metadata.recordCount.toLocaleString()} 行</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(dataset.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
      {confirmDialog}
    </Card>
  )
}