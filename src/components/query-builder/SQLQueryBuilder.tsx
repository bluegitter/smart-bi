'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { Plus, Minus, Play, Eye, Code, Database, FileText, RefreshCw } from 'lucide-react'
import { getAuthHeaders } from '@/lib/authUtils'
import type { 
  SQLQueryConfig, 
  SelectField, 
  TableConfig, 
  JoinConfig, 
  WhereCondition,
  OrderByConfig 
} from '@/types'

interface SchemaTable {
  name: string
  columns: { name: string, type: string, nullable?: boolean, comment?: string }[]
}

interface SchemaInfo {
  tables: SchemaTable[]
}

interface SQLQueryBuilderProps {
  initialConfig?: SQLQueryConfig
  datasourceId?: string
  tables?: { name: string, columns: { name: string, type: string }[] }[]
  onChange: (config: SQLQueryConfig) => void
  onPreview?: (config: SQLQueryConfig) => void
}

export function SQLQueryBuilder({
  initialConfig,
  datasourceId,
  tables = [],
  onChange,
  onPreview
}: SQLQueryBuilderProps) {
  const [config, setConfig] = useState<SQLQueryConfig>(
    initialConfig || {
      select: [{ field: '*' }],
      from: [{ name: '' }],
      joins: [],
      where: [],
      groupBy: [],
      having: [],
      orderBy: [],
      limit: undefined
    }
  )

  const [activeTab, setActiveTab] = useState<'select' | 'from' | 'join' | 'where' | 'group' | 'order' | 'sql'>(
    initialConfig?.customSql ? 'sql' : 'select'
  )
  const [sqlPreview, setSqlPreview] = useState<string>('')
  const [customSql, setCustomSql] = useState<string>(initialConfig?.customSql || '')
  const [useSqlMode, setUseSqlMode] = useState<boolean>(Boolean(initialConfig?.customSql))
  const [schemaInfo, setSchemaInfo] = useState<SchemaInfo>({ tables: [] })
  const [loadingSchema, setLoadingSchema] = useState<boolean>(false)

  useEffect(() => {
    if (useSqlMode) {
      // 在SQL模式下，从自定义SQL生成配置
      onChange({ ...config, customSql })
    } else {
      onChange(config)
    }
    generateSQLPreview()
  }, [config, customSql, useSqlMode])

  useEffect(() => {
    if (datasourceId) {
      loadSchemaInfo()
    }
  }, [datasourceId])

  const loadSchemaInfo = async () => {
    if (!datasourceId) return
    
    setLoadingSchema(true)
    try {
      const response = await fetch(`/api/datasources/${datasourceId}/schema`, {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        setSchemaInfo({ tables: data.tables || [] })
      }
    } catch (error) {
      console.error('Failed to load schema info:', error)
    } finally {
      setLoadingSchema(false)
    }
  }

  const getTableOptions = () => {
    return schemaInfo.tables.map(table => ({
      value: table.name,
      label: table.name,
      description: `${table.columns.length} 个字段`
    }))
  }

  const getFieldOptions = (includeTablePrefix = false) => {
    const options = [
      { value: '*', label: '*', description: '所有字段' }
    ]
    
    schemaInfo.tables.forEach(table => {
      table.columns.forEach(column => {
        const value = includeTablePrefix ? `${table.name}.${column.name}` : column.name
        options.push({
          value,
          label: column.name,
          description: `${table.name} - ${column.type}${column.comment ? ` (${column.comment})` : ''}`
        })
      })
    })
    
    return options
  }

  const generateSQLPreview = () => {
    try {
      if (useSqlMode) {
        setSqlPreview(customSql)
        return
      }
      
      // 这里可以调用SQLQueryBuilder类来生成预览SQL
      // 暂时使用简化版本
      let sql = 'SELECT '
      
      if (config.select.length > 0) {
        const selectFields = config.select.map(field => {
          let fieldStr = field.field
          if (field.aggregation) {
            fieldStr = `${field.aggregation}(${fieldStr})`
          }
          if (field.alias) {
            fieldStr += ` AS ${field.alias}`
          }
          return fieldStr
        })
        sql += selectFields.join(', ')
      } else {
        sql += '*'
      }

      if (config.from.length > 0 && config.from[0].name) {
        sql += `\nFROM ${config.from[0].name}`
        if (config.from[0].alias) {
          sql += ` AS ${config.from[0].alias}`
        }
      }

      if (config.joins.length > 0) {
        config.joins.forEach(join => {
          sql += `\n${join.type} JOIN ${join.table}`
          if (join.alias) {
            sql += ` AS ${join.alias}`
          }
          sql += ` ON ${join.condition}`
        })
      }

      if (config.where.length > 0) {
        const whereConditions = config.where.map((where, index) => {
          const logic = index > 0 ? ` ${where.logic || 'AND'}` : ''
          return `${logic} ${where.field} ${getOperatorSymbol(where.operator)} ${formatValue(where.value)}`
        }).join('')
        sql += `\nWHERE${whereConditions}`
      }

      if (config.groupBy.length > 0) {
        sql += `\nGROUP BY ${config.groupBy.join(', ')}`
      }

      if (config.having.length > 0) {
        const havingConditions = config.having.map((having, index) => {
          const logic = index > 0 ? ` ${having.logic || 'AND'}` : ''
          return `${logic} ${having.field} ${getOperatorSymbol(having.operator)} ${formatValue(having.value)}`
        }).join('')
        sql += `\nHAVING${havingConditions}`
      }

      if (config.orderBy.length > 0) {
        const orderFields = config.orderBy.map(order => `${order.field} ${order.direction}`)
        sql += `\nORDER BY ${orderFields.join(', ')}`
      }

      if (config.limit) {
        sql += `\nLIMIT ${config.limit}`
      }

      setSqlPreview(sql)
    } catch (error) {
      setSqlPreview('SQL生成错误')
    }
  }

  const getOperatorSymbol = (operator: string): string => {
    const symbols: Record<string, string> = {
      eq: '=',
      ne: '!=',
      gt: '>',
      gte: '>=',
      lt: '<',
      lte: '<=',
      like: 'LIKE',
      in: 'IN',
      between: 'BETWEEN'
    }
    return symbols[operator] || '='
  }

  const formatValue = (value: any): string => {
    if (typeof value === 'string') return `'${value}'`
    if (Array.isArray(value)) return `(${value.map(v => formatValue(v)).join(', ')})`
    return String(value)
  }

  const updateConfig = (key: keyof SQLQueryConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const addSelectField = () => {
    updateConfig('select', [...config.select, { field: '' }])
  }

  const updateSelectField = (index: number, field: Partial<SelectField>) => {
    const newSelect = [...config.select]
    newSelect[index] = { ...newSelect[index], ...field }
    updateConfig('select', newSelect)
  }

  const removeSelectField = (index: number) => {
    updateConfig('select', config.select.filter((_, i) => i !== index))
  }

  const addJoin = () => {
    updateConfig('joins', [
      ...config.joins,
      { type: 'INNER' as const, table: '', condition: '' }
    ])
  }

  const updateJoin = (index: number, join: Partial<JoinConfig>) => {
    const newJoins = [...config.joins]
    newJoins[index] = { ...newJoins[index], ...join }
    updateConfig('joins', newJoins)
  }

  const removeJoin = (index: number) => {
    updateConfig('joins', config.joins.filter((_, i) => i !== index))
  }

  const addWhereCondition = () => {
    updateConfig('where', [
      ...config.where,
      { field: '', operator: 'eq' as const, value: '', logic: 'AND' as const }
    ])
  }

  const updateWhereCondition = (index: number, condition: Partial<WhereCondition>) => {
    const newWhere = [...config.where]
    newWhere[index] = { ...newWhere[index], ...condition }
    updateConfig('where', newWhere)
  }

  const removeWhereCondition = (index: number) => {
    updateConfig('where', config.where.filter((_, i) => i !== index))
  }

  const addOrderBy = () => {
    updateConfig('orderBy', [
      ...config.orderBy,
      { field: '', direction: 'ASC' as const }
    ])
  }

  const updateOrderBy = (index: number, order: Partial<OrderByConfig>) => {
    const newOrderBy = [...config.orderBy]
    newOrderBy[index] = { ...newOrderBy[index], ...order }
    updateConfig('orderBy', newOrderBy)
  }

  const removeOrderBy = (index: number) => {
    updateConfig('orderBy', config.orderBy.filter((_, i) => i !== index))
  }

  const renderSelectTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">SELECT 字段</h3>
        <Button size="sm" onClick={addSelectField}>
          <Plus className="h-4 w-4 mr-1" />
          添加字段
        </Button>
      </div>
      
      {config.select.map((field, index) => (
        <Card key={index} className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">字段名</label>
              <SearchableSelect
                value={field.field}
                onChange={(value) => updateSelectField(index, { field: value })}
                options={getFieldOptions(true)}
                placeholder="选择字段或输入字段名"
                allowCustomValue={true}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">聚合函数</label>
              <select
                value={field.aggregation || ''}
                onChange={(e) => updateSelectField(index, { 
                  aggregation: e.target.value as any || undefined 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">无</option>
                <option value="SUM">SUM</option>
                <option value="AVG">AVG</option>
                <option value="COUNT">COUNT</option>
                <option value="MAX">MAX</option>
                <option value="MIN">MIN</option>
                <option value="DISTINCT">DISTINCT</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">别名</label>
              <Input
                value={field.alias || ''}
                onChange={(e) => updateSelectField(index, { alias: e.target.value })}
                placeholder="别名（可选）"
              />
            </div>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => removeSelectField(index)}
              disabled={config.select.length === 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )

  const renderFromTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">FROM 表</h3>
      
      {config.from.map((table, index) => (
        <Card key={index} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">表名</label>
              <SearchableSelect
                value={table.name}
                onChange={(value) => {
                  const newFrom = [...config.from]
                  newFrom[index] = { ...newFrom[index], name: value }
                  updateConfig('from', newFrom)
                }}
                options={getTableOptions()}
                placeholder="选择表或输入表名"
                allowCustomValue={true}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">架构（可选）</label>
              <Input
                value={table.schema || ''}
                onChange={(e) => {
                  const newFrom = [...config.from]
                  newFrom[index] = { ...newFrom[index], schema: e.target.value }
                  updateConfig('from', newFrom)
                }}
                placeholder="架构名"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">别名（可选）</label>
              <Input
                value={table.alias || ''}
                onChange={(e) => {
                  const newFrom = [...config.from]
                  newFrom[index] = { ...newFrom[index], alias: e.target.value }
                  updateConfig('from', newFrom)
                }}
                placeholder="表别名"
              />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )

  const renderJoinTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">JOIN 连接</h3>
        <Button size="sm" onClick={addJoin}>
          <Plus className="h-4 w-4 mr-1" />
          添加连接
        </Button>
      </div>
      
      {config.joins.map((join, index) => (
        <Card key={index} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">连接类型</label>
              <select
                value={join.type}
                onChange={(e) => updateJoin(index, { type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="INNER">INNER JOIN</option>
                <option value="LEFT">LEFT JOIN</option>
                <option value="RIGHT">RIGHT JOIN</option>
                <option value="FULL">FULL JOIN</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">表名</label>
              <SearchableSelect
                value={join.table}
                onChange={(value) => updateJoin(index, { table: value })}
                options={getTableOptions()}
                placeholder="选择表或输入表名"
                allowCustomValue={true}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">别名（可选）</label>
              <Input
                value={join.alias || ''}
                onChange={(e) => updateJoin(index, { alias: e.target.value })}
                placeholder="别名"
              />
            </div>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => removeJoin(index)}
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">ON 条件</label>
            <Input
              value={join.condition}
              onChange={(e) => updateJoin(index, { condition: e.target.value })}
              placeholder="连接条件，如: t1.id = t2.user_id"
            />
          </div>
        </Card>
      ))}
    </div>
  )

  const renderWhereTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">WHERE 条件</h3>
        <Button size="sm" onClick={addWhereCondition}>
          <Plus className="h-4 w-4 mr-1" />
          添加条件
        </Button>
      </div>
      
      {config.where.map((condition, index) => (
        <Card key={index} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            {index > 0 && (
              <div>
                <label className="block text-sm font-medium mb-1">逻辑连接</label>
                <select
                  value={condition.logic}
                  onChange={(e) => updateWhereCondition(index, { logic: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="AND">AND</option>
                  <option value="OR">OR</option>
                </select>
              </div>
            )}
            
            <div className={index === 0 ? 'md:col-start-1' : ''}>
              <label className="block text-sm font-medium mb-1">字段</label>
              <SearchableSelect
                value={condition.field}
                onChange={(value) => updateWhereCondition(index, { field: value })}
                options={getFieldOptions(true)}
                placeholder="选择字段或输入字段名"
                allowCustomValue={true}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">操作符</label>
              <select
                value={condition.operator}
                onChange={(e) => updateWhereCondition(index, { operator: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="eq">=</option>
                <option value="ne">!=</option>
                <option value="gt">&gt;</option>
                <option value="gte">&gt;=</option>
                <option value="lt">&lt;</option>
                <option value="lte">&lt;=</option>
                <option value="like">LIKE</option>
                <option value="in">IN</option>
                <option value="between">BETWEEN</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">值</label>
              <Input
                value={condition.value}
                onChange={(e) => updateWhereCondition(index, { value: e.target.value })}
                placeholder="值"
              />
            </div>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => removeWhereCondition(index)}
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )

  const renderGroupTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">GROUP BY & ORDER BY</h3>
      
      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">GROUP BY 字段</label>
            <Input
              value={config.groupBy.join(', ')}
              onChange={(e) => updateConfig('groupBy', 
                e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              )}
              placeholder="字段名，用逗号分隔"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">LIMIT 限制</label>
            <Input
              type="number"
              value={config.limit || ''}
              onChange={(e) => updateConfig('limit', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="返回记录数限制"
              min="1"
            />
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <h4 className="text-md font-medium">ORDER BY 排序</h4>
        <Button size="sm" onClick={addOrderBy}>
          <Plus className="h-4 w-4 mr-1" />
          添加排序
        </Button>
      </div>
      
      {config.orderBy.map((order, index) => (
        <Card key={index} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">字段</label>
              <SearchableSelect
                value={order.field}
                onChange={(value) => updateOrderBy(index, { field: value })}
                options={getFieldOptions(true)}
                placeholder="选择字段或输入字段名"
                allowCustomValue={true}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">排序方向</label>
              <select
                value={order.direction}
                onChange={(e) => updateOrderBy(index, { direction: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ASC">升序 (ASC)</option>
                <option value="DESC">降序 (DESC)</option>
              </select>
            </div>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => removeOrderBy(index)}
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )

  const renderSqlTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">自定义 SQL</h3>
        <div className="flex items-center space-x-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadSchemaInfo()}
            disabled={loadingSchema}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loadingSchema ? 'animate-spin' : ''}`} />
            刷新表结构
          </Button>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={useSqlMode}
              onChange={(e) => setUseSqlMode(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">使用 SQL 模式</span>
          </label>
        </div>
      </div>
      
      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">SQL 语句</label>
            <textarea
              value={customSql}
              onChange={(e) => setCustomSql(e.target.value)}
              className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="在这里输入您的 SQL 查询..."
              disabled={!useSqlMode}
            />
          </div>
          
          {!useSqlMode && (
            <div className="text-sm text-gray-500">
              启用 SQL 模式以直接编写和使用自定义 SQL 查询
            </div>
          )}
        </div>
      </Card>

      {/* 表结构信息面板 */}
      <Card className="p-4">
        <h4 className="text-md font-medium mb-3 flex items-center">
          <Database className="h-4 w-4 mr-2" />
          表结构
        </h4>
        
        {loadingSchema ? (
          <div className="text-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500">加载表结构中...</p>
          </div>
        ) : schemaInfo.tables.length > 0 ? (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {schemaInfo.tables.map(table => (
              <div key={table.name} className="border border-gray-200 rounded-lg">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                  <h5 className="font-medium text-sm">{table.name}</h5>
                </div>
                <div className="p-3">
                  <div className="grid grid-cols-1 gap-1 text-sm">
                    {table.columns.map(column => (
                      <div key={`${table.name}.${column.name}`} className="flex justify-between items-center">
                        <span className="font-mono text-blue-600">{column.name}</span>
                        <span className="text-gray-500">{column.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            {datasourceId ? '无法获取表结构信息' : '请先选择数据源'}
          </div>
        )}
      </Card>
    </div>
  )

  return (
    <div className="h-full flex flex-col">
      {/* 标签页 */}
      <div className="flex border-b border-gray-200 mb-6">
        {[
          { key: 'select', label: 'SELECT', icon: Database },
          { key: 'from', label: 'FROM', icon: Database },
          { key: 'join', label: 'JOIN', icon: Database },
          { key: 'where', label: 'WHERE', icon: Database },
          { key: 'group', label: 'GROUP/ORDER', icon: Database },
          { key: 'sql', label: 'SQL 编写', icon: FileText }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`px-4 py-2 flex items-center space-x-2 border-b-2 font-medium text-sm ${
              activeTab === key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6">
        {/* 左侧配置面板 */}
        <div className={`${activeTab === 'sql' ? 'w-full' : 'lg:w-2/3'} space-y-6`}>
          {activeTab === 'select' && renderSelectTab()}
          {activeTab === 'from' && renderFromTab()}
          {activeTab === 'join' && renderJoinTab()}
          {activeTab === 'where' && renderWhereTab()}
          {activeTab === 'group' && renderGroupTab()}
          {activeTab === 'sql' && renderSqlTab()}
        </div>

        {/* 右侧SQL预览面板 */}
        {activeTab !== 'sql' && (
          <div className="lg:w-1/3">
            <Card className="p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium flex items-center">
                <Code className="h-5 w-5 mr-2" />
                SQL 预览
              </h3>
              {onPreview && (
                <Button size="sm" onClick={() => {
                  const previewConfig = useSqlMode 
                    ? { ...config, customSql }
                    : config
                  onPreview(previewConfig)
                }}>
                  <Eye className="h-4 w-4 mr-1" />
                  预览数据
                </Button>
              )}
            </div>
            
            <div className="bg-gray-900 text-gray-100 p-4 rounded-md font-mono text-sm whitespace-pre-wrap overflow-auto max-h-96">
              {sqlPreview || '// SQL预览将在这里显示'}
            </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}