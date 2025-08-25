'use client'

import React from 'react'
import { X, Settings, Palette, Database, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useSidebarCollapsed, useIsFullscreen } from '@/store/useAppStore'
import type { ComponentLayout } from '@/types'
import {
  BasicSettingsEditor,
  GeneralStyleEditor,
  ChartStyleEditor,
  TableStyleEditor,
  KPIStyleEditor,
  GaugeStyleEditor,
  MapStyleEditor,
  ContainerStyleEditor,
  DataConfigEditor,
  AdvancedSettingsEditor
} from './property-editors'

interface PropertyPanelProps {
  isOpen: boolean
  onClose: () => void
  selectedComponent: ComponentLayout | null
  onUpdateComponent: (componentId: string, updates: Partial<ComponentLayout>) => void
  onUpdateChild?: (containerId: string, childId: string, updates: Partial<ComponentLayout>) => void
  parentContainerId?: string // 如果选中的是子组件，这里存储父容器ID
}


export function PropertyPanel({ isOpen, onClose, selectedComponent, onUpdateComponent, onUpdateChild, parentContainerId }: PropertyPanelProps) {
  const [activeSection, setActiveSection] = React.useState<string>('basic')
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    basic: true,
    style: true,
    data: true,
    advanced: false
  })
  
  // 过滤器状态
  const [filters, setFilters] = React.useState<Array<{
    field: string
    operator: string
    value: string
    id: string
  }>>(selectedComponent?.dataConfig?.filters || [])

  // 获取sidebar和全屏状态
  const sidebarCollapsed = useSidebarCollapsed()
  const isFullscreen = useIsFullscreen()

  if (!isOpen || !selectedComponent) return null

  // 计算属性面板的位置
  // 当sidebar折叠或全屏时，面板位置为 right-0
  // 当sidebar展开时，面板位置需要考虑sidebar的宽度(320px)
  const panelRight = (sidebarCollapsed || isFullscreen) ? 0 : 0

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleUpdate = (updates: Partial<ComponentLayout>) => {
    // 如果选中的是容器子组件，使用特殊的更新逻辑
    if (parentContainerId && onUpdateChild) {
      onUpdateChild(parentContainerId, selectedComponent.id, updates)
    } else {
      // 普通组件更新
      onUpdateComponent(selectedComponent.id, updates)
    }
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

  const handleMapConfigUpdate = (mapUpdates: any) => {
    handleUpdate({
      config: {
        ...selectedComponent.config,
        map: {
          ...selectedComponent.config?.map,
          ...mapUpdates
        }
      }
    })
  }

  const handleContainerConfigUpdate = (containerUpdates: any) => {
    handleUpdate({
      containerConfig: {
        ...selectedComponent.containerConfig,
        ...containerUpdates
      }
    })
  }

  // 处理数据配置更新
  const handleDataConfigUpdate = (dataUpdates: any) => {
    const currentDataConfig = selectedComponent.dataConfig || {}
    handleUpdate({
      dataConfig: {
        ...currentDataConfig,
        ...dataUpdates
      }
    })
  }


  const handleScrollCapture = (e: React.UIEvent) => {
    // 阻止滚动事件向上传播到画布区域
    e.stopPropagation()
  }

  return (
    <div 
      className="fixed w-80 bg-white border-l border-slate-200 flex flex-col z-50 shadow-lg"
      style={{ 
        top: isFullscreen ? '0' : '64px', // Header高度64px，全屏时从顶部开始
        height: isFullscreen ? '100vh' : 'calc(100vh - 64px)',
        right: panelRight,
        transition: 'right 0.3s ease-in-out'
      }}
    >
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
        className="flex-1 overflow-y-auto min-h-0"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 transparent',
        }}
        onScroll={handleScrollCapture}
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
              <CardContent className="pt-2">
                <BasicSettingsEditor
                  selectedComponent={selectedComponent}
                  onUpdate={handleUpdate}
                />
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
                <GeneralStyleEditor
                  selectedComponent={selectedComponent}
                  onStyleUpdate={handleStyleUpdate}
                />

                <ChartStyleEditor
                  selectedComponent={selectedComponent}
                  onChartConfigUpdate={handleChartConfigUpdate}
                />

                <TableStyleEditor
                  selectedComponent={selectedComponent}
                  onTableConfigUpdate={handleTableConfigUpdate}
                />

                <KPIStyleEditor
                  selectedComponent={selectedComponent}
                  onKPIConfigUpdate={handleKPIConfigUpdate}
                />

                <GaugeStyleEditor
                  selectedComponent={selectedComponent}
                  onGaugeConfigUpdate={handleGaugeConfigUpdate}
                />

                <MapStyleEditor
                  selectedComponent={selectedComponent}
                  onMapConfigUpdate={handleMapConfigUpdate}
                />

                <ContainerStyleEditor
                  selectedComponent={selectedComponent}
                  onContainerConfigUpdate={handleContainerConfigUpdate}
                />
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
              <CardContent className="pt-2">
                <DataConfigEditor
                  selectedComponent={selectedComponent}
                  onDataConfigUpdate={handleDataConfigUpdate}
                  filters={filters}
                  setFilters={setFilters}
                />
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
              <CardContent className="pt-2">
                <AdvancedSettingsEditor />
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