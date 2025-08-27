'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, Loader2, BarChart3, TrendingUp, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, isLoading } = useAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // 如果已经登录，重定向到主页
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // 清除对应字段的错误
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    
    if (!formData.email.trim()) {
      newErrors.email = '请输入邮箱地址'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址'
    }
    
    if (!formData.password.trim()) {
      newErrors.password = '请输入密码'
    } else if (formData.password.length < 6) {
      newErrors.password = '密码长度至少6位'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    setErrors({})
    
    try {
      await login(formData.email, formData.password)
      router.push('/')
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : '登录失败，请重试'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 演示账号快速登录
  const handleDemoLogin = async (role: 'admin' | 'user' | 'viewer') => {
    const demoAccounts = {
      admin: { email: 'admin@smartbi.com', password: 'admin123' },
      user: { email: 'user@smartbi.com', password: 'user123' },
      viewer: { email: 'viewer@smartbi.com', password: 'viewer123' }
    }
    
    const account = demoAccounts[role]
    setFormData(account)
    
    setIsSubmitting(true)
    try {
      await login(account.email, account.password)
      router.push('/')
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : '登录失败，请重试'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 动态背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* 动态几何图形 */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-300" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-700" />
        
        {/* 网格背景 */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
        
        {/* 浮动粒子效果 */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* 左侧品牌展示区 */}
        <div className="hidden lg:flex lg:flex-1 items-center justify-center p-12">
          <div className="max-w-md text-center space-y-8">
            {/* Logo 和品牌 */}
            <div className="space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-2xl">
                <BarChart3 className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-4">
                  Smart BI
                </h1>
                <p className="text-xl text-blue-100/80 leading-relaxed">
                  智能商业分析平台
                </p>
              </div>
            </div>

            {/* 特性展示 */}
            <div className="space-y-4 text-left">
              <div className="flex items-center space-x-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-medium">实时数据分析</h3>
                  <p className="text-blue-100/60 text-sm">多维度数据洞察与智能预测</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-medium">闪电般的速度</h3>
                  <p className="text-blue-100/60 text-sm">毫秒级查询响应与可视化</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-medium">智能仪表板</h3>
                  <p className="text-blue-100/60 text-sm">拖拽式图表配置与自定义</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧登录区 */}
        <div className="flex-1 lg:flex-none lg:w-96 xl:w-[480px] flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            {/* 移动端品牌标识 */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-2xl mb-4">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-2">
                Smart BI
              </h1>
              <p className="text-blue-100/70">智能商业分析平台</p>
            </div>

            {/* 玻璃态登录卡片 */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 transition-all duration-300 hover:bg-white/15 hover:shadow-3xl">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">欢迎回来</h2>
                <p className="text-blue-100/70">登录您的账户以继续</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 邮箱输入 */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-white/90">
                    邮箱地址
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-white/40 group-focus-within:text-blue-400 transition-colors duration-200" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="请输入邮箱地址"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      className={`
                        w-full pl-12 pr-4 py-3.5 bg-white/5 backdrop-blur-sm border rounded-xl 
                        text-white placeholder-white/40 focus:outline-none focus:ring-2 
                        transition-all duration-200 hover:bg-white/10
                        ${errors.email 
                          ? 'border-red-400 focus:ring-red-400/50' 
                          : 'border-white/20 focus:border-blue-400 focus:ring-blue-400/30'
                        }
                      `}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-300">{errors.email}</p>
                  )}
                </div>

                {/* 密码输入 */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-white/90">
                    密码
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-white/40 group-focus-within:text-blue-400 transition-colors duration-200" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="请输入密码"
                      value={formData.password}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      className={`
                        w-full pl-12 pr-12 py-3.5 bg-white/5 backdrop-blur-sm border rounded-xl 
                        text-white placeholder-white/40 focus:outline-none focus:ring-2 
                        transition-all duration-200 hover:bg-white/10
                        ${errors.password 
                          ? 'border-red-400 focus:ring-red-400/50' 
                          : 'border-white/20 focus:border-blue-400 focus:ring-blue-400/30'
                        }
                      `}
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-3.5 text-white/40 hover:text-white/70 transition-colors duration-200"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-300">{errors.password}</p>
                  )}
                </div>

                {/* 提交错误 */}
                {errors.submit && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
                    <p className="text-sm text-red-300">{errors.submit}</p>
                  </div>
                )}

                {/* 登录按钮 */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="
                    w-full py-3.5 bg-gradient-to-r from-blue-500 to-purple-600 
                    text-white font-medium rounded-xl shadow-lg
                    hover:from-blue-600 hover:to-purple-700 
                    focus:outline-none focus:ring-2 focus:ring-blue-400/50
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl
                  "
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      登录中...
                    </div>
                  ) : (
                    '登录'
                  )}
                </button>
              </form>

              {/* 演示账号 */}
              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-transparent text-white/70">
                      或使用演示账号
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleDemoLogin('admin')}
                    disabled={isSubmitting}
                    className="
                      px-3 py-2 bg-white/5 backdrop-blur-sm border border-white/20 
                      text-white/80 text-xs rounded-lg hover:bg-white/10 
                      focus:outline-none focus:ring-2 focus:ring-blue-400/30
                      disabled:opacity-50 transition-all duration-200
                    "
                  >
                    管理员
                  </button>
                  <button
                    onClick={() => handleDemoLogin('user')}
                    disabled={isSubmitting}
                    className="
                      px-3 py-2 bg-white/5 backdrop-blur-sm border border-white/20 
                      text-white/80 text-xs rounded-lg hover:bg-white/10 
                      focus:outline-none focus:ring-2 focus:ring-blue-400/30
                      disabled:opacity-50 transition-all duration-200
                    "
                  >
                    普通用户
                  </button>
                  <button
                    onClick={() => handleDemoLogin('viewer')}
                    disabled={isSubmitting}
                    className="
                      px-3 py-2 bg-white/5 backdrop-blur-sm border border-white/20 
                      text-white/80 text-xs rounded-lg hover:bg-white/10 
                      focus:outline-none focus:ring-2 focus:ring-blue-400/30
                      disabled:opacity-50 transition-all duration-200
                    "
                  >
                    观察者
                  </button>
                </div>

                <div className="mt-4 text-xs text-white/50 text-center">
                  <p>演示账号密码分别为：admin123、user123、viewer123</p>
                </div>
              </div>
            </div>

            {/* 版权信息 */}
            <div className="mt-8 text-center text-sm text-white/50">
              <p>© 2024 泰豪软件. 智能商业分析平台.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}