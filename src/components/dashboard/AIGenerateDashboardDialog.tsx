'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Sparkles, X, Loader2, RefreshCw, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Metric, ComponentLayout } from '@/types'

interface AIGenerateDashboardDialogProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (components: ComponentLayout[]) => void
  metrics: Metric[]
  loading?: boolean
}

interface DashboardTemplate {
  id: string
  name: string
  description: string
  category: string
  requiredMetricTypes: string[]
  layoutPattern: 'executive' | 'operational' | 'analytical' | 'monitoring'
}

const DASHBOARD_TEMPLATES: DashboardTemplate[] = [
  {
    id: 'sales-executive',
    name: '销售管理看板',
    description: '适合销售经理查看核心销售指标，包含销售额、订单量、趋势分析等',
    category: '销售',
    requiredMetricTypes: ['sum', 'count', 'ratio'],
    layoutPattern: 'executive'
  },
  {
    id: 'finance-overview',
    name: '财务概览看板',
    description: '展示收入、利润、成本等财务核心指标，适合财务团队使用',
    category: '财务',
    requiredMetricTypes: ['sum', 'ratio'],
    layoutPattern: 'executive'
  },
  {
    id: 'user-behavior',
    name: '用户行为分析',
    description: '分析用户活跃度、行为模式、设备分布等用户相关指标',
    category: '用户行为',
    requiredMetricTypes: ['count', 'ratio'],
    layoutPattern: 'analytical'
  },
  {
    id: 'product-performance',
    name: '产品表现分析',
    description: '展示产品销售、用户反馈、市场表现等产品相关指标',
    category: '产品',
    requiredMetricTypes: ['sum', 'count'],
    layoutPattern: 'operational'
  }
]

