'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { CreateDashboardModal } from '@/components/dashboard/CreateDashboardModal'

// 模拟看板数据
const mockDashboards = [
  {
    id: '1',
    name: '销售业绩看板',
    description: '展示销售团队的关键业绩指标',
    updatedAt: '2024-01-15',
    owner: '张三',
    isPublic: false,
    components: 8,
  },
  {
    id: '2',
    name: '用户行为分析',
    description: '用户活跃度和行为漏斗分析',
    updatedAt: '2024-01-14',
    owner: '李四',
    isPublic: true,
    components: 12,
  },
  {
    id: '3',
    name: '财务报表',
    description: '月度和季度财务数据汇总',
    updatedAt: '2024-01-13',
    owner: '王五',
    isPublic: false,
    components: 6,
  },
]

export default function DashboardsPage() {
  const router = useRouter()
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)

  const handleCreateDashboard = (dashboardData: {
    name: string
    description: string
    template: { id: string; name: string } | null
  }) => {
    console.log('Creating dashboard:', dashboardData)
    
    // 构建编辑器路由参数
    const params = new URLSearchParams({
      name: dashboardData.name,
    })
    
    if (dashboardData.template) {
      params.append('template', dashboardData.template.id)
    }
    
    // 导航到编辑器页面
    router.push(`/dashboards/editor?${params.toString()}`)
  }

  return (
    <div className="flex-1 p-6">
      {/* 页面头部 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold">我的看板</h1>
            <p className="text-slate-500">管理和创建您的数据看板</p>
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
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            筛选
          </Button>
        </div>
      </div>

      {/* 看板列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockDashboards.map((dashboard) => (
          <Card key={dashboard.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{dashboard.name}</CardTitle>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                    {dashboard.description}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-slate-500">
                <div className="flex items-center gap-4">
                  <span>{dashboard.components} 个组件</span>
                  {dashboard.isPublic && (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                      公开
                    </span>
                  )}
                </div>
                <div>
                  更新于 {dashboard.updatedAt}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    创建者: {dashboard.owner}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/dashboards/editor?name=${encodeURIComponent(dashboard.name)}`)
                      }}
                    >
                      编辑
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/dashboards/editor?name=${encodeURIComponent(dashboard.name)}&preview=true`)
                      }}
                    >
                      查看
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

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
  )
}