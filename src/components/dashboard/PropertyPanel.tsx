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

  const handleChartConfigUpdate = (chartUpdates: any) => {
    handleUpdate({
      config: {
        ...selectedComponent.config,
        chart: {
          ...selectedComponent.config?.chart,
          ...chartUpdates
        }
      }
    })
  }

  const handleTableConfigUpdate = (tableUpdates: any) => {
    handleUpdate({
      config: {
        ...selectedComponent.config,
        table: {
          ...selectedComponent.config?.table,
          ...tableUpdates
        }
      }
    })
  }

  const handleKPIConfigUpdate = (kpiUpdates: any) => {
    handleUpdate({
      config: {
        ...selectedComponent.config,
        kpi: {
          ...selectedComponent.config?.kpi,
          ...kpiUpdates
        }
      }
    })
  }

  const handleGaugeConfigUpdate = (gaugeUpdates: any) => {
    handleUpdate({
      config: {
        ...selectedComponent.config,
        gauge: {
          ...selectedComponent.config?.gauge,
          ...gaugeUpdates
        }
      }
    })
  }

  const currentChartType = chartTypeOptions.find(option => option.value === selectedComponent.type)

  const handleScrollCapture = (e: React.UIEvent) => {
    // 阻止滚动事件向上传播到画布区域
    e.stopPropagation()
  }

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-screen">
      {/* 头部 */}
      <div className="h-16 border-b border-slate-200 px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-slate-600" />
          <span className="font-medium">组件属性</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* 内容区域 - 独立滚动容器 */}
      <div 
        className="flex-1 overflow-y-scroll"
        style={{
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none', /* IE and Edge */
          maxHeight: 'calc(100vh - 120px)' /* 头部64px + 底部56px = 120px */
        }}
        onScroll={handleScrollCapture}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
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
                        value={selectedComponent.position.x.toString()}
                        onChange={(e) => handleUpdate({
                          position: { ...selectedComponent.position, x: parseInt(e.target.value) || 0 }
                        })}
                        size="sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Y坐标</label>
                      <Input
                        type="number"
                        value={selectedComponent.position.y.toString()}
                        onChange={(e) => handleUpdate({
                          position: { ...selectedComponent.position, y: parseInt(e.target.value) || 0 }
                        })}
                        size="sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">宽度</label>
                      <Input
                        type="number"
                        value={selectedComponent.size.width.toString()}
                        onChange={(e) => handleUpdate({
                          size: { ...selectedComponent.size, width: parseInt(e.target.value) || 200 }
                        })}
                        size="sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">高度</label>
                      <Input
                        type="number"
                        value={selectedComponent.size.height.toString()}
                        onChange={(e) => handleUpdate({
                          size: { ...selectedComponent.size, height: parseInt(e.target.value) || 150 }
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

                {/* 图表专属设置 */}
                {selectedComponent.type === 'line-chart' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">折线图设置</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showGrid"
                          className="rounded"
                          defaultChecked={true}
                          onChange={(e) => handleChartConfigUpdate({ showGrid: e.target.checked })}
                        />
                        <label htmlFor="showGrid" className="text-sm">显示网格</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showPoints"
                          className="rounded"
                          defaultChecked={true}
                          onChange={(e) => handleChartConfigUpdate({ showPoints: e.target.checked })}
                        />
                        <label htmlFor="showPoints" className="text-sm">显示数据点</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showArea"
                          className="rounded"
                          defaultChecked={false}
                          onChange={(e) => handleChartConfigUpdate({ showArea: e.target.checked })}
                        />
                        <label htmlFor="showArea" className="text-sm">面积填充</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="smooth"
                          className="rounded"
                          defaultChecked={false}
                          onChange={(e) => handleChartConfigUpdate({ smooth: e.target.checked })}
                        />
                        <label htmlFor="smooth" className="text-sm">平滑曲线</label>
                      </div>
                    </div>
                  </div>
                )}

                {selectedComponent.type === 'bar-chart' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">柱状图设置</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showValues"
                          className="rounded"
                          defaultChecked={false}
                          onChange={(e) => handleChartConfigUpdate({ showValues: e.target.checked })}
                        />
                        <label htmlFor="showValues" className="text-sm">显示数值</label>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">柱子样式</label>
                        <select 
                          className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
                          onChange={(e) => handleChartConfigUpdate({ barStyle: e.target.value })}
                        >
                          <option value="rounded">圆角</option>
                          <option value="square">方角</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">方向</label>
                        <select 
                          className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
                          onChange={(e) => handleChartConfigUpdate({ orientation: e.target.value })}
                        >
                          <option value="vertical">垂直</option>
                          <option value="horizontal">水平</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {selectedComponent.type === 'pie-chart' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">饼图设置</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showLabels"
                          className="rounded"
                          defaultChecked={true}
                          onChange={(e) => handleChartConfigUpdate({ showLabels: e.target.checked })}
                        />
                        <label htmlFor="showLabels" className="text-sm">显示标签</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showLegend"
                          className="rounded"
                          defaultChecked={true}
                          onChange={(e) => handleChartConfigUpdate({ showLegend: e.target.checked })}
                        />
                        <label htmlFor="showLegend" className="text-sm">显示图例</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showPercentage"
                          className="rounded"
                          defaultChecked={true}
                          onChange={(e) => handleChartConfigUpdate({ showPercentage: e.target.checked })}
                        />
                        <label htmlFor="showPercentage" className="text-sm">显示百分比</label>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">内圆半径 (%)</label>
                        <input
                          type="range"
                          min="0"
                          max="80"
                          defaultValue="0"
                          className="w-full"
                          onChange={(e) => handleChartConfigUpdate({ innerRadius: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedComponent.type === 'table' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">数据表设置</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showHeader"
                          className="rounded"
                          defaultChecked={true}
                          onChange={(e) => handleTableConfigUpdate({ showHeader: e.target.checked })}
                        />
                        <label htmlFor="showHeader" className="text-sm">显示表头</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showBorder"
                          className="rounded"
                          defaultChecked={false}
                          onChange={(e) => handleTableConfigUpdate({ showBorder: e.target.checked })}
                        />
                        <label htmlFor="showBorder" className="text-sm">显示边框</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showStripes"
                          className="rounded"
                          defaultChecked={false}
                          onChange={(e) => handleTableConfigUpdate({ showStripes: e.target.checked })}
                        />
                        <label htmlFor="showStripes" className="text-sm">斑马纹</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="compact"
                          className="rounded"
                          defaultChecked={false}
                          onChange={(e) => handleTableConfigUpdate({ compact: e.target.checked })}
                        />
                        <label htmlFor="compact" className="text-sm">紧凑模式</label>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">最大行数</label>
                        <input
                          type="number"
                          min="3"
                          max="20"
                          defaultValue="6"
                          className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
                          onChange={(e) => handleTableConfigUpdate({ maxRows: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedComponent.type === 'kpi-card' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">指标卡设置</label>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">卡片样式</label>
                        <select 
                          className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
                          onChange={(e) => handleKPIConfigUpdate({ style: e.target.value })}
                        >
                          <option value="modern">现代</option>
                          <option value="minimal">简约</option>
                          <option value="colorful">彩色</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showIcon"
                          className="rounded"
                          defaultChecked={true}
                          onChange={(e) => handleKPIConfigUpdate({ showIcon: e.target.checked })}
                        />
                        <label htmlFor="showIcon" className="text-sm">显示图标</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showTrend"
                          className="rounded"
                          defaultChecked={true}
                          onChange={(e) => handleKPIConfigUpdate({ showTrend: e.target.checked })}
                        />
                        <label htmlFor="showTrend" className="text-sm">显示趋势</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showDescription"
                          className="rounded"
                          defaultChecked={true}
                          onChange={(e) => handleKPIConfigUpdate({ showDescription: e.target.checked })}
                        />
                        <label htmlFor="showDescription" className="text-sm">显示描述</label>
                      </div>
                    </div>
                  </div>
                )}

                {selectedComponent.type === 'gauge' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">仪表盘设置</label>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">样式</label>
                        <select 
                          className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
                          onChange={(e) => handleGaugeConfigUpdate({ style: e.target.value })}
                        >
                          <option value="modern">现代</option>
                          <option value="classic">经典</option>
                          <option value="minimal">简约</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showLabels"
                          className="rounded"
                          defaultChecked={true}
                          onChange={(e) => handleGaugeConfigUpdate({ showLabels: e.target.checked })}
                        />
                        <label htmlFor="showLabels" className="text-sm">显示刻度</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showThresholds"
                          className="rounded"
                          defaultChecked={false}
                          onChange={(e) => handleGaugeConfigUpdate({ showThresholds: e.target.checked })}
                        />
                        <label htmlFor="showThresholds" className="text-sm">显示阈值</label>
                      </div>
                    </div>
                  </div>
                )}

                {/* 通用背景设置 */}
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
      <div className="border-t border-slate-200 p-4 flex-shrink-0">
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