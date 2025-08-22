'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { 
  Save, 
  Play, 
  RefreshCw, 
  Database, 
  Table, 
  Filter, 
  SortAsc, 
  Eye, 
  EyeOff,
  BarChart3,
  Hash,
  Calendar,
  Type,
  ArrowLeft,
  Settings,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { SQLQueryBuilder } from '@/components/query-builder/SQLQueryBuilder'
import { TableSelector } from '@/components/dataset/TableSelector'
import { FieldTypeSelector } from '@/components/dataset/FieldTypeSelector'
import { useDataset } from '@/hooks/useDatasets'
import { useDataSources } from '@/hooks/useDataSources'
import { cn } from '@/lib/utils'
import type { Dataset, DatasetField, DatasetType } from '@/types/dataset'
import type { DataSource } from '@/types'

interface DatasetEditorProps {
  datasetId?: string
  mode: 'create' | 'edit' | 'view'
}

export function DatasetEditor({ datasetId, mode }: DatasetEditorProps) {
  const router = useRouter()
  const { dataSources, loading: dataSourcesLoading } = useDataSources()
  const { dataset, loading, error, save, preview, refresh } = useDataset(datasetId)
  
  // 编辑器状态
  const [datasetType, setDatasetType] = React.useState<DatasetType>('table')
  const [selectedDataSource, setSelectedDataSource] = React.useState<string>('')
  const [datasetName, setDatasetName] = React.useState('')
  const [datasetDisplayName, setDatasetDisplayName] = React.useState('')
  const [datasetDescription, setDatasetDescription] = React.useState('')
  const [datasetCategory, setDatasetCategory] = React.useState('')
  
  // 字段相关状态
  const [fields, setFields] = React.useState<DatasetField[]>([])
  const [expandedSections, setExpandedSections] = React.useState({
    dimensions: true,
    measures: true
  })
  const [hideHiddenFields, setHideHiddenFields] = React.useState(false)
  
  // 预览相关状态
  const [previewData, setPreviewData] = React.useState<any[]>([])
  const [previewLoading, setPreviewLoading] = React.useState(false)
  const [previewError, setPreviewError] = React.useState<string>('')
  
  // 表选择器状态（用于table类型）
  const [selectedTable, setSelectedTable] = React.useState('')
  const [selectedSchema, setSelectedSchema] = React.useState('')
  
  // SQL编辑器状态（用于sql类型）
  const [sqlQuery, setSqlQuery] = React.useState('')
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false)

  // 初始化数据
  React.useEffect(() => {
    if (dataset && mode !== 'create') {
      setDatasetType(dataset.type)
      setDatasetName(dataset.name)
      setDatasetDisplayName(dataset.displayName)
      setDatasetDescription(dataset.description || '')
      setDatasetCategory(dataset.category)
      setFields(dataset.fields || [])
      
      if (dataset.tableConfig) {
        setSelectedDataSource(dataset.tableConfig.datasourceId)
        setSelectedSchema(dataset.tableConfig.schema || '')
        setSelectedTable(dataset.tableConfig.tableName)
      } else if (dataset.sqlConfig) {
        setSelectedDataSource(dataset.sqlConfig.datasourceId)
        setSqlQuery(dataset.sqlConfig.sql)
      }
    }
  }, [dataset, mode])

  // 监听变化，标记未保存状态
  React.useEffect(() => {
    if (mode === 'view') return
    
    if (dataset) {
      const hasChanges = (
        datasetName !== dataset.name ||
        datasetDisplayName !== dataset.displayName ||
        datasetDescription !== (dataset.description || '') ||
        datasetCategory !== dataset.category ||
        JSON.stringify(fields) !== JSON.stringify(dataset.fields || [])
      )
      setHasUnsavedChanges(hasChanges)
    } else if (mode === 'create') {
      setHasUnsavedChanges(datasetName.trim() !== '' || fields.length > 0)
    }
  }, [dataset, datasetName, datasetDisplayName, datasetDescription, datasetCategory, fields, mode])

  // 自动分析表字段
  const analyzeTableFields = async (datasourceId: string, schema: string, tableName: string) => {
    try {
      const response = await fetch(`/api/datasources/${datasourceId}/schema`)
      if (response.ok) {
        const data = await response.json()
        const table = data.tables?.find((t: any) => t.name === tableName)
        
        if (table && table.columns) {
          const analyzedFields = table.columns.map((col: any) => {
            // 推断字段类型
            const dataType = inferDataType(col.type)
            const fieldType = inferFieldType(col.name, col.type)
            
            return {
              name: col.name,
              displayName: generateDisplayName(col.name),
              type: dataType,
              fieldType,
              isNullable: col.nullable,
              isPrimaryKey: col.name.toLowerCase() === 'id',
              ...(fieldType === 'measure' && {
                aggregationType: inferAggregationType(col.name)
              }),
              ...(fieldType === 'dimension' && {
                dimensionLevel: dataType === 'date' ? 'temporal' : 'categorical'
              }),
              sampleValues: []
            }
          })
          
          setFields(analyzedFields)
        }
      }
    } catch (error) {
      console.error('分析表字段失败:', error)
    }
  }

  // 字段类型推断辅助函数
  const inferDataType = (mysqlType: string): 'string' | 'number' | 'date' | 'boolean' => {
    const type = mysqlType.toLowerCase()
    if (type.includes('int') || type.includes('decimal') || type.includes('float') || type.includes('double')) {
      return 'number'
    }
    if (type.includes('date') || type.includes('time')) {
      return 'date'
    }
    if (type.includes('bool') || type.includes('bit')) {
      return 'boolean'
    }
    return 'string'
  }

  const inferFieldType = (fieldName: string, mysqlType: string): 'dimension' | 'measure' => {
    const name = fieldName.toLowerCase()
    const type = mysqlType.toLowerCase()
    
    // 数字类型且包含度量关键词的字段
    if ((type.includes('int') || type.includes('decimal') || type.includes('float')) &&
        (name.includes('amount') || name.includes('price') || name.includes('count') || 
         name.includes('total') || name.includes('sum') || name.includes('qty') ||
         name.includes('数量') || name.includes('金额') || name.includes('价格'))) {
      return 'measure'
    }
    
    // ID字段通常是维度
    if (name === 'id' || name.endsWith('_id')) {
      return 'dimension'
    }
    
    // 其他情况根据数据类型判断
    if (type.includes('int') || type.includes('decimal') || type.includes('float')) {
      return 'measure'
    }
    
    return 'dimension'
  }

  const inferAggregationType = (fieldName: string): 'SUM' | 'AVG' | 'COUNT' | 'MAX' | 'MIN' => {
    const name = fieldName.toLowerCase()
    if (name.includes('count') || name.includes('数量')) return 'COUNT'
    if (name.includes('avg') || name.includes('平均')) return 'AVG'
    return 'SUM'
  }

  const generateDisplayName = (fieldName: string): string => {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim()
  }

  // 监听表选择变化，自动分析字段
  React.useEffect(() => {
    if (selectedDataSource && selectedTable && datasetType === 'table') {
      analyzeTableFields(selectedDataSource, selectedSchema, selectedTable)
    }
  }, [selectedDataSource, selectedSchema, selectedTable, datasetType])

  // 处理预览
  const handlePreview = async () => {
    setPreviewLoading(true)
    setPreviewError('')
    
    try {
      if (fields.length > 0) {
        // 根据字段生成模拟预览数据
        const sampleData = Array.from({ length: 3 }, (_, i) => {
          const row: any = {}
          fields.forEach(field => {
            if (field.fieldType === 'measure') {
              row[field.displayName] = (Math.random() * 10000).toFixed(1)
            } else if (field.type === 'date') {
              row[field.displayName] = `2024-0${i + 1}-01`
            } else {
              row[field.displayName] = `示例${field.displayName}${i + 1}`
            }
          })
          return row
        })
        
        setPreviewData(sampleData)
      } else {
        // 使用默认模拟数据
        setPreviewData([
          { 月份: '1月', 门店: 'DT广州天河店', 年份: 2024, 实际数: 10000.0, 预算数: 8000.0 },
          { 月份: '3月', 门店: 'DT广州天河店', 年份: 2024, 实际数: 30000.0, 预算数: 40000.0 },
          { 月份: '2月', 门店: 'DT玉林容县峰府店', 年份: 2024, 实际数: 20000.0, 预算数: 150000.0 }
        ])
      }
      setPreviewLoading(false)
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : '预览失败')
      setPreviewLoading(false)
    }
  }

  // 处理保存
  const handleSave = async () => {
    try {
      const datasetData = {
        name: datasetName,
        displayName: datasetDisplayName,
        description: datasetDescription,
        category: datasetCategory,
        type: datasetType,
        fields,
        // 根据类型添加配置
        ...(datasetType === 'table' && {
          tableConfig: {
            datasourceId: selectedDataSource,
            schema: selectedSchema,
            tableName: selectedTable
          }
        }),
        ...(datasetType === 'sql' && {
          sqlConfig: {
            datasourceId: selectedDataSource,
            sql: sqlQuery
          }
        })
      }
      
      await save(datasetData)
      setHasUnsavedChanges(false)
      
      if (mode === 'create') {
        router.push('/datasets')
      }
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  // 处理字段更新
  const handleFieldUpdate = (fieldName: string, updates: Partial<DatasetField>) => {
    setFields(prev => prev.map(field => 
      field.name === fieldName ? { ...field, ...updates } : field
    ))
  }

  // 处理字段可见性切换
  const handleFieldVisibilityToggle = (fieldName: string) => {
    setFields(prev => prev.map(field => 
      field.name === fieldName ? { ...field, hidden: !field.hidden } : field
    ))
  }

  // 获取字段图标
  const getFieldIcon = (field: DatasetField) => {
    if (field.fieldType === 'measure') {
      return <Hash className="h-4 w-4 text-green-600" />
    } else if (field.type === 'date') {
      return <Calendar className="h-4 w-4 text-blue-600" />
    } else {
      return <Type className="h-4 w-4 text-purple-600" />
    }
  }

  // 过滤字段
  const visibleFields = hideHiddenFields ? fields.filter(f => !f.hidden) : fields
  const dimensions = visibleFields.filter(f => f.fieldType === 'dimension')
  const measures = visibleFields.filter(f => f.fieldType === 'measure')

  if (loading || dataSourcesLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* 顶部工具栏 */}
      <div className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            <span className="font-medium">
              {mode === 'create' ? '新建数据集' : dataset?.displayName || '数据集编辑'}
            </span>
            {hasUnsavedChanges && <span className="text-orange-500">*</span>}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            disabled={previewLoading}
          >
            <Play className={cn("h-4 w-4 mr-2", previewLoading && "animate-spin")} />
            预览数据
          </Button>
          
          {mode !== 'view' && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
            >
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex">
        {/* 左侧配置面板 */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* 基本信息 */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium mb-3">基本信息</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">数据集名称</label>
                <Input
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  placeholder="输入数据集名称"
                  disabled={mode === 'view'}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">显示名称</label>
                <Input
                  value={datasetDisplayName}
                  onChange={(e) => setDatasetDisplayName(e.target.value)}
                  placeholder="输入显示名称"
                  disabled={mode === 'view'}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">描述</label>
                <Input
                  value={datasetDescription}
                  onChange={(e) => setDatasetDescription(e.target.value)}
                  placeholder="输入数据集描述"
                  disabled={mode === 'view'}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">分类</label>
                <Input
                  value={datasetCategory}
                  onChange={(e) => setDatasetCategory(e.target.value)}
                  placeholder="输入分类名称"
                  disabled={mode === 'view'}
                />
              </div>
            </div>
          </div>

          {/* 数据源配置 */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium mb-3">数据源配置</h3>
            
            {/* 数据集类型选择 */}
            <div className="mb-3">
              <label className="text-sm text-gray-600 mb-2 block">数据集类型</label>
              <div className="flex gap-2">
                <Button
                  variant={datasetType === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDatasetType('table')}
                  disabled={mode === 'view'}
                >
                  <Table className="h-3 w-3 mr-1" />
                  数据表
                </Button>
                <Button
                  variant={datasetType === 'sql' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDatasetType('sql')}
                  disabled={mode === 'view'}
                >
                  <Database className="h-3 w-3 mr-1" />
                  SQL
                </Button>
              </div>
            </div>
            
            {datasetType === 'table' && (
              <TableSelector
                dataSources={dataSources}
                selectedDataSource={selectedDataSource}
                selectedSchema={selectedSchema}
                selectedTable={selectedTable}
                onDataSourceChange={setSelectedDataSource}
                onSchemaChange={setSelectedSchema}
                onTableChange={setSelectedTable}
                disabled={mode === 'view'}
              />
            )}
            
            {datasetType === 'sql' && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">选择数据源</label>
                  <select
                    value={selectedDataSource}
                    onChange={(e) => setSelectedDataSource(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    disabled={mode === 'view'}
                  >
                    <option value="">请选择数据源</option>
                    {dataSources.map(ds => (
                      <option key={ds._id} value={ds._id}>{ds.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 字段管理 */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">字段管理</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHideHiddenFields(!hideHiddenFields)}
                >
                  {hideHiddenFields ? (
                    <><EyeOff className="h-4 w-4 mr-1" />隐藏</>
                  ) : (
                    <><Eye className="h-4 w-4 mr-1" />显示</>
                  )}
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {/* 维度字段 */}
              <div className="border-b border-gray-100">
                <div
                  className="flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedSections(prev => ({ ...prev, dimensions: !prev.dimensions }))}
                >
                  {expandedSections.dimensions ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <Type className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-sm">维度</span>
                  <span className="text-xs text-gray-500">·{dimensions.length}</span>
                </div>
                
                {expandedSections.dimensions && (
                  <div className="space-y-1 pb-2">
                    {dimensions.map(field => (
                      <div
                        key={field.name}
                        className={cn(
                          "flex items-center gap-2 px-6 py-2 text-sm",
                          field.hidden && "opacity-50"
                        )}
                      >
                        <button
                          className="p-1 hover:bg-gray-100 rounded"
                          onClick={() => handleFieldVisibilityToggle(field.name)}
                          disabled={mode === 'view'}
                        >
                          {field.hidden ? (
                            <EyeOff className="h-3 w-3 text-gray-400" />
                          ) : (
                            <Eye className="h-3 w-3 text-gray-600" />
                          )}
                        </button>
                        {getFieldIcon(field)}
                        <span className="flex-1 truncate">{field.displayName}</span>
                        {mode !== 'view' && (
                          <FieldTypeSelector
                            field={field}
                            onChange={(updates) => handleFieldUpdate(field.name, updates)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* 度量字段 */}
              <div>
                <div
                  className="flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedSections(prev => ({ ...prev, measures: !prev.measures }))}
                >
                  {expandedSections.measures ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <Hash className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-sm">度量</span>
                  <span className="text-xs text-gray-500">·{measures.length}</span>
                </div>
                
                {expandedSections.measures && (
                  <div className="space-y-1 pb-2">
                    {measures.map(field => (
                      <div
                        key={field.name}
                        className={cn(
                          "flex items-center gap-2 px-6 py-2 text-sm",
                          field.hidden && "opacity-50"
                        )}
                      >
                        <button
                          className="p-1 hover:bg-gray-100 rounded"
                          onClick={() => handleFieldVisibilityToggle(field.name)}
                          disabled={mode === 'view'}
                        >
                          {field.hidden ? (
                            <EyeOff className="h-3 w-3 text-gray-400" />
                          ) : (
                            <Eye className="h-3 w-3 text-gray-600" />
                          )}
                        </button>
                        {getFieldIcon(field)}
                        <span className="flex-1 truncate">{field.displayName}</span>
                        {mode !== 'view' && (
                          <FieldTypeSelector
                            field={field}
                            onChange={(updates) => handleFieldUpdate(field.name, updates)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧主内容区 */}
        <div className="flex-1 flex flex-col">
          {/* SQL编辑器（仅SQL类型显示） */}
          {datasetType === 'sql' && (
            <div className="h-2/5 border-b border-gray-200">
              <div className="h-full p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">SQL查询</h3>
                  <Button size="sm" variant="outline" onClick={handlePreview}>
                    <Play className="h-4 w-4 mr-1" />
                    运行
                  </Button>
                </div>
                <textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  className="w-full h-full resize-none border border-gray-300 rounded-md p-3 font-mono text-sm"
                  placeholder="输入 SQL 查询语句..."
                  disabled={mode === 'view'}
                />
              </div>
            </div>
          )}

          {/* 数据预览区 */}
          <div className="flex-1 flex flex-col">
            <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">数据预览</span>
                  {previewError && (
                    <span className="text-red-600 text-xs">预览失败</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    不展示隐藏字段
                  </span>
                  <Button size="sm" variant="outline">
                    刷新
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto">
              {previewLoading ? (
                <div className="h-full flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : previewData.length > 0 ? (
                <div className="overflow-auto">
                  <table className="w-full">
                    <thead className="bg-blue-600 text-white sticky top-0">
                      <tr>
                        {Object.keys(previewData[0]).map(col => (
                          <th key={col} className="px-4 py-2 text-left text-xs font-medium">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                          {Object.values(row).map((value: any, j) => (
                            <td key={j} className="px-4 py-2 text-sm">
                              {typeof value === 'number' ? value.toLocaleString() : String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Table className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>暂无预览数据</p>
                    <p className="text-sm">点击"预览数据"按钮查看数据</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}