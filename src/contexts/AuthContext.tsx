'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@/types'
import { setAuthToken, removeAuthToken, getAuthHeaders } from '@/lib/authUtils'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  // 检查用户认证状态
  const refreshUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({}),
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
        removeAuthToken()
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
      setUser(null)
      removeAuthToken()
    } finally {
      setIsLoading(false)
    }
  }

  // 登录
  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '登录失败')
      }

      const data = await response.json()
      setUser(data.user)
      
      // Save token to localStorage for subsequent API calls
      if (data.token) {
        setAuthToken(data.token)
      }
    } catch (error) {
      throw error
    }
  }

  // 退出登录
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      removeAuthToken()
    }
  }

  // 初始化时检查认证状态
  useEffect(() => {
    refreshUser()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}