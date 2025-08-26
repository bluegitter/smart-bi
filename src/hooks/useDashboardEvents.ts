import { useCallback, useEffect } from 'react'
import type { ComponentLayout, DragItem } from '@/types'

interface UseDashboardEventsProps {
  components: ComponentLayout[]
  selectedComponent: ComponentLayout | null
  selectedComponents: ComponentLayout[]
  selectedChildParentId: string | null
  isPreviewMode: boolean
  canvasRef: React.RefObject<HTMLDivElement | null>
  setComponents: React.Dispatch<React.SetStateAction<ComponentLayout[]>>
  clearSelection: () => void
  setIsPropertyPanelOpen: (open: boolean) => void
  setIsSelecting: (selecting: boolean) => void
  setSelectionBox: (box: any) => void
  handleComponentDelete: (id: string) => void
  handleDeleteChild: (containerId: string, childId: string) => void
  setIsMetricsLibraryOpen: (open: boolean) => void
  setIsComponentLibraryOpen: (open: boolean) => void
  setIsPreviewMode: (preview: boolean) => void
  handleBoxSelection: (startX: number, startY: number, endX: number, endY: number, components: ComponentLayout[]) => void
  setSelectedComponent: (component: ComponentLayout | null) => void
}

// 获取默认标题图标的辅助函数
const getDefaultTitleIcon = (type: ComponentLayout['type']) => {
  switch (type) {
    case 'line-chart': return 'TrendingUp'
    case 'bar-chart': return 'BarChart3'
    case 'pie-chart': return 'PieChart'
    case 'table': return 'Database'
    case 'kpi-card': return 'Target'
    case 'gauge': return 'Activity'
    case 'map': return 'Globe'
    case 'container': return 'Folder'
    default: return undefined
  }
}

