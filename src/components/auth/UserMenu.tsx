'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Settings, LogOut, ChevronDown, Shield } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'

export function UserMenu() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-purple-600 bg-purple-100'
      case 'user': return 'text-blue-600 bg-blue-100'
      case 'viewer': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return '管理员'
      case 'user': return '用户'
      case 'viewer': return '观察者'
      default: return '未知'
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        className="flex items-center gap-2 px-3 py-2 h-auto"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* 用户头像 */}
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          {user.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt={user.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="h-4 w-4 text-blue-600" />
          )}
        </div>
        
        {/* 用户信息 */}
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium">{user.name}</div>
          <div className="text-xs text-gray-500">{user.email}</div>
        </div>
        
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* 用户信息 */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                {user.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{user.name}</div>
                <div className="text-sm text-gray-500 truncate">{user.email}</div>
                <div className="flex items-center gap-1 mt-1">
                  <Shield className="h-3 w-3" />
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(user.role)}`}>
                    {getRoleText(user.role)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 菜单项 */}
          <div className="py-2">
            <button
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm"
              onClick={() => {
                setIsOpen(false)
                router.push('/profile')
              }}
            >
              <User className="h-4 w-4" />
              个人资料
            </button>
            
            <button
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm"
              onClick={() => {
                setIsOpen(false)
                router.push('/settings')
              }}
            >
              <Settings className="h-4 w-4" />
              系统设置
            </button>
          </div>

          {/* 退出登录 */}
          <div className="border-t border-gray-200 py-2">
            <button
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-red-600"
              onClick={() => {
                setIsOpen(false)
                handleLogout()
              }}
            >
              <LogOut className="h-4 w-4" />
              退出登录
            </button>
          </div>
        </div>
      )}
    </div>
  )
}