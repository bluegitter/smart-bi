'use client'

import React from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { useSidebarCollapsed } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const sidebarCollapsed = useSidebarCollapsed()
  
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-slate-50">
        {/* Header */}
        <Header />
        
        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className={cn(
            "transition-all duration-300 ease-in-out",
            sidebarCollapsed ? "w-0" : "w-80"
          )}>
            <Sidebar />
          </div>
          
          {/* Main content */}
          <main className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </main>
        </div>
        
        {/* Status bar */}
        <StatusBar />
      </div>
    </DndProvider>
  )
}