import { useState, useCallback } from 'react'
import type { ComponentLayout } from '@/types'

interface AlignmentGuides {
  vertical: number[]
  horizontal: number[]
}

export function useComponentAlignment(components: ComponentLayout[]) {
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuides>({ 
    vertical: [], 
    horizontal: [] 
  })

  const calculateAlignmentGuides = useCallback((
    draggingComponent: ComponentLayout, 
    newPosition: { x: number; y: number }, 
    disableGrid = false
  ) => {
    const SNAP_THRESHOLD = 8
    const FINE_GRID_SIZE = 4
    const guides: AlignmentGuides = { vertical: [], horizontal: [] }
    const snappedPosition = { ...newPosition }
    
    if (!disableGrid) {
      const gridX = Math.round(newPosition.x / FINE_GRID_SIZE) * FINE_GRID_SIZE
      const gridY = Math.round(newPosition.y / FINE_GRID_SIZE) * FINE_GRID_SIZE
      snappedPosition.x = Math.max(0, gridX)
      snappedPosition.y = Math.max(0, gridY)
    } else {
      snappedPosition.x = Math.max(0, newPosition.x)
      snappedPosition.y = Math.max(0, newPosition.y)
    }
    
    const dragLeft = snappedPosition.x
    const dragRight = snappedPosition.x + draggingComponent.size.width
    const dragTop = snappedPosition.y
    const dragBottom = snappedPosition.y + draggingComponent.size.height
    const dragCenterX = snappedPosition.x + draggingComponent.size.width / 2
    const dragCenterY = snappedPosition.y + draggingComponent.size.height / 2
    
    components.forEach(comp => {
      if (comp.id === draggingComponent.id) return
      
      const compLeft = comp.position.x
      const compRight = comp.position.x + comp.size.width
      const compTop = comp.position.y
      const compBottom = comp.position.y + comp.size.height
      const compCenterX = comp.position.x + comp.size.width / 2
      const compCenterY = comp.position.y + comp.size.height / 2
      
      // 垂直对齐检测
      if (Math.abs(dragLeft - compLeft) <= SNAP_THRESHOLD) {
        snappedPosition.x = compLeft
        guides.vertical.push(compLeft)
      }
      if (Math.abs(dragRight - compRight) <= SNAP_THRESHOLD) {
        snappedPosition.x = compRight - draggingComponent.size.width
        guides.vertical.push(compRight)
      }
      if (Math.abs(dragLeft - compRight) <= SNAP_THRESHOLD) {
        snappedPosition.x = compRight
        guides.vertical.push(compRight)
      }
      if (Math.abs(dragRight - compLeft) <= SNAP_THRESHOLD) {
        snappedPosition.x = compLeft - draggingComponent.size.width
        guides.vertical.push(compLeft)
      }
      if (Math.abs(dragCenterX - compCenterX) <= SNAP_THRESHOLD) {
        snappedPosition.x = compCenterX - draggingComponent.size.width / 2
        guides.vertical.push(compCenterX)
      }
      
      // 水平对齐检测
      if (Math.abs(dragTop - compTop) <= SNAP_THRESHOLD) {
        snappedPosition.y = compTop
        guides.horizontal.push(compTop)
      }
      if (Math.abs(dragBottom - compBottom) <= SNAP_THRESHOLD) {
        snappedPosition.y = compBottom - draggingComponent.size.height
        guides.horizontal.push(compBottom)
      }
      if (Math.abs(dragTop - compBottom) <= SNAP_THRESHOLD) {
        snappedPosition.y = compBottom
        guides.horizontal.push(compBottom)
      }
      if (Math.abs(dragBottom - compTop) <= SNAP_THRESHOLD) {
        snappedPosition.y = compTop - draggingComponent.size.height
        guides.horizontal.push(compTop)
      }
      if (Math.abs(dragCenterY - compCenterY) <= SNAP_THRESHOLD) {
        snappedPosition.y = compCenterY - draggingComponent.size.height / 2
        guides.horizontal.push(compCenterY)
      }
    })
    
    guides.vertical = [...new Set(guides.vertical)]
    guides.horizontal = [...new Set(guides.horizontal)]
    
    return { snappedPosition, guides }
  }, [components])

  const calculateResizeAlignmentGuides = useCallback((
    resizingComponent: ComponentLayout, 
    newSize: { width: number; height: number }, 
    disableGrid = false
  ) => {
    const SNAP_THRESHOLD = 8
    const FINE_GRID_SIZE = 4
    const guides: AlignmentGuides = { vertical: [], horizontal: [] }
    const snappedSize = { ...newSize }
    
    if (!disableGrid) {
      const gridWidth = Math.round(newSize.width / FINE_GRID_SIZE) * FINE_GRID_SIZE
      const gridHeight = Math.round(newSize.height / FINE_GRID_SIZE) * FINE_GRID_SIZE
      snappedSize.width = Math.max(100, gridWidth)
      snappedSize.height = Math.max(80, gridHeight)
    } else {
      snappedSize.width = Math.max(100, newSize.width)
      snappedSize.height = Math.max(80, newSize.height)
    }
    
    const resizeRight = resizingComponent.position.x + snappedSize.width
    const resizeBottom = resizingComponent.position.y + snappedSize.height
    
    components.forEach(comp => {
      if (comp.id === resizingComponent.id) return
      
      const compLeft = comp.position.x
      const compRight = comp.position.x + comp.size.width
      const compTop = comp.position.y
      const compBottom = comp.position.y + comp.size.height
      
      if (Math.abs(resizeRight - compLeft) <= SNAP_THRESHOLD) {
        const newWidth = compLeft - resizingComponent.position.x
        if (newWidth >= 100) {
          snappedSize.width = newWidth
          guides.vertical.push(compLeft)
        }
      }
      if (Math.abs(resizeRight - compRight) <= SNAP_THRESHOLD) {
        snappedSize.width = compRight - resizingComponent.position.x
        guides.vertical.push(compRight)
      }
      
      if (Math.abs(resizeBottom - compTop) <= SNAP_THRESHOLD) {
        const newHeight = compTop - resizingComponent.position.y
        if (newHeight >= 80) {
          snappedSize.height = newHeight
          guides.horizontal.push(compTop)
        }
      }
      if (Math.abs(resizeBottom - compBottom) <= SNAP_THRESHOLD) {
        snappedSize.height = compBottom - resizingComponent.position.y
        guides.horizontal.push(compBottom)
      }
      
      if (Math.abs(snappedSize.width - comp.size.width) <= SNAP_THRESHOLD) {
        snappedSize.width = comp.size.width
        guides.vertical.push(resizingComponent.position.x + comp.size.width)
      }
      
      if (Math.abs(snappedSize.height - comp.size.height) <= SNAP_THRESHOLD) {
        snappedSize.height = comp.size.height
        guides.horizontal.push(resizingComponent.position.y + comp.size.height)
      }
    })
    
    guides.vertical = [...new Set(guides.vertical)]
    guides.horizontal = [...new Set(guides.horizontal)]
    
    return { snappedSize, guides }
  }, [components])

  const clearAlignmentGuides = useCallback(() => {
    setAlignmentGuides({ vertical: [], horizontal: [] })
  }, [])

  return {
    alignmentGuides,
    setAlignmentGuides,
    calculateAlignmentGuides,
    calculateResizeAlignmentGuides,
    clearAlignmentGuides
  }
}