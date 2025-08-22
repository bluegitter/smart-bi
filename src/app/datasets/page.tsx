'use client'

import React from 'react'
import { Search, Plus, Filter, Database, Table, FileCode, Eye, BarChart3, Calendar, Tag, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { CreateDatasetModal } from '@/components/dataset/CreateDatasetModal'
import { DatasetCard } from '@/components/dataset/DatasetCard'
import { useDatasets } from '@/hooks/useDatasets'
import { cn } from '@/lib/utils'
import type { Dataset, DatasetType } from '@/types/dataset'

export default function DatasetsPage() {
  const {
    datasets,
    loading,
    error,
    pagination,
    filters,
    searchDatasets,
    refreshDatasets
  } = useDatasets()
  
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState<string>('全部')
  const [selectedType, setSelectedType] = React.useState<DatasetType | '全部'>('全部')
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [searchTimeout, setSearchTimeout] = React.useState<NodeJS.Timeout>()

  // 处理搜索
  const handleSearch = React.useCallback(() => {
    const params = {
      keyword: searchTerm || undefined,
      category: selectedCategory === '全部' ? undefined : selectedCategory,
      type: selectedType === '全部' ? undefined : selectedType,
      page: 1
    }
    searchDatasets(params)
  }, [searchTerm, selectedCategory, selectedType, searchDatasets])

  // 防抖搜索
  React.useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    const timeout = setTimeout(() => {
      handleSearch()
    }, 500)
    
    setSearchTimeout(timeout)
    
    return () => clearTimeout(timeout)
  }, [searchTerm])

  // 分类和类型变化时立即搜索
  React.useEffect(() => {
    handleSearch()
  }, [selectedCategory, selectedType])

  const getTypeIcon = (type: DatasetType) => {
    switch (type) {
      case 'table':
        return <Table className="h-4 w-4" />
      case 'sql':
        return <FileCode className="h-4 w-4" />
      case 'view':
        return <Eye className="h-4 w-4" />
      default:
        return <Database className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: DatasetType) => {
    switch (type) {
      case 'table':
        return '数据表'
      case 'sql':
        return 'SQL查询'
      case 'view':
        return '数据视图'
      default:
        return type
    }
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">
          <div className="text-red-600 mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refreshDatasets}>
            重新加载
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">数据集管理</h1>
          <p className="text-gray-600">创建和管理您的数据集，为看板提供数据源</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshDatasets}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            刷新
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新建数据集
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">总数据集</p>
                <p className="text-xl font-semibold">{pagination.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Table className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">数据表</p>
                <p className="text-xl font-semibold">
                  {datasets.filter(d => d.type === 'table').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileCode className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">SQL查询</p>
                <p className="text-xl font-semibold">
                  {datasets.filter(d => d.type === 'sql').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Eye className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">数据视图</p>
                <p className="text-xl font-semibold">
                  {datasets.filter(d => d.type === 'view').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和过滤 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 搜索框 */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索数据集名称、描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* 分类筛选 */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">分类:</span>
              {['全部', ...filters.categories].map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="text-xs"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {category}
                </Button>
              ))}
            </div>
          </div>
          
          {/* 类型筛选 */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">类型:</span>
              {(['全部', ...filters.types] as const).map((type) => (
                <Button
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                  className="text-xs"
                >
                  {type !== '全部' && getTypeIcon(type)}
                  <span className={type !== '全部' ? 'ml-1' : ''}>
                    {type === '全部' ? '全部' : getTypeLabel(type)}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 数据集列表 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : datasets.length === 0 ? (
        <div className="text-center py-12">
          <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无数据集</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedCategory !== '全部' || selectedType !== '全部' 
              ? '没有找到匹配的数据集，请尝试调整搜索条件' 
              : '开始创建您的第一个数据集'}
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            创建数据集
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {datasets.map((dataset) => (
              <DatasetCard
                key={dataset._id}
                dataset={dataset}
                onRefresh={refreshDatasets}
              />
            ))}
          </div>
          
          {/* 分页 */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => searchDatasets({ page: pagination.page - 1 })}
              >
                上一页
              </Button>
              
              <span className="text-sm text-gray-600">
                第 {pagination.page} 页，共 {pagination.totalPages} 页
              </span>
              
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => searchDatasets({ page: pagination.page + 1 })}
              >
                下一页
              </Button>
            </div>
          )}
        </>
      )}

      {/* 创建数据集模态框 */}
      <CreateDatasetModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={refreshDatasets}
      />
    </div>
  )
}