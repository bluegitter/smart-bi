import { useState, useCallback } from 'react'
import type { ComponentLayout } from '@/types'

interface SelectionBox {
  startX: number
  startY: number
  currentX: number
  currentY: number
}

export function useComponentSelection() {
  const [selectedComponent, setSelectedComponent] = useState<ComponentLayout | null>(null)
  const [selectedComponents, setSelectedComponents] = useState<ComponentLayout[]>([])
  const [selectedChildParentId, setSelectedChildParentId] = useState<string | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null)

  const clearSelection = useCallback(() => {
    setSelectedComponent(null)
    setSelectedComponents([])
    setSelectedChildParentId(null)
  }, [])

  const handleComponentSelect = useCallback((component: ComponentLayout, isMultiSelect = false) => {
    if (isMultiSelect) {
      setSelectedComponents(prev => {
        const isAlreadySelected = prev.some(comp => comp.id === component.id)
        if (isAlreadySelected) {
          const newSelection = prev.filter(comp => comp.id !== component.id)
          if (newSelection.length === 0) {
            setSelectedComponent(null)
          } else if (newSelection.length === 1) {
            setSelectedComponent(newSelection[0])
          } else {
            setSelectedComponent(prev.length > 0 ? prev[0] : newSelection[0])
          }
          return newSelection
        } else {
          const newSelection = [...prev, component]
          if (newSelection.length === 1) {
            setSelectedComponent(component)
          } else {
            setSelectedComponent(prev.length > 0 ? prev[0] : component)
          }
          return newSelection
        }
      })
    } else {
      setSelectedComponent(component)
      setSelectedComponents([component])
      setSelectedChildParentId(null)
    }
  }, [])

  const calculateSelectionBox = useCallback((
    startX: number, 
    startY: number, 
    currentX: number, 
    currentY: number
  ) => {
    return {
      left: Math.min(startX, currentX),
      top: Math.min(startY, currentY),
      width: Math.abs(currentX - startX),
      height: Math.abs(currentY - startY)
    }
  }, [])

  const getComponentsInSelection = useCallback((
    selectionRect: { left: number; top: number; width: number; height: number },
    components: ComponentLayout[]
  ) => {
    return components.filter(component => {
      const compLeft = component.position.x
      const compRight = component.position.x + component.size.width
      const compTop = component.position.y
      const compBottom = component.position.y + component.size.height
      
      const selRight = selectionRect.left + selectionRect.width
      const selBottom = selectionRect.top + selectionRect.height
      
      return !(compLeft > selRight || compRight < selectionRect.left || 
               compTop > selBottom || compBottom < selectionRect.top)
    })
  }, [])

  const handleBoxSelection = useCallback((
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    components: ComponentLayout[]
  ) => {
    const selectionRect = calculateSelectionBox(startX, startY, endX, endY)
    const selectedComps = getComponentsInSelection(selectionRect, components)
    
    if (selectedComps.length > 0) {
      setSelectedComponents(selectedComps)
      if (selectedComps.length === 1) {
        setSelectedComponent(selectedComps[0])
      } else if (selectedComps.length > 1) {
        setSelectedComponent(selectedComps[0])
      }
    }
  }, [calculateSelectionBox, getComponentsInSelection])

  return {
    selectedComponent,
    selectedComponents,
    selectedChildParentId,
    isSelecting,
    selectionBox,
    setSelectedComponent,
    setSelectedComponents,
    setSelectedChildParentId,
    setIsSelecting,
    setSelectionBox,
    clearSelection,
    handleComponentSelect,
    calculateSelectionBox,
    getComponentsInSelection,
    handleBoxSelection
  }
}