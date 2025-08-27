'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Settings, Trash2, TestTube, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/hooks/useToast'
import type { LLMConfig, LLMProvider, CreateLLMConfigRequest, UpdateLLMConfigRequest, LLMTestResult, LLMProviderPreset } from '@/types/llm'
import { LLM_PROVIDER_PRESETS } from '@/types/llm'

interface LLMConfigPanelProps {
  className?: string
}

export function LLMConfigPanel({ className }: LLMConfigPanelProps) {
  const [configs, setConfigs] = useState<LLMConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingConfig, setEditingConfig] = useState<LLMConfig | null>(null)
  const [testingConfig, setTestingConfig] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, LLMTestResult>>({})
  const { showSuccess, showError } = useToast()

  // 加载LLM配置列表
  const loadConfigs = async () => {
    try {
      const response = await fetch('/api/llm/configs')
      if (response.ok) {
        const data = await response.json()
        setConfigs(data.configs || [])
      } else {
        showError('错误', '加载LLM配置失败')
      }
    } catch (error) {
      console.error('加载LLM配置失败:', error)
      showError('错误', '加载LLM配置失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfigs()
  }, [])

  // 测试配置连接
  const handleTestConfig = async (configId: string) => {
    setTestingConfig(configId)
    try {
      const response = await fetch(`/api/llm/configs/${configId}/test`, {
        method: 'POST'
      })
      const result = await response.json()
      setTestResults(prev => ({
        ...prev,
        [configId]: result
      }))
      
      if (result.success) {
        showSuccess('成功', '连接测试成功')
      } else {
        showError('错误', `连接测试失败: ${result.error}`)
      }
    } catch (error) {
      console.error('测试连接失败:', error)
      showError('错误', '测试连接失败')
    } finally {
      setTestingConfig(null)
    }
  }

  // 设置为默认配置
  const handleSetDefault = async (configId: string) => {
    try {
      const response = await fetch(`/api/llm/configs/${configId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true })
      })

      if (response.ok) {
        showSuccess('成功', '设置默认配置成功')
        await loadConfigs()
      } else {
        showError('错误', '设置默认配置失败')
      }
    } catch (error) {
      console.error('设置默认配置失败:', error)
      showError('错误', '设置默认配置失败')
    }
  }

  // 删除配置
  const handleDeleteConfig = async (configId: string) => {
    if (!confirm('确定要删除这个配置吗？此操作不可撤销。')) {
      return
    }

    try {
      const response = await fetch(`/api/llm/configs/${configId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showSuccess('成功', '删除配置成功')
        await loadConfigs()
      } else {
        const error = await response.json()
        showError('错误', error.error || '删除配置失败')
      }
    } catch (error) {
      console.error('删除配置失败:', error)
      showError('错误', '删除配置失败')
    }
  }

  // 编辑配置
  const handleEditConfig = (config: LLMConfig) => {
    setEditingConfig(config)
    setShowEditDialog(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">LLM模型配置</h2>
          <p className="text-sm text-slate-500 mt-1">
            管理你的大语言模型配置，用于AI问答功能
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          添加配置
        </Button>
      </div>

      {configs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="font-medium mb-2">还没有LLM配置</h3>
            <p className="text-slate-500 text-sm mb-4">
              添加你的第一个大语言模型配置来启用AI功能
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              添加配置
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {configs.map((config) => (
            <ConfigCard
              key={config._id}
              config={config}
              testResult={testResults[config._id]}
              isTesting={testingConfig === config._id}
              onTest={() => handleTestConfig(config._id)}
              onSetDefault={() => handleSetDefault(config._id)}
              onEdit={() => handleEditConfig(config)}
              onDelete={() => handleDeleteConfig(config._id)}
            />
          ))}
        </div>
      )}

      <CreateConfigDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={() => {
          setShowCreateDialog(false)
          loadConfigs()
        }}
      />

      <EditConfigDialog
        isOpen={showEditDialog}
        config={editingConfig}
        onClose={() => {
          setShowEditDialog(false)
          setEditingConfig(null)
        }}
        onSuccess={() => {
          setShowEditDialog(false)
          setEditingConfig(null)
          loadConfigs()
        }}
      />
    </div>
  )
}

// 配置卡片组件
interface ConfigCardProps {
  config: LLMConfig
  testResult?: LLMTestResult
  isTesting: boolean
  onTest: () => void
  onSetDefault: () => void
  onEdit: () => void
  onDelete: () => void
}

function ConfigCard({ config, testResult, isTesting, onTest, onSetDefault, onEdit, onDelete }: ConfigCardProps) {
  const providerPreset = LLM_PROVIDER_PRESETS.find(p => p.provider === config.provider)
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium">{config.displayName}</h3>
              {config.isDefault && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">默认</span>
              )}
              {!config.isActive && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">未启用</span>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
              <span>{providerPreset?.displayName || config.provider}</span>
              <span>•</span>
              <span>{config.config.model}</span>
              {testResult && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    {testResult.success ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <X className="h-3 w-3 text-red-500" />
                    )}
                    <span className={testResult.success ? 'text-green-600' : 'text-red-600'}>
                      {testResult.success ? '连接正常' : '连接失败'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {config.description && (
              <p className="text-sm text-slate-500">{config.description}</p>
            )}

            {config.tags && config.tags.length > 0 && (
              <div className="flex gap-1 mt-2">
                {config.tags.map((tag, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onTest}
              disabled={isTesting}
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
            </Button>
            
            {!config.isDefault && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSetDefault}
              >
                设为默认
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
            >
              <Settings className="h-4 w-4" />
            </Button>
            
            {!config.isDefault && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 创建配置对话框
interface CreateConfigDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function CreateConfigDialog({ isOpen, onClose, onSuccess }: CreateConfigDialogProps) {
  const [form, setForm] = useState<CreateLLMConfigRequest>({
    name: '',
    displayName: '',
    provider: 'openai',
    config: {
      apiKey: '',
      model: '',
      temperature: 0.7
    }
  })
  const [loading, setLoading] = useState(false)

  const selectedPreset = LLM_PROVIDER_PRESETS.find(p => p.provider === form.provider)

  const handleProviderChange = (provider: LLMProvider) => {
    const preset = LLM_PROVIDER_PRESETS.find(p => p.provider === provider)
    setForm(prev => ({
      ...prev,
      provider,
      config: {
        ...prev.config,
        apiUrl: preset?.defaultApiUrl || '',
        model: preset?.supportedModels[0]?.model || ''
      },
      capabilities: preset?.capabilities
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/llm/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (response.ok) {
        showSuccess('成功', '创建配置成功')
        onSuccess()
        // 重置表单
        setForm({
          name: '',
          displayName: '',
          provider: 'openai',
          config: {
            apiKey: '',
            model: '',
            temperature: 0.7
          }
        })
      } else {
        const error = await response.json()
        showError('错误', error.error || '创建配置失败')
      }
    } catch (error) {
      console.error('创建配置失败:', error)
      showError('错误', '创建配置失败')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Plus className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">添加LLM配置</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-800 mb-3">配置名称</label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="例如: openai-gpt4"
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="displayName" className="block text-sm font-semibold text-gray-800 mb-3">显示名称</label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={(e) => setForm(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="例如: OpenAI GPT-4"
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="provider" className="block text-sm font-semibold text-gray-800 mb-3">提供商</label>
            <select
              id="provider"
              value={form.provider}
              onChange={(e) => handleProviderChange(e.target.value as LLMProvider)}
              className="w-full h-11 px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              {LLM_PROVIDER_PRESETS.map((preset) => (
                <option key={preset.provider} value={preset.provider}>
                  {preset.displayName}
                </option>
              ))}
            </select>
            {selectedPreset && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  {selectedPreset.description}
                </p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="apiKey" className="block text-sm font-semibold text-gray-800 mb-3">API密钥</label>
            <Input
              id="apiKey"
              type="password"
              value={form.config.apiKey}
              onChange={(e) => setForm(prev => ({
                ...prev,
                config: { ...prev.config, apiKey: e.target.value }
              }))}
              placeholder="输入API密钥"
              className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label htmlFor="apiUrl" className="block text-sm font-semibold text-gray-800 mb-3">API地址（可选）</label>
              <Input
                id="apiUrl"
                value={form.config.apiUrl || ''}
                onChange={(e) => setForm(prev => ({
                  ...prev,
                  config: { ...prev.config, apiUrl: e.target.value }
                }))}
                placeholder={selectedPreset?.defaultApiUrl}
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label htmlFor="model" className="block text-sm font-semibold text-gray-800 mb-3">模型</label>
              <div className="space-y-3">
                <select
                  id="model-preset"
                  value={form.config.model}
                  onChange={(e) => setForm(prev => ({
                    ...prev,
                    config: { ...prev.config, model: e.target.value }
                  }))}
                  className="w-full h-11 px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="">选择预设模型</option>
                  {selectedPreset?.supportedModels.map((model) => (
                    <option key={model.model} value={model.model}>
                      {model.displayName}
                    </option>
                  ))}
                </select>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    或者输入自定义模型名：
                  </div>
                  <Input
                    id="model-custom"
                    value={form.config.model}
                    onChange={(e) => setForm(prev => ({
                      ...prev,
                      config: { ...prev.config, model: e.target.value }
                    }))}
                    placeholder="例如: gpt-4o, claude-3-5-sonnet-20241022, glm-4-plus"
                    className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-800 mb-3">描述（可选）</label>
            <textarea
              id="description"
              value={form.description || ''}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="配置说明"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="px-6 py-2.5 h-11"
            >
              取消
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2.5 h-11 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  创建中...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  创建配置
                </>
              )}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}

// 编辑配置对话框
interface EditConfigDialogProps {
  isOpen: boolean
  config: LLMConfig | null
  onClose: () => void
  onSuccess: () => void
}

function EditConfigDialog({ isOpen, config, onClose, onSuccess }: EditConfigDialogProps) {
  const [form, setForm] = useState<UpdateLLMConfigRequest>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (config) {
      setForm({
        name: config.name,
        displayName: config.displayName,
        provider: config.provider,
        config: config.config,
        capabilities: config.capabilities,
        limits: config.limits,
        description: config.description,
        tags: config.tags,
        isActive: config.isActive
      })
    }
  }, [config])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!config) return

    setLoading(true)

    try {
      const response = await fetch(`/api/llm/configs/${config._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (response.ok) {
        showSuccess('成功', '更新配置成功')
        onSuccess()
      } else {
        const error = await response.json()
        showError('错误', error.error || '更新配置失败')
      }
    } catch (error) {
      console.error('更新配置失败:', error)
      showError('错误', '更新配置失败')
    } finally {
      setLoading(false)
    }
  }

  if (!config) return null

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Settings className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">编辑LLM配置</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label htmlFor="edit-name" className="block text-sm font-semibold text-gray-800 mb-3">配置名称</label>
              <Input
                id="edit-name"
                value={form.name || ''}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label htmlFor="edit-displayName" className="block text-sm font-semibold text-gray-800 mb-3">显示名称</label>
              <Input
                id="edit-displayName"
                value={form.displayName || ''}
                onChange={(e) => setForm(prev => ({ ...prev, displayName: e.target.value }))}
                className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-apiKey" className="block text-sm font-semibold text-gray-800 mb-3">API密钥</label>
            <Input
              id="edit-apiKey"
              type="password"
              value={form.config?.apiKey || ''}
              onChange={(e) => setForm(prev => ({
                ...prev,
                config: { ...prev.config!, apiKey: e.target.value }
              }))}
              placeholder="保持不变则留空"
              className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500 font-mono"
            />
          </div>

          <div>
            <label htmlFor="edit-apiUrl" className="block text-sm font-semibold text-gray-800 mb-3">
              API地址（可选）
            </label>
            <Input
              id="edit-apiUrl"
              type="url"
              value={form.config?.apiUrl || ''}
              onChange={(e) => setForm(prev => ({
                ...prev,
                config: { ...prev.config!, apiUrl: e.target.value }
              }))}
              placeholder="例如: https://api.openai.com/v1, https://api.anthropic.com/v1"
              className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500 font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              留空则使用提供商的默认API地址
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label htmlFor="edit-model" className="block text-sm font-semibold text-gray-800 mb-3">模型</label>
              <Input
                id="edit-model"
                value={form.config?.model || ''}
                onChange={(e) => setForm(prev => ({
                  ...prev,
                  config: { ...prev.config!, model: e.target.value }
                }))}
                placeholder="例如: gpt-4o, claude-3-5-sonnet-20241022, glm-4-plus"
                className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500 font-mono"
                required
              />
            </div>
            <div className="flex items-center justify-center">
              <label className="inline-flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  id="edit-isActive"
                  checked={form.isActive || false}
                  onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                />
                <span className="ml-3 text-sm font-semibold text-gray-800">启用配置</span>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="edit-description" className="block text-sm font-semibold text-gray-800 mb-3">描述</label>
            <textarea
              id="edit-description"
              value={form.description || ''}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="px-6 py-2.5 h-11"
            >
              取消
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2.5 h-11 bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  更新中...
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
                  更新配置
                </>
              )}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}