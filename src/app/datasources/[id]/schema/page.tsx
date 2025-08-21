'use client'

import React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Database, Table, Key, Search, Eye, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ConnectionTester } from '@/components/datasource/ConnectionTester'

// 模拟数据源和表结构数据
const mockDataSource = {
  id: '1',
  name: 'MySQL 生产环境',
  type: 'mysql',
  status: 'connected',
  config: {
    host: 'prod-mysql.example.com',
    port: 3306,
    database: 'production_db',
    username: 'admin'
  }
}

const mockTables = [
  {
    name: 'users',
    comment: '用户表',
    rowCount: 125430,
    columns: [
      { name: 'id', type: 'bigint', nullable: false, key: 'PRIMARY', comment: '用户ID' },
      { name: 'username', type: 'varchar(50)', nullable: false, key: 'UNI', comment: '用户名' },
      { name: 'email', type: 'varchar(100)', nullable: false, key: 'UNI', comment: '邮箱' },
      { name: 'password_hash', type: 'varchar(255)', nullable: false, key: '', comment: '密码哈希' },
      { name: 'full_name', type: 'varchar(100)', nullable: true, key: '', comment: '姓名' },
      { name: 'phone', type: 'varchar(20)', nullable: true, key: '', comment: '电话' },
      { name: 'status', type: 'enum', nullable: false, key: '', comment: '状态' },
      { name: 'created_at', type: 'timestamp', nullable: false, key: '', comment: '创建时间' },
      { name: 'updated_at', type: 'timestamp', nullable: false, key: '', comment: '更新时间' }
    ]
  },
  {
    name: 'orders',
    comment: '订单表',
    rowCount: 89234,
    columns: [
      { name: 'id', type: 'bigint', nullable: false, key: 'PRIMARY', comment: '订单ID' },
      { name: 'user_id', type: 'bigint', nullable: false, key: 'MUL', comment: '用户ID' },
      { name: 'order_number', type: 'varchar(32)', nullable: false, key: 'UNI', comment: '订单号' },
      { name: 'total_amount', type: 'decimal(10,2)', nullable: false, key: '', comment: '订单金额' },
      { name: 'status', type: 'enum', nullable: false, key: '', comment: '订单状态' },
      { name: 'payment_method', type: 'varchar(20)', nullable: true, key: '', comment: '支付方式' },
      { name: 'shipping_address', type: 'text', nullable: true, key: '', comment: '配送地址' },
      { name: 'created_at', type: 'timestamp', nullable: false, key: '', comment: '创建时间' },
      { name: 'updated_at', type: 'timestamp', nullable: false, key: '', comment: '更新时间' }
    ]
  },
  {
    name: 'products',
    comment: '产品表',
    rowCount: 5678,
    columns: [
      { name: 'id', type: 'bigint', nullable: false, key: 'PRIMARY', comment: '产品ID' },
      { name: 'sku', type: 'varchar(50)', nullable: false, key: 'UNI', comment: 'SKU编码' },
      { name: 'name', type: 'varchar(200)', nullable: false, key: '', comment: '产品名称' },
      { name: 'description', type: 'text', nullable: true, key: '', comment: '产品描述' },
      { name: 'category_id', type: 'bigint', nullable: false, key: 'MUL', comment: '分类ID' },
      { name: 'price', type: 'decimal(10,2)', nullable: false, key: '', comment: '价格' },
      { name: 'stock_quantity', type: 'int', nullable: false, key: '', comment: '库存数量' },
      { name: 'status', type: 'enum', nullable: false, key: '', comment: '产品状态' },
      { name: 'created_at', type: 'timestamp', nullable: false, key: '', comment: '创建时间' },
      { name: 'updated_at', type: 'timestamp', nullable: false, key: '', comment: '更新时间' }
    ]
  },
  {
    name: 'order_items',
    comment: '订单明细表',
    rowCount: 234567,
    columns: [
      { name: 'id', type: 'bigint', nullable: false, key: 'PRIMARY', comment: '明细ID' },
      { name: 'order_id', type: 'bigint', nullable: false, key: 'MUL', comment: '订单ID' },
      { name: 'product_id', type: 'bigint', nullable: false, key: 'MUL', comment: '产品ID' },
      { name: 'quantity', type: 'int', nullable: false, key: '', comment: '数量' },
      { name: 'unit_price', type: 'decimal(10,2)', nullable: false, key: '', comment: '单价' },
      { name: 'total_price', type: 'decimal(10,2)', nullable: false, key: '', comment: '小计' },
      { name: 'created_at', type: 'timestamp', nullable: false, key: '', comment: '创建时间' }
    ]
  }
]