export function AIGenerateDashboardDialog({
  isOpen,
  onClose,
  onGenerate,
  metrics,
  loading = false
}: AIGenerateDashboardDialogProps) {
  const [step, setStep] = React.useState<'requirements' | 'preview' | 'generating'>('requirements')
  const [selectedTemplate, setSelectedTemplate] = React.useState<string>('')
  const [customRequirement, setCustomRequirement] = React.useState('')
  const [selectedMetrics, setSelectedMetrics] = React.useState<string[]>([])
  const [generatedComponents, setGeneratedComponents] = React.useState<ComponentLayout[]>([])
  const { showConfirm, confirmDialog } = useConfirmDialog()

  // 按分类分组指标
  const metricsByCategory = React.useMemo(() => {
    const grouped: Record<string, Metric[]> = {}
    metrics.forEach(metric => {
      if (!grouped[metric.category]) {
        grouped[metric.category] = []
      }
      grouped[metric.category].push(metric)
    })
    return grouped
  }, [metrics])

  // 获取推荐的模板
  const recommendedTemplates = React.useMemo(() => {
    const availableCategories = Object.keys(metricsByCategory)
    return DASHBOARD_TEMPLATES.filter(template =>
      availableCategories.includes(template.category)
    )
  }, [metricsByCategory])

  const resetDialog = () => {
    setStep('requirements')
    setSelectedTemplate('')
    setCustomRequirement('')
    setSelectedMetrics([])
    setGeneratedComponents([])
  }

  const handleClose = () => {
    if (step === 'generating') return // 生成中不能关闭
    
    if (step === 'preview' && generatedComponents.length > 0) {
      showConfirm({
        title: '确认关闭',
        message: '当前生成的看板配置将会丢失，确定要关闭吗？',
        confirmText: '确认关闭',
        cancelText: '继续编辑',
        type: 'warning',
        onConfirm: () => {
          resetDialog()
          onClose()
        }
      })
    } else {
      resetDialog()
      onClose()
    }
  }

  // 智能生成看板组件
  const generateDashboardComponents = async () => {
    setStep('generating')
    
    try {
      const template = DASHBOARD_TEMPLATES.find(t => t.id === selectedTemplate)
      const relevantMetrics = metrics.filter(m => selectedMetrics.includes(m._id))
      
      // 模拟AI生成过程
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const components = generateComponentsFromMetrics(relevantMetrics, template?.layoutPattern || 'executive')
      setGeneratedComponents(components)
      setStep('preview')
    } catch (error) {
      console.error('生成看板失败:', error)
      // 处理错误
    }
  }

  // 根据指标生成组件
  const generateComponentsFromMetrics = (metrics: Metric[], layoutPattern: string): ComponentLayout[] => {
    const components: ComponentLayout[] = []
    let yOffset = 24
    
    // KPI卡片区域 - 核心指标
    const kpiMetrics = metrics.filter(m => ['sum', 'count', 'ratio'].includes(m.type)).slice(0, 4)
    kpiMetrics.forEach((metric, index) => {
      components.push({
        id: `kpi-${metric._id}-${Date.now()}-${index}`,
        type: 'kpi-card',
        title: metric.displayName,
        position: { x: 24 + (index * 280), y: yOffset },
        size: { width: 260, height: 120 },
        config: {
          kpi: {
            style: 'modern',
            showIcon: true,
            showTrend: true,
            unit: metric.unit
          }
        },
        dataConfig: {
          metrics: [metric.name],
          filters: []
        }
      })
    })
    
    yOffset += 144

    // 图表区域
    const chartMetrics = metrics.filter(m => !kpiMetrics.includes(m))
    
    // 趋势图 - 时间序列类指标
    const trendMetrics = chartMetrics.filter(m => 
      m.displayName.includes('趋势') || m.displayName.includes('日') || m.displayName.includes('每日')
    ).slice(0, 1)
    
    if (trendMetrics.length > 0) {
      components.push({
        id: `line-${trendMetrics[0]._id}-${Date.now()}`,
        type: 'line-chart',
        title: trendMetrics[0].displayName + '趋势',
        position: { x: 24, y: yOffset },
        size: { width: 560, height: 320 },
        config: {},
        dataConfig: {
          metrics: [trendMetrics[0].name],
          filters: []
        }
      })
    }

    // 分布图 - 分类类指标
    const distributionMetrics = chartMetrics.filter(m => 
      m.displayName.includes('分类') || m.displayName.includes('分布') || m.displayName.includes('地区')
    ).slice(0, 1)
    
    if (distributionMetrics.length > 0) {
      components.push({
        id: `pie-${distributionMetrics[0]._id}-${Date.now()}`,
        type: 'pie-chart',
        title: distributionMetrics[0].displayName,
        position: { x: 604, y: yOffset },
        size: { width: 500, height: 320 },
        config: {},
        dataConfig: {
          metrics: [distributionMetrics[0].name],
          filters: []
        }
      })
    }

    yOffset += 344

    // 排行榜 - TOP类指标
    const rankingMetrics = chartMetrics.filter(m => 
      m.displayName.includes('TOP') || m.displayName.includes('热销') || m.displayName.includes('排行')
    ).slice(0, 1)
    
    if (rankingMetrics.length > 0) {
      components.push({
        id: `bar-${rankingMetrics[0]._id}-${Date.now()}`,
        type: 'bar-chart',
        title: rankingMetrics[0].displayName,
        position: { x: 24, y: yOffset },
        size: { width: 540, height: 280 },
        config: {},
        dataConfig: {
          metrics: [rankingMetrics[0].name],
          filters: []
        }
      })
    }

    // 详细数据表格
    if (chartMetrics.length > 3) {
      components.push({
        id: `table-${Date.now()}`,
        type: 'table',
        title: '详细数据',
        position: { x: 584, y: yOffset },
        size: { width: 520, height: 280 },
        config: {},
        dataConfig: {
          metrics: chartMetrics.slice(0, 3).map(m => m.name),
          filters: []
        }
      })
    }

    return components
  }

  const handleConfirmGenerate = () => {
    onGenerate(generatedComponents)
    resetDialog()
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">AI智能生成看板</h3>
                <p className="text-sm text-slate-500">基于您的指标库智能生成专业看板</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* 步骤指示器 */}
          <div className="px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-4">
              {[
                { key: 'requirements', label: '需求分析' },
                { key: 'preview', label: '预览生成' },
              ].map((stepItem, index) => (
                <div key={stepItem.key} className="flex items-center gap-2">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                    step === stepItem.key || (step === 'generating' && stepItem.key === 'preview')
                      ? "bg-blue-600 text-white"
                      : (step === 'preview' && stepItem.key === 'requirements')
                      ? "bg-green-600 text-white"
                      : "bg-slate-200 text-slate-600"
                  )}>
                    {step === 'preview' && stepItem.key === 'requirements' ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    step === stepItem.key || (step === 'generating' && stepItem.key === 'preview')
                      ? "text-blue-600"
                      : "text-slate-600"
                  )}>
                    {stepItem.label}
                  </span>
                  {index < 1 && (
                    <div className="w-8 h-px bg-slate-200 ml-2" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto">
            {step === 'requirements' && (
              <RequirementsStep
                templates={recommendedTemplates}
                metricsByCategory={metricsByCategory}
                selectedTemplate={selectedTemplate}
                selectedMetrics={selectedMetrics}
                customRequirement={customRequirement}
                onTemplateChange={setSelectedTemplate}
                onMetricsChange={setSelectedMetrics}
                onCustomRequirementChange={setCustomRequirement}
              />
            )}

            {step === 'generating' && (
              <GeneratingStep />
            )}

            {step === 'preview' && (
              <PreviewStep
                components={generatedComponents}
                selectedMetrics={metrics.filter(m => selectedMetrics.includes(m._id))}
              />
            )}
          </div>

          {/* 底部按钮 */}
          <div className="flex items-center justify-between p-6 border-t border-slate-200">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <AlertCircle className="h-4 w-4" />
              <span>生成的看板可以在编辑器中进一步调整</span>
            </div>
            <div className="flex items-center gap-3">
              {step === 'requirements' && (
                <>
                  <Button variant="outline" onClick={handleClose}>
                    取消
                  </Button>
                  <Button 
                    onClick={generateDashboardComponents}
                    disabled={!selectedTemplate || selectedMetrics.length === 0}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    开始生成
                  </Button>
                </>
              )}
              {step === 'generating' && (
                <Button disabled>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  生成中...
                </Button>
              )}
              {step === 'preview' && (
                <>
                  <Button variant="outline" onClick={() => setStep('requirements')}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    重新生成
                  </Button>
                  <Button onClick={handleConfirmGenerate}>
                    <Check className="h-4 w-4 mr-2" />
                    应用到画布
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {confirmDialog}
    </>
  )
}

// 需求收集步骤组件
function RequirementsStep({
  templates,
  metricsByCategory,
  selectedTemplate,
  selectedMetrics,
  customRequirement,
  onTemplateChange,
  onMetricsChange,
  onCustomRequirementChange
}: {
  templates: DashboardTemplate[]
  metricsByCategory: Record<string, Metric[]>
  selectedTemplate: string
  selectedMetrics: string[]
  customRequirement: string
  onTemplateChange: (templateId: string) => void
  onMetricsChange: (metrics: string[]) => void
  onCustomRequirementChange: (requirement: string) => void
}) {
  const selectedTemplateData = templates.find(t => t.id === selectedTemplate)

  return (
    <div className="p-6 space-y-6">
      {/* 模板选择 */}
      <div>
        <h4 className="font-medium text-slate-900 mb-3">选择看板模板</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className={cn(
                "border rounded-lg p-4 cursor-pointer transition-all",
                selectedTemplate === template.id
                  ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              )}
              onClick={() => onTemplateChange(template.id)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h5 className="font-medium text-slate-900 mb-1">{template.name}</h5>
                  <p className="text-sm text-slate-600 mb-2">{template.description}</p>
                  <span className="inline-block px-2 py-1 bg-slate-100 text-xs text-slate-600 rounded">
                    {template.category}
                  </span>
                </div>
                {selectedTemplate === template.id && (
                  <Check className="h-5 w-5 text-blue-600 mt-1" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 指标选择 */}
      {selectedTemplateData && (
        <div>
          <h4 className="font-medium text-slate-900 mb-3">选择相关指标</h4>
          <div className="space-y-4">
            {Object.entries(metricsByCategory).map(([category, metrics]) => (
              <div key={category}>
                <h5 className="text-sm font-medium text-slate-700 mb-2">{category}</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {metrics.map((metric) => (
                    <label
                      key={metric._id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMetrics.includes(metric._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            onMetricsChange([...selectedMetrics, metric._id])
                          } else {
                            onMetricsChange(selectedMetrics.filter(id => id !== metric._id))
                          }
                        }}
                        className="rounded"
                      />
                      <div>
                        <div className="text-sm font-medium text-slate-900">{metric.displayName}</div>
                        <div className="text-xs text-slate-500">{metric.unit}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 自定义需求 */}
      <div>
        <h4 className="font-medium text-slate-900 mb-3">补充需求（可选）</h4>
        <Input
          placeholder="描述您的特殊需求，如特定的图表类型、布局偏好等..."
          value={customRequirement}
          onChange={(e) => onCustomRequirementChange(e.target.value)}
          className="w-full"
        />
      </div>
    </div>
  )
}

// 生成中步骤组件
function GeneratingStep() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-ping opacity-30"></div>
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">AI正在生成您的看板...</h3>
      <p className="text-slate-600 text-center max-w-md">
        正在分析您选择的指标，智能设计最佳的看板布局和图表类型
      </p>
      <div className="flex items-center gap-2 mt-4">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <span className="text-sm text-slate-500">预计需要几秒钟...</span>
      </div>
    </div>
  )
}

// 预览步骤组件
function PreviewStep({ 
  components, 
  selectedMetrics 
}: { 
  components: ComponentLayout[]
  selectedMetrics: Metric[]
}) {
  return (
    <div className="p-6">
      <div className="mb-4">
        <h4 className="font-medium text-slate-900 mb-2">生成的看板预览</h4>
        <p className="text-sm text-slate-600">
          为您生成了 {components.length} 个图表组件，使用了 {selectedMetrics.length} 个指标
        </p>
      </div>

      {/* 组件列表 */}
      <div className="space-y-3">
        {components.map((component, index) => (
          <div key={component.id} className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-slate-900">{component.title}</h5>
                <p className="text-sm text-slate-600">
                  {component.type === 'kpi-card' ? 'KPI卡片' :
                   component.type === 'line-chart' ? '折线图' :
                   component.type === 'bar-chart' ? '柱状图' :
                   component.type === 'pie-chart' ? '饼图' :
                   component.type === 'table' ? '数据表格' : '图表'}
                  • 尺寸: {component.size.width}×{component.size.height}
                </p>
              </div>
              <div className="text-xs text-slate-500">
                位置: ({component.position.x}, {component.position.y})
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}