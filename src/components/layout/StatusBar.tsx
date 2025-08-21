'use client'

import React from 'react'
import { Wifi, WifiOff, Save, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StatusBar() {
  const [isOnline, setIsOnline] = React.useState(true)
  const [lastSaved, setLastSaved] = React.useState<Date>(new Date())

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const formatLastSaved = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return '刚刚保存'
    if (minutes < 60) return `${minutes}分钟前保存`
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="h-6 bg-slate-100 border-t border-slate-200 px-4 flex items-center justify-between text-xs text-slate-600">
      {/* 左侧：自动保存状态 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Save className="h-3 w-3" />
          <span>{formatLastSaved(lastSaved)}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{new Date().toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          })}</span>
        </div>
      </div>

      {/* 右侧：连接状态 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          {isOnline ? (
            <>
              <Wifi className="h-3 w-3 text-green-600" />
              <span className="text-green-600">已连接</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 text-red-600" />
              <span className="text-red-600">离线</span>
            </>
          )}
        </div>
        
        <div>
          <span>Smart BI v1.0.0</span>
        </div>
      </div>
    </div>
  )
}