'use client'

import React from 'react'
import { Database, Table } from 'lucide-react'
import { CustomSelect, type SelectItem } from '@/components/ui/CustomSelect'
import type { DataSource } from '@/types'

interface TableSelectorProps {
  dataSources: DataSource[]
  selectedDataSource: string
  selectedSchema: string
  selectedTable: string
  onDataSourceChange: (datasourceId: string) => void
  onSchemaChange: (schema: string) => void
  onTableChange: (table: string) => void
  disabled?: boolean
}

interface TableInfo {
  name: string
  displayName: string
  schema: string
  comment?: string
}

export function TableSelector({
  dataSources,
  selectedDataSource,
  selectedSchema,
  selectedTable,
  onDataSourceChange,
  onSchemaChange,
  onTableChange,
  disabled = false
}: TableSelectorProps) {
  const [schemas, setSchemas] = React.useState<string[]>([])
  const [tables, setTables] = React.useState<TableInfo[]>([])
  const [loadingSchemas, setLoadingSchemas] = React.useState(false)
  const [loadingTables, setLoadingTables] = React.useState(false)

  // 获取数据源的模式列表
  const fetchSchemas = React.useCallback(async (datasourceId: string) => {
    if (!datasourceId) {
      setSchemas([])
      setTables([])
      return
    }

    setLoadingSchemas(true)
    try {
      const response = await fetch(`/api/datasources/${datasourceId}/schema`)
      if (response.ok) {
        const data = await response.json()
        // API返回的是 { tables: [...] } 结构
        const schemaNames = (data.tables || [])
          .map((t: any) => t.schema)
          .filter((s: string, i: number, arr: string[]) => s && arr.indexOf(s) === i)
          .sort()
        
        setSchemas(schemaNames.length > 0 ? schemaNames : [''])
        
        // 如果只有一个schema或没有schema，自动选择
        if (schemaNames.length <= 1) {
          onSchemaChange(schemaNames[0] || '')
        }
      }
    } catch (error) {
      console.error('获取模式列表失败:', error)
      setSchemas([])
    } finally {
      setLoadingSchemas(false)
    }
  }, [onSchemaChange])

  // 获取指定模式的表列表
  const fetchTables = React.useCallback(async (datasourceId: string, schema: string) => {
    if (!datasourceId) {
      setTables([])
      return
    }

    setLoadingTables(true)
    try {
      const response = await fetch(`/api/datasources/${datasourceId}/schema`)
      if (response.ok) {
        const data = await response.json()
        // API返回的是 { tables: [...] } 结构
        const tableList = (data.tables || [])
          .filter((t: any) => !schema || t.schema === schema || (!t.schema && !schema))
          .map((t: any) => ({
            name: t.name,
            displayName: t.displayName || t.name,
            schema: t.schema,
            comment: t.comment
          }))
          .sort((a: TableInfo, b: TableInfo) => a.name.localeCompare(b.name))
        
        setTables(tableList)
      }
    } catch (error) {
      console.error('获取表列表失败:', error)
      setTables([])
    } finally {
      setLoadingTables(false)
    }
  }, [])

  // 数据源变化时获取模式
  React.useEffect(() => {
    if (selectedDataSource) {
      fetchSchemas(selectedDataSource)
    } else {
      setSchemas([])
      setTables([])
    }
  }, [selectedDataSource, fetchSchemas])

  // 模式变化时获取表
  React.useEffect(() => {
    if (selectedDataSource && selectedSchema !== undefined) {
      fetchTables(selectedDataSource, selectedSchema)
    } else {
      setTables([])
    }
  }, [selectedDataSource, selectedSchema, fetchTables])

  const selectedDataSourceObj = dataSources.find(ds => ds._id === selectedDataSource)

  // 构建数据源选项
  const dataSourceItems: SelectItem[] = dataSources.map(ds => ({
    id: ds._id,
    name: ds.name,
    displayName: `${ds.name}`,
    type: ds.type,
    icon: Database
  }))

  // 构建模式选项
  const schemaItems: SelectItem[] = schemas.map(schema => ({
    id: schema,
    name: schema,
    displayName: schema || '默认模式',
    icon: Database
  }))

  // 构建表选项
  const tableItems: SelectItem[] = tables.map(table => ({
    id: table.name,
    name: table.name,
    displayName: table.displayName,
    icon: Table
  }))

  return (
    <div className="space-y-3">
      {/* 数据源选择 */}
      <div>
        <label className="text-sm text-gray-600 mb-1 block">选择数据源</label>
        <CustomSelect
          items={dataSourceItems}
          value={selectedDataSource}
          onValueChange={onDataSourceChange}
          placeholder="请选择数据源"
          disabled={disabled}
        />
      </div>

      {/* 模式选择 */}
      {selectedDataSource && schemas.length > 1 && (
        <div>
          <label className="text-sm text-gray-600 mb-1 block">选择模式</label>
          <CustomSelect
            items={schemaItems}
            value={selectedSchema}
            onValueChange={onSchemaChange}
            placeholder="请选择模式"
            loading={loadingSchemas}
            disabled={disabled}
          />
        </div>
      )}

      {/* 表选择 */}
      {selectedDataSource && (
        <div>
          <label className="text-sm text-gray-600 mb-1 block">选择数据表</label>
          {tables.length > 0 || loadingTables ? (
            <CustomSelect
              items={tableItems}
              value={selectedTable}
              onValueChange={onTableChange}
              placeholder="请选择表"
              loading={loadingTables}
              disabled={disabled}
            />
          ) : (
            <div className="p-3 text-sm text-gray-500 border border-gray-300 rounded-md bg-gray-50">
              {selectedDataSource ? '该数据源暂无可用表' : '请先选择数据源'}
            </div>
          )}
        </div>
      )}

      {/* 选中信息显示 */}
      {selectedDataSourceObj && selectedTable && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Table className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-blue-900 mb-1">已选择</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <div>数据源: {selectedDataSourceObj.name}</div>
                {selectedSchema && <div>模式: {selectedSchema}</div>}
                <div>数据表: {selectedTable}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}