export default function DataSourceSchemaPage() {
  const router = useRouter()
  const params = useParams()
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedTable, setSelectedTable] = React.useState<string | null>(null)
  const [showConnectionTester, setShowConnectionTester] = React.useState(false)

  const filteredTables = mockTables.filter(table =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    table.comment.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedTableData = selectedTable 
    ? mockTables.find(t => t.name === selectedTable)
    : null

  const handleRefreshSchema = () => {
    console.log('Refreshing schema for datasource:', params.id)
    // TODO: 实现刷新数据库结构的逻辑
  }

  const getKeyTypeIcon = (keyType: string) => {
    if (keyType === 'PRIMARY') return <Key className="h-3 w-3 text-yellow-600" />
    if (keyType === 'UNI') return <Key className="h-3 w-3 text-blue-600" />
    if (keyType === 'MUL') return <Key className="h-3 w-3 text-green-600" />
    return null
  }

  const getKeyTypeLabel = (keyType: string) => {
    if (keyType === 'PRIMARY') return '主键'
    if (keyType === 'UNI') return '唯一键'
    if (keyType === 'MUL') return '外键'
    return ''
  }

  return (
    <div className="flex-1 p-6">
      {/* 页面头部 */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">数据源结构</h1>
            <p className="text-slate-500">{mockDataSource.name} - 数据表和字段信息</p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              placeholder="搜索数据表..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          <Button
            variant="outline"
            onClick={handleRefreshSchema}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            刷新结构
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowConnectionTester(!showConnectionTester)}
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            连接测试
          </Button>
          <Button
            onClick={() => router.push(`/datasources/${params.id}/query`)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            查询数据
          </Button>
        </div>
      </div>

      {/* 连接测试器 */}
      {showConnectionTester && (
        <div className="mb-6">
          <ConnectionTester
            dataSource={mockDataSource}
            onTestComplete={(result) => console.log('Test result:', result)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 数据表列表 */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table className="h-5 w-5" />
                数据表 ({filteredTables.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {filteredTables.map((table) => (
                  <div
                    key={table.name}
                    className={`p-3 border-b border-slate-100 cursor-pointer transition-colors hover:bg-slate-50 ${
                      selectedTable === table.name ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => setSelectedTable(table.name)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{table.name}</div>
                        <div className="text-xs text-slate-500">{table.comment}</div>
                      </div>
                      <div className="text-xs text-slate-400">
                        {table.rowCount.toLocaleString()} 行
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 表结构详情 */}
        <div className="lg:col-span-2">
          {selectedTableData ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Table className="h-5 w-5" />
                      {selectedTableData.name}
                    </CardTitle>
                    <p className="text-sm text-slate-500 mt-1">
                      {selectedTableData.comment} • {selectedTableData.rowCount.toLocaleString()} 行 • {selectedTableData.columns.length} 个字段
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/datasources/${params.id}/query?table=${selectedTableData.name}`)}
                  >
                    查询此表
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">字段名</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">数据类型</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">键类型</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">可空</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">备注</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedTableData.columns.map((column) => (
                        <tr key={column.name} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{column.name}</span>
                              {column.key && getKeyTypeIcon(column.key)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-mono bg-slate-100 px-2 py-1 rounded text-slate-700">
                              {column.type}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {column.key && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {getKeyTypeLabel(column.key)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded ${
                              column.nullable 
                                ? 'bg-yellow-100 text-yellow-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {column.nullable ? '可空' : '不可空'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-slate-600">{column.comment}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Table className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="font-medium text-slate-600 mb-2">选择一个数据表</h3>
                <p className="text-sm text-slate-500">
                  从左侧列表中选择一个数据表查看其结构信息
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}