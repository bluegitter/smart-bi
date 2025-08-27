'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Sparkles, X, Loader2, RefreshCw, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Metric, ComponentLayout, Dataset, DatasetField } from '@/types'

interface AIGenerateDashboardDialogProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (components: ComponentLayout[]) => void
  datasets: Dataset[]
  loading?: boolean
}

interface DashboardTemplate {
  id: string
  name: string
  description: string
  category: string
  requiredFieldTypes: string[]
  layoutPattern: 'executive' | 'operational' | 'analytical' | 'monitoring'
}

const DASHBOARD_TEMPLATES: DashboardTemplate[] = [
  {
    id: 'data-overview',
    name: '数据概览看板',
    description: '全面展示数据集的核心指标，包含KPI卡片、趋势图、分布图等',
    category: '通用',
    requiredFieldTypes: ['measure', 'dimension'],
    layoutPattern: 'executive'
  },
  {
    id: 'analytical-deep-dive',
    name: '分析洞察看板',
    description: '深度分析数据模式，适合数据分析师进行详细的数据探索',
    category: '分析',
    requiredFieldTypes: ['measure', 'dimension'],
    layoutPattern: 'analytical'
  },
  {
    id: 'monitoring-dashboard',
    name: '监控看板',
    description: '实时监控关键指标变化，适合业务运营团队日常监控使用',
    category: '监控',
    requiredFieldTypes: ['measure'],
    layoutPattern: 'monitoring'
  },
  {
    id: 'executive-summary',
    name: '管理层汇总',
    description: '高层次的数据汇总展示，突出核心业务指标和趋势',
    category: '管理',
    requiredFieldTypes: ['measure', 'dimension'],
    layoutPattern: 'executive'
  }
]

