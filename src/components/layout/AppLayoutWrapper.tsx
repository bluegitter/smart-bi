'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { MainLayout } from './MainLayout'
import { useAuth } from '@/contexts/AuthContext'

interface AppLayoutWrapperProps {
  children: React.ReactNode
}

export function AppLayoutWrapper({ children }: AppLayoutWrapperProps) {
  const pathname = usePathname()
  const { isAuthenticated, isLoading } = useAuth()

  // 不需要主布局的页面
  const noLayoutPages = ['/login', '/unauthorized']
  const shouldShowMainLayout = !noLayoutPages.includes(pathname) && isAuthenticated

  // 在加载状态时显示最小布局
  if (isLoading) {
    return <>{children}</>
  }

  if (shouldShowMainLayout) {
    return (
      <MainLayout>
        {children}
      </MainLayout>
    )
  }

  return <>{children}</>
}