export function useDashboardEvents({
  components,
  selectedComponent,
  selectedComponents,
  selectedChildParentId,
  isPreviewMode,
  canvasRef,
  setComponents,
  clearSelection,
  setIsPropertyPanelOpen,
  setIsSelecting,
  setSelectionBox,
  handleComponentDelete,
  handleDeleteChild,
  setIsMetricsLibraryOpen,
  setIsComponentLibraryOpen,
  setIsPreviewMode,
  handleBoxSelection,
  setSelectedComponent
}: UseDashboardEventsProps) {
  
  const handleDrop = useCallback((item: DragItem, offset: { x: number; y: number }) => {
    const canvasRect = canvasRef.current?.getBoundingClientRect()
    
    if (!canvasRect) return

    const relativeX = offset.x - canvasRect.left
    const relativeY = offset.y - canvasRect.top

    const gridSize = 24
    const x = Math.max(0, Math.round(relativeX / gridSize) * gridSize)
    const y = Math.max(0, Math.round(relativeY / gridSize) * gridSize)

    if (item.type === 'component') {
      const componentData = item.data as { type: ComponentLayout['type'], name: string }
      const componentType = componentData.type || 'line-chart'
      
      const getDefaultSize = (type: ComponentLayout['type']) => {
        switch (type) {
          case 'kpi-card': return { width: 300, height: 180 }
          case 'gauge': return { width: 250, height: 200 }
          case 'pie-chart': return { width: 350, height: 280 }
          case 'table': return { width: 500, height: 300 }
          case 'map': return { width: 400, height: 300 }
          case 'container': return { width: 600, height: 400 }
          default: return { width: 400, height: 300 }
        }
      }
      
      const getDefaultTitle = (type: ComponentLayout['type']) => {
        switch (type) {
          case 'line-chart': return '趋势分析图'
          case 'bar-chart': return '柱状对比图'
          case 'pie-chart': return '数据分布图'
          case 'table': return '数据明细表'
          case 'kpi-card': return '关键指标'
          case 'gauge': return '进度仪表盘'
          case 'map': return '地图组件'
          case 'container': return '容器组件'
          default: return '新图表'
        }
      }
      
      
      const newComponent: ComponentLayout = {
        id: `component-${Date.now()}`,
        type: componentType,
        title: componentData.name || getDefaultTitle(componentType),
        titleIcon: getDefaultTitleIcon(componentType),
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
    } else if (item.type === 'dataset-field') {
      // 从数据集库拖拽字段到画布，自动创建对应的图表组件
      const fieldData = item.data as { 
        datasetId: string; 
        datasetName: string; 
        field: any; 
        fieldType: 'dimension' | 'measure' 
      }
      
      // 根据字段类型选择合适的图表类型
      const getChartTypeForField = (fieldType: string, dataType: string): ComponentLayout['type'] => {
        if (fieldType === 'measure') {
          return dataType === 'number' ? 'kpi-card' : 'bar-chart'
        } else {
          return dataType === 'date' ? 'line-chart' : 'bar-chart'
        }
      }
      
      const chartType = getChartTypeForField(fieldData.fieldType, fieldData.field.type)
      
      const newComponent: ComponentLayout = {
        id: `dataset-${fieldData.datasetId}-${fieldData.field.name}-${Date.now()}`,
        type: chartType,
        title: `${fieldData.datasetName} - ${fieldData.field.displayName}`,
        titleIcon: getDefaultTitleIcon(chartType),
        position: { x, y },
        size: chartType === 'kpi-card' ? { width: 300, height: 150 } : { width: 400, height: 300 },
        config: {
          style: {
            colorScheme: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'],
            showBackground: true,
            showBorder: true,
            showShadow: false,
            opacity: 1
          },
          // 如果是KPI卡片，从字段单位初始化KPI配置的单位
          ...(chartType === 'kpi-card' && fieldData.field.unit && {
            kpi: {
              unit: fieldData.field.unit
            }
          })
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
          } : {}
        },
      }
      
      setComponents(prev => [...prev, newComponent])
      // 自动选择新创建的组件
      setSelectedComponent(newComponent)
      setIsPropertyPanelOpen(true)
    }
  }, [canvasRef, setComponents, setSelectedComponent, setIsPropertyPanelOpen])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Delete' && !isPreviewMode) {
      e.preventDefault()
      
      if (selectedComponents.length > 1) {
        selectedComponents.forEach(component => {
          setComponents(prev => prev.filter(comp => comp.id !== component.id))
        })
        clearSelection()
        setIsPropertyPanelOpen(false)
      } else if (selectedComponent) {
        if (selectedChildParentId) {
          handleDeleteChild(selectedChildParentId, selectedComponent.id)
        } else {
          handleComponentDelete(selectedComponent.id)
        }
      }
    }
    
    if (e.key === 'Escape' && !isPreviewMode) {
      e.preventDefault()
      setIsPreviewMode(true)
      clearSelection()
      setIsPropertyPanelOpen(false)
      setIsMetricsLibraryOpen(false)
      setIsComponentLibraryOpen(false)
    }
  }, [
    isPreviewMode,
    selectedComponents,
    selectedComponent,
    selectedChildParentId,
    setComponents,
    clearSelection,
    setIsPropertyPanelOpen,
    handleComponentDelete,
    handleDeleteChild,
    setIsPreviewMode,
    setIsMetricsLibraryOpen,
    setIsComponentLibraryOpen
  ])

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (isPreviewMode) return
    
    const target = e.target as HTMLElement
    const isClickOnComponent = target.closest('[data-component-id]')
    
    if (!isClickOnComponent) {
      const canvasRect = canvasRef.current?.getBoundingClientRect()
      if (canvasRect) {
        const startX = e.clientX - canvasRect.left
        const startY = e.clientY - canvasRect.top
        
        setIsSelecting(true)
        setSelectionBox({
          startX,
          startY,
          currentX: startX,
          currentY: startY
        })
        
        clearSelection()
        
        const handleMouseMove = (e: MouseEvent) => {
          const currentX = e.clientX - canvasRect.left
          const currentY = e.clientY - canvasRect.top
          
          setSelectionBox((prev: any) => prev ? {
            ...prev,
            currentX,
            currentY
          } : null)
        }
        
        const handleMouseUp = () => {
          setIsSelecting(false)
          
          const currentSelectionBox = document.querySelector('[data-selection-box]')
          if (currentSelectionBox) {
            const endX = e.clientX - canvasRect.left
            const endY = e.clientY - canvasRect.top
            handleBoxSelection(startX, startY, endX, endY, components)
          }
          
          setSelectionBox(null)
          document.removeEventListener('mousemove', handleMouseMove)
          document.removeEventListener('mouseup', handleMouseUp)
        }
        
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
      }
    }
  }, [
    isPreviewMode,
    canvasRef,
    setIsSelecting,
    setSelectionBox,
    clearSelection,
    handleBoxSelection,
    components
  ])

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
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
  }, [handleKeyDown])

  return {
    handleDrop,
    handleCanvasMouseDown
  }
}