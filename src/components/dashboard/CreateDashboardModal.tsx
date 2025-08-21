'use client'

import React from 'react'
import { X, Check, Layout, BarChart3, PieChart, TrendingUp, Table } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

interface CreateDashboardModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateDashboard: (dashboard: CreateDashboardData) => void
}

interface CreateDashboardData {
  name: string
  description: string
  template: DashboardTemplate | null
}

interface DashboardTemplate {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  preview: string
  components: {
    type: string
    title: string
    position: { x: number; y: number }
    size: { width: number; height: number }
  }[]
}

const dashboardTemplates: DashboardTemplate[] = [
  {
    id: 'blank',
    name: '空白看板',
    description: '从头开始创建自定义看板',
    icon: Layout,
    preview: '🗂️',
    components: []
  },
  {
    id: 'sales-dashboard',
    name: '销售分析看板',
    description: '包含销售趋势、业绩指标等组件',
    icon: TrendingUp,
    preview: '📊',
    components: [
      { type: 'kpi-card', title: '总销售额', position: { x: 0, y: 0 }, size: { width: 300, height: 150 } },
      { type: 'line-chart', title: '销售趋势', position: { x: 320, y: 0 }, size: { width: 500, height: 300 } },
      { type: 'bar-chart', title: '产品销量', position: { x: 0, y: 170 }, size: { width: 400, height: 300 } },
      { type: 'pie-chart', title: '销售渠道分布', position: { x: 420, y: 320 }, size: { width: 400, height: 300 } }
    ]
  },
  {
    id: 'user-analytics',
    name: '用户行为分析',
    description: '用户活跃度、留存率等分析',
    icon: BarChart3,
    preview: '👥',
    components: [
      { type: 'kpi-card', title: '活跃用户', position: { x: 0, y: 0 }, size: { width: 200, height: 120 } },
      { type: 'kpi-card', title: '新增用户', position: { x: 220, y: 0 }, size: { width: 200, height: 120 } },
      { type: 'line-chart', title: '用户活跃趋势', position: { x: 0, y: 140 }, size: { width: 600, height: 300 } },
      { type: 'table', title: '用户行为明细', position: { x: 0, y: 460 }, size: { width: 800, height: 250 } }
    ]
  },
  {
    id: 'financial-report',
    name: '财务报表',
    description: '收入、成本、利润分析',
    icon: PieChart,
    preview: '💰',
    components: [
      { type: 'kpi-card', title: '总收入', position: { x: 0, y: 0 }, size: { width: 200, height: 120 } },
      { type: 'kpi-card', title: '净利润', position: { x: 220, y: 0 }, size: { width: 200, height: 120 } },
      { type: 'kpi-card', title: '利润率', position: { x: 440, y: 0 }, size: { width: 200, height: 120 } },
      { type: 'bar-chart', title: '月度收支', position: { x: 0, y: 140 }, size: { width: 400, height: 300 } },
      { type: 'pie-chart', title: '成本结构', position: { x: 420, y: 140 }, size: { width: 400, height: 300 } }
    ]
  },
  {
    id: 'operations-dashboard',
    name: '运营监控看板',
    description: '系统状态、性能指标监控',
    icon: Table,
    preview: '⚡',
    components: [
      { type: 'gauge', title: 'CPU使用率', position: { x: 0, y: 0 }, size: { width: 300, height: 200 } },
      { type: 'gauge', title: '内存使用率', position: { x: 320, y: 0 }, size: { width: 300, height: 200 } },
      { type: 'line-chart', title: '系统负载', position: { x: 0, y: 220 }, size: { width: 620, height: 250 } },
      { type: 'table', title: '告警日志', position: { x: 0, y: 490 }, size: { width: 800, height: 200 } }
    ]
  }
]

export function CreateDashboardModal({ isOpen, onClose, onCreateDashboard }: CreateDashboardModalProps) {
  const [step, setStep] = React.useState(1)
  const [formData, setFormData] = React.useState({
    name: '',
    description: ''
  })
  const [selectedTemplate, setSelectedTemplate] = React.useState<DashboardTemplate | null>(null)

  React.useEffect(() => {
    if (isOpen) {
      // 重置状态
      setStep(1)
      setFormData({ name: '', description: '' })
      setSelectedTemplate(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleNext = () => {
    if (step === 1 && formData.name.trim()) {
      setStep(2)
    }
  }

  const handleBack = () => {
    if (step === 2) {
      setStep(1)
    }
  }

  const handleCreate = () => {
    if (formData.name.trim()) {
      onCreateDashboard({
        name: formData.name,
        description: formData.description,
        template: selectedTemplate
      })
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold">创建新看板</h2>
            <p className="text-sm text-slate-500 mt-1">
              {step === 1 ? '设置看板基本信息' : '选择看板模板'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* 进度指示器 */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex items-center gap-2 text-sm",
              step >= 1 ? "text-blue-600" : "text-slate-400"
            )}>
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                step >= 1 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-400"
              )}>
                {step > 1 ? <Check className="w-3 h-3" /> : '1'}
              </div>
              基本信息
            </div>
            <div className={cn(
              "flex-1 h-px",
              step >= 2 ? "bg-blue-600" : "bg-slate-200"
            )} />
            <div className={cn(
              "flex items-center gap-2 text-sm",
              step >= 2 ? "text-blue-600" : "text-slate-400"
            )}>
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                step >= 2 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-400"
              )}>
                2
              </div>
              选择模板
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">看板名称 *</label>
                <Input
                  placeholder="输入看板名称"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">看板描述</label>
                <textarea
                  placeholder="输入看板描述（可选）"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full h-24 px-3 py-2 border border-slate-200 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">选择看板模板</h3>
                <p className="text-sm text-slate-500">
                  选择一个模板快速开始，或选择空白模板从头创建
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardTemplates.map((template) => {
                  const Icon = template.icon
                  return (
                    <Card
                      key={template.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        selectedTemplate?.id === template.id && "ring-2 ring-blue-500"
                      )}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <Icon className="h-5 w-5 text-slate-600" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-base">{template.name}</CardTitle>
                          </div>
                          {selectedTemplate?.id === template.id && (
                            <Check className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-600 mb-3">
                          {template.description}
                        </p>
                        <div className="text-center py-8 bg-slate-50 rounded-lg">
                          <div className="text-4xl mb-2">{template.preview}</div>
                          <div className="text-xs text-slate-500">
                            {template.components.length} 个组件
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200">
          <div className="text-sm text-slate-500">
            {step === 1 && '第 1 步，共 2 步'}
            {step === 2 && '第 2 步，共 2 步'}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            {step === 1 && (
              <Button 
                onClick={handleNext}
                disabled={!formData.name.trim()}
              >
                下一步
              </Button>
            )}
            {step === 2 && (
              <>
                <Button variant="outline" onClick={handleBack}>
                  上一步
                </Button>
                <Button 
                  onClick={handleCreate}
                  disabled={!selectedTemplate}
                >
                  创建看板
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}