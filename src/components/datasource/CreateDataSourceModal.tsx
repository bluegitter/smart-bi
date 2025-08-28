'use client'

import React from 'react'
import { X, Database, Globe, FileText, Server, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { getAuthHeaders } from '@/lib/authUtils'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'

interface CreateDataSourceModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateDataSource: (dataSource: CreateDataSourceData) => void
}

interface CreateDataSourceData {
  name: string
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

export function CreateDataSourceModal({ isOpen, onClose, onCreateDataSource }: CreateDataSourceModalProps) {
  const [step, setStep] = React.useState(1)
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
  
  const { showSuccess, showError } = useToast()

  React.useEffect(() => {
    if (isOpen) {
      // 重置状态
      setStep(1)
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
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleNext = () => {
    if (step === 1 && selectedType) {
      setStep(2)
    }
  }

  const handleBack = () => {
    if (step === 2) {
      setStep(1)
    }
  }

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
          password: formData.password
        }
      } else if (selectedType === 'mongodb') {
        config = {
          host: formData.host,
          port: Number(formData.port),
          database: formData.database,
          username: formData.username,
          password: formData.password
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

      const response = await fetch('/api/datasources/test', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          type: selectedType,
          config
        })
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
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

  const handleCreate = () => {
    if (!selectedType || !formData.name) return

    let config: Record<string, any> = {}

    if (selectedType === 'mysql' || selectedType === 'postgresql') {
      config = {
        host: formData.host,
        port: Number(formData.port),
        database: formData.database,
        username: formData.username,
        password: formData.password
      }
    } else if (selectedType === 'mongodb') {
      config = {
        host: formData.host,
        port: Number(formData.port),
        database: formData.database,
        username: formData.username,
        password: formData.password
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

    onCreateDataSource({
      name: formData.name,
      type: selectedType,
      config
    })
    onClose()
  }

  const selectedTypeInfo = selectedType ? dataSourceTypes.find(t => t.id === selectedType) : null

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold">添加数据源</h2>
            <p className="text-sm text-slate-500 mt-1">
              {step === 1 ? '选择数据源类型' : '配置连接信息'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* 进度指示器 */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex items-center gap-2 text-sm",
              step >= 1 ? "text-blue-600" : "text-slate-400"
            )}>
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                step >= 1 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-400"
              )}>
                {step > 1 ? <Check className="w-3 h-3" /> : '1'}
              </div>
              选择类型
            </div>
            <div className={cn(
              "flex-1 h-px",
              step >= 2 ? "bg-blue-600" : "bg-slate-200"
            )} />
            <div className={cn(
              "flex items-center gap-2 text-sm",
              step >= 2 ? "text-blue-600" : "text-slate-400"
            )}>
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                step >= 2 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-400"
              )}>
                2
              </div>
              配置连接
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {step === 1 && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">选择数据源类型</h3>
                <p className="text-sm text-slate-500">
                  选择你要连接的数据源类型
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dataSourceTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <Card
                      key={type.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        selectedType === type.id && "ring-2 ring-blue-500"
                      )}
                      onClick={() => setSelectedType(type.id as DataSourceType)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            type.bgColor
                          )}>
                            <Icon className={cn("h-5 w-5", type.color)} />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-base">{type.name}</CardTitle>
                          </div>
                          {selectedType === type.id && (
                            <Check className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-600">
                          {type.description}
                        </p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {step === 2 && selectedTypeInfo && (
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
                        <label className="block text-sm font-medium mb-2">密码 *</label>
                        <Input
                          type="password"
                          placeholder="数据库密码"
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
        <div className="flex items-center justify-between p-6 border-t border-slate-200">
          <div className="text-sm text-slate-500">
            {step === 1 && '第 1 步，共 2 步'}
            {step === 2 && '第 2 步，共 2 步'}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            {step === 1 && (
              <Button 
                onClick={handleNext}
                disabled={!selectedType}
              >
                下一步
              </Button>
            )}
            {step === 2 && (
              <>
                <Button variant="outline" onClick={handleBack}>
                  上一步
                </Button>
                <Button 
                  onClick={handleCreate}
                  disabled={!formData.name}
                >
                  创建数据源
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}