'use client'

import React, { useEffect } from 'react'
import { useDrop } from 'react-dnd'
import { Plus, Layout, Save, Eye, Settings, Maximize2, Minimize2, Loader2, Database, BarChart3, Grid3x3 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { PropertyPanel } from './PropertyPanel'
import { MetricsLibraryPanel } from './MetricsLibraryPanel'
import { ComponentLibraryPanel } from './ComponentLibraryPanel'
import { DatasetLibraryPanel } from '@/components/dataset/DatasetLibraryPanel'
import { cn } from '@/lib/utils'
import { useDashboard } from '@/hooks/useDashboards'
import { useActions, useIsFullscreen, useSidebarCollapsed } from '@/store/useAppStore'
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
import { SimpleMapComponent } from '@/components/charts/MapComponent'
import { 
  RealLineChart, 
  RealBarChart, 
  RealPieChart, 
  RealKPICard 
} from '@/components/charts/RealDataCharts'
import {
  DatasetLineChart,
  DatasetBarChart,
  DatasetKPICard,
  DatasetPieChart
} from '@/components/charts/DatasetCharts'
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
  const [isDatasetLibraryOpen, setIsDatasetLibraryOpen] = React.useState(false)
  const [datasetLibraryHeight, setDatasetLibraryHeight] = React.useState(400)
  const [isComponentLibraryOpen, setIsComponentLibraryOpen] = React.useState(false)
  const [componentLibraryHeight, setComponentLibraryHeight] = React.useState(500)
  
  // 全屏状态和操作
  const isFullscreen = useIsFullscreen()
  const sidebarCollapsed = useSidebarCollapsed()
  const { toggleFullscreen } = useActions()
  
  const [metricsLibraryPosition, setMetricsLibraryPosition] = React.useState({ x: 0, y: isFullscreen ? 60 : 120 })
  const [datasetLibraryPosition, setDatasetLibraryPosition] = React.useState({ x: 0, y: isFullscreen ? 60 : 120 })
  // 组件库面板默认位置计算（紧贴左侧）
  const getComponentLibraryDefaultPosition = React.useCallback(() => {
    return {
      x: 10, // 距离左边缘10px
      y: isFullscreen ? 60 : 120
    }
  }, [isFullscreen])

  const [componentLibraryPosition, setComponentLibraryPosition] = React.useState(getComponentLibraryDefaultPosition())

  // 窗口尺寸状态，用于响应式计算
  const [windowSize, setWindowSize] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  })

  // 计算面板的最佳高度（通用函数）
  const calculateOptimalHeight = React.useCallback((panelY: number) => {
    const panelTop = panelY
    const bottomPadding = 50 // 距离底部的安全距离
    const minHeight = 300
    const maxHeight = 800
    
    const availableHeight = windowSize.height - panelTop - bottomPadding
    const optimalHeight = Math.max(minHeight, Math.min(maxHeight, availableHeight))
    
    return optimalHeight
  }, [windowSize.height])

  // 监听窗口尺寸变化
  React.useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 计算画布可用宽度（只考虑Sidebar状态）
  const canvasWidth = React.useMemo(() => {
    let availableWidth = windowSize.width
    
    // 减去侧边栏宽度（仅在非全屏且侧边栏展开时）
    if (!isFullscreen && !sidebarCollapsed) {
      availableWidth -= 320 // 侧边栏宽度（w-80 = 320px）
    }
    
    // 确保最小宽度
    return Math.max(400, availableWidth)
  }, [windowSize.width, isFullscreen, sidebarCollapsed])

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
        const optimalHeight = calculateOptimalHeight(metricsLibraryPosition.y)
        setMetricsLibraryHeight(optimalHeight)
      }
      if (isDatasetLibraryOpen) {
        const optimalHeight = calculateOptimalHeight(datasetLibraryPosition.y)
        setDatasetLibraryHeight(optimalHeight)
      }
      if (isComponentLibraryOpen) {
        const optimalHeight = calculateOptimalHeight(componentLibraryPosition.y)
        setComponentLibraryHeight(optimalHeight)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isMetricsLibraryOpen, isDatasetLibraryOpen, isComponentLibraryOpen, calculateOptimalHeight, metricsLibraryPosition.y, datasetLibraryPosition.y, componentLibraryPosition.y])

  // 处理数据集面板位置变化，同时重新计算高度
  const handleDatasetLibraryMove = React.useCallback((newPosition: { x: number; y: number }) => {
    // 确保位置在合理范围内
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    const panelWidth = 320
    
    const constrainedPosition = {
      x: Math.max(0, Math.min(newPosition.x, windowWidth - panelWidth)),
      y: Math.max(60, Math.min(newPosition.y, windowHeight - 300))
    }
    
    setDatasetLibraryPosition(constrainedPosition)
    
    // 位置变化后立即重新计算高度
    if (isDatasetLibraryOpen) {
      setTimeout(() => {
        const optimalHeight = calculateOptimalHeight(constrainedPosition.y)
        setDatasetLibraryHeight(optimalHeight)
      }, 0)
    }
  }, [isDatasetLibraryOpen, calculateOptimalHeight])

  // 处理组件库面板位置变化，同时重新计算高度
  const handleComponentLibraryMove = React.useCallback((newPosition: { x: number; y: number }) => {
    // 确保位置在合理范围内
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    const panelWidth = 360
    
    const constrainedPosition = {
      x: Math.max(0, Math.min(newPosition.x, windowWidth - panelWidth)),
      y: Math.max(60, Math.min(newPosition.y, windowHeight - 400))
    }
    
    setComponentLibraryPosition(constrainedPosition)
    
    // 位置变化后立即重新计算高度
    if (isComponentLibraryOpen) {
      setTimeout(() => {
        const optimalHeight = calculateOptimalHeight(constrainedPosition.y)
        setComponentLibraryHeight(optimalHeight)
      }, 0)
    }
  }, [isComponentLibraryOpen, calculateOptimalHeight])

  // 当组件库面板打开时，确保它在正确的右侧位置
  React.useEffect(() => {
    if (isComponentLibraryOpen) {
      const optimalPosition = getComponentLibraryDefaultPosition()
      setComponentLibraryPosition(optimalPosition)
      
      // 同时计算高度
      const optimalHeight = calculateOptimalHeight(optimalPosition.y)
      setComponentLibraryHeight(optimalHeight)
    }
  }, [isComponentLibraryOpen, getComponentLibraryDefaultPosition, calculateOptimalHeight])

  // 监听全屏模式变化，调整面板位置
  React.useEffect(() => {
    const newY = isFullscreen ? 60 : 120
    setMetricsLibraryPosition(prev => ({ ...prev, y: newY }))
    setDatasetLibraryPosition(prev => ({ ...prev, y: newY }))
    
    // 组件库面板只需要调整Y坐标，X坐标保持在左侧
    setComponentLibraryPosition(prev => ({ ...prev, y: newY }))
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
        setIsComponentLibraryOpen(false)
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
    accept: ['component', 'metric', 'container', 'container-child', 'dataset-field'],
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
          case 'map':
            return { width: 400, height: 300 }
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
          case 'map':
            return '地图组件'
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
            colorScheme: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'],
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
            colorScheme: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'],
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
          // 保存指标的单位映射
          fieldUnits: metricData.unit ? {
            [metricData.name]: metricData.unit
          } : {},
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
    } else if (item.type === 'dataset-field') {
      // 从数据集库拖拽字段到画布，自动创建对应的图表组件
      console.log('Creating component from dataset field drag')
      console.log('Item type confirmed:', item.type)
      const fieldData = item.data as { 
        datasetId: string; 
        datasetName: string; 
        field: any; 
        fieldType: 'dimension' | 'measure' 
      }
      console.log('Field data:', fieldData)
      
      // 根据字段类型选择合适的图表类型
      const getChartTypeForField = (fieldType: string, dataType: string): ComponentLayout['type'] => {
        if (fieldType === 'measure') {
          return dataType === 'number' ? 'kpi-card' : 'bar-chart'
        } else {
          return dataType === 'date' ? 'line-chart' : 'bar-chart'
        }
      }
      
      const chartType = getChartTypeForField(fieldData.fieldType, fieldData.field.type)
      console.log('Selected chart type:', chartType)
      
      const newComponent: ComponentLayout = {
        id: `dataset-${fieldData.datasetId}-${fieldData.field.name}-${Date.now()}`,
        type: chartType,
        title: `${fieldData.datasetName} - ${fieldData.field.displayName}`,
        position: { x, y },
        size: chartType === 'kpi-card' ? { width: 300, height: 150 } : { width: 400, height: 300 },
        config: {
          style: {
            colorScheme: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'],
            showBackground: true,
            showBorder: true,
            showShadow: false,
            opacity: 1
          }
        },
        dataConfig: {
          // 新的数据集绑定方式
          datasetId: fieldData.datasetId,
          selectedMeasures: fieldData.fieldType === 'measure' ? [fieldData.field.name] : [],
          selectedDimensions: fieldData.fieldType === 'dimension' ? [fieldData.field.name] : [],
          filters: [],
          // 保存字段的显示名称映射
          fieldDisplayNames: {
            [fieldData.field.name]: fieldData.field.displayName
          },
          // 保存字段的单位映射
          fieldUnits: fieldData.field.unit ? {
            [fieldData.field.name]: fieldData.field.unit
          } : {},
          // 调试用 - 确保这个字段被包含
          testUnitField: fieldData.field.unit || 'no-unit'
        },
      }
      
      console.log('Creating new component from dataset field:', newComponent)
      console.log('Field data received:', fieldData)
      console.log('Field unit:', fieldData.field.unit)
      console.log('Component dataConfig.fieldUnits:', newComponent.dataConfig?.fieldUnits)
      console.log('Full dataConfig:', JSON.stringify(newComponent.dataConfig, null, 2))
      setComponents(prev => {
        const updated = [...prev, newComponent]
        console.log('Updated components array:', updated)
        return updated
      })
      // 自动选择新创建的组件
      setSelectedComponent(newComponent)
      setIsPropertyPanelOpen(true)
      console.log('Dataset field component creation completed')
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
          case 'map':
            return { width: 400, height: 300 }
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
            colorScheme: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'],
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
          // 保存指标的单位映射
          fieldUnits: metricData.unit ? {
            [metricData.name]: metricData.unit
          } : {},
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
    <div className={cn("flex-1 bg-white flex flex-col", className)} style={{ height: '100vh', overflow: 'hidden' }}>
      {/* 工具栏 - 绝对固定在顶部 */}
      <div 
        className="h-12 border-b border-slate-200 pr-4 flex items-center justify-between flex-shrink-0 bg-white z-50"
        style={{
          // 计算左边距：根据sidebar状态调整左侧内容位置，保持右侧按钮位置固定
          paddingLeft: (() => {
            let padding = 16 // 基础边距
            
            // 当sidebar展开时，增加左边距为sidebar腾出空间
            if (!sidebarCollapsed && !isFullscreen) {
              padding += 60 // 为sidebar腾出空间
            }
            
            return `${padding}px`
          })(),
          transition: 'padding-left 0.3s ease-in-out' // 平滑过渡
        }}
      >
        <div className="flex items-center gap-2">
          <h1 className="font-semibold">
            {dashboard?.name || dashboardName}
            {hasUnsavedChanges && <span className="text-orange-500">*</span>}
          </h1>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setIsComponentLibraryOpen(!isComponentLibraryOpen)}
              disabled={isPreviewMode}
              title="组件库"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setIsMetricsLibraryOpen(!isMetricsLibraryOpen)}
              disabled={isPreviewMode}
              title="指标库"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setIsDatasetLibraryOpen(!isDatasetLibraryOpen)}
              disabled={isPreviewMode}
              title="数据集库"
            >
              <Database className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setIsPropertyPanelOpen(!isPropertyPanelOpen)}
              disabled={!selectedComponent}
              title="属性设置"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={handlePreviewToggle}
              title={isPreviewMode ? "编辑模式" : "预览模式"}
            >
              {isPreviewMode ? <Layout className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={toggleFullscreen}
              title={isFullscreen ? "退出全屏" : "全屏模式"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-2",
          // 当sidebar展开且不是全屏时，隐藏文字版本的重复按钮，只保留保存按钮
          !sidebarCollapsed && !isFullscreen && "hidden sm:flex"
        )}>
          {/* 在sidebar展开时，只显示最重要的保存按钮 */}
          <Button 
            size="sm"
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            className="flex items-center gap-1"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                保存
              </>
            )}
          </Button>
          
          {/* 在sidebar折叠或全屏时显示完整按钮组 */}
          <div className={cn(
            "flex items-center gap-2",
            !sidebarCollapsed || isFullscreen ? "flex" : "hidden sm:flex"
          )}>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handlePreviewToggle}
              className={cn(isPreviewMode && "bg-blue-50 text-blue-700")}
            >
              {isPreviewMode ? (
                <>
                  <Layout className="h-4 w-4 mr-1" />
                  编辑
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-1" />
                  预览
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
                  <Minimize2 className="h-4 w-4 mr-1" />
                  退出全屏
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4 mr-1" />
                  全屏
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 画布容器 - 独立的滚动区域 */}
      <div 
        className="flex-1 flex"
        style={{ 
          height: 'calc(100vh - 48px)',
          maxHeight: 'calc(100vh - 48px)',
          overflow: 'hidden'
        }}>
        {/* 画布区域 */}
        <div 
          ref={(node) => {
            canvasRef.current = node
            drop(node)
          }}
          className={cn(
            "h-full",
            isPreviewMode ? "bg-white" : "bg-slate-50",
            !isPreviewMode && "bg-grid-pattern",
            isOver && !isPreviewMode && "bg-blue-50 ring-2 ring-blue-300 ring-inset"
          )}
          style={{
            overflow: 'auto',
            position: 'relative',
            // 使用计算的画布宽度，确保滚动条可见
            width: `${canvasWidth}px`,
            transition: 'width 0.3s ease-in-out', // 平滑过渡
            ...(!isPreviewMode ? {
              backgroundImage: `radial-gradient(circle, #e2e8f0 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            } : {})
          }}
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
          {/* 画布内容区域 - 动态计算滚动空间 */}
          <div 
            className="relative"
            style={{ 
              width: components.length > 0 
                ? Math.max(1200, Math.max(...components.map(c => c.position.x + c.size.width)) + 200) + 'px'
                : '1200px',
              height: components.length > 0 
                ? Math.max(800, Math.max(...components.map(c => c.position.y + c.size.height)) + 200) + 'px'
                : '800px',
              padding: '24px'
            }}
          >
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

      {/* 组件库面板 */}
      <ComponentLibraryPanel
        isOpen={isComponentLibraryOpen && !isPreviewMode}
        onClose={() => setIsComponentLibraryOpen(false)}
        position={componentLibraryPosition}
        onMove={handleComponentLibraryMove}
        height={componentLibraryHeight}
        onHeightChange={setComponentLibraryHeight}
      />

      {/* 指标库面板 */}
      <MetricsLibraryPanel
        isOpen={isMetricsLibraryOpen && !isPreviewMode}
        onClose={() => setIsMetricsLibraryOpen(false)}
        position={metricsLibraryPosition}
        onMove={handleMetricsLibraryMove}
        height={metricsLibraryHeight}
        onHeightChange={setMetricsLibraryHeight}
      />

      {/* 数据集库面板 */}
      <DatasetLibraryPanel
        isOpen={isDatasetLibraryOpen && !isPreviewMode}
        onClose={() => setIsDatasetLibraryOpen(false)}
        position={datasetLibraryPosition}
        onMove={handleDatasetLibraryMove}
        height={datasetLibraryHeight}
        onHeightChange={setDatasetLibraryHeight}
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

  // Pre-generate mock data to avoid hooks order issues
  const mockLineChartData = React.useMemo(() => generateMockData.lineChart(), [component.id])
  const mockBarChartData = React.useMemo(() => generateMockData.barChart(), [component.id])
  const mockPieChartData = React.useMemo(() => generateMockData.pieChart(), [component.id])
  const mockTableData = React.useMemo(() => generateMockData.tableData(), [component.id])
  const mockKpiData = React.useMemo(() => generateMockData.kpiData(), [component.id])
  const mockGaugeData = React.useMemo(() => generateMockData.gaugeData(), [component.id])

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

  // 检查是否有自定义背景样式（支持所有DatasetCharts组件）
  const getCustomBackgroundType = () => {
    switch (component.type) {
      case 'kpi-card':
        return component.config?.kpi?.backgroundType
      case 'line-chart':
        return component.config?.lineChart?.backgroundType
      case 'bar-chart':
        return component.config?.barChart?.backgroundType
      case 'pie-chart':
        return component.config?.pieChart?.backgroundType
      default:
        return undefined
    }
  }
  
  const customBackgroundType = getCustomBackgroundType()
  const isComponentWithCustomBackground = component.dataConfig?.datasetId && 
    customBackgroundType && 
    customBackgroundType !== 'default'
  
  // 对于有配色方案的组件，也应该应用标题栏样式
  const hasColorScheme = component.config?.style?.colorScheme && component.config?.style?.colorScheme.length > 0
  const shouldApplyTitleBackground = isComponentWithCustomBackground || hasColorScheme
  
  
  
  // 获取组件的配色方案用于外层容器
  const getComponentOuterStyles = () => {
    if (!isComponentWithCustomBackground) return {}
    
    const colors = component.config?.style?.colorScheme || ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
    const primaryColor = colors[0] || '#3b82f6'
    const secondaryColor = colors[1] || '#ef4444'
    
    switch (customBackgroundType) {
      case 'solid':
        return {
          backgroundColor: primaryColor,
          borderColor: primaryColor
        }
      case 'gradient':
        return {
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          borderColor: primaryColor
        }
      default:
        return {
          background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}05)`,
          borderColor: primaryColor
        }
    }
  }
  

  return (
    <div
      className={cn(
        "absolute rounded-lg transition-all",
        // 对于有配色方案的组件，都使用透明背景，避免影响标题栏显示
        shouldApplyTitleBackground ? "bg-transparent" : "bg-white border border-slate-200",
        // 只有没有配色方案的组件才显示边框
        !isPreviewMode && "cursor-move",
        // 有配色方案组件不显示阴影，避免视觉冲突
        !isPreviewMode && !shouldApplyTitleBackground && "shadow-sm hover:shadow-md",
        !isPreviewMode && isSelected && "ring-2 ring-blue-500",
        // 有配色方案组件选中时不改变边框色
        !isPreviewMode && isSelected && !shouldApplyTitleBackground && "border-blue-300",
        !isPreviewMode && isDragging && "shadow-lg ring-2 ring-blue-400",
        // 预览模式只给非配色方案组件显示阴影
        isPreviewMode && !shouldApplyTitleBackground && "shadow-sm"
      )}
      style={{
        left: component.position.x,
        top: component.position.y,
        width: component.size.width,
        height: component.size.height,
        opacity: component.config?.style?.opacity || 1
        // 移除外层样式应用，避免影响标题栏显示
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onMouseEnter={() => !isPreviewMode && setIsHovered(true)}
      onMouseLeave={() => !isPreviewMode && setIsHovered(false)}
    >
      {/* 组件头部 - 预览和编辑模式都显示 */}
      <div 
        className={cn(
          "h-10 px-3 flex items-center justify-between border-b rounded-t-lg",
          shouldApplyTitleBackground ? "border-white/20" : "border-slate-100"
        )}
        style={(() => {
          if (!shouldApplyTitleBackground) return {}
          
          const colors = component.config?.style?.colorScheme || ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
          
          // 使用配色方案中最深的颜色作为标题栏背景
          const darkestColor = colors.reduce((darkest, color) => {
            // 简单的亮度计算，选择最深（最暗）的颜色
            const hex = color.replace('#', '')
            const r = parseInt(hex.substr(0, 2), 16)
            const g = parseInt(hex.substr(2, 2), 16)  
            const b = parseInt(hex.substr(4, 2), 16)
            const brightness = (r * 299 + g * 587 + b * 114) / 1000
            
            const darkestHex = darkest.replace('#', '')
            const dr = parseInt(darkestHex.substr(0, 2), 16)
            const dg = parseInt(darkestHex.substr(2, 2), 16)
            const db = parseInt(darkestHex.substr(4, 2), 16)
            const darkestBrightness = (dr * 299 + dg * 587 + db * 114) / 1000
            
            return brightness < darkestBrightness ? color : darkest
          }, colors[0])
          
          return {
            backgroundColor: darkestColor,
            borderColor: darkestColor
          }
        })()}
      >
        <span className={cn(
          "text-sm font-medium truncate",
          shouldApplyTitleBackground ? "text-white" : "text-gray-900"
        )}>
          {component.title}
        </span>
        {!isPreviewMode && (
          <div className={cn(
            "flex items-center gap-1 transition-opacity",
            (!isHovered && !isSelected) && "opacity-0"
          )}>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6",
                shouldApplyTitleBackground 
                  ? "text-white/70 hover:text-white" 
                  : "text-slate-400 hover:text-blue-500"
              )}
              onClick={(e) => {
                e.stopPropagation()
                onSelect(component)
              }}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6",
                shouldApplyTitleBackground 
                  ? "text-white/70 hover:text-red-300" 
                  : "text-slate-400 hover:text-red-500"
              )}
              onClick={(e) => {
                e.stopPropagation()
                onDelete(component.id)
              }}
            >
              ×
            </Button>
          </div>
        )}
      </div>


      {/* 组件内容 */}
      <div className={cn(
        component.type === 'map' ? "overflow-hidden" : "flex items-center justify-center overflow-hidden",
        "h-[calc(100%-40px)]", // 所有组件都有标题栏，统一高度计算
        !shouldApplyTitleBackground && component.type !== 'map' && "p-2" // 地图组件不加padding
      )}>
        {component.type === 'line-chart' && (
          <div 
            className="w-full h-full flex items-center justify-center rounded-b-lg"
            style={shouldApplyTitleBackground ? (() => {
              if (isComponentWithCustomBackground) {
                return getComponentOuterStyles()
              } else {
                // 为只有配色方案的组件提供默认的淡色背景和边框
                const colors = component.config?.style?.colorScheme || ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
                const primaryColor = colors[0] || '#3b82f6'
                const secondaryColor = colors[1] || '#ef4444'
                return {
                  background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}05)`,
                  borderColor: primaryColor,
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }
              }
            })() : {}}
          >
            {component.dataConfig?.datasetId ? (
              <DatasetLineChart 
                component={component}
                width={component.size.width - 10}
                height={component.size.height - 50}
              />
            ) : component.dataConfig?.metrics?.length > 0 && component.id.includes('metric-') ? (
              <RealLineChart 
                metricId={component.id.split('-')[1]} 
                width={component.size.width - 10}
                height={component.size.height - 50}
                config={component.config}
              />
            ) : (
              <SimpleLineChart 
                data={mockLineChartData} 
                width={component.size.width - 10}
                height={component.size.height - 50}
                config={component.config}
              />
            )}
          </div>
        )}
        
        {component.type === 'bar-chart' && (
          <div 
            className="w-full h-full flex items-center justify-center rounded-b-lg"
            style={shouldApplyTitleBackground ? (() => {
              if (isComponentWithCustomBackground) {
                return getComponentOuterStyles()
              } else {
                const colors = component.config?.style?.colorScheme || ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
                const primaryColor = colors[0] || '#3b82f6'
                const secondaryColor = colors[1] || '#ef4444'
                return {
                  background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}05)`,
                  borderColor: primaryColor,
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }
              }
            })() : {}}
          >
            {component.dataConfig?.datasetId ? (
              <DatasetBarChart 
                component={component}
                width={component.size.width - 10}
                height={component.size.height - 50}
              />
            ) : component.dataConfig?.metrics?.length > 0 && component.id.includes('metric-') ? (
              <RealBarChart 
                metricId={component.id.split('-')[1]} 
                width={component.size.width - 10}
                height={component.size.height - 50}
                config={component.config}
              />
            ) : (
              <SimpleBarChart 
                data={mockBarChartData} 
                width={component.size.width - 10}
                height={component.size.height - 50}
                config={component.config}
              />
            )}
          </div>
        )}
        
        {component.type === 'pie-chart' && (
          <div 
            className="w-full h-full flex items-center justify-center rounded-b-lg"
            style={shouldApplyTitleBackground ? (() => {
              if (isComponentWithCustomBackground) {
                return getComponentOuterStyles()
              } else {
                const colors = component.config?.style?.colorScheme || ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
                const primaryColor = colors[0] || '#3b82f6'
                const secondaryColor = colors[1] || '#ef4444'
                return {
                  background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}05)`,
                  borderColor: primaryColor,
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }
              }
            })() : {}}
          >
            {component.dataConfig?.datasetId ? (
              <DatasetPieChart 
                component={component}
                width={component.size.width - 10}
                height={component.size.height - 50}
              />
            ) : component.dataConfig?.metrics?.length > 0 && component.id.includes('metric-') ? (
              <RealPieChart 
                metricId={component.id.split('-')[1]} 
                width={component.size.width - 10}
                height={component.size.height - 50}
                config={component.config}
              />
            ) : (
              <SimplePieChart 
                data={mockPieChartData} 
                width={component.size.width - 10}
                height={component.size.height - 50}
                config={component.config}
              />
            )}
          </div>
        )}
        
        {component.type === 'table' && (
          <div 
            className="w-full h-full overflow-hidden rounded-b-lg"
            style={shouldApplyTitleBackground ? (() => {
              if (isComponentWithCustomBackground) {
                return getComponentOuterStyles()
              } else {
                const colors = component.config?.style?.colorScheme || ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
                const primaryColor = colors[0] || '#3b82f6'
                const secondaryColor = colors[1] || '#ef4444'
                return {
                  background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}05)`,
                  borderColor: primaryColor,
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }
              }
            })() : {}}
          >
            <SimpleTable 
              data={mockTableData} 
              config={component.config}
            />
          </div>
        )}
        
        {component.type === 'kpi-card' && (
          <div 
            className="w-full h-full rounded-b-lg"
            style={shouldApplyTitleBackground ? (() => {
              if (isComponentWithCustomBackground) {
                return getComponentOuterStyles()
              } else {
                const colors = component.config?.style?.colorScheme || ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
                const primaryColor = colors[0] || '#3b82f6'
                const secondaryColor = colors[1] || '#ef4444'
                return {
                  background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}05)`
                }
              }
            })() : {}}
          >
            {component.dataConfig?.datasetId ? (
              <DatasetKPICard 
                component={component}
              />
            ) : component.dataConfig?.metrics?.length > 0 && component.id.includes('metric-') ? (
              <RealKPICard 
                metricId={component.id.split('-')[1]} 
                title={undefined}
                config={component.config}
              />
            ) : (
              <SimpleKPICard 
                key={`${component.id}-${JSON.stringify(component.config?.style?.colorScheme)}-${component.config?.kpi?.backgroundType}`}
                data={mockKpiData} 
                title={undefined}
                config={component.config}
              />
            )}
          </div>
        )}
        
        {component.type === 'gauge' && (
          <div 
            className="w-full h-full flex items-center justify-center rounded-b-lg"
            style={shouldApplyTitleBackground ? (() => {
              if (isComponentWithCustomBackground) {
                return getComponentOuterStyles()
              } else {
                const colors = component.config?.style?.colorScheme || ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
                const primaryColor = colors[0] || '#3b82f6'
                const secondaryColor = colors[1] || '#ef4444'
                return {
                  background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}05)`,
                  borderColor: primaryColor,
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }
              }
            })() : {}}
          >
            <SimpleGauge 
              data={mockGaugeData} 
              width={component.size.width}
              height={component.size.height - 40}
              config={component.config}
            />
          </div>
        )}
        
        {component.type === 'map' && (
          <div 
            className="w-full h-full rounded-b-lg"
            style={shouldApplyTitleBackground ? (() => {
              if (isComponentWithCustomBackground) {
                return getComponentOuterStyles()
              } else {
                const colors = component.config?.style?.colorScheme || ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
                const primaryColor = colors[0] || '#3b82f6'
                const secondaryColor = colors[1] || '#ef4444'
                return {
                  background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}05)`,
                  borderColor: primaryColor,
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }
              }
            })() : { backgroundColor: '#ffffff' }}
          >
            <SimpleMapComponent 
              component={component}
              className="w-full h-full rounded-b-lg"
            />
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