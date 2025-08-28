'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { X, Database, Table, FileCode, Eye, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { TableSelector } from '@/components/dataset/TableSelector'
import { CustomSelect, type SelectItem } from '@/components/ui/CustomSelect'
import { useDataSources } from '@/hooks/useDataSources'
import { getAuthHeaders } from '@/lib/authUtils'
import { cn } from '@/lib/utils'
import type { DatasetType } from '@/types/dataset'

interface CreateDatasetModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CreateDatasetModal({ isOpen, onClose, onSuccess }: CreateDatasetModalProps) {
  const router = useRouter()
  const { dataSources, loading: dataSourcesLoading } = useDataSources()
  const [selectedType, setSelectedType] = React.useState<DatasetType | null>(null)
  const [datasetName, setDatasetName] = React.useState('')
  const [datasetDisplayName, setDatasetDisplayName] = React.useState('')
  
  // 数据库连接选择相关状态
  const [selectedDataSource, setSelectedDataSource] = React.useState('')
  const [selectedSchema, setSelectedSchema] = React.useState('')
  const [selectedTable, setSelectedTable] = React.useState('')

  // 处理表选择变更，自动填充数据集名称和显示名称
  const handleTableChange = (tableName: string, tableInfo?: any) => {
    setSelectedTable(tableName)
    if (tableInfo && selectedType === 'table') {
      setDatasetName(tableName)
      // 优先使用表的comment作为显示名称，否则使用displayName或表名
      if (tableInfo.comment && tableInfo.comment.trim()) {
        setDatasetDisplayName(tableInfo.comment.trim())
      } else if (tableInfo.displayName && tableInfo.displayName !== tableName) {
        setDatasetDisplayName(tableInfo.displayName)
      } else {
        setDatasetDisplayName(tableName)
      }
    }
  }

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
      ...(datasetDisplayName && { displayName: datasetDisplayName }),
      // 传递数据源信息（所有类型都需要）
      ...(selectedDataSource && { dataSource: selectedDataSource }),
      // 对于数据表类型，额外传递模式和表选择信息
      ...(selectedType === 'table' && selectedSchema && { schema: selectedSchema }),
      ...(selectedType === 'table' && selectedTable && { table: selectedTable })
    })
    
    router.push(`/datasets/editor?${params}`)
    onClose()
  }

  const handleClose = () => {
    setSelectedType(null)
    setDatasetName('')
    setDatasetDisplayName('')
    setSelectedDataSource('')
    setSelectedSchema('')
    setSelectedTable('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
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

        {/* Content - 可滚动区域 */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-6">
            <h3 className="font-medium mb-2">选择数据集类型</h3>
            <p className="text-sm text-gray-600 mb-4">
              根据您的数据来源和处理需求选择合适的数据集类型
            </p>
            
            <div className="grid grid-cols-3 gap-3">
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
                    <div className="text-center">
                      <div className={cn("p-3 rounded-lg inline-flex mb-3", item.color)}>
                        {item.icon}
                      </div>
                      <h4 className="font-medium mb-2">{item.title}</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">{item.description}</p>
                      {selectedType === item.type && (
                        <div className="mt-3 flex justify-center">
                          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
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
              {/* 数据源配置 */}
              <div className="space-y-4 mb-6">
                <h3 className="font-medium">数据源配置</h3>
                
                {selectedType === 'table' && (
                  <TableSelector
                    dataSources={dataSources}
                    selectedDataSource={selectedDataSource}
                    selectedSchema={selectedSchema}
                    selectedTable={selectedTable}
                    onDataSourceChange={setSelectedDataSource}
                    onSchemaChange={setSelectedSchema}
                    onTableChange={handleTableChange}
                    disabled={dataSourcesLoading}
                  />
                )}

                {(selectedType === 'sql' || selectedType === 'view') && (
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">选择数据源</label>
                    <CustomSelect
                      items={dataSources.map(ds => ({
                        id: ds._id,
                        name: ds.name,
                        displayName: ds.name,
                        type: ds.type,
                        icon: Database
                      }))}
                      value={selectedDataSource}
                      onValueChange={setSelectedDataSource}
                      placeholder="请选择数据源"
                      disabled={dataSourcesLoading}
                    />
                  </div>
                )}
              </div>

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

        {/* Footer - 固定在底部 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0">
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button 
            onClick={handleContinue}
            disabled={
              !selectedType || 
              !selectedDataSource || 
              (selectedType === 'table' && !selectedTable)
            }
          >
            继续
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}