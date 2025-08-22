'use client'

import React, { useState } from 'react'
import { Plus, Search, Filter, Tag, Edit2, Trash2, Database, Sparkles, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { CreateMetricModal } from '@/components/metrics/CreateMetricModal'
import { EditMetricModal } from '@/components/metrics/EditMetricModal'
import { MetricCard } from '@/components/metrics/MetricCard'
import { MetricRecommendations } from '@/components/metrics/MetricRecommendations'
import { useMetrics } from '@/hooks/useMetrics'
import { usePermissions } from '@/lib/permissionsService'
import type { Metric } from '@/types'

export default function MetricsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingMetric, setEditingMetric] = useState<Metric | null>(null)
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const {
    metrics,
    loading,
    error,
    categories,
    allTags,
    total,
    // 操作方法
    createMetric,
    updateMetric,
    deleteMetric,
    // 搜索和过滤
    setSearch,
    setCategory,
    setTags,
    clearFilters
  } = useMetrics({ autoFetch: true })

  const permissions = usePermissions()

  // 过滤后的指标 (应用权限过滤)
  const filteredMetrics = permissions.filterMetricsByPermission(metrics, 'read')
  
  // 检查权限
  const canCreateMetric = permissions.canCreateMetric()
  const canAccessManagement = permissions.canAccessMetricsManagement()

  // 如果没有访问权限，显示权限不足页面
  if (!canAccessManagement) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">访问受限</h1>
          <p className="text-gray-600">您没有权限访问指标管理页面</p>
        </div>
      </div>
    )
  }

  // 创建指标
  const handleCreateMetric = async (metricData: Partial<Metric>) => {
    try {
      await createMetric(metricData)
      setShowCreateModal(false)
    } catch (error) {
      console.error('Error creating metric:', error)
      alert(error instanceof Error ? error.message : 'Failed to create metric')
    }
  }

  // 更新指标
  const handleUpdateMetric = async (id: string, metricData: Partial<Metric>) => {
    try {
      await updateMetric(id, metricData)
      setEditingMetric(null)
    } catch (error) {
      console.error('Error updating metric:', error)
      alert(error instanceof Error ? error.message : 'Failed to update metric')
    }
  }

  // 删除指标
  const handleDeleteMetric = async (id: string) => {
    if (!confirm('确定要删除这个指标吗？')) return
    
    try {
      await deleteMetric(id)
    } catch (error) {
      console.error('Error deleting metric:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete metric')
    }
  }

  // 处理指标编辑 - 根据指标类型路由到不同的编辑界面
  const handleEditMetric = (metric: Metric) => {
    // 检查是否是SQL构建器创建的指标
    // 判断条件：有queryConfig字段且（有customSql或没有传统formula）
    const isSQLBuilderMetric = metric.queryConfig && (
      (metric.queryConfig.customSql && metric.queryConfig.customSql.trim().length > 0) ||
      (!metric.formula || metric.formula.trim().length === 0)
    )
    
    if (isSQLBuilderMetric) {
      // SQL构建器创建的指标，跳转到构建器页面
      router.push(`/metrics/builder?id=${metric._id}`)
    } else {
      // 普通指标，使用对话框编辑
      setEditingMetric(metric)
    }
  }

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setSearch(value)
  }

  // 处理标签点击
  const handleTagClick = (tag: string) => {
    setTags([tag]) // 只选择单个标签
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">指标库</h1>
          <p className="text-muted-foreground">
            管理和配置数据指标，支持拖拽到看板组件中
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setShowRecommendations(!showRecommendations)}
            className="flex items-center"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            智能推荐
          </Button>
          {canCreateMetric && (
            <>
              <Button 
                variant="outline"
                onClick={() => window.open('/metrics/builder', '_blank')}
              >
                <Database className="w-4 h-4 mr-2" />
                SQL构建器
              </Button>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                新建指标
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 搜索和过滤器 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            {/* 搜索框 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索指标名称、描述..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* 分类过滤 */}
            <select
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">所有分类</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* 清除过滤器 */}
            <Button variant="outline" onClick={clearFilters} className="flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              清除过滤器
            </Button>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 指标统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">总指标数</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Tag className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">分类数</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Filter className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">筛选结果</p>
                <p className="text-2xl font-bold">{filteredMetrics.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Tag className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">标签数</p>
                <p className="text-2xl font-bold">{allTags.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 智能推荐面板 */}
      {showRecommendations && (
        <MetricRecommendations
          onClose={() => setShowRecommendations(false)}
          availableMetrics={metrics}
        />
      )}

      {/* 指标列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // 加载状态
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))
        ) : filteredMetrics.length === 0 ? (
          // 空状态
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <Database className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无指标</h3>
            <p className="text-gray-500 mb-4">开始创建您的第一个数据指标</p>
            <div className="flex space-x-2">
              {canCreateMetric && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  新建指标
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowRecommendations(true)}>
                <Sparkles className="w-4 h-4 mr-2" />
                智能推荐
              </Button>
            </div>
          </div>
        ) : (
          // 指标卡片
          filteredMetrics.map((metric) => (
            <MetricCard
              key={metric._id}
              metric={metric}
              onEdit={handleEditMetric}
              onDelete={() => handleDeleteMetric(metric._id)}
              onTagClick={handleTagClick}
            />
          ))
        )}
      </div>

      {/* 创建指标模态框 */}
      {showCreateModal && canCreateMetric && (
        <CreateMetricModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateMetric}
          categories={categories}
          allTags={allTags}
        />
      )}

      {/* 编辑指标模态框 */}
      {editingMetric && (
        <EditMetricModal
          metric={editingMetric}
          onClose={() => setEditingMetric(null)}
          onSubmit={(data) => handleUpdateMetric(editingMetric._id, data)}
          categories={categories}
          allTags={allTags}
        />
      )}
    </div>
  )
}