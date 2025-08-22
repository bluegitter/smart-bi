'use client'

import React from 'react'
import { Database, Table, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
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
  const [tables, setTables] = React.useState<string[]>([])
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
        const tableNames = (data.tables || [])
          .filter((t: any) => !schema || t.schema === schema || (!t.schema && !schema))
          .map((t: any) => t.name)
          .sort()
        
        setTables(tableNames)
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

  return (
    <div className="space-y-3">
      {/* 数据源选择 */}
      <div>
        <label className="text-sm text-gray-600 mb-1 block">选择数据源</label>
        <select
          value={selectedDataSource}
          onChange={(e) => onDataSourceChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={disabled}
        >
          <option value="">请选择数据源</option>
          {dataSources.map(ds => (
            <option key={ds._id} value={ds._id}>
              <div className="flex items-center gap-2">
                {ds.name} ({ds.type})
              </div>
            </option>
          ))}
        </select>
      </div>

      {/* 模式选择 */}
      {selectedDataSource && schemas.length > 1 && (
        <div>
          <label className="text-sm text-gray-600 mb-1 block">选择模式</label>
          {loadingSchemas ? (
            <div className="flex items-center gap-2 p-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              加载模式中...
            </div>
          ) : (
            <select
              value={selectedSchema}
              onChange={(e) => onSchemaChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={disabled}
            >
              <option value="">请选择模式</option>
              {schemas.map(schema => (
                <option key={schema} value={schema}>
                  {schema || '(默认模式)'}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* 表选择 */}
      {selectedDataSource && (
        <div>
          <label className="text-sm text-gray-600 mb-1 block">选择数据表</label>
          {loadingTables ? (
            <div className="flex items-center gap-2 p-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              加载表列表中...
            </div>
          ) : tables.length > 0 ? (
            <select
              value={selectedTable}
              onChange={(e) => onTableChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={disabled}
            >
              <option value="">请选择表</option>
              {tables.map(table => (
                <option key={table} value={table}>
                  {table}
                </option>
              ))}
            </select>
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