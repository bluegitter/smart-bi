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
  ChevronRight,
  X,
  Calculator
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { SQLQueryBuilder } from '@/components/query-builder/SQLQueryBuilder'
import { TableSelector } from '@/components/dataset/TableSelector'
import { FieldTypeSelector } from '@/components/dataset/FieldTypeSelector'
import { FieldEditorDialog } from '@/components/dataset/FieldEditorDialog'
import { useDataset } from '@/hooks/useDatasets'
import { useDataSources } from '@/hooks/useDataSources'
import { cn } from '@/lib/utils'
import type { Dataset, DatasetField, DatasetType } from '@/types/dataset'
import type { DataSource } from '@/types'

interface DatasetEditorProps {
  datasetId?: string
  mode: 'create' | 'edit' | 'view'
  initialName?: string
  initialDisplayName?: string
  initialType?: DatasetType
}

export function DatasetEditor({ datasetId, mode, initialName, initialDisplayName, initialType }: DatasetEditorProps) {
  const router = useRouter()
  const { dataSources, loading: dataSourcesLoading } = useDataSources()
  const { dataset, loading, error, save, preview, refresh } = useDataset(datasetId)
  
  // 编辑器状态
  const [datasetType, setDatasetType] = React.useState<DatasetType>(initialType || 'table')
  const [selectedDataSource, setSelectedDataSource] = React.useState<string>('')
  const [datasetName, setDatasetName] = React.useState(initialName || '')
  const [datasetDisplayName, setDatasetDisplayName] = React.useState(initialDisplayName || '')
  const [datasetDescription, setDatasetDescription] = React.useState('')
  const [datasetCategory, setDatasetCategory] = React.useState('')
  
  // 字段相关状态
  const [fields, setFields] = React.useState<DatasetField[]>([])
  const [expandedSections, setExpandedSections] = React.useState({
    dimensions: true,
    measures: true,
    calculated: true
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
  
  // 字段管理状态
  const [fieldEditorOpen, setFieldEditorOpen] = React.useState(false)
  const [editingField, setEditingField] = React.useState<DatasetField | undefined>()
  const [fieldSearchQuery, setFieldSearchQuery] = React.useState('')
  const [selectedFields, setSelectedFields] = React.useState<Set<string>>(new Set())
  
  // 面板折叠状态
  const [collapsedSections, setCollapsedSections] = React.useState({
    basicInfo: true,
    dataSource: true
  })
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false)
  
  // 面板宽度调节
  const [leftPanelWidth, setLeftPanelWidth] = React.useState(400)
  const [isResizing, setIsResizing] = React.useState(false)
  
  // 标记是否刚刚完成保存，避免保存后重新加载覆盖本地状态
  const [justSaved, setJustSaved] = React.useState(false)
  
  // 标记用户是否正在编辑字段，避免异步字段分析覆盖用户更改
  const [isUserEditing, setIsUserEditing] = React.useState(false)

  // 处理面板宽度调节
  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    setIsResizing(true)
    e.preventDefault()
  }, [])

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      
      const newWidth = Math.min(Math.max(320, e.clientX), 600)
      setLeftPanelWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  // 跟踪数据集ID，只有当ID改变时才重新初始化
  const [lastDatasetId, setLastDatasetId] = React.useState<string>('')
  
  // 初始化数据 - 只有在数据集ID改变或刚保存后才重新初始化
  React.useEffect(() => {
    const currentDatasetId = dataset?.id || dataset?._id || ''
    const shouldInitialize = dataset && mode !== 'create' && (
      currentDatasetId !== lastDatasetId || // 数据集ID改变了
      justSaved // 或者刚保存完毕
    )
    
    if (shouldInitialize) {
      
      setDatasetType(dataset.type)
      setDatasetName(dataset.name)
      setDatasetDisplayName(dataset.displayName)
      setDatasetDescription(dataset.description || '')
      setDatasetCategory(dataset.category)
      setFields(dataset.fields || [])
      setLastDatasetId(currentDatasetId)
      
      
      if (dataset.tableConfig) {
        const datasourceId = typeof dataset.tableConfig.datasourceId === 'object' 
          ? dataset.tableConfig.datasourceId._id || dataset.tableConfig.datasourceId.id
          : dataset.tableConfig.datasourceId
        setSelectedDataSource(datasourceId.toString())
        setSelectedSchema(dataset.tableConfig.schema || '')
        setSelectedTable(dataset.tableConfig.tableName)
      } else if (dataset.sqlConfig) {
        const datasourceId = typeof dataset.sqlConfig.datasourceId === 'object'
          ? dataset.sqlConfig.datasourceId._id || dataset.sqlConfig.datasourceId.id  
          : dataset.sqlConfig.datasourceId
        setSelectedDataSource(datasourceId.toString())
        setSqlQuery(dataset.sqlConfig.sql)
      }
    }
    
    // 如果刚保存完，重置标记
    if (justSaved) {
      setJustSaved(false)
    }
  }, [dataset, mode, justSaved, lastDatasetId])

  // 处理预览
  const handlePreview = React.useCallback(async () => {
    setPreviewLoading(true)
    setPreviewError('')
    
    try {
      // 如果是编辑模式且有datasetId，获取真实预览数据
      if (mode === 'edit' && datasetId) {
        const previewResult = await preview(datasetId)
        if (previewResult && previewResult.rows && previewResult.rows.length > 0) {
          setPreviewData(previewResult.rows)
          setPreviewLoading(false)
          return
        }
      }
      
      // 否则生成模拟预览数据
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
  }, [mode, datasetId, preview, fields])

  // 在编辑模式下自动加载预览数据
  React.useEffect(() => {
    if (mode === 'edit' && dataset && !loading && fields.length > 0 && previewData.length === 0) {
      handlePreview()
    }
  }, [mode, dataset?.id, loading, fields.length, previewData.length])


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

  // 监听表选择变化，自动分析字段（仅在创建模式或用户主动更改时）
  React.useEffect(() => {
    if (selectedDataSource && selectedTable && datasetType === 'table') {
      // 在编辑模式下，只有在已经有字段数据的情况下才避免重新分析（保护用户修改）
      // 在创建模式下或字段为空时才进行自动分析
      if (mode === 'create' || fields.length === 0) {
        analyzeTableFields(selectedDataSource, selectedSchema, selectedTable)
      }
    }
  }, [selectedDataSource, selectedSchema, selectedTable, datasetType, mode, fields.length])

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
      
      
      setJustSaved(true) // 设置刚保存标记，防止重新加载覆盖本地状态
      setIsUserEditing(false) // 保存后重置用户编辑状态
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
    setIsUserEditing(true)
    setFields(prev => prev.map(field => 
      field.name === fieldName ? { ...field, ...updates } : field
    ))
    setHasUnsavedChanges(true)
  }

  // 处理字段可见性切换
  const handleFieldVisibilityToggle = (fieldName: string) => {
    setIsUserEditing(true)
    setFields(prev => prev.map(field => 
      field.name === fieldName ? { ...field, hidden: !field.hidden } : field
    ))
  }

  // 字段管理函数
  const handleEditField = (field: DatasetField) => {
    setEditingField(field)
    setFieldEditorOpen(true)
  }

  const handleDuplicateField = (field: DatasetField) => {
    const newField = {
      ...field,
      name: `${field.name}_copy`,
      displayName: `${field.displayName} (复制)`,
    }
    setEditingField(newField)
    setFieldEditorOpen(true)
  }

  const handleDeleteField = (fieldName: string) => {
    if (confirm('确定要删除这个字段吗？')) {
      setFields(prev => prev.filter(field => field.name !== fieldName))
      setSelectedFields(prev => {
        const newSet = new Set(prev)
        newSet.delete(fieldName)
        return newSet
      })
    }
  }

  const handleSaveField = (fieldData: Partial<DatasetField>) => {
    setIsUserEditing(true)
    if (editingField) {
      // 编辑现有字段
      const updatedField = { ...editingField, ...fieldData }
      
      setFields(prev => prev.map(field => 
        field.name === editingField.name ? updatedField : field
      ))
    } else {
      // 添加新字段
      const newField: DatasetField = {
        name: fieldData.name || '',
        displayName: fieldData.displayName || '',
        type: fieldData.type || 'string',
        fieldType: fieldData.fieldType || 'dimension',
        isNullable: true,
        sampleValues: [],
        ...fieldData
      }
      setFields(prev => [...prev, newField])
    }
    setEditingField(undefined)
  }

  const handleAddNewField = () => {
    setEditingField(undefined)
    setFieldEditorOpen(true)
  }

  const handleBatchHideFields = () => {
    const fieldsToHide = Array.from(selectedFields)
    setFields(prev => prev.map(field => 
      fieldsToHide.includes(field.name) ? { ...field, hidden: true } : field
    ))
    setSelectedFields(new Set())
  }

  const handleBatchShowFields = () => {
    const fieldsToShow = Array.from(selectedFields)
    setFields(prev => prev.map(field => 
      fieldsToShow.includes(field.name) ? { ...field, hidden: false } : field
    ))
    setSelectedFields(new Set())
  }

  const handleBatchDeleteFields = () => {
    if (confirm(`确定要删除选中的 ${selectedFields.size} 个字段吗？`)) {
      const fieldsToDelete = Array.from(selectedFields)
      setFields(prev => prev.filter(field => !fieldsToDelete.includes(field.name)))
      setSelectedFields(new Set())
    }
  }

  const handleFieldSelect = (fieldName: string, selected: boolean) => {
    setSelectedFields(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(fieldName)
      } else {
        newSet.delete(fieldName)
      }
      return newSet
    })
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
  const filteredFields = React.useMemo(() => {
    let result = fields
    
    
    // 搜索过滤
    if (fieldSearchQuery) {
      const query = fieldSearchQuery.toLowerCase()
      result = result.filter(f => 
        f.name.toLowerCase().includes(query) ||
        f.displayName.toLowerCase().includes(query) ||
        (f.description && f.description.toLowerCase().includes(query))
      )
    }
    
    // 隐藏字段过滤
    if (hideHiddenFields) {
      result = result.filter(f => !f.hidden)
    }
    
    return result
  }, [fields, fieldSearchQuery, hideHiddenFields])

  const dimensions = filteredFields.filter(f => f.fieldType === 'dimension')
  const measures = filteredFields.filter(f => f.fieldType === 'measure')
  const calculatedFields = filteredFields.filter(f => f.fieldType === 'calculated')

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
      <div className="h-16 bg-gradient-to-r from-white via-blue-50 to-purple-50 border-b border-gray-200 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="hover:bg-white/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">
                {mode === 'create' ? '新建数据集' : dataset?.displayName || '数据集编辑'}
                {hasUnsavedChanges && <span className="text-orange-500 ml-1">*</span>}
              </h1>
              {dataset && (
                <p className="text-xs text-gray-500">
                  {dataset.type === 'table' ? '数据表' : dataset.type === 'sql' ? 'SQL查询' : '视图'} 
                  {dataset.category && ` · ${dataset.category}`}
                </p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            disabled={previewLoading}
            className="bg-white/80 hover:bg-white border-blue-200 text-blue-700 hover:text-blue-800"
          >
            <Play className={cn("h-4 w-4 mr-2", previewLoading && "animate-spin")} />
            预览数据
          </Button>
          
          {mode !== 'view' && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className={cn(
                "bg-blue-600 hover:bg-blue-700 text-white shadow-md",
                !hasUnsavedChanges && "opacity-50"
              )}
            >
              <Save className="h-4 w-4 mr-2" />
              保存更改
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex">
        {/* 左侧配置面板 */}
        <div 
          className="bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 flex flex-col relative"
          style={{ width: leftPanelWidth }}
        >
          {/* 基本信息 - 紧凑折叠设计 */}
          <div className="border-b border-gray-200 bg-white">
            <div 
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setCollapsedSections(prev => ({ ...prev, basicInfo: !prev.basicInfo }))}
            >
              <div className="flex items-center gap-2">
                <ChevronRight className={cn("h-4 w-4 transition-transform", !collapsedSections.basicInfo && "rotate-90")} />
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h3 className="font-medium text-gray-700 text-sm">基本信息</h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{datasetDisplayName || datasetName || '未命名'}</span>
                {datasetCategory && <span>· {datasetCategory}</span>}
              </div>
            </div>
            
            {!collapsedSections.basicInfo && (
              <div className="px-3 pb-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">名称</label>
                    <Input
                      value={datasetName}
                      onChange={(e) => setDatasetName(e.target.value)}
                      placeholder="数据集名称"
                      disabled={mode === 'view'}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">显示名称</label>
                    <Input
                      value={datasetDisplayName}
                      onChange={(e) => setDatasetDisplayName(e.target.value)}
                      placeholder="显示名称"
                      disabled={mode === 'view'}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">描述</label>
                  <Input
                    value={datasetDescription}
                    onChange={(e) => setDatasetDescription(e.target.value)}
                    placeholder="数据集描述"
                    disabled={mode === 'view'}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">分类</label>
                  <Input
                    value={datasetCategory}
                    onChange={(e) => setDatasetCategory(e.target.value)}
                    placeholder="分类名称"
                    disabled={mode === 'view'}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 数据源配置 - 紧凑折叠设计 */}
          <div className="border-b border-gray-200 bg-white">
            <div 
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setCollapsedSections(prev => ({ ...prev, dataSource: !prev.dataSource }))}
            >
              <div className="flex items-center gap-2">
                <ChevronRight className={cn("h-4 w-4 transition-transform", !collapsedSections.dataSource && "rotate-90")} />
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <h3 className="font-medium text-gray-700 text-sm">数据源</h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  datasetType === 'table' ? 'bg-blue-100 text-blue-700' :
                  datasetType === 'sql' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {datasetType === 'table' ? '数据表' : datasetType === 'sql' ? 'SQL' : '未选择'}
                </span>
                {(selectedTable || selectedDataSource) && (
                  <span>
                    {selectedTable || dataSources.find(ds => ds._id === selectedDataSource)?.name || ''}
                  </span>
                )}
              </div>
            </div>
            
            {!collapsedSections.dataSource && (
              <div className="px-3 pb-3 space-y-3">
                {/* 数据集类型选择 */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">类型</label>
                  <div className="flex gap-1">
                    <Button
                      variant={datasetType === 'table' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDatasetType('table')}
                      disabled={mode === 'view'}
                      className="h-7 text-xs flex-1"
                    >
                      <Table className="h-3 w-3 mr-1" />
                      表
                    </Button>
                    <Button
                      variant={datasetType === 'sql' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDatasetType('sql')}
                      disabled={mode === 'view'}
                      className="h-7 text-xs flex-1"
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
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">数据源</label>
                    <select
                      value={selectedDataSource}
                      onChange={(e) => setSelectedDataSource(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs h-7"
                      disabled={mode === 'view'}
                    >
                      <option value="">选择数据源</option>
                      {dataSources.map(ds => (
                        <option key={ds._id} value={ds._id}>{ds.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 字段管理 - 重点展示区域 */}
          <div className="flex-1 overflow-hidden flex flex-col bg-white">
            {/* 字段管理头部 - 优化布局 */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50">
              {/* 标题行 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Type className="h-3 w-3 text-white" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 flex-shrink-0">字段管理</h3>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddNewField}
                    disabled={mode === 'view'}
                    className="h-8 px-2 text-xs hover:bg-purple-50 text-purple-700"
                    title="新增字段"
                  >
                    <Type className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setHideHiddenFields(!hideHiddenFields)}
                    className="h-8 px-2 text-xs hover:bg-gray-100"
                    title={hideHiddenFields ? "显示隐藏字段" : "隐藏已隐藏字段"}
                  >
                    {hideHiddenFields ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
              
              {/* 统计徽章行 */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                  维度 {dimensions.length}
                </span>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                  度量 {measures.length}
                </span>
                {calculatedFields.length > 0 && (
                  <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">
                    计算 {calculatedFields.length}
                  </span>
                )}
              </div>

              {/* 搜索行 */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="搜索字段..."
                    value={fieldSearchQuery}
                    onChange={(e) => setFieldSearchQuery(e.target.value)}
                    className="h-8 text-sm bg-white border-gray-200 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                {fieldSearchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFieldSearchQuery('')}
                    className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* 批量操作栏 */}
              {selectedFields.size > 0 && (
                <div className="mt-3 flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-blue-700 font-medium">
                      已选择 {selectedFields.size} 个字段
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleBatchShowFields}
                      className="h-7 px-3 text-xs hover:bg-blue-50 text-blue-600 rounded-md"
                    >
                      显示
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleBatchHideFields}
                      className="h-7 px-3 text-xs hover:bg-orange-50 text-orange-600 rounded-md"
                    >
                      隐藏
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleBatchDeleteFields}
                      className="h-7 px-3 text-xs text-red-600 hover:bg-red-50 rounded-md"
                    >
                      删除
                    </Button>
                    <div className="w-px h-4 bg-gray-300 mx-1"></div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedFields(new Set())}
                      className="h-7 w-7 p-0 text-xs hover:bg-gray-50 rounded-md"
                      title="取消选择"
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto bg-gray-50/30">
              {/* 无字段提示 */}
              {filteredFields.length === 0 && (
                <div className="flex items-center justify-center h-full p-12">
                  <div className="text-center max-w-md">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                      <Type className="h-10 w-10 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {fieldSearchQuery ? '未找到匹配字段' : '暂无字段'}
                    </h3>
                    <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                      {fieldSearchQuery ? '尝试调整搜索条件，或者清空搜索查看所有字段' : '开始添加维度和度量字段来构建您的数据集'}
                    </p>
                    {!fieldSearchQuery && mode !== 'view' && (
                      <Button 
                        onClick={handleAddNewField}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg"
                        size="lg"
                      >
                        <Type className="h-5 w-5 mr-2" />
                        创建第一个字段
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* 维度字段 */}
              {dimensions.length > 0 && (
                <div className="bg-white">
                  <div
                    className="flex items-center gap-3 px-6 py-4 cursor-pointer hover:bg-blue-50/50 transition-colors border-b border-gray-100"
                    onClick={() => setExpandedSections(prev => ({ ...prev, dimensions: !prev.dimensions }))}
                  >
                    <ChevronRight className={cn("h-5 w-5 text-gray-400 transition-transform", expandedSections.dimensions && "rotate-90")} />
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Type className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">维度字段</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{dimensions.length} 个维度 · 用于分组和筛选</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">{dimensions.length}</div>
                      <div className="text-xs text-gray-400">fields</div>
                    </div>
                  </div>
                  
                  {expandedSections.dimensions && (
                    <div className="px-4 py-2 space-y-2">
                      {dimensions.map(field => (
                        <div
                          key={field.name}
                          className={cn(
                            "group flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all duration-200",
                            field.hidden && "opacity-60 bg-gray-50",
                            selectedFields.has(field.name) && "ring-2 ring-blue-200 border-blue-300"
                          )}
                        >
                          {/* 复选框 */}
                          <input
                            type="checkbox"
                            checked={selectedFields.has(field.name)}
                            onChange={(e) => handleFieldSelect(field.name, e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          />

                          {/* 字段图标 */}
                          <div className="flex items-center gap-2">
                            <button
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                              onClick={() => handleFieldVisibilityToggle(field.name)}
                              disabled={mode === 'view'}
                              title={field.hidden ? "显示字段" : "隐藏字段"}
                            >
                              {field.hidden ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-600" />
                              )}
                            </button>
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                              {getFieldIcon(field)}
                            </div>
                          </div>

                          {/* 字段信息 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-medium text-gray-900 truncate">
                                {field.displayName || field.name}
                              </h5>
                              {field.type && (
                                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                                  {field.type}
                                </span>
                              )}
                              {field.dimensionLevel && (
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                                  {field.dimensionLevel === 'categorical' ? '分类' : 
                                   field.dimensionLevel === 'ordinal' ? '有序' : '时间'}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 font-mono mb-1">
                              {field.name}
                            </div>
                            {field.description && (
                              <div className="text-xs text-gray-400 leading-relaxed">
                                {field.description}
                              </div>
                            )}
                          </div>

                          {/* 操作按钮 */}
                          {mode !== 'view' && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <FieldTypeSelector
                                field={field}
                                onChange={(updates) => handleFieldUpdate(field.name, updates)}
                                onEdit={() => handleEditField(field)}
                                onDuplicate={() => handleDuplicateField(field)}
                                onDelete={() => handleDeleteField(field.name)}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
                </div>
              )}
              
              {/* 度量字段 */}
              {measures.length > 0 && (
                <div className="bg-white mt-4">
                  <div
                    className="flex items-center gap-3 px-6 py-4 cursor-pointer hover:bg-green-50/50 transition-colors border-b border-gray-100"
                    onClick={() => setExpandedSections(prev => ({ ...prev, measures: !prev.measures }))}
                  >
                    <ChevronRight className={cn("h-5 w-5 text-gray-400 transition-transform", expandedSections.measures && "rotate-90")} />
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                      <Hash className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">度量字段</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{measures.length} 个度量 · 用于计算和聚合</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{measures.length}</div>
                      <div className="text-xs text-gray-400">metrics</div>
                    </div>
                  </div>
                
                  {expandedSections.measures && (
                    <div className="px-4 py-2 space-y-2">
                      {measures.map(field => (
                        <div
                          key={field.name}
                          className={cn(
                            "group flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-green-200 hover:shadow-sm transition-all duration-200",
                            field.hidden && "opacity-60 bg-gray-50",
                            selectedFields.has(field.name) && "ring-2 ring-green-200 border-green-300"
                          )}
                        >
                          {/* 复选框 */}
                          <input
                            type="checkbox"
                            checked={selectedFields.has(field.name)}
                            onChange={(e) => handleFieldSelect(field.name, e.target.checked)}
                            className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                          />

                          {/* 字段图标 */}
                          <div className="flex items-center gap-2">
                            <button
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                              onClick={() => handleFieldVisibilityToggle(field.name)}
                              disabled={mode === 'view'}
                              title={field.hidden ? "显示字段" : "隐藏字段"}
                            >
                              {field.hidden ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-600" />
                              )}
                            </button>
                            <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                              {getFieldIcon(field)}
                            </div>
                          </div>

                          {/* 字段信息 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-medium text-gray-900 truncate">
                                {field.displayName || field.name}
                              </h5>
                              {field.type && (
                                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                                  {field.type}
                                </span>
                              )}
                              {field.aggregationType && (
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                                  {field.aggregationType}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 font-mono mb-1">
                              {field.name}
                            </div>
                            {field.description && (
                              <div className="text-xs text-gray-400 leading-relaxed">
                                {field.description}
                              </div>
                            )}
                          </div>

                          {/* 操作按钮 */}
                          {mode !== 'view' && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <FieldTypeSelector
                                field={field}
                                onChange={(updates) => handleFieldUpdate(field.name, updates)}
                                onEdit={() => handleEditField(field)}
                                onDuplicate={() => handleDuplicateField(field)}
                                onDelete={() => handleDeleteField(field.name)}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
                </div>
              )}

              {/* 计算字段 */}
              {calculatedFields.length > 0 && (
                <div className="bg-white mt-4">
                  <div
                    className="flex items-center gap-3 px-6 py-4 cursor-pointer hover:bg-orange-50/50 transition-colors border-b border-gray-100"
                    onClick={() => setExpandedSections(prev => ({ ...prev, calculated: !prev.calculated }))}
                  >
                    <ChevronRight className={cn("h-5 w-5 text-gray-400 transition-transform", expandedSections.calculated && "rotate-90")} />
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
                      <Calculator className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">计算字段</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{calculatedFields.length} 个计算字段 · 自定义表达式和公式</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-orange-600">{calculatedFields.length}</div>
                      <div className="text-xs text-gray-400">computed</div>
                    </div>
                  </div>
                  
                  {expandedSections.calculated && (
                    <div className="px-4 py-2 space-y-2">
                      {calculatedFields.map(field => (
                        <div
                          key={field.name}
                          className={cn(
                            "group flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-orange-200 hover:shadow-sm transition-all duration-200",
                            field.hidden && "opacity-60 bg-gray-50",
                            selectedFields.has(field.name) && "ring-2 ring-orange-200 border-orange-300"
                          )}
                        >
                          {/* 复选框 */}
                          <input
                            type="checkbox"
                            checked={selectedFields.has(field.name)}
                            onChange={(e) => handleFieldSelect(field.name, e.target.checked)}
                            className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                          />

                          {/* 字段图标 */}
                          <div className="flex items-center gap-2">
                            <button
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                              onClick={() => handleFieldVisibilityToggle(field.name)}
                              disabled={mode === 'view'}
                              title={field.hidden ? "显示字段" : "隐藏字段"}
                            >
                              {field.hidden ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-600" />
                              )}
                            </button>
                            <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg flex items-center justify-center">
                              <Calculator className="h-4 w-4 text-orange-600" />
                            </div>
                          </div>

                          {/* 字段信息 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-medium text-gray-900 truncate">
                                {field.displayName || field.name}
                              </h5>
                              {field.type && (
                                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                                  {field.type}
                                </span>
                              )}
                              <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">
                                计算字段
                              </span>
                            </div>
                            <div className="text-sm text-gray-500 font-mono mb-1">
                              {field.name}
                            </div>
                            {field.expression && (
                              <div className="text-xs text-orange-600 font-mono bg-orange-50 px-3 py-2 rounded-lg mt-2 border-l-2 border-orange-200">
                                {field.expression}
                              </div>
                            )}
                            {field.description && (
                              <div className="text-xs text-gray-400 leading-relaxed mt-2">
                                {field.description}
                              </div>
                            )}
                          </div>

                          {/* 操作按钮 */}
                          {mode !== 'view' && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <FieldTypeSelector
                                field={field}
                                onChange={(updates) => handleFieldUpdate(field.name, updates)}
                                onEdit={() => handleEditField(field)}
                                onDuplicate={() => handleDuplicateField(field)}
                                onDelete={() => handleDeleteField(field.name)}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
                </div>
              )}
            </div>
          </div>
          
          {/* 拖拽手柄 */}
          <div
            className={cn(
              "absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors z-10",
              isResizing && "bg-blue-500"
            )}
            onMouseDown={handleMouseDown}
          >
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 w-3 h-8 bg-gray-400 hover:bg-blue-500 rounded-full flex items-center justify-center opacity-60 hover:opacity-100 transition-all">
              <div className="w-1 h-4 bg-white rounded-full"></div>
            </div>
          </div>
        </div>

        {/* 右侧主内容区 */}
        <div className="flex-1 flex flex-col">
          {/* SQL编辑器（仅SQL类型显示） */}
          {datasetType === 'sql' && (
            <div className="h-2/5 border-b border-gray-200 bg-gray-900">
              <div className="h-full p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <h3 className="font-semibold text-white">SQL查询编辑器</h3>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handlePreview}
                    className="bg-green-600 text-white border-green-500 hover:bg-green-700"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    执行查询
                  </Button>
                </div>
                <div className="h-full pb-12">
                  <textarea
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    className="w-full h-full resize-none bg-gray-800 text-gray-100 border border-gray-600 rounded-lg p-4 font-mono text-sm leading-relaxed placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="-- 输入 SQL 查询语句
SELECT column1, column2 
FROM your_table 
WHERE condition = 'value';"
                    disabled={mode === 'view'}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 数据预览区 */}
          <div className="flex-1 flex flex-col">
            <div className="border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    <span className="font-semibold text-gray-800">数据预览</span>
                  </div>
                  {previewData.length > 0 && (
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                      {previewData.length} 行数据
                    </span>
                  )}
                  {previewError && (
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                      预览失败
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">
                    显示实际数据
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handlePreview}
                    disabled={previewLoading}
                    className="hover:bg-blue-50"
                  >
                    <RefreshCw className={cn("h-3 w-3 mr-1", previewLoading && "animate-spin")} />
                    刷新
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto bg-gray-50">
              {previewLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-gray-600">正在加载预览数据...</p>
                  </div>
                </div>
              ) : previewData.length > 0 ? (
                <div className="overflow-auto p-4">
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white sticky top-0">
                        <tr>
                          {Object.keys(previewData[0]).map(col => (
                            <th key={col} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {previewData.map((row, i) => (
                          <tr key={i} className={cn(
                            "transition-colors hover:bg-blue-50",
                            i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          )}>
                            {Object.values(row).map((value: any, j) => (
                              <td key={j} className="px-4 py-3 text-sm text-gray-900">
                                <div className="max-w-xs truncate">
                                  {typeof value === 'number' ? (
                                    <span className="font-mono">{value.toLocaleString()}</span>
                                  ) : (
                                    String(value)
                                  )}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Table className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">暂无预览数据</h3>
                    <p className="text-sm text-gray-500 mb-4">数据集配置完成后将自动加载预览</p>
                    <Button 
                      onClick={handlePreview}
                      disabled={previewLoading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      加载预览数据
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 字段编辑对话框 */}
      <FieldEditorDialog
        isOpen={fieldEditorOpen}
        field={editingField}
        onClose={() => {
          setFieldEditorOpen(false)
          setEditingField(undefined)
        }}
        onSave={handleSaveField}
        availableFields={fields.filter(f => f.name !== editingField?.name)}
      />
    </div>
  )
}