'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Database, 
  Globe, 
  Save,
  ChevronRight,
  Monitor,
  Moon,
  Sun,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'

export default function SettingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  const [settings, setSettings] = useState({
    profile: {
      name: user?.name || '',
      email: user?.email || '',
      avatar: '',
      timezone: 'Asia/Shanghai'
    },
    notifications: {
      emailNotifications: true,
      dashboardAlerts: true,
      systemUpdates: false,
      marketingEmails: false
    },
    appearance: {
      theme: 'light',
      language: 'zh-CN',
      dateFormat: 'YYYY-MM-DD',
      currency: 'CNY'
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: '24',
      loginNotifications: true
    },
    data: {
      defaultQueryLimit: '1000',
      cacheTimeout: '300',
      exportFormat: 'xlsx'
    }
  })

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // 这里可以添加保存设置的API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('Settings saved:', settings)
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const tabs = [
    { id: 'profile', label: '个人资料', icon: User },
    { id: 'notifications', label: '通知设置', icon: Bell },
    { id: 'appearance', label: '外观设置', icon: Palette },
    { id: 'security', label: '安全设置', icon: Shield },
    { id: 'data', label: '数据设置', icon: Database },
  ]

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">姓名</label>
          <input
            type="text"
            value={settings.profile.name}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              profile: { ...prev.profile, name: e.target.value }
            }))}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
            placeholder="请输入您的姓名"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">邮箱地址</label>
          <input
            type="email"
            value={settings.profile.email}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              profile: { ...prev.profile, email: e.target.value }
            }))}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
            placeholder="请输入邮箱地址"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">时区</label>
          <select
            value={settings.profile.timezone}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              profile: { ...prev.profile, timezone: e.target.value }
            }))}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
          >
            <option value="Asia/Shanghai">Asia/Shanghai (GMT+8)</option>
            <option value="UTC">UTC (GMT+0)</option>
            <option value="America/New_York">America/New_York (GMT-5)</option>
          </select>
        </div>
      </div>
    </div>
  )

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      {Object.entries(settings.notifications).map(([key, value]) => {
        const labels = {
          emailNotifications: '邮件通知',
          dashboardAlerts: '看板预警',
          systemUpdates: '系统更新',
          marketingEmails: '营销邮件'
        }
        
        return (
          <div key={key} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <div className="font-medium text-slate-900">{labels[key as keyof typeof labels]}</div>
              <div className="text-sm text-slate-500">
                {key === 'emailNotifications' && '接收重要的邮件通知'}
                {key === 'dashboardAlerts' && '看板数据异常时发送预警'}
                {key === 'systemUpdates' && '系统维护和更新通知'}
                {key === 'marketingEmails' && '产品更新和营销信息'}
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, [key]: e.target.checked }
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        )
      })}
    </div>
  )

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-3">主题设置</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'light', label: '浅色', icon: Sun },
              { id: 'dark', label: '深色', icon: Moon },
              { id: 'auto', label: '跟随系统', icon: Monitor }
            ].map((theme) => {
              const Icon = theme.icon
              return (
                <button
                  key={theme.id}
                  onClick={() => setSettings(prev => ({
                    ...prev,
                    appearance: { ...prev.appearance, theme: theme.id }
                  }))}
                  className={`
                    p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-all
                    ${settings.appearance.theme === theme.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${settings.appearance.theme === theme.id ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span className={`text-sm font-medium ${settings.appearance.theme === theme.id ? 'text-blue-700' : 'text-slate-700'}`}>
                    {theme.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">语言</label>
            <select
              value={settings.appearance.language}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                appearance: { ...prev.appearance, language: e.target.value }
              }))}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
            >
              <option value="zh-CN">简体中文</option>
              <option value="en-US">English</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">日期格式</label>
            <select
              value={settings.appearance.dateFormat}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                appearance: { ...prev.appearance, dateFormat: e.target.value }
              }))}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
            >
              <option value="YYYY-MM-DD">2024-12-25</option>
              <option value="DD/MM/YYYY">25/12/2024</option>
              <option value="MM/DD/YYYY">12/25/2024</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center">
          <Shield className="w-5 h-5 text-amber-600 mr-2" />
          <div>
            <div className="font-medium text-amber-800">安全提醒</div>
            <div className="text-sm text-amber-700">定期更新密码并启用两步验证以保护账户安全</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div>
            <div className="font-medium text-slate-900">两步验证</div>
            <div className="text-sm text-slate-500">为您的账户增加额外的安全保护</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.security.twoFactorAuth}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                security: { ...prev.security, twoFactorAuth: e.target.checked }
              }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">会话超时时间（小时）</label>
          <select
            value={settings.security.sessionTimeout}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              security: { ...prev.security, sessionTimeout: e.target.value }
            }))}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
          >
            <option value="1">1小时</option>
            <option value="8">8小时</option>
            <option value="24">24小时</option>
            <option value="168">7天</option>
          </select>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div>
            <div className="font-medium text-slate-900">登录通知</div>
            <div className="text-sm text-slate-500">新设备登录时发送通知</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.security.loginNotifications}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                security: { ...prev.security, loginNotifications: e.target.checked }
              }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  )

  const renderDataSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">默认查询限制</label>
          <select
            value={settings.data.defaultQueryLimit}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              data: { ...prev.data, defaultQueryLimit: e.target.value }
            }))}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
          >
            <option value="100">100 行</option>
            <option value="500">500 行</option>
            <option value="1000">1000 行</option>
            <option value="5000">5000 行</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">缓存超时时间（秒）</label>
          <select
            value={settings.data.cacheTimeout}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              data: { ...prev.data, cacheTimeout: e.target.value }
            }))}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
          >
            <option value="60">1分钟</option>
            <option value="300">5分钟</option>
            <option value="900">15分钟</option>
            <option value="3600">1小时</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">默认导出格式</label>
          <select
            value={settings.data.exportFormat}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              data: { ...prev.data, exportFormat: e.target.value }
            }))}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
          >
            <option value="xlsx">Excel (.xlsx)</option>
            <option value="csv">CSV (.csv)</option>
            <option value="json">JSON (.json)</option>
            <option value="pdf">PDF (.pdf)</option>
          </select>
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileSettings()
      case 'notifications':
        return renderNotificationSettings()
      case 'appearance':
        return renderAppearanceSettings()
      case 'security':
        return renderSecuritySettings()
      case 'data':
        return renderDataSettings()
      default:
        return renderProfileSettings()
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex-1 overflow-auto bg-slate-50/30">
        {/* 页面标题 */}
        <div className="bg-white border-b border-slate-200/60">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">系统设置</h1>
                <p className="text-slate-600">管理您的账户、偏好设置和系统配置</p>
              </div>
              
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-slate-900 text-white hover:bg-slate-800 px-6"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    保存设置
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* 设置内容 */}
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* 侧边栏导航 */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-slate-200/60 rounded-2xl p-2 shadow-sm">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                          w-full flex items-center justify-between px-4 py-3 rounded-xl text-left
                          transition-all duration-200
                          ${activeTab === tab.id 
                            ? 'bg-slate-100 text-slate-900 shadow-sm' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }
                        `}
                      >
                        <div className="flex items-center">
                          <Icon className="w-5 h-5 mr-3" />
                          <span className="font-medium">{tab.label}</span>
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${
                          activeTab === tab.id ? 'rotate-90 text-slate-600' : 'text-slate-400'
                        }`} />
                      </button>
                    )
                  })}
                </nav>
              </div>
            </div>

            {/* 设置内容区 */}
            <div className="lg:col-span-3">
              <Card className="border-slate-200/60 shadow-sm">
                <CardHeader className="pb-6">
                  <CardTitle className="text-xl text-slate-900">
                    {tabs.find(tab => tab.id === activeTab)?.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderTabContent()}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}