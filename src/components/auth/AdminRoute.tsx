'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { redirect } from 'next/navigation'
import { Shield, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'

interface AdminRouteProps {
  children: React.ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading } = useAuth()

  // 显示加载状态
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // 用户未登录
  if (!user) {
    redirect('/login')
  }

  // 用户不是管理员
  if (user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              权限不足
            </h2>
            <p className="text-gray-600 mb-4">
              您需要管理员权限才能访问此页面
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-yellow-700 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200">
              <AlertTriangle className="h-4 w-4" />
              <span>当前角色: {user.role === 'user' ? '普通用户' : '观察者'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 用户是管理员，渲染子组件
  return <>{children}</>
}