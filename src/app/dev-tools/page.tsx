'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Database, Trash2, Plus, Key, RefreshCw } from 'lucide-react'

export default function DevToolsPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [token, setToken] = useState('')

  const handleGetToken = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dev/token')
      const data = await response.json()
      
      if (data.token) {
        localStorage.setItem('token', data.token)
        setToken(data.token)
        setMessage('开发token已生成并保存到localStorage')
      } else {
        setMessage('获取token失败: ' + data.error)
      }
    } catch (error) {
      setMessage('获取token失败: ' + error)
    } finally {
      setLoading(false)
    }
  }

  const handleInitSeedData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dev/seed', {
        method: 'POST'
      })
      const data = await response.json()
      
      setMessage(data.success ? data.message : '初始化失败: ' + data.error)
    } catch (error) {
      setMessage('初始化失败: ' + error)
    } finally {
      setLoading(false)
    }
  }

  const handleClearData = async () => {
    if (!confirm('确定要清除所有数据吗？此操作不可恢复！')) {
      return
    }
    
    try {
      setLoading(true)
      const response = await fetch('/api/dev/seed', {
        method: 'DELETE'
      })
      const data = await response.json()
      
      setMessage(data.success ? data.message : '清除失败: ' + data.error)
    } catch (error) {
      setMessage('清除失败: ' + error)
    } finally {
      setLoading(false)
    }
  }

  // 检查当前token
  React.useEffect(() => {
    const currentToken = localStorage.getItem('token')
    if (currentToken) {
      setToken(currentToken)
    }
  }, [])

  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">404</h1>
          <p className="text-gray-600">页面不存在</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-2">开发工具</h1>
          <p className="text-muted-foreground">
            开发环境专用工具，用于管理测试数据和认证
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('失败') || message.includes('错误') 
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 认证管理 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                认证管理
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  当前token状态: {token ? '已设置' : '未设置'}
                </p>
                {token && (
                  <p className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded break-all">
                    {token.substring(0, 50)}...
                  </p>
                )}
              </div>
              <Button 
                onClick={handleGetToken}
                disabled={loading}
                className="w-full"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Key className="h-4 w-4 mr-2" />}
                生成开发Token
              </Button>
            </CardContent>
          </Card>

          {/* 数据管理 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                数据管理
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                管理MongoDB中的种子数据，包括数据源和指标
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={handleInitSeedData}
                  disabled={loading}
                  className="w-full"
                  variant="default"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  初始化种子数据
                </Button>
                <Button 
                  onClick={handleClearData}
                  disabled={loading}
                  className="w-full"
                  variant="destructive"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  清除所有数据
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 使用说明 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>使用说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. 生成认证Token</h4>
              <p className="text-sm text-gray-600">
                点击"生成开发Token"来获取一个用于API访问的JWT token。这个token会自动保存到localStorage中。
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">2. 初始化数据</h4>
              <p className="text-sm text-gray-600">
                点击"初始化种子数据"来创建示例数据源和指标。这将帮助您快速开始使用系统。
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">3. 清除数据</h4>
              <p className="text-sm text-gray-600">
                如果需要重新开始，可以点击"清除所有数据"来删除所有数据源和指标。
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>注意：</strong> 此页面仅在开发环境中可用。在生产环境中将返回404错误。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}