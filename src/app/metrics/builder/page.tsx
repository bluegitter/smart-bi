'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SQLQueryBuilder } from '@/components/query-builder/SQLQueryBuilder'
import { Save, ArrowLeft, Play, Database, Settings, TestTube } from 'lucide-react'
import type { SQLQueryConfig, Metric, DataSource, MetricParameter } from '@/types'
import { getAuthHeaders, initDevAuth } from '@/lib/authUtils'

export default function MetricBuilderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const metricId = searchParams.get('id')
  const isEdit = Boolean(metricId)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  
  // 指标基本信息
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    displayName: '',
    description: '',
    category: '',
    type: 'custom' as const,
    unit: '',
    tags: [] as string[]
  })

  // SQL查询配置
  const [queryConfig, setQueryConfig] = useState<SQLQueryConfig>({
    select: [{ field: '*' }],
    from: [{ name: '' }],
    joins: [],
    where: [],
    groupBy: [],
    having: [],
    orderBy: [],
    limit: undefined
  })

  // 参数定义
  const [parameters, setParameters] = useState<MetricParameter[]>([])
  
  // 当前选择的数据源
  const [selectedDataSource, setSelectedDataSource] = useState<string>('')

  const [activeTab, setActiveTab] = useState<'basic' | 'query' | 'params' | 'preview'>('basic')

  useEffect(() => {
    // 确保开发环境有token
    initDevAuth()
    
    // 延迟一点加载数据源，确保token已设置
    const timer = setTimeout(() => {
      loadDataSources()
      if (isEdit) {
        loadMetric()
      }
    }, 100)
    
    return () => clearTimeout(timer)
  }, [isEdit, metricId])

  const loadDataSources = async () => {
    try {
      const response = await fetch('/api/datasources', {
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        setDataSources(data.dataSources || [])
      }
    } catch (error) {
      console.error('加载数据源失败:', error)
    }
  }

  const loadMetric = async () => {
    if (!metricId) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/metrics/${metricId}`, {
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const metric: Metric = await response.json()
        
        setBasicInfo({
          name: metric.name,
          displayName: metric.displayName,
          description: metric.description || '',
          category: metric.category,
          type: metric.type,
          unit: metric.unit || '',
          tags: metric.tags
        })

        if (metric.queryConfig) {
          setQueryConfig(metric.queryConfig)
        }

        if (metric.parameters) {
          setParameters(metric.parameters)
        }

        setSelectedDataSource(metric.datasourceId.toString())
      }
    } catch (error) {
      console.error('加载指标失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    // 验证必填字段
    if (!basicInfo.name || !basicInfo.displayName || !selectedDataSource) {
      alert('请填写必填字段：指标名称、显示名称和数据源')
      return
    }

    // 如果有自定义SQL，则不需要验证FROM表名
    if (!queryConfig.customSql && !queryConfig.from[0]?.name) {
      alert('请配置FROM表名或使用自定义SQL')
      return
    }

    setSaving(true)
    try {
      const metricData = {
        ...basicInfo,
        datasourceId: selectedDataSource,
        queryConfig,
        parameters,
        version: 1
      }

      const url = isEdit ? `/api/metrics/${metricId}` : '/api/metrics'
      const method = isEdit ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(metricData)
      })

      if (response.ok) {
        const result = await response.json()
        alert(isEdit ? '指标更新成功' : '指标创建成功')
        router.push('/metrics')
      } else {
        const error = await response.json()
        alert(`保存失败: ${error.error}`)
      }
    } catch (error) {
      console.error('保存指标失败:', error)
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = async () => {
    if (!selectedDataSource) {
      alert('请先选择数据源')
      return
    }

    setPreviewLoading(true)
    try {
      const response = await fetch('/api/metrics/preview', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          queryConfig,
          parameters: {},
          datasourceId: selectedDataSource
        })
      })

      if (response.ok) {
        const result = await response.json()
        setPreviewData(result.data || [])
        setActiveTab('preview')
      } else {
        const error = await response.json()
        alert(`预览失败: ${error.error}`)
      }
    } catch (error) {
      console.error('预览查询失败:', error)
      alert('预览失败，请重试')
    } finally {
      setPreviewLoading(false)
    }
  }

  const addParameter = () => {
    setParameters([
      ...parameters,
      {
        name: '',
        displayName: '',
        type: 'string',
        required: false,
        defaultValue: ''
      }
    ])
  }

  const updateParameter = (index: number, param: Partial<MetricParameter>) => {
    const newParameters = [...parameters]
    newParameters[index] = { ...newParameters[index], ...param }
    setParameters(newParameters)
  }

  const removeParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index))
  }

  const renderBasicTab = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">基本信息</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">指标名称 *</label>
            <Input
              value={basicInfo.name}
              onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
              placeholder="如: total_sales"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">显示名称 *</label>
            <Input
              value={basicInfo.displayName}
              onChange={(e) => setBasicInfo({ ...basicInfo, displayName: e.target.value })}
              placeholder="如: 总销售额"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">分类 *</label>
            <Input
              value={basicInfo.category}
              onChange={(e) => setBasicInfo({ ...basicInfo, category: e.target.value })}
              placeholder="如: 销售指标"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">指标类型</label>
            <select
              value={basicInfo.type}
              onChange={(e) => setBasicInfo({ ...basicInfo, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="count">计数</option>
              <option value="sum">求和</option>
              <option value="avg">平均值</option>
              <option value="max">最大值</option>
              <option value="min">最小值</option>
              <option value="ratio">比率</option>
              <option value="custom">自定义</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">单位</label>
            <Input
              value={basicInfo.unit}
              onChange={(e) => setBasicInfo({ ...basicInfo, unit: e.target.value })}
              placeholder="如: 元, 个, %"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">数据源 *</label>
            <select
              value={selectedDataSource}
              onChange={(e) => setSelectedDataSource(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">选择数据源</option>
              {dataSources.map((ds) => (
                <option key={ds._id} value={ds._id}>
                  {ds.name} ({ds.type})
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">描述</label>
          <textarea
            value={basicInfo.description}
            onChange={(e) => setBasicInfo({ ...basicInfo, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="指标的详细描述..."
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">标签</label>
          <Input
            value={basicInfo.tags.join(', ')}
            onChange={(e) => setBasicInfo({ 
              ...basicInfo, 
              tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
            })}
            placeholder="标签，用逗号分隔"
          />
        </div>
      </Card>
    </div>
  )

  const renderQueryTab = () => (
    <Card className="p-6">
      <h3 className="text-lg font-medium mb-4">SQL查询配置</h3>
      <SQLQueryBuilder
        initialConfig={queryConfig}
        datasourceId={selectedDataSource}
        onChange={setQueryConfig}
        onPreview={handlePreview}
      />
    </Card>
  )

  const renderParamsTab = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">参数定义</h3>
          <Button size="sm" onClick={addParameter}>
            添加参数
          </Button>
        </div>
        
        {parameters.length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无参数，点击"添加参数"开始配置</p>
        ) : (
          <div className="space-y-4">
            {parameters.map((param, index) => (
              <Card key={index} className="p-4 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">参数名</label>
                    <Input
                      value={param.name}
                      onChange={(e) => updateParameter(index, { name: e.target.value })}
                      placeholder="如: start_date"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">显示名称</label>
                    <Input
                      value={param.displayName}
                      onChange={(e) => updateParameter(index, { displayName: e.target.value })}
                      placeholder="如: 开始日期"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">类型</label>
                    <select
                      value={param.type}
                      onChange={(e) => updateParameter(index, { type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="string">字符串</option>
                      <option value="number">数字</option>
                      <option value="date">日期</option>
                      <option value="boolean">布尔值</option>
                      <option value="list">列表</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">默认值</label>
                    <Input
                      value={param.defaultValue || ''}
                      onChange={(e) => updateParameter(index, { defaultValue: e.target.value })}
                      placeholder="默认值"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={param.required}
                        onChange={(e) => updateParameter(index, { required: e.target.checked })}
                        className="mr-2"
                      />
                      必填参数
                    </label>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeParameter(index)}
                    >
                      删除
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  )

  const renderPreviewTab = () => (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">数据预览</h3>
        <Button size="sm" onClick={handlePreview} disabled={previewLoading}>
          {previewLoading ? '加载中...' : '刷新预览'}
        </Button>
      </div>
      
      {previewData.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {Object.keys(previewData[0]).map((key) => (
                  <th
                    key={key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {previewData.slice(0, 20).map((row, index) => (
                <tr key={index}>
                  {Object.values(row).map((value: any, colIndex) => (
                    <td
                      key={colIndex}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {String(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {previewData.length > 20 && (
            <p className="text-sm text-gray-500 mt-2">
              显示前20行，共{previewData.length}行数据
            </p>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">
          点击"预览数据"或"刷新预览"查看查询结果
        </p>
      )}
    </Card>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push('/metrics')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回
          </Button>
          <h1 className="text-2xl font-bold">
            {isEdit ? '编辑指标' : '创建指标'}
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={handlePreview}
            disabled={previewLoading}
          >
            <TestTube className="h-4 w-4 mr-1" />
            {previewLoading ? '预览中...' : '预览查询'}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1" />
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>

      {/* 标签页 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'basic', label: '基本信息', icon: Settings },
            { key: 'query', label: 'SQL配置', icon: Database },
            { key: 'params', label: '参数设置', icon: Settings },
            { key: 'preview', label: '数据预览', icon: Play }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* 内容区域 */}
      <div className="min-h-96">
        {activeTab === 'basic' && renderBasicTab()}
        {activeTab === 'query' && renderQueryTab()}
        {activeTab === 'params' && renderParamsTab()}
        {activeTab === 'preview' && renderPreviewTab()}
      </div>
    </div>
  )
}