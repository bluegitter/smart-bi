'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, MoreHorizontal, Database, TestTube, Edit, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { CreateDataSourceModal } from '@/components/datasource/CreateDataSourceModal'

// 模拟数据源数据
const mockDataSources = [
  {
    id: '1',
    name: 'MySQL 生产环境',
    type: 'mysql' as const,
    status: 'connected' as const,
    host: 'prod-mysql.example.com',
    database: 'production_db',
    lastConnected: '2024-01-15 14:30',
    tablesCount: 45,
    createdBy: '张三',
    description: '生产环境主数据库，包含用户、订单、产品等核心数据'
  },
  {
    id: '2',
    name: 'PostgreSQL 分析库',
    type: 'postgresql' as const,
    status: 'connected' as const,
    host: 'analytics-pg.example.com',
    database: 'analytics_db',
    lastConnected: '2024-01-15 13:45',
    tablesCount: 28,
    createdBy: '李四',
    description: '数据分析专用数据库，包含汇总统计数据'
  },
  {
    id: '3',
    name: 'MongoDB 日志库',
    type: 'mongodb' as const,
    status: 'connecting' as const,
    host: 'logs-mongo.example.com',
    database: 'logs_db',
    lastConnected: '2024-01-15 12:20',
    tablesCount: 12,
    createdBy: '王五',
    description: '应用日志和事件数据存储'
  },
  {
    id: '4',
    name: '销售API接口',
    type: 'api' as const,
    status: 'error' as const,
    apiUrl: 'https://api.sales.example.com/v1',
    lastConnected: '2024-01-14 16:00',
    tablesCount: 0,
    createdBy: '赵六',
    description: '销售系统API接口，提供实时销售数据'
  }
]

const dataSourceTypeLabels = {
  mysql: 'MySQL',
  postgresql: 'PostgreSQL', 
  mongodb: 'MongoDB',
  api: 'API接口',
  csv: 'CSV文件'
}

const statusConfig = {
  connected: {
    label: '已连接',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: CheckCircle
  },
  connecting: {
    label: '连接中',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: Clock
  },
  error: {
    label: '连接失败',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: XCircle
  }
}

export default function DataSourcesPage() {
  const router = useRouter()
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')

  const filteredDataSources = mockDataSources.filter(ds => 
    ds.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ds.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateDataSource = (dataSourceData: {
    name: string
    type: string
    config: Record<string, any>
  }) => {
    console.log('Creating data source:', dataSourceData)
    // TODO: 实现创建数据源的逻辑
  }

  const handleTestConnection = (dataSourceId: string) => {
    console.log('Testing connection for:', dataSourceId)
    // TODO: 实现测试连接的逻辑
  }

  const handleEditDataSource = (dataSourceId: string) => {
    console.log('Editing data source:', dataSourceId)
    // TODO: 实现编辑数据源的逻辑
  }

  const handleDeleteDataSource = (dataSourceId: string) => {
    console.log('Deleting data source:', dataSourceId)
    // TODO: 实现删除数据源的逻辑
  }

  return (
    <div className="flex-1 p-6">
      {/* 页面头部 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold">数据源管理</h1>
            <p className="text-slate-500">管理和配置您的数据连接</p>
          </div>
          <Button 
            className="flex items-center gap-2"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            新建数据源
          </Button>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="搜索数据源..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            筛选
          </Button>
        </div>
      </div>

      {/* 数据源统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Database className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold">4</div>
                <div className="text-sm text-slate-500">总数据源</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold">2</div>
                <div className="text-sm text-slate-500">已连接</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold">1</div>
                <div className="text-sm text-slate-500">连接中</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold">1</div>
                <div className="text-sm text-slate-500">连接失败</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 数据源列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredDataSources.map((dataSource) => {
          const status = statusConfig[dataSource.status]
          const StatusIcon = status.icon
          
          return (
            <Card key={dataSource.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Database className="h-6 w-6 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{dataSource.name}</CardTitle>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500 mb-2">
                        <span>{dataSourceTypeLabels[dataSource.type]}</span>
                        {dataSource.tablesCount > 0 && (
                          <span>{dataSource.tablesCount} 个数据表</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {dataSource.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleTestConnection(dataSource.id)}
                      title="测试连接"
                    >
                      <TestTube className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleEditDataSource(dataSource.id)}
                      title="编辑"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      onClick={() => handleDeleteDataSource(dataSource.id)}
                      title="删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {/* 连接信息 */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-slate-500">连接地址</div>
                      <div className="font-medium">
                        {dataSource.host || dataSource.apiUrl || '未设置'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">数据库名</div>
                      <div className="font-medium">
                        {dataSource.database || '无'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">最近连接</div>
                      <div className="font-medium">{dataSource.lastConnected}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">创建者</div>
                      <div className="font-medium">{dataSource.createdBy}</div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => handleTestConnection(dataSource.id)}
                    >
                      <TestTube className="h-3 w-3" />
                      测试连接
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/datasources/${dataSource.id}/schema`)}
                    >
                      查看结构
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/datasources/${dataSource.id}/query`)}
                    >
                      查询数据
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* 新建数据源卡片 */}
        <Card 
          className="border-2 border-dashed border-slate-300 hover:border-slate-400 transition-colors cursor-pointer"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="font-medium mb-2">添加新数据源</h3>
            <p className="text-sm text-slate-500 mb-4">
              连接数据库、API或上传文件，开始数据分析
            </p>
            <Button variant="outline">
              立即添加
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* 创建数据源模态框 */}
      <CreateDataSourceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateDataSource={handleCreateDataSource}
      />
    </div>
  )
}