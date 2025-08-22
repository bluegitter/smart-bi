'use client'

import React, { useEffect } from 'react'
import { useDrop } from 'react-dnd'
import { Plus, Layout, Save, Eye, Settings, Maximize2, Minimize2, Loader2, Database } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { PropertyPanel } from './PropertyPanel'
import { MetricsLibraryPanel } from './MetricsLibraryPanel'
import { cn } from '@/lib/utils'
import { useDashboard } from '@/hooks/useDashboards'
import { useActions, useIsFullscreen } from '@/store/useAppStore'
import { 
  SimpleLineChart, 
  SimpleBarChart, 
  SimplePieChart, 
  SimpleTable, 
  SimpleKPICard, 
  SimpleGauge,
  ContainerComponent,
  generateMockData 
} from '@/components/charts/ChartComponents'
import type { DragItem, ComponentLayout, Dashboard } from '@/types'

interface DashboardCanvasProps {
  className?: string
  dashboardId?: string
  dashboardName?: string
  onSave?: (dashboard: Dashboard) => void
  initialComponents?: ComponentLayout[]
  initialPreviewMode?: boolean
}

export function DashboardCanvas({ 
  className, 
  dashboardId,
  dashboardName = '未命名看板',
  onSave,
  initialComponents = [],
  initialPreviewMode = false
}: DashboardCanvasProps) {
  const {
    dashboard,
    loading,
    error,
    saving,
    saveDashboard,
    saveLayout,
    addComponent: addComponentToDb,
    updateComponent: updateComponentInDb,
    removeComponent: removeComponentFromDb
  } = useDashboard(dashboardId || null)

  const [components, setComponents] = React.useState<ComponentLayout[]>(initialComponents)
  const [selectedComponent, setSelectedComponent] = React.useState<ComponentLayout | null>(null)
  const [selectedChildParentId, setSelectedChildParentId] = React.useState<string | null>(null) // 跟踪子组件的父容器ID
  const [isPropertyPanelOpen, setIsPropertyPanelOpen] = React.useState(false)
  const [isPreviewMode, setIsPreviewMode] = React.useState(initialPreviewMode)
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false)
  const [isMetricsLibraryOpen, setIsMetricsLibraryOpen] = React.useState(false)
  const [metricsLibraryHeight, setMetricsLibraryHeight] = React.useState(400)
  
  // 全屏状态和操作
  const isFullscreen = useIsFullscreen()
  const { toggleFullscreen } = useActions()
  
  const [metricsLibraryPosition, setMetricsLibraryPosition] = React.useState({ x: 0, y: isFullscreen ? 60 : 120 })

  // 计算指标面板的最佳高度
  const calculateOptimalHeight = React.useCallback(() => {
    const windowHeight = window.innerHeight
    const panelTop = metricsLibraryPosition.y
    const bottomPadding = 50 // 距离底部的安全距离
    const minHeight = 300
    const maxHeight = 800
    
    const availableHeight = windowHeight - panelTop - bottomPadding
    const optimalHeight = Math.max(minHeight, Math.min(maxHeight, availableHeight))
    
    return optimalHeight
  }, [metricsLibraryPosition.y])

  // 当指标面板打开时自动计算高度和调整位置
  React.useEffect(() => {
    if (isMetricsLibraryOpen) {
      const windowHeight = window.innerHeight
      const windowWidth = window.innerWidth
      const panelWidth = 320
      const minHeight = 300
      
      // 计算最佳位置
      let newX = metricsLibraryPosition.x
      let newY = metricsLibraryPosition.y
      
      // 检查水平位置是否需要调整
      if (newX + panelWidth > windowWidth - 10) {
        newX = Math.max(0, windowWidth - panelWidth - 10)
      }
      
      // 确保不会超出左边界
      newX = Math.max(0, newX)
      
      // 检查垂直位置是否需要调整
      const maxY = windowHeight - minHeight - 50
      if (newY > maxY) {
        newY = Math.max(70, maxY)
      }
      
      // 如果位置需要调整，更新位置
      if (newX !== metricsLibraryPosition.x || newY !== metricsLibraryPosition.y) {
        setMetricsLibraryPosition({ x: newX, y: newY })
      }
      
      // 计算最佳高度
      const panelTop = newY
      const bottomPadding = 50
      const availableHeight = windowHeight - panelTop - bottomPadding
      const optimalHeight = Math.max(minHeight, Math.min(800, availableHeight))
      
      setMetricsLibraryHeight(optimalHeight)
    }
  }, [isMetricsLibraryOpen]) // 只依赖于打开状态

  // 监听窗口大小变化
  React.useEffect(() => {
    const handleResize = () => {
      if (isMetricsLibraryOpen) {
        const optimalHeight = calculateOptimalHeight()
        setMetricsLibraryHeight(optimalHeight)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isMetricsLibraryOpen, calculateOptimalHeight])

  // 监听全屏模式变化，调整指标面板位置
  React.useEffect(() => {
    if (isFullscreen) {
      setMetricsLibraryPosition(prev => ({ ...prev, y: 60 }))
    } else {
      setMetricsLibraryPosition(prev => ({ ...prev, y: 120 }))
    }
  }, [isFullscreen])

  // 监听键盘事件
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete键删除选中组件
      if (e.key === 'Delete' && selectedComponent && !isPreviewMode) {
        e.preventDefault()
        if (selectedChildParentId) {
          // 删除容器子组件
          handleDeleteChild(selectedChildParentId, selectedComponent.id)
        } else {
          // 删除普通组件
          handleComponentDelete(selectedComponent.id)
        }
      }
      
      // ESC键退出编辑模式
      if (e.key === 'Escape' && !isPreviewMode) {
        e.preventDefault()
        setIsPreviewMode(true)
        setSelectedComponent(null)
        setIsPropertyPanelOpen(false)
        setIsMetricsLibraryOpen(false)
      }
    }

    // 只在组件已挂载且用户没有在输入框中时监听键盘事件
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 检查是否在输入元素中
      const activeElement = document.activeElement
      const isInputElement = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.tagName === 'SELECT' ||
        activeElement.getAttribute('contenteditable') === 'true'
      )
      
      if (!isInputElement) {
        handleKeyDown(e)
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [selectedComponent, selectedChildParentId, isPreviewMode])

  // 处理指标面板位置变化，同时重新计算高度
  const handleMetricsLibraryMove = React.useCallback((newPosition: { x: number; y: number }) => {
    // 确保位置在合理范围内
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    const panelWidth = 320
    
    const constrainedPosition = {
      x: Math.max(0, Math.min(newPosition.x, windowWidth - panelWidth)),
      y: Math.max(60, Math.min(newPosition.y, windowHeight - 300))
    }
    
    setMetricsLibraryPosition(constrainedPosition)
    
    // 位置变化后立即重新计算高度
    if (isMetricsLibraryOpen) {
      setTimeout(() => {
        const windowHeight = window.innerHeight
        const panelTop = constrainedPosition.y
        const bottomPadding = 50
        const minHeight = 300
        const maxHeight = 800
        
        const availableHeight = windowHeight - panelTop - bottomPadding
        const optimalHeight = Math.max(minHeight, Math.min(maxHeight, availableHeight))
        
        setMetricsLibraryHeight(optimalHeight)
      }, 0)
    }
  }, [isMetricsLibraryOpen])

  // 当看板数据加载时，更新组件状态
  useEffect(() => {
    if (dashboard?.layout?.components) {
      setComponents(dashboard.layout.components)
      setHasUnsavedChanges(false)
    }
  }, [dashboard])

  // 监听组件变化，标记为有未保存的更改
  useEffect(() => {
    if (dashboard?.layout?.components) {
      const currentComponents = JSON.stringify(components)
      const savedComponents = JSON.stringify(dashboard.layout.components)
      setHasUnsavedChanges(currentComponents !== savedComponents)
    } else if (components.length > 0) {
      // 如果没有现有dashboard但有组件，说明有未保存的更改
      setHasUnsavedChanges(true)
    } else {
      // 如果没有dashboard也没有组件，说明没有更改
      setHasUnsavedChanges(false)
    }
  }, [components, dashboard?.layout?.components])
  
  // Create a ref for the canvas element
  const canvasRef = React.useRef<HTMLDivElement>(null)
  
  // Debug components state changes
  React.useEffect(() => {
    console.log('Components state updated:', components.length, components)
  }, [components])

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ['component', 'metric', 'container', 'container-child'],
    drop: (item: DragItem, monitor) => {
      console.log('Drop zone triggered with item:', item)
      const offset = monitor.getSourceClientOffset()
      console.log('Source client offset:', offset)
      if (offset) {
        console.log('Calling handleDrop with:', item, offset)
        try {
          handleDrop(item, offset)
          console.log('handleDrop completed successfully')
        } catch (error) {
          console.error('Error in handleDrop:', error)
        }
      } else {
        console.log('No offset available for drop')
      }
    },
    hover: (item: DragItem, monitor) => {
      console.log('Hovering over drop zone with:', item.type)
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }))

  const handleDrop = (item: DragItem, offset: { x: number; y: number }) => {
    console.log('Drop event received:', item)
    console.log('Offset:', offset)
    console.log('Canvas ref current:', canvasRef.current)
    
    const canvasRect = canvasRef.current?.getBoundingClientRect()
    console.log('Canvas rect:', canvasRect)
    
    if (!canvasRect) {
      console.log('No canvas rect found, returning early')
      return
    }

    const relativeX = offset.x - canvasRect.left
    const relativeY = offset.y - canvasRect.top

    // 网格对齐（24px 网格）
    const gridSize = 24
    const x = Math.max(0, Math.round(relativeX / gridSize) * gridSize)
    const y = Math.max(0, Math.round(relativeY / gridSize) * gridSize)

    console.log(`Drop position: x=${x}, y=${y}, item type: ${item.type}`)

    console.log('Checking item type:', item.type, typeof item.type)
    console.log('Is metric?', item.type === 'metric')
    console.log('Is component?', item.type === 'component')

    if (item.type === 'component') {
      // 从侧边栏拖拽组件
      const componentData = item.data as { type: ComponentLayout['type'], name: string }
      const componentType = componentData.type || 'line-chart'
      
      // 根据组件类型设置合适的默认尺寸
      const getDefaultSize = (type: ComponentLayout['type']) => {
        switch (type) {
          case 'kpi-card':
            return { width: 300, height: 180 }
          case 'gauge':
            return { width: 250, height: 200 }
          case 'pie-chart':
            return { width: 350, height: 280 }
          case 'table':
            return { width: 500, height: 300 }
          case 'container':
            return { width: 600, height: 400 }
          default:
            return { width: 400, height: 300 }
        }
      }
      
      // 根据组件类型设置合适的中文标题
      const getDefaultTitle = (type: ComponentLayout['type']) => {
        switch (type) {
          case 'line-chart':
            return '趋势分析图'
          case 'bar-chart':
            return '柱状对比图'
          case 'pie-chart':
            return '数据分布图'
          case 'table':
            return '数据明细表'
          case 'kpi-card':
            return '关键指标'
          case 'gauge':
            return '进度仪表盘'
          case 'container':
            return '容器组件'
          default:
            return '新图表'
        }
      }
      
      const newComponent: ComponentLayout = {
        id: `component-${Date.now()}`,
        type: componentType,
        title: componentData.name || getDefaultTitle(componentType),
        position: { x, y },
        size: getDefaultSize(componentType),
        config: {
          style: {
            colorScheme: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'],
            showBackground: true,
            showBorder: true,
            showShadow: false,
            opacity: 1
          }
        },
        dataConfig: {
          datasourceId: '',
          query: '',
          metrics: [],
          dimensions: [],
          filters: [],
        },
        // 容器组件专用属性
        ...(componentType === 'container' && {
          children: [],
          containerConfig: {
            layout: 'flex',
            padding: 16,
            gap: 12,
            backgroundColor: '#ffffff',
            borderStyle: 'dashed',
            borderColor: '#e2e8f0',
            borderWidth: 2
          }
        })
      }
      setComponents(prev => [...prev, newComponent])
      // 自动选择新创建的组件
      setSelectedComponent(newComponent)
      setIsPropertyPanelOpen(true)
    } else if (item.type === 'metric') {
      // 从指标面板拖拽指标到画布，自动创建对应的图表组件
      console.log('Creating component from metric drag')
      const metricData = item.data as { _id: string; name: string; displayName: string; category: string; type: string; unit?: string }
      console.log('Metric data:', metricData)
      
      // 根据指标类型选择合适的图表类型
      const getChartTypeForMetric = (metricType: string, metricCategory: string): ComponentLayout['type'] => {
        // 根据指标类型和类别智能选择图表类型
        if (metricType === 'ratio' || metricCategory === '营销') {
          return 'pie-chart'
        } else if (metricType === 'count') {
          return 'bar-chart'
        } else if (metricType === 'sum') {
          return 'line-chart'
        } else {
          return 'kpi-card'
        }
      }
      
      const chartType = getChartTypeForMetric(metricData.type, metricData.category)
      console.log('Selected chart type:', chartType)
      
      const newComponent: ComponentLayout = {
        id: `metric-${metricData._id}-${Date.now()}`,
        type: chartType,
        title: metricData.unit ? `${metricData.displayName} (${metricData.unit})` : metricData.displayName,
        position: { x, y },
        size: chartType === 'kpi-card' ? { width: 300, height: 150 } : { width: 400, height: 300 },
        config: {
          style: {
            colorScheme: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'],
            showBackground: true,
            showBorder: true,
            showShadow: false,
            opacity: 1
          }
        },
        dataConfig: {
          datasourceId: '',
          query: '',
          metrics: [metricData.name], // 内部使用name，但显示用displayName
          dimensions: [],
          filters: [],
        },
      }
      
      console.log('Creating new component:', newComponent)
      setComponents(prev => {
        const updated = [...prev, newComponent]
        console.log('Updated components array:', updated)
        return updated
      })
      // 自动选择新创建的组件
      setSelectedComponent(newComponent)
      setIsPropertyPanelOpen(true)
      console.log('Component creation completed')
    } else if (item.type === 'container-child') {
      // 从容器拖拽子组件到画布
      console.log('Moving container child to canvas')
      const childData = item.data as { component: ComponentLayout, containerId: string, index: number }
      
      // 创建新的独立组件，使用合适的画布尺寸
      const getCanvasSize = (type: ComponentLayout['type']) => {
        switch (type) {
          case 'kpi-card':
            return { width: 300, height: 180 }
          case 'gauge':
            return { width: 250, height: 200 }
          case 'pie-chart':
            return { width: 350, height: 280 }
          case 'table':
            return { width: 500, height: 300 }
          default:
            return { width: 400, height: 300 }
        }
      }
      
      const newComponent: ComponentLayout = {
        ...childData.component,
        id: `moved-${childData.component.id}-${Date.now()}`, // 新ID避免冲突
        position: { x, y },
        size: getCanvasSize(childData.component.type)
      }
      
      // 添加到画布
      setComponents(prev => [...prev, newComponent])
      
      // 从容器中删除子组件
      handleDeleteChild(childData.containerId, childData.component.id)
      
      // 自动选择新创建的组件
      setSelectedComponent(newComponent)
      setIsPropertyPanelOpen(true)
      console.log('Container child moved to canvas:', newComponent)
    }
  }

  const handleComponentMove = (id: string, newPosition: { x: number; y: number }) => {
    setComponents(prev => prev.map(comp => 
      comp.id === id ? { ...comp, position: newPosition } : comp
    ))
    // 更新选中组件的状态
    if (selectedComponent?.id === id) {
      setSelectedComponent(prev => prev ? { ...prev, position: newPosition } : null)
    }
  }

  const handleComponentResize = (id: string, newSize: { width: number; height: number }) => {
    setComponents(prev => prev.map(comp => 
      comp.id === id ? { ...comp, size: newSize } : comp
    ))
    // 更新选中组件的状态
    if (selectedComponent?.id === id) {
      setSelectedComponent(prev => prev ? { ...prev, size: newSize } : null)
    }
  }

  const handleComponentSelect = (component: ComponentLayout) => {
    setSelectedComponent(component)
    setSelectedChildParentId(null) // 清除子组件父容器ID
    setIsPropertyPanelOpen(true)
  }

  const handleComponentDelete = (id: string) => {
    setComponents(prev => prev.filter(comp => comp.id !== id))
    // 如果删除的是选中组件，清除选择
    if (selectedComponent?.id === id) {
      setSelectedComponent(null)
      setIsPropertyPanelOpen(false)
    }
  }

  const handleComponentUpdate = (componentId: string, updates: Partial<ComponentLayout>) => {
    setComponents(prev => prev.map(comp => 
      comp.id === componentId ? { ...comp, ...updates } : comp
    ))
    // 更新选中组件的状态
    if (selectedComponent?.id === componentId) {
      setSelectedComponent(prev => prev ? { ...prev, ...updates } : null)
    }
  }

  // 处理拖拽到容器组件的逻辑
  const handleDropToContainer = (item: DragItem, containerId: string, position?: { x: number; y: number }) => {
    console.log('Dropping item to container:', item, containerId)
    
    if (item.type === 'metric') {
      // 拖拽指标到容器，创建新的图表组件作为子组件
      const metricData = item.data as { _id: string; name: string; displayName: string; category: string; type: string; unit?: string }
      
      const getChartTypeForMetric = (metricType: string, metricCategory: string): ComponentLayout['type'] => {
        if (metricType === 'ratio' || metricCategory === '营销') {
          return 'pie-chart'
        } else if (metricType === 'count') {
          return 'bar-chart'
        } else if (metricType === 'sum') {
          return 'line-chart'
        } else {
          return 'kpi-card'
        }
      }
      
      const chartType = getChartTypeForMetric(metricData.type, metricData.category)
      
      const newChildComponent: ComponentLayout = {
        id: `metric-${metricData._id}-${Date.now()}`,
        type: chartType,
        title: metricData.unit ? `${metricData.displayName} (${metricData.unit})` : metricData.displayName,
        position: position || { x: 0, y: 0 }, // 在容器内的相对位置
        size: chartType === 'kpi-card' ? { width: 200, height: 120 } : { width: 300, height: 200 },
        config: {
          style: {
            colorScheme: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'],
            showBackground: true,
            showBorder: true,
            showShadow: false,
            opacity: 1
          }
        },
        dataConfig: {
          datasourceId: '',
          query: '',
          metrics: [metricData.name],
          dimensions: [],
          filters: [],
        },
      }
      
      // 将子组件添加到容器中
      setComponents(prev => prev.map(comp => {
        if (comp.id === containerId && comp.type === 'container') {
          return {
            ...comp,
            children: [...(comp.children || []), newChildComponent]
          }
        }
        return comp
      }))
      
    } else if (item.type === 'component') {
      // 拖拽现有组件到容器 - 暂时不支持，避免复杂的布局问题
      console.log('Moving existing component to container - not implemented yet')
    }
  }

  // 处理选择容器内的子组件
  const handleSelectChild = (childComponent: ComponentLayout, containerId?: string) => {
    setSelectedComponent(childComponent)
    setSelectedChildParentId(containerId || null)
    setIsPropertyPanelOpen(true)
  }

  // 处理更新容器内的子组件
  const handleUpdateChild = (containerId: string, childId: string, updates: Partial<ComponentLayout>) => {
    setComponents(prev => prev.map(comp => {
      if (comp.id === containerId && comp.type === 'container' && comp.children) {
        return {
          ...comp,
          children: comp.children.map(child => 
            child.id === childId ? { ...child, ...updates } : child
          )
        }
      }
      return comp
    }))
    
    // 如果更新的是当前选中的子组件，也要更新选中状态
    if (selectedComponent?.id === childId) {
      setSelectedComponent(prev => prev ? { ...prev, ...updates } : null)
    }
  }

  // 处理删除容器内的子组件
  const handleDeleteChild = (containerId: string, childId: string) => {
    setComponents(prev => prev.map(comp => {
      if (comp.id === containerId && comp.type === 'container' && comp.children) {
        return {
          ...comp,
          children: comp.children.filter(child => child.id !== childId)
        }
      }
      return comp
    }))
    
    // 如果删除的是当前选中的子组件，清除选择
    if (selectedComponent?.id === childId) {
      setSelectedComponent(null)
      setIsPropertyPanelOpen(false)
    }
  }

  // 处理容器内子组件的拖拽排序
  const handleMoveChild = (containerId: string, dragIndex: number, hoverIndex: number) => {
    setComponents(prev => prev.map(comp => {
      if (comp.id === containerId && comp.type === 'container' && comp.children) {
        const newChildren = [...comp.children]
        const dragChild = newChildren[dragIndex]
        newChildren.splice(dragIndex, 1)
        newChildren.splice(hoverIndex, 0, dragChild)
        
        return {
          ...comp,
          children: newChildren
        }
      }
      return comp
    }))
  }

  const handleSave = async () => {
    try {
      if (dashboardId && dashboard) {
        // 保存到数据库
        const updatedLayout = {
          ...dashboard.layout,
          components
        }
        const savedDashboard = await saveLayout(updatedLayout)
        
        if (onSave && savedDashboard) {
          onSave(savedDashboard)
        }
        
        console.log('Dashboard saved successfully:', savedDashboard)
      } else if (onSave) {
        // 如果没有dashboardId，使用传递的onSave回调
        onSave({ components } as Dashboard)
      }
    } catch (error) {
      console.error('Failed to save dashboard:', error)
      alert('保存失败: ' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  const handlePreviewToggle = () => {
    setIsPreviewMode(!isPreviewMode)
    if (!isPreviewMode) {
      // 进入预览模式时关闭属性面板
      setIsPropertyPanelOpen(false)
    }
  }

  // 显示加载状态
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">加载看板中...</p>
        </div>
      </div>
    )
  }

  // 显示错误状态（但允许新看板继续编辑）
  if (error && !error.includes('Dashboard not found')) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-2">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            重新加载
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex-1 bg-white flex flex-col relative", className)}>
      {/* 工具栏 - 绝对固定在顶部 */}
      <div className="h-12 border-b border-slate-200 px-4 flex items-center justify-between flex-shrink-0 bg-white z-50 sticky top-0">
        <div className="flex items-center gap-2">
          <h1 className="font-semibold">
            {dashboard?.name || dashboardName}
            {hasUnsavedChanges && <span className="text-orange-500">*</span>}
          </h1>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={() => setIsMetricsLibraryOpen(!isMetricsLibraryOpen)}
              disabled={isPreviewMode}
              title="指标库"
            >
              <Database className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={() => setIsPropertyPanelOpen(!isPropertyPanelOpen)}
              disabled={!selectedComponent}
              title="属性设置"
            >
              <Settings className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={handlePreviewToggle}
              title={isPreviewMode ? "编辑模式" : "预览模式"}
            >
              {isPreviewMode ? <Layout className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={toggleFullscreen}
              title={isFullscreen ? "退出全屏" : "全屏模式"}
            >
              {isFullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handlePreviewToggle}
            className={cn(isPreviewMode && "bg-blue-50 text-blue-700")}
          >
            {isPreviewMode ? (
              <>
                <Layout className="h-3 w-3 mr-1" />
                编辑
              </>
            ) : (
              <>
                <Eye className="h-3 w-3 mr-1" />
                预览
              </>
            )}
          </Button>
          <Button 
            size="sm"
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            className="flex items-center gap-1"
          >
            {saving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-3 w-3" />
                保存
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={toggleFullscreen}
            className={cn(isFullscreen && "bg-blue-50 text-blue-700")}
            title={isFullscreen ? "退出全屏" : "全屏模式"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-3 w-3 mr-1" />
                退出全屏
              </>
            ) : (
              <>
                <Maximize2 className="h-3 w-3 mr-1" />
                全屏
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 画布容器 - 独立的滚动区域 */}
      <div className={cn(
        "flex-1 flex",
        isFullscreen ? "h-[calc(100vh-48px)]" : "h-[calc(100vh-140px)]"
      )}>
        {/* 画布区域 */}
        <div 
          ref={(node) => {
            canvasRef.current = node
            drop(node)
          }}
          className={cn(
            "flex-1 relative p-6 overflow-auto",
            isPreviewMode ? "bg-white" : "bg-slate-50",
            !isPreviewMode && "bg-grid-pattern",
            isOver && !isPreviewMode && "bg-blue-50 ring-2 ring-blue-300 ring-inset"
          )}
          style={!isPreviewMode ? {
            backgroundImage: `radial-gradient(circle, #e2e8f0 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          } : {}}
          onClick={() => {
            if (!isPreviewMode) {
              setSelectedComponent(null)
              setIsPropertyPanelOpen(false)
            }
          }}
          onDoubleClick={() => {
            if (isPreviewMode) {
              setIsPreviewMode(false)
            }
          }}
        >
          {/* 画布内容区域 - 确保有足够的滚动空间 */}
          <div className="relative min-w-full min-h-full" style={{ minWidth: '1200px', minHeight: '800px' }}>
            {components.length === 0 && !isPreviewMode ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Card className="w-96">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="font-semibold mb-2">开始创建你的看板</h3>
                    <p className="text-slate-500 text-sm mb-4">
                      从左侧拖拽组件到画布，或使用AI智能生成看板
                    </p>
                    <Button className="w-full">
                      使用AI生成看板
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              components.map((component) => (
                <DraggableComponent
                  key={component.id}
                  component={component}
                  isSelected={selectedComponent?.id === component.id}
                  isPreviewMode={isPreviewMode}
                  selectedChildId={selectedComponent?.id}
                  onMove={handleComponentMove}
                  onResize={handleComponentResize}
                  onSelect={handleComponentSelect}
                  onDelete={handleComponentDelete}
                  onDropToContainer={handleDropToContainer}
                  onSelectChild={handleSelectChild}
                  onUpdateChild={handleUpdateChild}
                  onDeleteChild={handleDeleteChild}
                  onMoveChild={handleMoveChild}
                />
              ))
            )}
          </div>
        </div>
        
        {/* 属性面板 */}
        <PropertyPanel
          isOpen={isPropertyPanelOpen && !isPreviewMode}
          onClose={() => setIsPropertyPanelOpen(false)}
          selectedComponent={selectedComponent}
          onUpdateComponent={handleComponentUpdate}
          onUpdateChild={handleUpdateChild}
          parentContainerId={selectedChildParentId}
        />
      </div>

      {/* 指标库面板 */}
      <MetricsLibraryPanel
        isOpen={isMetricsLibraryOpen && !isPreviewMode}
        onClose={() => setIsMetricsLibraryOpen(false)}
        position={metricsLibraryPosition}
        onMove={handleMetricsLibraryMove}
        height={metricsLibraryHeight}
        onHeightChange={setMetricsLibraryHeight}
      />
    </div>
  )
}

// 可拖拽的组件
interface DraggableComponentProps {
  component: ComponentLayout
  isSelected: boolean
  isPreviewMode: boolean
  selectedChildId?: string
  onMove: (id: string, position: { x: number; y: number }) => void
  onResize: (id: string, size: { width: number; height: number }) => void
  onSelect: (component: ComponentLayout) => void
  onDelete: (id: string) => void
  onDropToContainer: (item: DragItem, containerId: string, position?: { x: number; y: number }) => void
  onSelectChild: (childComponent: ComponentLayout) => void
  onUpdateChild: (containerId: string, childId: string, updates: Partial<ComponentLayout>) => void
  onDeleteChild: (containerId: string, childId: string) => void
  onMoveChild: (containerId: string, dragIndex: number, hoverIndex: number) => void
}

function DraggableComponent({ 
  component, 
  isSelected,
  isPreviewMode,
  selectedChildId,
  onMove, 
  onResize,
  onSelect,
  onDelete,
  onDropToContainer,
  onSelectChild,
  onUpdateChild,
  onDeleteChild,
  onMoveChild
}: DraggableComponentProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPreviewMode) return
    
    // 检查是否点击在子组件上，如果是则不启动容器拖拽
    const target = e.target as HTMLElement
    const isChildComponent = target.closest('[data-container-child="true"]')
    if (isChildComponent) {
      return
    }
    
    e.preventDefault()
    e.stopPropagation()
    
    // 选择组件
    onSelect(component)
    
    setIsDragging(true)

    const startX = e.clientX - component.position.x
    const startY = e.clientY - component.position.y

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - startX
      const newY = e.clientY - startY
      
      // 网格对齐
      const gridSize = 24
      const alignedX = Math.max(0, Math.round(newX / gridSize) * gridSize)
      const alignedY = Math.max(0, Math.round(newY / gridSize) * gridSize)
      
      onMove(component.id, { x: alignedX, y: alignedY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleClick = (e: React.MouseEvent) => {
    if (isPreviewMode) return
    e.stopPropagation()
    onSelect(component)
  }

  return (
    <div
      className={cn(
        "absolute bg-white rounded-lg transition-all",
        "border border-slate-200", // 预览和编辑模式都显示边框
        !isPreviewMode && "shadow-sm hover:shadow-md cursor-move",
        !isPreviewMode && isSelected && "ring-2 ring-blue-500 border-blue-300",
        !isPreviewMode && isDragging && "shadow-lg ring-2 ring-blue-400",
        isPreviewMode && "shadow-sm" // 预览模式保持轻微阴影
      )}
      style={{
        left: component.position.x,
        top: component.position.y,
        width: component.size.width,
        height: component.size.height,
        opacity: component.config?.style?.opacity || 1
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onMouseEnter={() => !isPreviewMode && setIsHovered(true)}
      onMouseLeave={() => !isPreviewMode && setIsHovered(false)}
    >
      {/* 组件头部 */}
      {!isPreviewMode && (
        <div className="h-10 border-b border-slate-100 px-3 flex items-center justify-between">
          <span className="text-sm font-medium truncate">{component.title}</span>
          <div className={cn(
            "flex items-center gap-1 transition-opacity",
            (!isHovered && !isSelected) && "opacity-0"
          )}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-slate-400 hover:text-blue-500"
              onClick={(e) => {
                e.stopPropagation()
                onSelect(component)
              }}
            >
              <Settings className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-slate-400 hover:text-red-500"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(component.id)
              }}
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* 组件内容 */}
      <div className={cn(
        "flex items-center justify-center overflow-hidden",
        isPreviewMode ? "h-full p-2" : "h-[calc(100%-40px)] p-2"
      )}>
        {component.type === 'line-chart' && (
          <div className="w-full h-full flex flex-col">
            {isPreviewMode && (
              <div className="text-sm font-medium text-slate-700 mb-2 text-center">
                {component.title}
              </div>
            )}
            <div className="flex-1 flex items-center justify-center">
              <SimpleLineChart 
                data={React.useMemo(() => generateMockData.lineChart(), [component.id])} 
                width={Math.min(component.size.width - 20, 350)}
                height={Math.min(component.size.height - (isPreviewMode ? 60 : 80), 250)}
                config={component.config}
              />
            </div>
          </div>
        )}
        
        {component.type === 'bar-chart' && (
          <div className="w-full h-full flex flex-col">
            {isPreviewMode && (
              <div className="text-sm font-medium text-slate-700 mb-2 text-center">
                {component.title}
              </div>
            )}
            <div className="flex-1 flex items-center justify-center">
              <SimpleBarChart 
                data={React.useMemo(() => generateMockData.barChart(), [component.id])} 
                width={Math.min(component.size.width - 20, 350)}
                height={Math.min(component.size.height - (isPreviewMode ? 60 : 80), 250)}
                config={component.config}
              />
            </div>
          </div>
        )}
        
        {component.type === 'pie-chart' && (
          <div className="w-full h-full flex flex-col">
            {isPreviewMode && (
              <div className="text-sm font-medium text-slate-700 mb-2 text-center">
                {component.title}
              </div>
            )}
            <div className="flex-1 flex items-center justify-center">
              <SimplePieChart 
                data={React.useMemo(() => generateMockData.pieChart(), [component.id])} 
                width={Math.min(component.size.width - 20, 350)}
                height={Math.min(component.size.height - (isPreviewMode ? 60 : 80), 200)}
                config={component.config}
              />
            </div>
          </div>
        )}
        
        {component.type === 'table' && (
          <div className="w-full h-full flex flex-col">
            {isPreviewMode && (
              <div className="text-sm font-medium text-slate-700 mb-2 text-center">
                {component.title}
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <SimpleTable 
                data={React.useMemo(() => generateMockData.tableData(), [component.id])} 
                config={component.config}
              />
            </div>
          </div>
        )}
        
        {component.type === 'kpi-card' && (
          <div className="w-full h-full">
            <SimpleKPICard 
              data={React.useMemo(() => generateMockData.kpiData(), [component.id])} 
              title={!isPreviewMode ? component.title : undefined}
              config={component.config}
            />
          </div>
        )}
        
        {component.type === 'gauge' && (
          <div className="w-full h-full flex flex-col">
            {isPreviewMode && (
              <div className="text-sm font-medium text-slate-700 mb-2 text-center">
                {component.title}
              </div>
            )}
            <div className="flex-1 flex items-center justify-center">
              <SimpleGauge 
                data={React.useMemo(() => generateMockData.gaugeData(), [component.id])} 
                width={Math.min(component.size.width - 40, 180)}
                height={Math.min(component.size.height - (isPreviewMode ? 60 : 80), 120)}
                config={component.config}
              />
            </div>
          </div>
        )}

        {component.type === 'container' && (
          <div className="w-full h-full">
            <ContainerComponent
              component={component}
              isPreviewMode={isPreviewMode}
              isSelected={isSelected}
              selectedChildId={selectedChildId}
              onDropToContainer={onDropToContainer}
              onSelectChild={onSelectChild}
              onUpdateChild={onUpdateChild}
              onDeleteChild={onDeleteChild}
              onMoveChild={onMoveChild}
              className="h-full"
            />
          </div>
        )}
      </div>

      {/* 调整尺寸手柄 - 只在编辑模式显示 */}
      {!isPreviewMode && (isSelected || isHovered) && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-60 hover:opacity-100 transition-opacity"
          style={{
            background: 'linear-gradient(-45deg, transparent 30%, #3b82f6 30%, #3b82f6 70%, transparent 70%)',
          }}
          onMouseDown={(e) => {
            e.stopPropagation()
            e.preventDefault()

            const startX = e.clientX
            const startY = e.clientY
            const startWidth = component.size.width
            const startHeight = component.size.height

            const handleMouseMove = (e: MouseEvent) => {
              const deltaX = e.clientX - startX
              const deltaY = e.clientY - startY
              
              const gridSize = 24
              const newWidth = Math.max(200, Math.round((startWidth + deltaX) / gridSize) * gridSize)
              const newHeight = Math.max(150, Math.round((startHeight + deltaY) / gridSize) * gridSize)
              
              onResize(component.id, { width: newWidth, height: newHeight })
            }

            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove)
              document.removeEventListener('mouseup', handleMouseUp)
            }

            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
          }}
        />
      )}
    </div>
  )
}