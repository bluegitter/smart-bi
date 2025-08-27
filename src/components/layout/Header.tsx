'use client'

import React from 'react'
import { MessageSquare, Menu } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { UserMenu } from '@/components/auth/UserMenu'
import { GlobalSearch } from '@/components/search/GlobalSearch'
import { AIChatDialog } from '@/components/ai/AIChatDialog'
import { useAuth } from '@/contexts/AuthContext'
import { useActions } from '@/store/useAppStore'

export function Header() {
  const { user } = useAuth()
  const { toggleSidebar } = useActions()
  const [isAIChatOpen, setIsAIChatOpen] = React.useState(false)

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-4 flex items-center justify-between">
      {/* 左侧：Logo和菜单切换 */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
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
        <GlobalSearch className="flex-1" />
        <Button 
          variant="outline" 
          className="flex items-center gap-2 whitespace-nowrap"
          onClick={() => setIsAIChatOpen(true)}
        >
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">AI 问答</span>
        </Button>
      </div>

      {/* 右侧：用户菜单 */}
      <div className="flex items-center gap-2">
        <UserMenu />
      </div>

      {/* AI聊天对话框 */}
      <AIChatDialog 
        isOpen={isAIChatOpen} 
        onClose={() => setIsAIChatOpen(false)} 
      />
    </header>
  )
}