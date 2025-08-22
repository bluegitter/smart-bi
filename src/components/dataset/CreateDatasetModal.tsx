'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { X, Database, Table, FileCode, Eye, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import type { DatasetType } from '@/types/dataset'

interface CreateDatasetModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CreateDatasetModal({ isOpen, onClose, onSuccess }: CreateDatasetModalProps) {
  const router = useRouter()
  const [selectedType, setSelectedType] = React.useState<DatasetType | null>(null)
  const [datasetName, setDatasetName] = React.useState('')
  const [datasetDisplayName, setDatasetDisplayName] = React.useState('')

  const datasetTypes = [
    {
      type: 'table' as const,
      title: '数据表',
      description: '直接连接到数据库表，自动识别字段类型',
      icon: <Table className="h-6 w-6" />,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      type: 'sql' as const,
      title: 'SQL查询',
      description: '编写自定义SQL查询，灵活处理复杂数据',
      icon: <FileCode className="h-6 w-6" />,
      color: 'text-green-600 bg-green-100'
    },
    {
      type: 'view' as const,
      title: '数据视图',
      description: '基于现有数据集创建视图，添加过滤和计算字段',
      icon: <Eye className="h-6 w-6" />,
      color: 'text-purple-600 bg-purple-100'
    }
  ]

  const handleContinue = () => {
    if (!selectedType) return
    
    // 跳转到数据集编辑器
    const params = new URLSearchParams({
      mode: 'create',
      type: selectedType,
      ...(datasetName && { name: datasetName }),
      ...(datasetDisplayName && { displayName: datasetDisplayName })
    })
    
    router.push(`/datasets/editor?${params}`)
    onClose()
  }

  const handleClose = () => {
    setSelectedType(null)
    setDatasetName('')
    setDatasetDisplayName('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold">创建数据集</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="font-medium mb-2">选择数据集类型</h3>
            <p className="text-sm text-gray-600 mb-4">
              根据您的数据来源和处理需求选择合适的数据集类型
            </p>
            
            <div className="grid gap-3">
              {datasetTypes.map((item) => (
                <Card
                  key={item.type}
                  className={cn(
                    "cursor-pointer transition-all border-2",
                    selectedType === item.type
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => setSelectedType(item.type)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-lg", item.color)}>
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{item.title}</h4>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                      {selectedType === item.type && (
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {selectedType && (
            <div className="space-y-4 border-t border-gray-200 pt-6">
              <h3 className="font-medium">基本信息</h3>
              
              <div>
                <label className="text-sm text-gray-600 mb-1 block">数据集名称</label>
                <Input
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  placeholder="输入数据集名称（英文字母开头）"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-600 mb-1 block">显示名称</label>
                <Input
                  value={datasetDisplayName}
                  onChange={(e) => setDatasetDisplayName(e.target.value)}
                  placeholder="输入显示名称（中文）"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button 
            onClick={handleContinue}
            disabled={!selectedType}
          >
            继续
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}