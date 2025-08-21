'use client'

import React from 'react'
import { Search, MessageSquare, User, Menu } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useActions, useSidebarCollapsed, useUser } from '@/store/useAppStore'

export function Header() {
  const user = useUser()
  const sidebarCollapsed = useSidebarCollapsed()
  const { toggleSidebar } = useActions()

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-4 flex items-center justify-between">
      {/* 左侧：Logo和菜单切换 */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">BI</span>
          </div>
          <span className="font-semibold text-lg hidden sm:inline">Smart BI</span>
        </div>
      </div>

      {/* 中间：搜索栏和AI问答 */}
      <div className="flex-1 max-w-2xl mx-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="搜索看板、指标或数据源..."
            className="pl-10 pr-4"
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">AI 问答</span>
        </Button>
      </div>

      {/* 右侧：用户信息 */}
      <div className="flex items-center gap-2">
        {user ? (
          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-xs text-slate-500 capitalize">{user.role}</div>
            </div>
            <Button variant="ghost" size="icon" className="relative">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <User className="h-5 w-5" />
              )}
            </Button>
          </div>
        ) : (
          <Button variant="outline">登录</Button>
        )}
      </div>
    </header>
  )
}