export function AIGenerateDashboardDialog({
  isOpen,
  onClose,
  onGenerate,
  datasets,
  loading = false
}: AIGenerateDashboardDialogProps) {
  const [step, setStep] = React.useState<'requirements' | 'preview' | 'generating'>('requirements')
  const [selectedTemplate, setSelectedTemplate] = React.useState<string>('')
  const [customRequirement, setCustomRequirement] = React.useState('')
  const [selectedDatasets, setSelectedDatasets] = React.useState<string[]>([])
  const [selectedFields, setSelectedFields] = React.useState<Record<string, string[]>>({}) // datasetId -> fieldNames[]
  const [generatedComponents, setGeneratedComponents] = React.useState<ComponentLayout[]>([])
  const { showConfirm, confirmDialog } = useConfirmDialog()

  // 按分类分组数据集
  const datasetsByCategory = React.useMemo(() => {
    const grouped: Record<string, Dataset[]> = {}
    datasets.forEach(dataset => {
      if (!grouped[dataset.category]) {
        grouped[dataset.category] = []
      }
      grouped[dataset.category].push(dataset)
    })
    return grouped
  }, [datasets])

  // 获取推荐的模板 - 所有模板都可用
  const recommendedTemplates = React.useMemo(() => {
    return DASHBOARD_TEMPLATES
  }, [])

  const resetDialog = () => {
    setStep('requirements')
    setSelectedTemplate('')
    setCustomRequirement('')
    setSelectedDatasets([])
    setSelectedFields({})
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
      const relevantDatasets = datasets.filter(d => selectedDatasets.includes(d._id))
      
      // 模拟AI生成过程
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const components = generateComponentsFromDatasets(relevantDatasets, selectedFields, template?.layoutPattern || 'executive')
      setGeneratedComponents(components)
      setStep('preview')
    } catch (error) {
      console.error('生成看板失败:', error)
      // 处理错误
    }
  }

  // 根据数据集生成组件
  const generateComponentsFromDatasets = (
    datasets: Dataset[], 
    selectedFields: Record<string, string[]>, 
    layoutPattern: string
  ): ComponentLayout[] => {
    const components: ComponentLayout[] = []
    let yOffset = 24
    
    // 为每个数据集生成组件
    datasets.forEach((dataset, datasetIndex) => {
      const datasetFields = selectedFields[dataset._id] || []
      const fields = dataset.fields?.filter(f => datasetFields.includes(f.name)) || []
      
      // 按字段类型分类
      const measures = fields.filter(f => f.fieldType === 'measure')
      const dimensions = fields.filter(f => f.fieldType === 'dimension')
      
      // KPI卡片区域 - 度量字段
      const kpiMeasures = measures.slice(0, 4)
      if (kpiMeasures.length > 0) {
        kpiMeasures.forEach((field, index) => {
          components.push({
            id: `kpi-${dataset._id}-${field.name}-${Date.now()}-${index}`,
            type: 'kpi-card',
            title: field.displayName,
            position: { 
              x: 24 + (index * 280), 
              y: yOffset + (datasetIndex * 500)
            },
            size: { width: 260, height: 120 },
            config: {
              kpi: {
                style: 'modern',
                showIcon: true,
                showTrend: true,
                unit: field.unit
              }
            },
            dataConfig: {
              datasetId: dataset._id,
              selectedMeasures: [field.name],
              selectedDimensions: [],
              fieldDisplayNames: { [field.name]: field.displayName },
              fieldUnits: field.unit ? { [field.name]: field.unit } : {},
              filters: []
            }
          })
        })
        
        yOffset += 144
      }

      // 如果有维度和度量，生成图表
      if (measures.length > 0 && dimensions.length > 0) {
        const primaryMeasure = measures[0]
        const primaryDimension = dimensions[0]
        
        // 趋势图 - 如果有日期类型的维度
        const dateFields = dimensions.filter(f => f.type === 'date')
        if (dateFields.length > 0) {
          components.push({
            id: `line-${dataset._id}-${Date.now()}`,
            type: 'line-chart',
            title: `${dataset.displayName} - 趋势分析`,
            position: { x: 24, y: yOffset + (datasetIndex * 500) },
            size: { width: 560, height: 320 },
            config: {},
            dataConfig: {
              datasetId: dataset._id,
              selectedMeasures: [primaryMeasure.name],
              selectedDimensions: [dateFields[0].name],
              fieldDisplayNames: {
                [primaryMeasure.name]: primaryMeasure.displayName,
                [dateFields[0].name]: dateFields[0].displayName
              },
              fieldUnits: primaryMeasure.unit ? { [primaryMeasure.name]: primaryMeasure.unit } : {},
              filters: []
            }
          })
        }
        
        // 分布图 - 饼图
        if (dimensions.length > 0) {
          components.push({
            id: `pie-${dataset._id}-${Date.now()}`,
            type: 'pie-chart',
            title: `${dataset.displayName} - 分布图`,
            position: { x: dateFields.length > 0 ? 604 : 24, y: yOffset + (datasetIndex * 500) },
            size: { width: 500, height: 320 },
            config: {},
            dataConfig: {
              datasetId: dataset._id,
              selectedMeasures: [primaryMeasure.name],
              selectedDimensions: [primaryDimension.name],
              fieldDisplayNames: {
                [primaryMeasure.name]: primaryMeasure.displayName,
                [primaryDimension.name]: primaryDimension.displayName
              },
              fieldUnits: primaryMeasure.unit ? { [primaryMeasure.name]: primaryMeasure.unit } : {},
              filters: []
            }
          })
        }
        
        yOffset += 344
        
        // 柱状图 - 如果有多个维度
        if (dimensions.length > 1) {
          components.push({
            id: `bar-${dataset._id}-${Date.now()}`,
            type: 'bar-chart',
            title: `${dataset.displayName} - 对比分析`,
            position: { x: 24, y: yOffset + (datasetIndex * 500) },
            size: { width: 540, height: 280 },
            config: {},
            dataConfig: {
              datasetId: dataset._id,
              selectedMeasures: [primaryMeasure.name],
              selectedDimensions: [dimensions[1].name],
              fieldDisplayNames: {
                [primaryMeasure.name]: primaryMeasure.displayName,
                [dimensions[1].name]: dimensions[1].displayName
              },
              fieldUnits: primaryMeasure.unit ? { [primaryMeasure.name]: primaryMeasure.unit } : {},
              filters: []
            }
          })
        }
      }
      
      // 数据表格 - 展示所有选中的字段
      if (fields.length > 0) {
        const selectedMeasures = measures.map(f => f.name)
        const selectedDimensions = dimensions.map(f => f.name)
        const fieldDisplayNames = fields.reduce((acc, f) => {
          acc[f.name] = f.displayName
          return acc
        }, {} as Record<string, string>)
        const fieldUnits = measures.reduce((acc, f) => {
          if (f.unit) acc[f.name] = f.unit
          return acc
        }, {} as Record<string, string>)

        components.push({
          id: `table-${dataset._id}-${Date.now()}`,
          type: 'table',
          title: `${dataset.displayName} - 详细数据`,
          position: { x: dimensions.length > 1 ? 584 : 24, y: yOffset + (datasetIndex * 500) },
          size: { width: 520, height: 280 },
          config: {},
          dataConfig: {
            datasetId: dataset._id,
            selectedMeasures,
            selectedDimensions,
            fieldDisplayNames,
            fieldUnits,
            filters: []
          }
        })
      }
    })

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
                datasetsByCategory={datasetsByCategory}
                selectedTemplate={selectedTemplate}
                selectedDatasets={selectedDatasets}
                selectedFields={selectedFields}
                customRequirement={customRequirement}
                onTemplateChange={setSelectedTemplate}
                onDatasetsChange={setSelectedDatasets}
                onFieldsChange={setSelectedFields}
                onCustomRequirementChange={setCustomRequirement}
              />
            )}

            {step === 'generating' && (
              <GeneratingStep />
            )}

            {step === 'preview' && (
              <PreviewStep
                components={generatedComponents}
                selectedDatasets={datasets.filter(d => selectedDatasets.includes(d._id))}
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
                    disabled={!selectedTemplate || selectedDatasets.length === 0}
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
  datasetsByCategory,
  selectedTemplate,
  selectedDatasets,
  selectedFields,
  customRequirement,
  onTemplateChange,
  onDatasetsChange,
  onFieldsChange,
  onCustomRequirementChange
}: {
  templates: DashboardTemplate[]
  datasetsByCategory: Record<string, Dataset[]>
  selectedTemplate: string
  selectedDatasets: string[]
  selectedFields: Record<string, string[]>
  customRequirement: string
  onTemplateChange: (templateId: string) => void
  onDatasetsChange: (datasetIds: string[]) => void
  onFieldsChange: (fields: Record<string, string[]>) => void
  onCustomRequirementChange: (requirement: string) => void
}) {
  const selectedTemplateData = templates.find(t => t.id === selectedTemplate)

  const handleFieldSelection = (datasetId: string, fieldName: string, checked: boolean) => {
    const currentFields = selectedFields[datasetId] || []
    if (checked) {
      onFieldsChange({
        ...selectedFields,
        [datasetId]: [...currentFields, fieldName]
      })
    } else {
      onFieldsChange({
        ...selectedFields,
        [datasetId]: currentFields.filter(name => name !== fieldName)
      })
    }
  }

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

      {/* 数据集选择 */}
      {selectedTemplateData && (
        <div>
          <h4 className="font-medium text-slate-900 mb-3">选择数据集</h4>
          <div className="space-y-4">
            {Object.entries(datasetsByCategory).map(([category, datasets]) => (
              <div key={category}>
                <h5 className="text-sm font-medium text-slate-700 mb-2">{category}</h5>
                <div className="space-y-2">
                  {datasets.map((dataset) => (
                    <div key={dataset._id} className="border border-slate-200 rounded-lg">
                      <label className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={selectedDatasets.includes(dataset._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              onDatasetsChange([...selectedDatasets, dataset._id])
                            } else {
                              onDatasetsChange(selectedDatasets.filter(id => id !== dataset._id))
                              // 同时清除该数据集的字段选择
                              const newFields = { ...selectedFields }
                              delete newFields[dataset._id]
                              onFieldsChange(newFields)
                            }
                          }}
                          className="rounded"
                        />
                        <div>
                          <div className="text-sm font-medium text-slate-900">{dataset.displayName}</div>
                          <div className="text-xs text-slate-500">
                            {dataset.fields?.filter(f => f.fieldType === 'dimension').length || 0} 维度，
                            {dataset.fields?.filter(f => f.fieldType === 'measure').length || 0} 度量
                          </div>
                        </div>
                      </label>
                      
                      {/* 字段选择 */}
                      {selectedDatasets.includes(dataset._id) && dataset.fields && (
                        <div className="border-t border-slate-200 p-3 bg-slate-50">
                          <div className="text-xs font-medium text-slate-700 mb-2">选择要展示的字段：</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                            {dataset.fields.map((field) => (
                              <label key={field.name} className="flex items-center gap-2 text-xs cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={(selectedFields[dataset._id] || []).includes(field.name)}
                                  onChange={(e) => handleFieldSelection(dataset._id, field.name, e.target.checked)}
                                  className="rounded text-xs"
                                />
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded text-[10px] font-medium",
                                  field.fieldType === 'measure' 
                                    ? "bg-green-100 text-green-700"
                                    : "bg-purple-100 text-purple-700"
                                )}>
                                  {field.fieldType === 'measure' ? '度量' : '维度'}
                                </span>
                                <span className="text-slate-900">{field.displayName}</span>
                                {field.unit && <span className="text-slate-500">({field.unit})</span>}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
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
  selectedDatasets 
}: { 
  components: ComponentLayout[]
  selectedDatasets: Dataset[]
}) {
  return (
    <div className="p-6">
      <div className="mb-4">
        <h4 className="font-medium text-slate-900 mb-2">生成的看板预览</h4>
        <p className="text-sm text-slate-600">
          为您生成了 {components.length} 个图表组件，基于 {selectedDatasets.length} 个数据集
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
                {component.dataConfig.datasetId && (
                  <div className="text-xs text-slate-500 mt-1">
                    数据源: {selectedDatasets.find(d => d._id === component.dataConfig.datasetId)?.displayName}
                  </div>
                )}
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