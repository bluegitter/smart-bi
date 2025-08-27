'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  Home, 
  BarChart3, 
  Database, 
  Settings, 
  TrendingUp,
  Table
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface SidebarProps {
  className?: string
}

const sidebarItems = [
  { icon: Home, label: '首页', href: '/' },
  { icon: Database, label: '数据源', href: '/datasources' },
  { icon: Table, label: '数据集', href: '/datasets' },
  { icon: BarChart3, label: '看板', href: '/dashboards' },
  { icon: Settings, label: '设置', href: '/settings' },
]


export function Sidebar({ className }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <aside className={cn(
      "w-full bg-slate-50 border-r border-slate-200 flex flex-col h-full overflow-hidden",
      className
    )}>
      {/* 导航菜单 */}
      <div className="p-4  border-slate-200">
        <nav className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Button
                key={item.label}
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  "w-full justify-start gap-3 h-10",
                  isActive && "bg-blue-50 text-blue-700 hover:bg-blue-50"
                )}
                onClick={() => router.push(item.href)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            )
          })}
        </nav>
      </div>

      
    </aside>
  )
}


