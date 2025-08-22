'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'user' | 'viewer'
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(redirectTo)
        return
      }

      // 检查角色权限
      if (requiredRole && user) {
        const roleHierarchy = {
          'viewer': 1,
          'user': 2,
          'admin': 3
        }

        const userLevel = roleHierarchy[user.role]
        const requiredLevel = roleHierarchy[requiredRole]

        if (userLevel < requiredLevel) {
          router.push('/unauthorized')
          return
        }
      }
    }
  }, [isAuthenticated, isLoading, user, requiredRole, router, redirectTo])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">验证用户身份中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // 重定向中
  }

  if (requiredRole && user) {
    const roleHierarchy = {
      'viewer': 1,
      'user': 2,
      'admin': 3
    }

    const userLevel = roleHierarchy[user.role]
    const requiredLevel = roleHierarchy[requiredRole]

    if (userLevel < requiredLevel) {
      return null // 重定向中
    }
  }

  return <>{children}</>
}