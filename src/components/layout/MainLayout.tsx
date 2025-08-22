'use client'

import React from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { usePathname } from 'next/navigation'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { useSidebarCollapsed, useHeaderHidden, useIsFullscreen } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname()
  const sidebarCollapsed = useSidebarCollapsed()
  const headerHidden = useHeaderHidden()
  const isFullscreen = useIsFullscreen()
  
  // 检查是否在看板页面，需要特殊的滚动处理
  const isDashboardPage = pathname?.includes('/dashboard')
  
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-slate-50">
        {/* Header - 可隐藏 */}
        {!headerHidden && <Header />}
        
        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - 全屏模式或手动折叠时隐藏 */}
          <div className={cn(
            "transition-all duration-300 ease-in-out",
            (sidebarCollapsed || isFullscreen) ? "w-0" : "w-80"
          )}>
            <Sidebar />
          </div>
          
          {/* Main content */}
          <main className={cn(
            "flex-1 flex flex-col",
            isDashboardPage ? "overflow-visible" : "overflow-hidden"
          )}>
            <div className={cn(
              "flex-1",
              isDashboardPage ? "overflow-visible" : "overflow-auto"
            )}>
              {children}
            </div>
          </main>
        </div>
        
        {/* Status bar - 全屏模式时隐藏 */}
        {!isFullscreen && <StatusBar />}
      </div>
    </DndProvider>
  )
}