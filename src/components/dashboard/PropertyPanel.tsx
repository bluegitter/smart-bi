'use client'

import React from 'react'
import { X, Settings, Palette, Database, Filter, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import type { ComponentLayout } from '@/types'

interface PropertyPanelProps {
  isOpen: boolean
  onClose: () => void
  selectedComponent: ComponentLayout | null
  onUpdateComponent: (componentId: string, updates: Partial<ComponentLayout>) => void
}

const chartTypeOptions = [
  { value: 'line-chart', label: '折线图', icon: '📈' },
  { value: 'bar-chart', label: '柱状图', icon: '📊' },
  { value: 'pie-chart', label: '饼图', icon: '🥧' },
  { value: 'table', label: '数据表', icon: '📋' },
  { value: 'kpi-card', label: '指标卡片', icon: '📌' },
  { value: 'gauge', label: '仪表盘', icon: '⏰' }
]

const colorSchemes = [
  { name: '默认', colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'] },
  { name: '蓝色系', colors: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'] },
  { name: '绿色系', colors: ['#166534', '#16a34a', '#22c55e', '#4ade80', '#bbf7d0'] },
  { name: '紫色系', colors: ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#e9d5ff'] },
  { name: '暖色系', colors: ['#dc2626', '#ea580c', '#f59e0b', '#eab308', '#84cc16'] }
]

export function PropertyPanel({ isOpen, onClose, selectedComponent, onUpdateComponent }: PropertyPanelProps) {
  const [activeSection, setActiveSection] = React.useState<string>('basic')
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    basic: true,
    style: true,
    data: true,
    advanced: false
  })

  if (!isOpen || !selectedComponent) return null

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleUpdate = (updates: Partial<ComponentLayout>) => {
    onUpdateComponent(selectedComponent.id, updates)
  }

  const handleChartTypeChange = (newType: ComponentLayout['type']) => {
    handleUpdate({ type: newType })
  }

  const handleTitleChange = (newTitle: string) => {
    handleUpdate({ title: newTitle })
  }

  const handleStyleUpdate = (styleUpdates: any) => {
    handleUpdate({
      config: {
        ...selectedComponent.config,
        style: {
          ...selectedComponent.config.style,
          ...styleUpdates
        }
      }
    })
  }

  const currentChartType = chartTypeOptions.find(option => option.value === selectedComponent.type)

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full">
      {/* 头部 */}
      <div className="h-16 border-b border-slate-200 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-slate-600" />
          <span className="font-medium">组件属性</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* 基础设置 */}
          <Card>
            <CardHeader 
              className="pb-2 cursor-pointer"
              onClick={() => toggleSection('basic')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  基础设置
                </CardTitle>
                {expandedSections.basic ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </CardHeader>
            {expandedSections.basic && (
              <CardContent className="pt-2 space-y-4">
                {/* 组件类型 */}
                <div>
                  <label className="block text-sm font-medium mb-2">组件类型</label>
                  <div className="grid grid-cols-2 gap-2">
                    {chartTypeOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={selectedComponent.type === option.value ? 'default' : 'outline'}
                        size="sm"
                        className="flex flex-col items-center gap-1 h-auto py-2"
                        onClick={() => handleChartTypeChange(option.value as ComponentLayout['type'])}
                      >
                        <span className="text-sm">{option.icon}</span>
                        <span className="text-xs">{option.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 标题 */}
                <div>
                  <label className="block text-sm font-medium mb-2">标题</label>
                  <Input
                    value={selectedComponent.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="输入组件标题"
                  />
                </div>

                {/* 位置和尺寸 */}
                <div>
                  <label className="block text-sm font-medium mb-2">位置和尺寸</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">X坐标</label>
                      <Input
                        type="number"
                        value={selectedComponent.position.x}
                        onChange={(e) => handleUpdate({
                          position: { ...selectedComponent.position, x: Number(e.target.value) }
                        })}
                        size="sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Y坐标</label>
                      <Input
                        type="number"
                        value={selectedComponent.position.y}
                        onChange={(e) => handleUpdate({
                          position: { ...selectedComponent.position, y: Number(e.target.value) }
                        })}
                        size="sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">宽度</label>
                      <Input
                        type="number"
                        value={selectedComponent.size.width}
                        onChange={(e) => handleUpdate({
                          size: { ...selectedComponent.size, width: Number(e.target.value) }
                        })}
                        size="sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">高度</label>
                      <Input
                        type="number"
                        value={selectedComponent.size.height}
                        onChange={(e) => handleUpdate({
                          size: { ...selectedComponent.size, height: Number(e.target.value) }
                        })}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* 样式设置 */}
          <Card>
            <CardHeader 
              className="pb-2 cursor-pointer"
              onClick={() => toggleSection('style')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  样式设置
                </CardTitle>
                {expandedSections.style ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </CardHeader>
            {expandedSections.style && (
              <CardContent className="pt-2 space-y-4">
                {/* 配色方案 */}
                <div>
                  <label className="block text-sm font-medium mb-2">配色方案</label>
                  <div className="space-y-2">
                    {colorSchemes.map((scheme) => (
                      <div
                        key={scheme.name}
                        className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer"
                        onClick={() => handleStyleUpdate({ colorScheme: scheme.colors })}
                      >
                        <div className="flex gap-1">
                          {scheme.colors.map((color, index) => (
                            <div
                              key={index}
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <span className="text-sm">{scheme.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 背景设置 */}
                <div>
                  <label className="block text-sm font-medium mb-2">背景</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showBackground"
                        className="rounded"
                        defaultChecked={true}
                        onChange={(e) => handleStyleUpdate({ showBackground: e.target.checked })}
                      />
                      <label htmlFor="showBackground" className="text-sm">显示背景</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showBorder"
                        className="rounded"
                        defaultChecked={true}
                        onChange={(e) => handleStyleUpdate({ showBorder: e.target.checked })}
                      />
                      <label htmlFor="showBorder" className="text-sm">显示边框</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showShadow"
                        className="rounded"
                        defaultChecked={false}
                        onChange={(e) => handleStyleUpdate({ showShadow: e.target.checked })}
                      />
                      <label htmlFor="showShadow" className="text-sm">显示阴影</label>
                    </div>
                  </div>
                </div>

                {/* 透明度 */}
                <div>
                  <label className="block text-sm font-medium mb-2">透明度</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="100"
                    className="w-full"
                    onChange={(e) => handleStyleUpdate({ opacity: Number(e.target.value) / 100 })}
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* 数据配置 */}
          <Card>
            <CardHeader 
              className="pb-2 cursor-pointer"
              onClick={() => toggleSection('data')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  数据配置
                </CardTitle>
                {expandedSections.data ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </CardHeader>
            {expandedSections.data && (
              <CardContent className="pt-2 space-y-4">
                {/* 数据源 */}
                <div>
                  <label className="block text-sm font-medium mb-2">数据源</label>
                  <select className="w-full h-10 px-3 py-2 border border-slate-200 rounded-md text-sm">
                    <option value="">选择数据源</option>
                    <option value="mysql-prod">MySQL - 生产环境</option>
                    <option value="postgres-test">PostgreSQL - 测试环境</option>
                    <option value="api-sales">销售API接口</option>
                  </select>
                </div>

                {/* 指标设置 */}
                <div>
                  <label className="block text-sm font-medium mb-2">指标</label>
                  <div className="space-y-2">
                    {selectedComponent.dataConfig.metrics.length === 0 ? (
                      <div className="text-sm text-slate-500 text-center py-4 border-2 border-dashed border-slate-200 rounded">
                        拖拽指标到这里
                      </div>
                    ) : (
                      selectedComponent.dataConfig.metrics.map((metric, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                          <span className="text-sm">{metric}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    添加指标
                  </Button>
                </div>

                {/* 维度设置 */}
                <div>
                  <label className="block text-sm font-medium mb-2">维度</label>
                  <div className="space-y-2">
                    {selectedComponent.dataConfig.dimensions.length === 0 ? (
                      <div className="text-sm text-slate-500 text-center py-4 border-2 border-dashed border-slate-200 rounded">
                        拖拽维度到这里
                      </div>
                    ) : (
                      selectedComponent.dataConfig.dimensions.map((dimension, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                          <span className="text-sm">{dimension}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    添加维度
                  </Button>
                </div>

                {/* 过滤器 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">过滤器</label>
                    <Button variant="ghost" size="sm" className="h-6 text-xs">
                      <Filter className="h-3 w-3 mr-1" />
                      添加
                    </Button>
                  </div>
                  <div className="text-sm text-slate-500 text-center py-2">
                    暂无过滤器
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* 高级设置 */}
          <Card>
            <CardHeader 
              className="pb-2 cursor-pointer"
              onClick={() => toggleSection('advanced')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">高级设置</CardTitle>
                {expandedSections.advanced ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </CardHeader>
            {expandedSections.advanced && (
              <CardContent className="pt-2 space-y-4">
                {/* 刷新设置 */}
                <div>
                  <label className="block text-sm font-medium mb-2">自动刷新</label>
                  <select className="w-full h-10 px-3 py-2 border border-slate-200 rounded-md text-sm">
                    <option value="0">关闭</option>
                    <option value="30">30秒</option>
                    <option value="60">1分钟</option>
                    <option value="300">5分钟</option>
                    <option value="900">15分钟</option>
                  </select>
                </div>

                {/* 缓存设置 */}
                <div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="enableCache"
                      className="rounded"
                      defaultChecked={true}
                    />
                    <label htmlFor="enableCache" className="text-sm">启用缓存</label>
                  </div>
                </div>

                {/* 导出设置 */}
                <div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="allowExport"
                      className="rounded"
                      defaultChecked={true}
                    />
                    <label htmlFor="allowExport" className="text-sm">允许导出</label>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      {/* 底部操作按钮 */}
      <div className="border-t border-slate-200 p-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            重置
          </Button>
          <Button size="sm" className="flex-1">
            应用
          </Button>
        </div>
      </div>
    </div>
  )
}