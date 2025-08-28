'use client'

import React from 'react'
import { Database, Table, Eye } from 'lucide-react'
import { CustomSelect, type SelectItem } from '@/components/ui/CustomSelect'
import { getAuthHeaders } from '@/lib/authUtils'
import type { DataSource } from '@/types'

interface TableSelectorProps {
  dataSources: DataSource[]
  selectedDataSource: string
  selectedSchema: string
  selectedTable: string
  onDataSourceChange: (datasourceId: string) => void
  onSchemaChange: (schema: string) => void
  onTableChange: (table: string, tableInfo?: TableInfo) => void
  disabled?: boolean
}

interface TableInfo {
  name: string
  displayName: string
  schema: string
  comment?: string
  type?: 'table' | 'view'
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
  const [allTables, setAllTables] = React.useState<TableInfo[]>([])
  const [loading, setLoading] = React.useState(false)

  // 获取数据源的完整schema信息（只调用一次API）
  const fetchDataSourceSchema = React.useCallback(async (datasourceId: string) => {
    if (!datasourceId) {
      setSchemas([])
      setTables([])
      setAllTables([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/datasources/${datasourceId}/schema`, {
        method: 'POST',
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        const allTablesData = (data.tables || []).map((t: any) => ({
          name: t.name,
          displayName: t.displayName || t.name,
          schema: t.schema,
          comment: t.comment,
          type: t.type || 'table'
        }))
        
        setAllTables(allTablesData)
        
        // 提取唯一的schema列表
        const schemaNames = allTablesData
          .map((t: TableInfo) => t.schema)
          .filter((s: string, i: number, arr: string[]) => s && arr.indexOf(s) === i)
          .sort()
        
        setSchemas(schemaNames.length > 0 ? schemaNames : [''])
        
        // 如果只有一个schema或没有schema，自动选择并过滤表
        if (schemaNames.length <= 1) {
          const selectedSchemaName = schemaNames[0] || ''
          onSchemaChange(selectedSchemaName)
          filterTablesBySchema(allTablesData, selectedSchemaName)
        }
      }
    } catch (error) {
      console.error('获取数据源schema失败:', error)
      setSchemas([])
      setTables([])
      setAllTables([])
    } finally {
      setLoading(false)
    }
  }, [onSchemaChange])

  // 根据选择的schema过滤表列表
  const filterTablesBySchema = React.useCallback((tablesData: TableInfo[], schema: string) => {
    const filteredTables = tablesData
      .filter((t: TableInfo) => !schema || t.schema === schema || (!t.schema && !schema))
      .sort((a: TableInfo, b: TableInfo) => {
        // 先按类型排序（表在前，视图在后），再按名称排序
        if (a.type !== b.type) {
          return a.type === 'table' ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })
    
    setTables(filteredTables)
  }, [])

  // 数据源变化时获取完整schema信息
  React.useEffect(() => {
    if (selectedDataSource) {
      fetchDataSourceSchema(selectedDataSource)
    } else {
      setSchemas([])
      setTables([])
      setAllTables([])
    }
  }, [selectedDataSource, fetchDataSourceSchema])

  // 模式变化时过滤表列表
  React.useEffect(() => {
    if (allTables.length > 0 && selectedSchema !== undefined) {
      filterTablesBySchema(allTables, selectedSchema)
    }
  }, [selectedSchema, allTables, filterTablesBySchema])


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
    type: table.type === 'view' ? '视图' : '表',
    icon: table.type === 'view' ? Eye : Table
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
            loading={loading}
            disabled={disabled}
          />
        </div>
      )}

      {/* 表选择 */}
      {selectedDataSource && (
        <div>
          <label className="text-sm text-gray-600 mb-1 block">选择数据表</label>
          {tables.length > 0 || loading ? (
            <CustomSelect
              items={tableItems}
              value={selectedTable}
              onValueChange={(tableName) => {
                const tableInfo = tables.find(t => t.name === tableName)
                onTableChange(tableName, tableInfo)
              }}
              placeholder="请选择表"
              loading={loading}
              disabled={disabled}
            />
          ) : (
            <div className="p-3 text-sm text-gray-500 border border-gray-300 rounded-md bg-gray-50">
              {selectedDataSource ? '该数据源暂无可用表' : '请先选择数据源'}
            </div>
          )}
        </div>
      )}

    </div>
  )
}