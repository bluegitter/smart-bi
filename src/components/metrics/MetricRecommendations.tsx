'use client'

import React, { useState } from 'react'
import { Sparkles, Search, Target, Layout, X, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { MetricCard } from './MetricCard'
import { getAuthHeaders } from '@/lib/authUtils'
import type { Metric, ComponentLayout } from '@/types'

interface MetricRecommendationsProps {
  onClose: () => void
  availableMetrics?: Metric[]
}

interface RecommendationResult {
  metric: Metric
  relevanceScore: number
  reason: string
  confidence: number
}

export function MetricRecommendations({ onClose, availableMetrics = [] }: MetricRecommendationsProps) {
  const [activeTab, setActiveTab] = useState<'query' | 'component' | 'combination'>('query')
  const [queryInput, setQueryInput] = useState('')
  const [selectedComponent, setSelectedComponent] = useState<ComponentLayout['type']>('line-chart')
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([])
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([])
  const [loading, setLoading] = useState(false)

  const componentTypes = [
    { value: 'line-chart', label: '折线图', icon: '📈' },
    { value: 'bar-chart', label: '柱状图', icon: '📊' },
    { value: 'pie-chart', label: '饼图', icon: '🥧' },
    { value: 'table', label: '数据表', icon: '📋' },
    { value: 'kpi-card', label: '指标卡片', icon: '💳' },
    { value: 'gauge', label: '仪表盘', icon: '⚡' }
  ] as const

  // 获取查询推荐
  const handleQueryRecommendation = async () => {
    if (!queryInput.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/metrics/recommendations', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          type: 'query',
          query: queryInput
        })
      })

      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.result || [])
      }
    } catch (error) {
      console.error('Error getting query recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取组件推荐
  const handleComponentRecommendation = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/metrics/recommendations', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          type: 'component',
          componentType: selectedComponent
        })
      })

      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.result?.suggestedMetrics || [])
      }
    } catch (error) {
      console.error('Error getting component recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取组合推荐
  const handleCombinationRecommendation = async () => {
    if (selectedMetrics.length === 0) return

    setLoading(true)
    try {
      const response = await fetch('/api/metrics/recommendations', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          type: 'combination',
          baseMetrics: selectedMetrics
        })
      })

      if (response.ok) {
        const data = await response.json()
        const { primary, secondary, related } = data.result
        
        // 合并推荐结果并添加分数
        const combined = [
          ...primary.map((metric: Metric) => ({
            metric,
            relevanceScore: 0.9,
            reason: '强相关指标',
            confidence: 90
          })),
          ...secondary.map((metric: Metric) => ({
            metric,
            relevanceScore: 0.7,
            reason: '相关指标',
            confidence: 70
          })),
          ...related.map((metric: Metric) => ({
            metric,
            relevanceScore: 0.5,
            reason: '弱相关指标',
            confidence: 50
          }))
        ]
        
        setRecommendations(combined)
      }
    } catch (error) {
      console.error('Error getting combination recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMetricToggle = (metricId: string) => {
    setSelectedMetrics(prev =>
      prev.includes(metricId)
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <CardTitle>智能指标推荐</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="flex flex-col h-full max-h-[calc(90vh-80px)]">
          {/* 标签页 */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            <Button
              variant={activeTab === 'query' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('query')}
              className="flex-1 flex items-center justify-center"
            >
              <Search className="h-4 w-4 mr-2" />
              查询推荐
            </Button>
            <Button
              variant={activeTab === 'component' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('component')}
              className="flex-1 flex items-center justify-center"
            >
              <Layout className="h-4 w-4 mr-2" />
              组件推荐
            </Button>
            <Button
              variant={activeTab === 'combination' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('combination')}
              className="flex-1 flex items-center justify-center"
            >
              <Target className="h-4 w-4 mr-2" />
              组合推荐
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* 查询推荐 */}
            {activeTab === 'query' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="描述您想要分析的指标，例如：'销售额趋势分析'"
                      value={queryInput}
                      onChange={(e) => setQueryInput(e.target.value)}
                      className="pl-10"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleQueryRecommendation()
                        }
                      }}
                    />
                  </div>
                  <Button 
                    onClick={handleQueryRecommendation}
                    disabled={!queryInput.trim() || loading}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    获取推荐
                  </Button>
                </div>

                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800">提示：</p>
                      <p>尝试输入如 "用户增长分析"、"销售业绩对比"、"客户转化漏斗" 等描述</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 组件推荐 */}
            {activeTab === 'component' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">选择图表类型：</span>
                  <select
                    value={selectedComponent}
                    onChange={(e) => setSelectedComponent(e.target.value as ComponentLayout['type'])}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {componentTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                  <Button 
                    onClick={handleComponentRecommendation}
                    disabled={loading}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    获取推荐
                  </Button>
                </div>

                <div className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Lightbulb className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800">提示：</p>
                      <p>系统会根据图表类型的特点推荐最适合的指标类型</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 组合推荐 */}
            {activeTab === 'combination' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">选择基础指标：</span>
                    <Button 
                      onClick={handleCombinationRecommendation}
                      disabled={selectedMetrics.length === 0 || loading}
                      size="sm"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      获取推荐
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-40 overflow-y-auto">
                    {availableMetrics.slice(0, 12).map(metric => (
                      <label key={metric._id} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedMetrics.includes(metric._id)}
                          onChange={() => handleMetricToggle(metric._id)}
                          className="rounded"
                        />
                        <span className="text-sm">{metric.displayName}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="text-sm text-gray-600 bg-purple-50 p-3 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Lightbulb className="h-4 w-4 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-purple-800">提示：</p>
                      <p>选择1-3个基础指标，系统会推荐与之相关的指标组合</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 推荐结果 */}
            {recommendations.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">推荐结果</h3>
                  <span className="text-sm text-gray-500">
                    找到 {recommendations.length} 个推荐指标
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.map((rec) => (
                    <div key={rec.metric._id} className="relative">
                      <MetricCard
                        metric={rec.metric}
                        onEdit={() => {}} // 推荐模式下不允许编辑
                        onDelete={() => {}} // 推荐模式下不允许删除
                        onTagClick={() => {}}
                        className="h-full"
                      />
                      
                      {/* 推荐信息覆盖层 */}
                      <div className="absolute top-2 right-2 bg-white border rounded-lg px-2 py-1 shadow-sm">
                        <div className="flex items-center space-x-2">
                          <div className="text-xs font-medium text-blue-600">
                            {Math.round(rec.confidence)}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {rec.reason}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 加载状态 */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-gray-600">正在分析推荐...</span>
                </div>
              </div>
            )}

            {/* 空状态 */}
            {recommendations.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Sparkles className="h-12 w-12 mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">开始智能推荐</p>
                <p className="text-sm text-center max-w-md">
                  选择上方的推荐方式，系统将基于AI算法为您推荐最合适的指标
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}