'use client'

import React from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { ArrowLeft, Play, Download, Save, History, Table, Code, Eye, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

// 模拟数据源信息
const mockDataSource = {
  id: '1',
  name: 'MySQL 生产环境',
  type: 'mysql',
  database: 'production_db'
}

// 模拟查询历史
const mockQueryHistory = [
  {
    id: '1',
    query: 'SELECT * FROM users WHERE status = "active" LIMIT 10',
    executedAt: '2024-01-15 14:30:25',
    executionTime: 125,
    rowCount: 10
  },
  {
    id: '2', 
    query: 'SELECT COUNT(*) as total_orders, SUM(total_amount) as revenue FROM orders WHERE DATE(created_at) = CURDATE()',
    executedAt: '2024-01-15 14:25:15',
    executionTime: 89,
    rowCount: 1
  },
  {
    id: '3',
    query: 'SELECT p.name, SUM(oi.quantity) as sold_quantity FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.id ORDER BY sold_quantity DESC LIMIT 5',
    executedAt: '2024-01-15 14:20:10',
    executionTime: 234,
    rowCount: 5
  }
]

// 模拟查询结果
const mockQueryResult = {
  columns: ['id', 'username', 'email', 'full_name', 'status', 'created_at'],
  rows: [
    ['1', 'john_doe', 'john@example.com', 'John Doe', 'active', '2024-01-10 10:30:00'],
    ['2', 'jane_smith', 'jane@example.com', 'Jane Smith', 'active', '2024-01-11 11:45:00'],
    ['3', 'bob_wilson', 'bob@example.com', 'Bob Wilson', 'active', '2024-01-12 09:15:00'],
    ['4', 'alice_brown', 'alice@example.com', 'Alice Brown', 'active', '2024-01-13 16:20:00'],
    ['5', 'charlie_davis', 'charlie@example.com', 'Charlie Davis', 'active', '2024-01-14 08:50:00']
  ],
  executionTime: 156,
  totalRows: 5
}

export default function DataQueryPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const tableParam = searchParams.get('table')

  const [query, setQuery] = React.useState(
    tableParam ? `SELECT * FROM ${tableParam} LIMIT 10` : ''
  )
  const [queryResult, setQueryResult] = React.useState<typeof mockQueryResult | null>(null)
  const [isExecuting, setIsExecuting] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<'query' | 'history'>('query')

  const handleExecuteQuery = async () => {
    if (!query.trim()) return

    setIsExecuting(true)
    setQueryResult(null)

    // 模拟查询执行
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setQueryResult(mockQueryResult)
    setIsExecuting(false)
  }

  const handleLoadHistoryQuery = (historyQuery: string) => {
    setQuery(historyQuery)
    setActiveTab('query')
  }

  const handleSaveQuery = () => {
    // TODO: 实现保存查询的逻辑
    console.log('Saving query:', query)
    alert('查询已保存!')
  }

  const handleExportResults = () => {
    if (!queryResult) return
    
    // TODO: 实现导出结果的逻辑
    console.log('Exporting results:', queryResult)
    alert('结果导出功能开发中...')
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
            <h1 className="text-2xl font-semibold">数据查询</h1>
            <p className="text-slate-500">{mockDataSource.name} - SQL 查询工具</p>
          </div>
        </div>

        {/* 选项卡 */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'query'
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
            onClick={() => setActiveTab('query')}
          >
            <Code className="h-4 w-4 inline mr-2" />
            SQL 查询
          </button>
          <button
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'history'
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
            onClick={() => setActiveTab('history')}
          >
            <History className="h-4 w-4 inline mr-2" />
            查询历史
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* 主查询区域 */}
        <div className="xl:col-span-3 space-y-6">
          {activeTab === 'query' ? (
            <>
              {/* SQL 编辑器 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">SQL 查询</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveQuery}
                        disabled={!query.trim()}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        保存
                      </Button>
                      <Button
                        onClick={handleExecuteQuery}
                        disabled={!query.trim() || isExecuting}
                        className="flex items-center gap-2"
                      >
                        {isExecuting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                        {isExecuting ? '执行中...' : '执行查询'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="输入 SQL 查询语句..."
                    className="w-full h-40 p-3 border border-slate-200 rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    spellCheck={false}
                  />
                  <div className="flex items-center justify-between mt-3 text-sm text-slate-500">
                    <div>
                      数据库: <span className="font-medium">{mockDataSource.database}</span>
                    </div>
                    <div>
                      使用 Ctrl+Enter 快速执行
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 查询结果 */}
              {queryResult && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">查询结果</CardTitle>
                        <p className="text-sm text-slate-500 mt-1">
                          共 {queryResult.totalRows} 行记录，执行时间 {queryResult.executionTime}ms
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleExportResults}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        导出结果
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            {queryResult.columns.map((column) => (
                              <th
                                key={column}
                                className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase"
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {queryResult.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-slate-50">
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="px-4 py-3 text-sm">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 执行状态 */}
              {isExecuting && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-500" />
                    <p className="text-slate-600">正在执行查询...</p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            /* 查询历史 */
            <div className="space-y-4">
              {mockQueryHistory.map((historyItem) => (
                <Card key={historyItem.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="bg-slate-50 rounded p-3 mb-3">
                          <code className="text-sm text-slate-800 block overflow-x-auto">
                            {historyItem.query}
                          </code>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span>执行时间: {historyItem.executionTime}ms</span>
                          <span>返回行数: {historyItem.rowCount}</span>
                          <span>执行于: {historyItem.executedAt}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLoadHistoryQuery(historyItem.query)}
                        className="ml-4"
                      >
                        使用此查询
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 侧边栏 - 数据库信息 */}
        <div className="xl:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Table className="h-5 w-5" />
                数据库信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h5 className="font-medium text-sm text-slate-700 mb-2">连接信息</h5>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-slate-500">数据源:</span>
                    <span className="ml-2 font-medium">{mockDataSource.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">类型:</span>
                    <span className="ml-2 font-medium">{mockDataSource.type.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">数据库:</span>
                    <span className="ml-2 font-medium">{mockDataSource.database}</span>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-sm text-slate-700 mb-2">快捷操作</h5>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => router.push(`/datasources/${params.id}/schema`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    查看表结构
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setQuery('SHOW TABLES')}
                  >
                    <Table className="h-4 w-4 mr-2" />
                    显示所有表
                  </Button>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-sm text-slate-700 mb-2">常用查询模板</h5>
                <div className="space-y-2">
                  <button
                    className="w-full text-left p-2 text-sm bg-slate-50 rounded hover:bg-slate-100 transition-colors"
                    onClick={() => setQuery('SELECT * FROM table_name LIMIT 10')}
                  >
                    查询表前10行
                  </button>
                  <button
                    className="w-full text-left p-2 text-sm bg-slate-50 rounded hover:bg-slate-100 transition-colors"
                    onClick={() => setQuery('SELECT COUNT(*) FROM table_name')}
                  >
                    统计表记录数
                  </button>
                  <button
                    className="w-full text-left p-2 text-sm bg-slate-50 rounded hover:bg-slate-100 transition-colors"
                    onClick={() => setQuery('DESCRIBE table_name')}
                  >
                    查看表结构
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}