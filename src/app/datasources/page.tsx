'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, MoreHorizontal, Database, TestTube, Edit, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { CreateDataSourceModal } from '@/components/datasource/CreateDataSourceModal'
import { EditDataSourceModal } from '@/components/datasource/EditDataSourceModal'
import { useDataSources } from '@/hooks/useDataSources'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ui/Toast'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { DataSource } from '@/types'

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

// 获取数据源状态
const getDataSourceStatus = (dataSource: DataSource): 'connected' | 'connecting' | 'error' => {
  if (!dataSource.isActive) return 'error'
  // 根据实际情况判断状态，这里简化处理
  return 'connected'
}

export default function DataSourcesPage() {
  const router = useRouter()
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [editingDataSource, setEditingDataSource] = React.useState<DataSource | null>(null)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [testingConnections, setTestingConnections] = React.useState<Set<string>>(new Set())
  
  const { toasts, removeToast, showSuccess, showError } = useToast()
  const { showConfirm, confirmDialog } = useConfirmDialog()

  const {
    dataSources,
    loading,
    error,
    createDataSource,
    updateDataSource,
    deleteDataSource,
    testConnection,
    setError
  } = useDataSources()

  const filteredDataSources = dataSources.filter(ds => 
    ds.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ds.description && ds.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleCreateDataSource = async (dataSourceData: {
    name: string
    type: string
    config: Record<string, any>
  }) => {
    try {
      await createDataSource(dataSourceData)
      setIsCreateModalOpen(false)
    } catch (err) {
      console.error('Failed to create data source:', err)
    }
  }

  const handleTestConnection = async (dataSource: DataSource) => {
    const dataSourceId = dataSource._id || dataSource.id
    setTestingConnections(prev => new Set([...prev, dataSourceId]))
    
    try {
      const result = await testConnection({
        type: dataSource.type,
        config: dataSource.config
      })
      
      if (result.success) {
        showSuccess('连接测试成功', result.message)
      } else {
        showError('连接测试失败', result.error || '未知错误')
      }
    } catch (err) {
      console.error('Connection test failed:', err)
      showError('连接测试失败', '网络错误或服务异常')
    } finally {
      setTestingConnections(prev => {
        const newSet = new Set(prev)
        newSet.delete(dataSourceId)
        return newSet
      })
    }
  }

  const handleEditDataSource = (dataSource: DataSource) => {
    setEditingDataSource(dataSource)
    setIsEditModalOpen(true)
  }

  const handleUpdateDataSource = async (id: string, dataSourceData: {
    name: string
    type: string
    config: Record<string, any>
  }) => {
    try {
      await updateDataSource(id, dataSourceData)
      setIsEditModalOpen(false)
      setEditingDataSource(null)
    } catch (err) {
      console.error('Failed to update data source:', err)
    }
  }

  const handleDeleteDataSource = (dataSourceId: string, dataSourceName: string) => {
    showConfirm({
      title: '删除数据源',
      message: `确定要删除数据源"${dataSourceName}"吗？此操作不可恢复，相关的指标和看板也会受到影响。`,
      confirmText: '删除',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteDataSource(dataSourceId)
          showSuccess('删除成功', `数据源"${dataSourceName}"已被删除`)
        } catch (err) {
          console.error('Failed to delete data source:', err)
          showError('删除失败', '删除数据源时发生错误，请稍后重试')
        }
      }
    })
  }

  // 计算统计数据
  const stats = React.useMemo(() => {
    const total = dataSources.length
    const connected = dataSources.filter(ds => getDataSourceStatus(ds) === 'connected').length
    const connecting = dataSources.filter(ds => getDataSourceStatus(ds) === 'connecting').length
    const error = dataSources.filter(ds => getDataSourceStatus(ds) === 'error').length
    
    return { total, connected, connecting, error }
  }, [dataSources])

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
                <div className="text-2xl font-semibold">{stats.total}</div>
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
                <div className="text-2xl font-semibold">{stats.connected}</div>
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
                <div className="text-2xl font-semibold">{stats.connecting}</div>
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
                <div className="text-2xl font-semibold">{stats.error}</div>
                <div className="text-sm text-slate-500">连接失败</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 数据源列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading && dataSources.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <div className="text-slate-500">正在加载数据源...</div>
          </div>
        ) : error ? (
          <div className="col-span-full text-center py-8">
            <div className="text-red-500">加载失败: {error}</div>
            <Button variant="outline" onClick={() => setError(null)} className="mt-2">
              重试
            </Button>
          </div>
        ) : filteredDataSources.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <div className="text-slate-500">暂无数据源</div>
          </div>
        ) : (
          filteredDataSources.map((dataSource) => {
            const dataSourceId = dataSource._id || dataSource.id
            const status = statusConfig[getDataSourceStatus(dataSource)]
            const StatusIcon = status.icon
            const isTestingConnection = testingConnections.has(dataSourceId)
            
            return (
              <Card key={dataSourceId} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Database className="h-5 w-5 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base truncate">{dataSource.name}</CardTitle>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color} whitespace-nowrap`}>
                          <StatusIcon className="h-2.5 w-2.5" />
                          {status.label}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mb-1">
                        {dataSourceTypeLabels[dataSource.type]}
                        {dataSource.schemaInfo?.tables?.length && (
                          <span className="ml-2">{dataSource.schemaInfo.tables.length} 表</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleTestConnection(dataSource)}
                      disabled={isTestingConnection}
                      title="测试连接"
                    >
                      <TestTube className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon" 
                      className="h-7 w-7"
                      onClick={() => handleEditDataSource(dataSource)}
                      title="编辑"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-600"
                      onClick={() => handleDeleteDataSource(dataSourceId, dataSource.name)}
                      title="删除"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-2">
                <div className="space-y-2">
                  {/* 连接信息 */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-slate-500">连接地址</div>
                      <div className="font-medium truncate" title={dataSource.config?.host || dataSource.config?.apiUrl || '未设置'}>
                        {dataSource.config?.host || dataSource.config?.apiUrl || '未设置'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">数据库</div>
                      <div className="font-medium truncate" title={dataSource.config?.database || '无'}>
                        {dataSource.config?.database || '无'}
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-1 pt-2 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 text-xs px-2 py-1 h-7"
                      onClick={() => handleTestConnection(dataSource)}
                      disabled={isTestingConnection}
                    >
                      <TestTube className="h-3 w-3" />
                      {isTestingConnection ? '测试中' : '测试'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs px-2 py-1 h-7"
                      onClick={() => router.push(`/datasources/${dataSourceId}/schema`)}
                    >
                      结构
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs px-2 py-1 h-7"
                      onClick={() => router.push(`/datasources/${dataSourceId}/query`)}
                    >
                      查询
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            )
          })
        )}

        {/* 新建数据源卡片 */}
        <Card 
          className="border-2 border-dashed border-slate-300 hover:border-slate-400 transition-colors cursor-pointer"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[180px]">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
              <Plus className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="font-medium mb-2 text-sm">添加新数据源</h3>
            <p className="text-xs text-slate-500 mb-3">
              连接数据库、API或上传文件
            </p>
            <Button variant="outline" size="sm" className="text-xs px-3 py-1 h-7">
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
      
      {/* 编辑数据源模态框 */}
      <EditDataSourceModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingDataSource(null)
        }}
        onUpdateDataSource={handleUpdateDataSource}
        dataSource={editingDataSource}
        onTestConnection={testConnection}
      />
      
      {/* Toast 通知 */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* 确认对话框 */}
      {confirmDialog}
    </div>
  )
}