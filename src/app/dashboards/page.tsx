'use client'

import React, { useState } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { CreateDashboardModal } from '@/components/dashboard/CreateDashboardModal'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { useDashboards } from '@/hooks/useDashboards'
import type { Dashboard } from '@/types'

export default function DashboardsPage() {
  const router = useRouter()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const {
    dashboards,
    loading,
    error,
    total,
    createDashboard,
    deleteDashboard,
    cloneDashboard,
    searchDashboards
  } = useDashboards({ autoFetch: true })

  const handleCreateDashboard = async (dashboardData: {
    name: string
    description: string
    template: { id: string; name: string } | null
  }) => {
    try {
      console.log('Creating dashboard:', dashboardData)
      
      // 创建新看板
      const newDashboard = await createDashboard({
        name: dashboardData.name,
        description: dashboardData.description,
        layout: {
          grid: { columns: 12, rows: 8 },
          components: [] // 初始为空，在编辑器中根据模板添加组件
        },
        globalConfig: {
          theme: 'light',
          refreshInterval: 300000,
          timezone: 'Asia/Shanghai'
        }
      })
      
      // 构建编辑器路由参数
      const params = new URLSearchParams({
        id: newDashboard._id,
        name: newDashboard.name,
      })
      
      if (dashboardData.template) {
        params.append('template', dashboardData.template.id)
      }
      
      // 添加一个小延迟确保数据同步，然后导航到编辑器页面
      setTimeout(() => {
        router.push(`/dashboards/editor?${params.toString()}`)
      }, 100)
      setIsCreateModalOpen(false)
    } catch (error) {
      console.error('Failed to create dashboard:', error)
      alert('创建看板失败: ' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchQuery(value)
    searchDashboards(value)
  }

  // 处理克隆看板
  const handleCloneDashboard = async (dashboard: Dashboard) => {
    try {
      const clonedName = `${dashboard.name} (副本)`
      const cloned = await cloneDashboard(dashboard._id, clonedName)
      console.log('Dashboard cloned successfully:', cloned)
    } catch (error) {
      console.error('Failed to clone dashboard:', error)
      alert('克隆看板失败: ' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  // 处理删除看板
  const handleDeleteDashboard = async (dashboard: Dashboard) => {
    if (!confirm(`确定要删除看板 "${dashboard.name}" 吗？此操作无法撤销。`)) {
      return
    }

    try {
      await deleteDashboard(dashboard._id)
      console.log('Dashboard deleted successfully')
    } catch (error) {
      console.error('Failed to delete dashboard:', error)
      alert('删除看板失败: ' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  // 格式化日期
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <ProtectedRoute>
      <div className="flex-1 p-6">
      {/* 页面头部 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold">我的看板</h1>
            <p className="text-slate-500">
              {loading ? '加载中...' : `共 ${total} 个看板`}
            </p>
          </div>
          <Button 
            className="flex items-center gap-2"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            新建看板
          </Button>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="搜索看板..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            筛选
          </Button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* 看板列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // 加载状态
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))
        ) : dashboards.length === 0 ? (
          // 空状态
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? '未找到匹配的看板' : '暂无看板'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? '尝试调整搜索条件' : '开始创建您的第一个数据看板'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                新建看板
              </Button>
            )}
          </div>
        ) : (
          dashboards.map((dashboard) => (
            <DashboardCard
              key={dashboard._id}
              dashboard={dashboard}
              onEdit={() => {
                router.push(`/dashboards/editor?id=${dashboard._id}&name=${encodeURIComponent(dashboard.name)}`)
              }}
              onView={() => {
                router.push(`/dashboards/editor?id=${dashboard._id}&name=${encodeURIComponent(dashboard.name)}&preview=true`)
              }}
              onClone={() => handleCloneDashboard(dashboard)}
              onDelete={() => handleDeleteDashboard(dashboard)}
              formatDate={formatDate}
            />
          ))
        )}

        {/* 新建看板卡片 */}
        <Card 
          className="border-2 border-dashed border-slate-300 hover:border-slate-400 transition-colors cursor-pointer"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="font-medium mb-2">创建新看板</h3>
            <p className="text-sm text-slate-500 mb-4">
              开始构建您的数据可视化看板
            </p>
            <Button variant="outline">
              立即创建
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* 创建看板模态框 */}
      <CreateDashboardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateDashboard={handleCreateDashboard}
      />
      </div>
    </ProtectedRoute>
  )
}