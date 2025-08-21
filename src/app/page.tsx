'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, BarChart3, Brain, Zap, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export default function HomePage() {
  const router = useRouter()
  
  return (
    <div className="flex-1 overflow-auto">
      {/* 欢迎横幅 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">欢迎使用 Smart BI</h1>
          <p className="text-xl mb-6 opacity-90">
            基于AI的智能数据分析和可视化平台，让数据洞察变得简单
          </p>
          <div className="flex items-center gap-4">
            <Button 
              className="bg-white text-blue-600 hover:bg-slate-50"
              onClick={() => router.push('/dashboards')}
            >
              开始使用
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white/10">
              观看演示
            </Button>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          {/* 快速入门 */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">快速入门</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push('/dashboards')}
              >
                <CardHeader className="pb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">创建看板</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">
                    使用拖拽组件快速构建数据看板
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                    <Brain className="h-5 w-5 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">AI 生成</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">
                    通过自然语言描述自动生成看板
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push('/datasources')}
              >
                <CardHeader className="pb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                    <Zap className="h-5 w-5 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">连接数据</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">
                    连接各种数据源，统一管理数据
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-2">
                    <Users className="h-5 w-5 text-orange-600" />
                  </div>
                  <CardTitle className="text-lg">团队协作</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">
                    与团队成员共享和协作编辑看板
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* 最近活动 */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">最近活动</h2>
              <Button variant="outline">查看全部</Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 最近看板 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">最近访问的看板</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: '销售业绩看板', time: '2小时前', status: '已更新' },
                      { name: '用户行为分析', time: '昨天', status: '正常' },
                      { name: '财务报表', time: '3天前', status: '正常' },
                    ].map((dashboard, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded hover:bg-slate-50">
                        <div>
                          <div className="font-medium text-sm">{dashboard.name}</div>
                          <div className="text-xs text-slate-500">{dashboard.time}</div>
                        </div>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          {dashboard.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 系统状态 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">系统状态</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">数据源连接</span>
                      <span className="text-sm text-green-600">✓ 正常</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">AI 服务</span>
                      <span className="text-sm text-green-600">✓ 正常</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">缓存服务</span>
                      <span className="text-sm text-green-600">✓ 正常</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">数据同步</span>
                      <span className="text-sm text-yellow-600">⚠ 延迟</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
