'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  Home, 
  BarChart3, 
  Database, 
  Settings, 
  TrendingUp,
  Table,
  Activity,
  Users,
  Clock,
  ChevronRight,
  Plus,
  Search,
  Bell,
  HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

interface SidebarProps {
  className?: string
}

const sidebarItems = [
  { icon: Home, label: '首页', href: '/', badge: null },
  { icon: Database, label: '数据源', href: '/datasources', badge: null },
  { icon: Table, label: '数据集', href: '/datasets', badge: null },
  { icon: BarChart3, label: '看板', href: '/dashboards', badge: null },
  { icon: Settings, label: '设置', href: '/settings', badge: null },
]

const quickActions = [
  { icon: Plus, label: '新建看板', action: 'create-dashboard' },
  { icon: Database, label: '添加数据源', action: 'create-datasource' },
  { icon: Search, label: '搜索数据', action: 'search' },
]

export function Sidebar({ className }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'create-dashboard':
        router.push('/dashboards/editor')
        break
      case 'create-datasource':
        router.push('/datasources?action=create')
        break
      case 'search':
        // 这里可以触发全局搜索
        console.log('Search action triggered')
        break
    }
  }

  return (
    <aside className={cn(
      "w-56 bg-white border-r border-slate-200/60 flex flex-col h-full overflow-hidden shadow-sm",
      className
    )}>
      {/* 用户信息区 */}
      <div className="p-4 border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white font-semibold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-slate-900 text-sm truncate">
              {user?.name || '用户'}
            </div>
            <div className="text-xs text-slate-500 truncate">
              {user?.email || 'user@example.com'}
            </div>
          </div>
        </div>
      </div>

      {/* 主导航菜单 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 px-2">
            主要功能
          </div>
          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <button
                  key={item.label}
                  onClick={() => router.push(item.href)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group",
                    isActive 
                      ? "bg-blue-50 text-blue-700 shadow-sm" 
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn(
                      "h-5 w-5 transition-colors",
                      isActive ? "text-blue-600" : "text-slate-500 group-hover:text-slate-700"
                    )} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* 快速操作 */}
        <div className="p-3 border-t border-slate-100">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 px-2">
            快速操作
          </div>
          <div className="space-y-1">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.action}
                  onClick={() => handleQuickAction(action.action)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all duration-200 group"
                >
                  <Icon className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                  <span>{action.label}</span>
                  <ChevronRight className="h-3 w-3 text-slate-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )
            })}
          </div>
        </div>

        {/* 系统状态 */}
        <div className="p-3 border-t border-slate-100">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 px-2">
            系统状态
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50/50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-slate-700">服务正常</span>
              </div>
              <Activity className="h-3 w-3 text-slate-400" />
            </div>
            
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-slate-400" />
                <span className="text-xs text-slate-600">最后同步</span>
              </div>
              <span className="text-xs text-slate-500">2分钟前</span>
            </div>
          </div>
        </div>
      </div>

      {/* 底部帮助和通知 */}
      <div className="p-3 border-t border-slate-200/60 bg-slate-50/30">
        <div className="flex items-center justify-between">
          <button className="flex items-center justify-center w-9 h-9 text-slate-500 hover:text-slate-700 hover:bg-white rounded-lg transition-all duration-200 shadow-sm">
            <Bell className="h-4 w-4" />
          </button>
          <button className="flex items-center justify-center w-9 h-9 text-slate-500 hover:text-slate-700 hover:bg-white rounded-lg transition-all duration-200 shadow-sm">
            <HelpCircle className="h-4 w-4" />
          </button>
          <button className="flex items-center justify-center w-9 h-9 text-slate-500 hover:text-slate-700 hover:bg-white rounded-lg transition-all duration-200 shadow-sm">
            <Settings className="h-4 w-4" />
          </button>
        </div>
        
        <div className="mt-3 text-center">
          <div className="text-xs text-slate-500">Smart BI v2.0</div>
        </div>
      </div>
    </aside>
  )
}


