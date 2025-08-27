'use client'

import React, { useEffect } from 'react'
import { useDrop } from 'react-dnd'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PropertyPanel } from './PropertyPanel'
import { MetricsLibraryPanel } from './MetricsLibraryPanel'
import { ComponentLibraryPanel } from './ComponentLibraryPanel'
import { DatasetLibraryPanel } from '@/components/dataset/DatasetLibraryPanel'
import { DashboardToolbar } from './DashboardToolbar'
import { DashboardCanvasArea } from './DashboardCanvasArea'
import { DraggableComponent } from './DraggableComponent'
import { cn } from '@/lib/utils'
import { useDashboard } from '@/hooks/useDashboards'
import { useActions, useIsFullscreen, useSidebarCollapsed } from '@/store/useAppStore'
import { useComponentAlignment } from '@/hooks/useComponentAlignment'
import { useComponentSelection } from '@/hooks/useComponentSelection'
import { useDashboardEvents } from '@/hooks/useDashboardEvents'
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
    saveLayout
  } = useDashboard(dashboardId || null)

  // 基本状态
  const [components, setComponents] = React.useState<ComponentLayout[]>(initialComponents)
  const [isPropertyPanelOpen, setIsPropertyPanelOpen] = React.useState(false)
  const [isPreviewMode, setIsPreviewMode] = React.useState(initialPreviewMode)
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false)
  const [showHelpTip, setShowHelpTip] = React.useState(true)
  
  // 全屏状态和操作
  const isFullscreen = useIsFullscreen()
  const sidebarCollapsed = useSidebarCollapsed()
  const { toggleFullscreen } = useActions()
  
  // 窗口尺寸状态
  const [windowSize, setWindowSize] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  })

  // 计算数据集面板的最佳初始高度
  const calculateDatasetPanelHeight = React.useCallback(() => {
    const panelY = isFullscreen ? 60 : 120
    const bottomPadding = 10 // 距离底部的安全距离
    const availableHeight = windowSize.height - panelY - bottomPadding
    // 最小高度400px，最大高度为可用高度
    return Math.max(400, Math.min(availableHeight, 800))
  }, [windowSize.height, isFullscreen])

  // 面板状态
  const [isMetricsLibraryOpen, setIsMetricsLibraryOpen] = React.useState(false)
  const [metricsLibraryHeight, setMetricsLibraryHeight] = React.useState(400)
  const [isDatasetLibraryOpen, setIsDatasetLibraryOpen] = React.useState(false)
  const [datasetLibraryHeight, setDatasetLibraryHeight] = React.useState(() => calculateDatasetPanelHeight())
  const [isComponentLibraryOpen, setIsComponentLibraryOpen] = React.useState(false)
  const [componentLibraryHeight, setComponentLibraryHeight] = React.useState(500)
  
  const [metricsLibraryPosition, setMetricsLibraryPosition] = React.useState({ 
    x: 0, 
    y: isFullscreen ? 60 : 120 
  })
  const [datasetLibraryPosition, setDatasetLibraryPosition] = React.useState({ 
    x: 0, 
    y: isFullscreen ? 60 : 120 
  })
  const [componentLibraryPosition, setComponentLibraryPosition] = React.useState({ 
    x: 10, 
    y: isFullscreen ? 60 : 120 
  })

  // 使用自定义Hooks
  const selectionHook = useComponentSelection()
  const alignmentHook = useComponentAlignment(components)
  
  // 画布引用
  const canvasRef = React.useRef<HTMLDivElement>(null)

  // 计算画布宽度
  const canvasWidth = React.useMemo(() => {
    let availableWidth = windowSize.width
    if (!isFullscreen && !sidebarCollapsed) {
      availableWidth -= 320
    }
    return Math.max(400, availableWidth)
  }, [windowSize.width, isFullscreen, sidebarCollapsed])

  // 事件处理Hook
  const { handleDrop, handleCanvasMouseDown } = useDashboardEvents({
    components,
    selectedComponent: selectionHook.selectedComponent,
    selectedComponents: selectionHook.selectedComponents,
    selectedChildParentId: selectionHook.selectedChildParentId,
    isPreviewMode,
    canvasRef,
    setComponents,
    clearSelection: selectionHook.clearSelection,
    setIsPropertyPanelOpen,
    setIsSelecting: selectionHook.setIsSelecting,
    setSelectionBox: selectionHook.setSelectionBox,
    handleComponentDelete,
    handleDeleteChild,
    setIsMetricsLibraryOpen,
    setIsComponentLibraryOpen,
    setIsPreviewMode,
    handleBoxSelection: selectionHook.handleBoxSelection,
    setSelectedComponent: selectionHook.setSelectedComponent
  })

  // 拖拽处理
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ['component', 'metric', 'container', 'container-child', 'dataset-field'],
    drop: (item: DragItem, monitor) => {
      const offset = monitor.getSourceClientOffset()
      if (offset) {
        handleDrop(item, offset)
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }))

  // 组件操作函数
  const handleComponentMove = React.useCallback((id: string, newPosition: { x: number; y: number }) => {
    setComponents(prev => prev.map(comp => 
      comp.id === id ? { ...comp, position: newPosition } : comp
    ))
    if (selectionHook.selectedComponent?.id === id) {
      selectionHook.setSelectedComponent(prev => prev ? { ...prev, position: newPosition } : null)
    }
  }, [selectionHook])

  const handleComponentMoveWithAlignment = React.useCallback((
    id: string, 
    newPosition: { x: number; y: number }, 
    disableGrid = false
  ) => {
    const draggingComponent = components.find(comp => comp.id === id)
    if (!draggingComponent) return
    
    if (selectionHook.selectedComponents.length > 1 && 
        selectionHook.selectedComponents.some(comp => comp.id === id)) {
      handleMultiComponentMove(id, newPosition)
      return
    }
    
    const { snappedPosition, guides } = alignmentHook.calculateAlignmentGuides(
      draggingComponent, 
      newPosition, 
      disableGrid
    )
    alignmentHook.setAlignmentGuides(guides)
    handleComponentMove(id, snappedPosition)
  }, [components, selectionHook, alignmentHook])

  const handleMultiComponentMove = React.useCallback((
    primaryId: string, 
    newPosition: { x: number; y: number }
  ) => {
    alignmentHook.setAlignmentGuides({ vertical: [], horizontal: [] })
    
    setComponents(prev => {
      const primaryComponent = prev.find(comp => comp.id === primaryId)
      if (!primaryComponent) return prev
      
      const deltaX = newPosition.x - primaryComponent.position.x
      const deltaY = newPosition.y - primaryComponent.position.y
      
      return prev.map(comp => {
        if (selectionHook.selectedComponents.some(selected => selected.id === comp.id)) {
          return {
            ...comp,
            position: {
              x: Math.max(0, comp.position.x + deltaX),
              y: Math.max(0, comp.position.y + deltaY)
            }
          }
        }
        return comp
      })
    })
    
    if (selectionHook.selectedComponent?.id === primaryId) {
      selectionHook.setSelectedComponent(prev => prev ? {
        ...prev,
        position: newPosition
      } : null)
    }
  }, [selectionHook, alignmentHook])

  const handleComponentResize = React.useCallback((id: string, newSize: { width: number; height: number }) => {
    setComponents(prev => prev.map(comp => 
      comp.id === id ? { ...comp, size: newSize } : comp
    ))
    if (selectionHook.selectedComponent?.id === id) {
      selectionHook.setSelectedComponent(prev => prev ? { ...prev, size: newSize } : null)
    }
  }, [selectionHook])

  const handleComponentResizeWithAlignment = React.useCallback((
    id: string, 
    newSize: { width: number; height: number }, 
    disableGrid = false
  ) => {
    const resizingComponent = components.find(comp => comp.id === id)
    if (!resizingComponent) return
    
    const { snappedSize, guides } = alignmentHook.calculateResizeAlignmentGuides(
      resizingComponent, 
      newSize, 
      disableGrid
    )
    alignmentHook.setAlignmentGuides(guides)
    handleComponentResize(id, snappedSize)
  }, [components, alignmentHook])

  function handleComponentDelete(id: string) {
    setComponents(prev => prev.filter(comp => comp.id !== id))
    if (selectionHook.selectedComponent?.id === id) {
      selectionHook.setSelectedComponent(null)
      setIsPropertyPanelOpen(false)
    }
  }

  const handleComponentUpdate = React.useCallback((componentId: string, updates: Partial<ComponentLayout>) => {
    setComponents(prev => prev.map(comp => 
      comp.id === componentId ? { ...comp, ...updates } : comp
    ))
    if (selectionHook.selectedComponent?.id === componentId) {
      selectionHook.setSelectedComponent(prev => prev ? { ...prev, ...updates } : null)
    }
  }, [selectionHook])

  const handleOpenProperties = React.useCallback((component: ComponentLayout) => {
    selectionHook.setSelectedComponent(component)
    selectionHook.setSelectedComponents([component])
    selectionHook.setSelectedChildParentId(null)
    setIsPropertyPanelOpen(true)
    alignmentHook.setAlignmentGuides({ vertical: [], horizontal: [] })
  }, [selectionHook, alignmentHook])

  function handleDeleteChild(containerId: string, childId: string) {
    setComponents(prev => prev.map(comp => {
      if (comp.id === containerId && comp.type === 'container' && comp.children) {
        return {
          ...comp,
          children: comp.children.filter(child => child.id !== childId)
        }
      }
      return comp
    }))
    
    if (selectionHook.selectedComponent?.id === childId) {
      selectionHook.setSelectedComponent(null)
      setIsPropertyPanelOpen(false)
    }
  }

  const handleDropToContainer = React.useCallback((item: DragItem, containerId: string, position?: { x: number; y: number }) => {
    // 简化版容器拖拽处理
    console.log('Drop to container:', item, containerId, position)
  }, [])

  const handleSelectChild = React.useCallback((childComponent: ComponentLayout) => {
    selectionHook.setSelectedComponent(childComponent)
    selectionHook.setSelectedChildParentId(childComponent.id)
    setIsPropertyPanelOpen(true)
  }, [selectionHook])

  const handleUpdateChild = React.useCallback((containerId: string, childId: string, updates: Partial<ComponentLayout>) => {
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
    
    if (selectionHook.selectedComponent?.id === childId) {
      selectionHook.setSelectedComponent(prev => prev ? { ...prev, ...updates } : null)
    }
  }, [selectionHook])

  const handleMoveChild = React.useCallback((containerId: string, dragIndex: number, hoverIndex: number) => {
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
  }, [])

  // 工具栏事件处理
  const handleSave = React.useCallback(async () => {
    try {
      if (dashboardId && dashboard) {
        const updatedLayout = {
          ...dashboard.layout,
          components
        }
        const savedDashboard = await saveLayout(updatedLayout)
        
        if (onSave && savedDashboard) {
          onSave(savedDashboard)
        }
      } else if (onSave) {
        onSave({
          _id: '',
          name: dashboardName,
          components,
          layout: { components },
          globalConfig: {}
        } as Dashboard)
      }
    } catch (error) {
      console.error('Failed to save dashboard:', error)
      alert('保存失败: ' + (error instanceof Error ? error.message : '未知错误'))
    }
  }, [dashboardId, dashboard, components, saveLayout, onSave])

  const handlePreviewToggle = React.useCallback(() => {
    setIsPreviewMode(!isPreviewMode)
    if (!isPreviewMode) {
      setIsPropertyPanelOpen(false)
    }
  }, [isPreviewMode])

  // 渲染DraggableComponent的函数
  const renderDraggableComponent = React.useCallback((component: ComponentLayout) => {
    const isSelected = selectionHook.selectedComponent?.id === component.id
    const isMultiSelected = selectionHook.selectedComponents.some(comp => comp.id === component.id) && 
                           selectionHook.selectedComponent?.id !== component.id

    return (
      <DraggableComponent
        key={component.id}
        component={component}
        isSelected={isSelected}
        isPreviewMode={isPreviewMode}
        selectedChildId={selectionHook.selectedComponent?.id}
        onMove={handleComponentMoveWithAlignment}
        onResize={handleComponentResizeWithAlignment}
        onSelect={(comp, isMultiSelect) => selectionHook.handleComponentSelect(comp, isMultiSelect)}
        isMultiSelected={isMultiSelected}
        onOpenProperties={handleOpenProperties}
        onDelete={handleComponentDelete}
        onDropToContainer={handleDropToContainer}
        onSelectChild={handleSelectChild}
        onUpdateChild={handleUpdateChild}
        onDeleteChild={handleDeleteChild}
        onMoveChild={handleMoveChild}
        onDragEnd={() => alignmentHook.setAlignmentGuides({ vertical: [], horizontal: [] })}
      />
    )
  }, [
    selectionHook,
    isPreviewMode,
    handleComponentMoveWithAlignment,
    handleComponentResizeWithAlignment,
    handleOpenProperties,
    handleDropToContainer,
    handleSelectChild,
    handleUpdateChild,
    handleDeleteChild,
    handleMoveChild,
    alignmentHook
  ])

  // 监听看板数据变化
  useEffect(() => {
    if (dashboard?.layout?.components) {
      setComponents(dashboard.layout.components)
      setHasUnsavedChanges(false)
    }
  }, [dashboard])

  // 监听组件变化
  useEffect(() => {
    if (dashboard?.layout?.components) {
      const currentComponents = JSON.stringify(components)
      const savedComponents = JSON.stringify(dashboard.layout.components)
      setHasUnsavedChanges(currentComponents !== savedComponents)
    } else if (components.length > 0) {
      setHasUnsavedChanges(true)
    } else {
      setHasUnsavedChanges(false)
    }
  }, [components, dashboard?.layout?.components])

  // 监听窗口尺寸变化
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 自动隐藏操作提示
  useEffect(() => {
    if (showHelpTip) {
      const timer = setTimeout(() => {
        setShowHelpTip(false)
      }, 10000)
      
      return () => clearTimeout(timer)
    }
  }, [showHelpTip])

  // 监听窗口大小和全屏状态变化，自动调整数据集面板高度
  useEffect(() => {
    if (isDatasetLibraryOpen) {
      const newHeight = calculateDatasetPanelHeight()
      setDatasetLibraryHeight(newHeight)
    }
  }, [windowSize.height, isFullscreen, isDatasetLibraryOpen, calculateDatasetPanelHeight])

  // 面板位置处理函数（简化版）
  const handleMetricsLibraryMove = React.useCallback((newPosition: { x: number; y: number }) => {
    setMetricsLibraryPosition(newPosition)
  }, [])

  const handleDatasetLibraryMove = React.useCallback((newPosition: { x: number; y: number }) => {
    setDatasetLibraryPosition(newPosition)
  }, [])

  const handleComponentLibraryMove = React.useCallback((newPosition: { x: number; y: number }) => {
    setComponentLibraryPosition(newPosition)
  }, [])

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

  // 显示错误状态
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
      {/* 工具栏 */}
      <DashboardToolbar
        dashboardName={dashboard?.name || dashboardName}
        hasUnsavedChanges={hasUnsavedChanges}
        saving={saving}
        isPreviewMode={isPreviewMode}
        isFullscreen={isFullscreen}
        sidebarCollapsed={sidebarCollapsed}
        selectedComponent={selectionHook.selectedComponent}
        onComponentLibraryToggle={() => setIsComponentLibraryOpen(!isComponentLibraryOpen)}
        onMetricsLibraryToggle={() => setIsMetricsLibraryOpen(!isMetricsLibraryOpen)}
        onDatasetLibraryToggle={() => setIsDatasetLibraryOpen(!isDatasetLibraryOpen)}
        onPropertyPanelToggle={() => setIsPropertyPanelOpen(!isPropertyPanelOpen)}
        onPreviewToggle={handlePreviewToggle}
        onFullscreenToggle={toggleFullscreen}
        onSave={handleSave}
      />

      {/* 画布区域 */}
      <DashboardCanvasArea
        canvasRef={canvasRef}
        components={components}
        canvasWidth={canvasWidth}
        isPreviewMode={isPreviewMode}
        isOver={isOver}
        isSelecting={selectionHook.isSelecting}
        selectionBox={selectionHook.selectionBox}
        alignmentGuides={alignmentHook.alignmentGuides}
        showHelpTip={showHelpTip}
        selectedComponent={selectionHook.selectedComponent}
        selectedComponents={selectionHook.selectedComponents}
        drop={drop}
        onMouseDown={handleCanvasMouseDown}
        onClick={() => {
          if (!isPreviewMode && !selectionHook.isSelecting) {
            selectionHook.clearSelection()
            setIsPropertyPanelOpen(false)
          }
        }}
        onDoubleClick={() => {
          if (isPreviewMode) {
            setIsPreviewMode(false)
          }
        }}
        onSetShowHelpTip={setShowHelpTip}
        renderDraggableComponent={renderDraggableComponent}
        onAddComponents={(newComponents) => {
          setComponents(prev => [...prev, ...newComponents])
        }}
      />

      {/* 属性面板 */}
      <PropertyPanel
        isOpen={isPropertyPanelOpen && !isPreviewMode}
        onClose={() => setIsPropertyPanelOpen(false)}
        selectedComponent={selectionHook.selectedComponent}
        onUpdateComponent={handleComponentUpdate}
        onUpdateChild={handleUpdateChild}
        parentContainerId={selectionHook.selectedChildParentId || undefined}
      />

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