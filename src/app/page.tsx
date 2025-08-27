'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, BarChart3, Brain, Zap, Database, Loader2, TrendingUp, Users, Shield, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'

export default function HomePage() {
  const router = useRouter()
  const { isLoading } = useAuth()


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }
  
  return (
    <ProtectedRoute>
      <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30">
        {/* 精致的欢迎区域 */}
        <div className="relative bg-white border-b border-slate-200/60">
          {/* 微妙的背景装饰 */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 to-blue-50/30" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl" />
          
          <div className="relative max-w-7xl mx-auto px-8 py-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="space-y-6">
                  <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200/50 rounded-full text-blue-700 text-sm font-medium">
                    <Zap className="w-4 h-4 mr-2" />
                    智能数据分析平台
                  </div>
                  
                  <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
                    欢迎使用
                    <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Smart BI
                    </span>
                  </h1>
                  
                  <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
                    基于人工智能技术的企业级数据分析和可视化平台，助您从海量数据中获得有价值的商业洞察
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => router.push('/dashboards')}
                    className="
                      inline-flex items-center justify-center px-8 py-3 bg-slate-900 text-white
                      font-medium rounded-xl shadow-lg hover:bg-slate-800 
                      focus:outline-none focus:ring-2 focus:ring-slate-400/50
                      transition-all duration-200 transform hover:scale-105 hover:shadow-xl
                    "
                  >
                    开始使用
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => router.push('/demo')}
                    className="
                      inline-flex items-center justify-center px-8 py-3 bg-white text-slate-700
                      border border-slate-300 font-medium rounded-xl shadow-sm
                      hover:bg-slate-50 hover:border-slate-400 hover:shadow-md
                      focus:outline-none focus:ring-2 focus:ring-slate-300/50
                      transition-all duration-200
                    "
                  >
                    查看演示
                  </button>
                </div>
              </div>

              {/* 数据可视化预览 */}
              <div className="relative">
                <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-xl">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-slate-700">实时数据概览</h3>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    </div>
                    
                    {/* 模拟图表 */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                        <div className="text-xs text-blue-600 font-medium mb-1">总收入</div>
                        <div className="text-lg font-bold text-blue-900">¥2,847,392</div>
                        <div className="text-xs text-green-600">↗ +12.5%</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                        <div className="text-xs text-purple-600 font-medium mb-1">活跃用户</div>
                        <div className="text-lg font-bold text-purple-900">18,492</div>
                        <div className="text-xs text-green-600">↗ +8.2%</div>
                      </div>
                    </div>
                    
                    {/* 模拟趋势线 */}
                    <div className="h-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg flex items-end justify-between px-2 py-2">
                      {[40, 65, 55, 80, 70, 95, 85].map((height, i) => (
                        <div
                          key={i}
                          className="bg-gradient-to-t from-blue-500 to-purple-500 rounded-sm w-3 transition-all duration-500"
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 主要功能区域 */}
        <div className="max-w-7xl mx-auto px-8 py-16">
          {/* 核心功能 */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">核心功能</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                从数据连接到智能洞察，全流程数据分析解决方案
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div 
                onClick={() => router.push('/datasources')}
                className="group relative bg-white border border-slate-200/60 rounded-2xl p-6 hover:border-blue-300/50 hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                    <Database className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">数据连接</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    支持多种数据源，一键连接企业数据库和云服务
                  </p>
                </div>
              </div>

              <div 
                onClick={() => router.push('/datasets')}
                className="group relative bg-white border border-slate-200/60 rounded-2xl p-6 hover:border-purple-300/50 hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">数据建模</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    灵活的数据建模工具，构建标准化数据集
                  </p>
                </div>
              </div>

              <div 
                onClick={() => router.push('/dashboards')}
                className="group relative bg-white border border-slate-200/60 rounded-2xl p-6 hover:border-emerald-300/50 hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-green-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">可视化看板</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    拖拽式设计器，快速创建交互式数据看板
                  </p>
                </div>
              </div>

              <div className="group relative bg-white border border-slate-200/60 rounded-2xl p-6 hover:border-amber-300/50 hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">AI 洞察</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    智能分析引擎，自动发现数据中的规律和趋势
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 工作台概览 */}
          <section className="mb-20">
            <div className="bg-white border border-slate-200/60 rounded-3xl shadow-sm overflow-hidden">
              <div className="px-8 py-8 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">工作台概览</h2>
                    <p className="text-slate-600">您的数据分析工作台</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                    onClick={() => router.push('/dashboards')}
                  >
                    查看全部
                  </Button>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                {/* 最近看板 */}
                <div className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">最近看板</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      { name: '销售业绩总览', time: '2小时前', views: '127', status: 'active' },
                      { name: '用户行为分析', time: '昨天', views: '89', status: 'active' },
                      { name: '财务月度报告', time: '3天前', views: '234', status: 'updated' },
                      { name: '产品运营数据', time: '1周前', views: '156', status: 'normal' },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50/50 transition-colors duration-200 cursor-pointer group">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center group-hover:from-blue-50 group-hover:to-blue-100 transition-colors duration-200">
                            <BarChart3 className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors duration-200" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{item.name}</div>
                            <div className="text-sm text-slate-500">{item.time} · {item.views} 次查看</div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className={`
                            w-2 h-2 rounded-full 
                            ${item.status === 'active' ? 'bg-green-500' : 
                              item.status === 'updated' ? 'bg-blue-500' : 'bg-slate-400'}
                          `} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 系统状态和统计 */}
                <div className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                      <Shield className="w-4 h-4 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">系统状态</h3>
                  </div>

                  <div className="space-y-6">
                    {/* 服务状态 */}
                    <div className="space-y-3">
                      {[
                        { name: '数据源连接', status: 'healthy', latency: '12ms' },
                        { name: 'AI 分析服务', status: 'healthy', latency: '45ms' },
                        { name: '缓存系统', status: 'healthy', latency: '3ms' },
                        { name: '数据同步', status: 'warning', latency: '1.2s' },
                      ].map((service, index) => (
                        <div key={index} className="flex items-center justify-between py-2">
                          <div className="flex items-center space-x-3">
                            <div className={`
                              w-2 h-2 rounded-full
                              ${service.status === 'healthy' ? 'bg-green-500' : 
                                service.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}
                            `} />
                            <span className="text-sm font-medium text-slate-700">{service.name}</span>
                          </div>
                          <span className="text-xs text-slate-500">{service.latency}</span>
                        </div>
                      ))}
                    </div>

                    {/* 快速统计 */}
                    <div className="pt-6 border-t border-slate-100">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-slate-900">47</div>
                          <div className="text-xs text-slate-500">活跃看板</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-slate-900">1.2K</div>
                          <div className="text-xs text-slate-500">数据查询</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 企业级特性 */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">企业级特性</h2>
              <p className="text-slate-600 max-w-xl mx-auto">
                为企业级应用场景精心打造的专业功能
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">企业级安全</h3>
                <p className="text-sm text-slate-600 leading-relaxed px-4">
                  端到端数据加密，完善的权限管理，满足合规要求
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">团队协作</h3>
                <p className="text-sm text-slate-600 leading-relaxed px-4">
                  多人实时协作，分享和评论，构建数据驱动的团队文化
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">实时处理</h3>
                <p className="text-sm text-slate-600 leading-relaxed px-4">
                  毫秒级数据查询响应，实时监控业务指标变化
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* 底部装饰 */}
        <div className="border-t border-slate-200/60 bg-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="text-center text-sm text-slate-500">
              <p>© 2024 Smart BI. 智能商业分析平台 · 让数据洞察变得简单</p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
