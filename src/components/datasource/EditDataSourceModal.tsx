'use client'

import React from 'react'
import { X, Database, Globe, FileText, Server, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { DataSource } from '@/types'
import { useToast } from '@/hooks/useToast'

interface EditDataSourceModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdateDataSource: (id: string, dataSource: UpdateDataSourceData) => Promise<void>
  dataSource: DataSource | null
  onTestConnection: (config: TestConnectionConfig) => Promise<{ success: boolean; message: string; error?: string }>
}

interface UpdateDataSourceData {
  name: string
  type: string
  config: Record<string, any>
}

interface TestConnectionConfig {
  type: string
  config: Record<string, any>
}

type DataSourceType = 'mysql' | 'postgresql' | 'mongodb' | 'api' | 'csv'

const dataSourceTypes = [
  {
    id: 'mysql',
    name: 'MySQL',
    description: 'MySQL 关系型数据库',
    icon: Database,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    description: 'PostgreSQL 关系型数据库',
    icon: Database,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    description: 'MongoDB 文档数据库',
    icon: Database,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  {
    id: 'api',
    name: 'API 接口',
    description: 'REST API 数据接口',
    icon: Globe,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  {
    id: 'csv',
    name: 'CSV 文件',
    description: 'CSV 文件数据导入',
    icon: FileText,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  }
]

export function EditDataSourceModal({ isOpen, onClose, onUpdateDataSource, dataSource, onTestConnection }: EditDataSourceModalProps) {
  const [selectedType, setSelectedType] = React.useState<DataSourceType | null>(null)
  const [formData, setFormData] = React.useState({
    name: '',
    // Database connection
    host: '',
    port: '',
    database: '',
    username: '',
    password: '',
    // API connection
    apiUrl: '',
    headers: {} as Record<string, string>,
    // File upload
    filePath: ''
  })
  const [isConnecting, setIsConnecting] = React.useState(false)
  const [isUpdating, setIsUpdating] = React.useState(false)
  
  const { showSuccess, showError } = useToast()

  // Initialize form data when modal opens or dataSource changes
  React.useEffect(() => {
    if (isOpen && dataSource) {
      setSelectedType(dataSource.type as DataSourceType)
      setFormData({
        name: dataSource.name || '',
        host: dataSource.config?.host || '',
        port: dataSource.config?.port?.toString() || '',
        database: dataSource.config?.database || '',
        username: dataSource.config?.username || '',
        password: '', // Don't populate password for security
        apiUrl: dataSource.config?.apiUrl || '',
        headers: dataSource.config?.headers || {},
        filePath: dataSource.config?.filePath || ''
      })
    }
  }, [isOpen, dataSource])

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedType(null)
      setFormData({
        name: '',
        host: '',
        port: '',
        database: '',
        username: '',
        password: '',
        apiUrl: '',
        headers: {},
        filePath: ''
      })
      setIsConnecting(false)
      setIsUpdating(false)
    }
  }, [isOpen])

  if (!isOpen || !dataSource) return null

  const handleTestConnection = async () => {
    if (!selectedType) return
    
    setIsConnecting(true)
    
    try {
      let config: Record<string, any> = {}

      if (selectedType === 'mysql' || selectedType === 'postgresql') {
        config = {
          host: formData.host,
          port: Number(formData.port),
          database: formData.database,
          username: formData.username,
          password: formData.password || dataSource.config?.password // Use existing password if not changed
        }
      } else if (selectedType === 'mongodb') {
        config = {
          host: formData.host,
          port: Number(formData.port),
          database: formData.database,
          username: formData.username,
          password: formData.password || dataSource.config?.password
        }
      } else if (selectedType === 'api') {
        config = {
          apiUrl: formData.apiUrl,
          headers: formData.headers
        }
      } else if (selectedType === 'csv') {
        config = {
          filePath: formData.filePath
        }
      }

      const result = await onTestConnection({
        type: selectedType,
        config
      })
      
      if (result.success) {
        showSuccess('连接测试成功', result.message)
      } else {
        showError('连接测试失败', result.error || '未知错误')
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      showError('连接测试失败', '网络错误或服务异常')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedType || !formData.name || !dataSource) return

    setIsUpdating(true)

    try {
      let config: Record<string, any> = {}

      if (selectedType === 'mysql' || selectedType === 'postgresql') {
        config = {
          host: formData.host,
          port: Number(formData.port),
          database: formData.database,
          username: formData.username,
          // Only update password if it was changed
          ...(formData.password && { password: formData.password })
        }
      } else if (selectedType === 'mongodb') {
        config = {
          host: formData.host,
          port: Number(formData.port),
          database: formData.database,
          username: formData.username,
          ...(formData.password && { password: formData.password })
        }
      } else if (selectedType === 'api') {
        config = {
          apiUrl: formData.apiUrl,
          headers: formData.headers
        }
      } else if (selectedType === 'csv') {
        config = {
          filePath: formData.filePath
        }
      }

      await onUpdateDataSource(dataSource._id || dataSource.id, {
        name: formData.name,
        type: selectedType,
        config
      })

      onClose()
    } catch (error) {
      console.error('Failed to update data source:', error)
      showError('更新失败', '更新数据源时发生错误，请稍后重试')
    } finally {
      setIsUpdating(false)
    }
  }

  const selectedTypeInfo = selectedType ? dataSourceTypes.find(t => t.id === selectedType) : null

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold">编辑数据源</h2>
            <p className="text-sm text-slate-500 mt-1">
              修改 "{dataSource.name}" 的配置信息
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {selectedTypeInfo && (
            <div>
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center",
                    selectedTypeInfo.bgColor
                  )}>
                    <selectedTypeInfo.icon className={cn("h-6 w-6", selectedTypeInfo.color)} />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">配置 {selectedTypeInfo.name} 连接</h3>
                    <p className="text-sm text-slate-500">
                      {selectedTypeInfo.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* 基本信息 */}
                <div>
                  <label className="block text-sm font-medium mb-2">数据源名称 *</label>
                  <Input
                    placeholder="输入数据源名称"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full"
                  />
                </div>

                {/* 数据库连接配置 */}
                {(selectedType === 'mysql' || selectedType === 'postgresql' || selectedType === 'mongodb') && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-slate-700">连接配置</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">主机地址 *</label>
                        <Input
                          placeholder="localhost 或 IP 地址"
                          value={formData.host}
                          onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">端口</label>
                        <Input
                          placeholder={selectedType === 'mysql' ? '3306' : selectedType === 'postgresql' ? '5432' : '27017'}
                          value={formData.port}
                          onChange={(e) => setFormData(prev => ({ ...prev, port: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">数据库名 *</label>
                        <Input
                          placeholder="数据库名称"
                          value={formData.database}
                          onChange={(e) => setFormData(prev => ({ ...prev, database: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">用户名 *</label>
                        <Input
                          placeholder="数据库用户名"
                          value={formData.username}
                          onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">密码 (留空保持不变)</label>
                        <Input
                          type="password"
                          placeholder="输入新密码或留空保持不变"
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* API 连接配置 */}
                {selectedType === 'api' && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-slate-700">API 配置</h4>
                    <div>
                      <label className="block text-sm font-medium mb-2">API URL *</label>
                      <Input
                        placeholder="https://api.example.com/v1"
                        value={formData.apiUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, apiUrl: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">请求头 (可选)</label>
                      <textarea
                        placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                        className="w-full h-24 px-3 py-2 border border-slate-200 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={JSON.stringify(formData.headers, null, 2)}
                        onChange={(e) => {
                          try {
                            const headers = JSON.parse(e.target.value || '{}')
                            setFormData(prev => ({ ...prev, headers }))
                          } catch (e) {
                            // 忽略JSON解析错误
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* CSV 文件配置 */}
                {selectedType === 'csv' && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-slate-700">文件配置</h4>
                    <div>
                      <label className="block text-sm font-medium mb-2">文件路径 *</label>
                      <Input
                        type="file"
                        accept=".csv"
                        onChange={(e) => setFormData(prev => ({ ...prev, filePath: e.target.value }))}
                        className="w-full"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        当前文件: {dataSource.config?.filePath || '无'}
                      </p>
                    </div>
                  </div>
                )}

                {/* 测试连接 */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-sm">测试连接</h5>
                      <p className="text-xs text-slate-500">验证连接配置是否正确</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleTestConnection}
                      disabled={isConnecting}
                      className="flex items-center gap-2"
                    >
                      <Server className="h-4 w-4" />
                      {isConnecting ? '测试中...' : '测试连接'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>
            取消
          </Button>
          <Button 
            onClick={handleUpdate}
            disabled={!formData.name || isUpdating}
          >
            {isUpdating ? '更新中...' : '更新数据源'}
          </Button>
        </div>
      </div>
    </div>
  )
}