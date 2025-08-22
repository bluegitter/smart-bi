'use client'

import React from 'react'
import { useDrop } from 'react-dnd'
import { Box, Grid, Settings, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ContainerChildComponent } from './ContainerChildComponent'
import type { ComponentLayout, DragItem } from '@/types'

interface ContainerComponentProps {
  component: ComponentLayout
  isPreviewMode: boolean
  isSelected?: boolean
  selectedChildId?: string
  onDropToContainer?: (item: DragItem, containerId: string, position?: { x: number; y: number }) => void
  onSelectChild?: (childComponent: ComponentLayout, containerId?: string) => void
  onUpdateChild?: (containerId: string, childId: string, updates: Partial<ComponentLayout>) => void
  onDeleteChild?: (containerId: string, childId: string) => void
  onMoveChild?: (containerId: string, dragIndex: number, hoverIndex: number) => void
  children?: React.ReactNode
  className?: string
}

export function ContainerComponent({
  component,
  isPreviewMode,
  isSelected = false,
  selectedChildId,
  onDropToContainer,
  onSelectChild,
  onUpdateChild,
  onDeleteChild,
  onMoveChild,
  children,
  className
}: ContainerComponentProps) {
  const containerConfig = component.containerConfig || {
    layout: 'flex',
    padding: 16,
    gap: 12,
    backgroundColor: '#ffffff',
    borderStyle: 'solid',
    borderColor: '#e2e8f0',
    borderWidth: 1
  }

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ['metric', 'component', 'container-child'],
    drop: (item: DragItem, monitor) => {
      // 只有在直接拖拽到容器上时才处理（不是拖拽到子组件上）
      if (monitor.isOver({ shallow: true }) && onDropToContainer) {
        console.log('Dropping item into container:', item, component.id)
        onDropToContainer(item, component.id)
      }
    },
    canDrop: (item: DragItem) => {
      // 容器组件可以接受指标和其他组件（但不能接受其他容器避免无限嵌套）
      return item.type === 'metric' || (item.type === 'component' && item.data?.type !== 'container')
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  }))

  // 处理子组件移动
  const handleChildMove = (dragIndex: number, hoverIndex: number) => {
    onMoveChild?.(component.id, dragIndex, hoverIndex)
  }

  // 处理子组件选择
  const handleChildSelect = (childComponent: ComponentLayout) => {
    onSelectChild?.(childComponent, component.id)
  }

  // 处理子组件删除
  const handleChildDelete = (childId: string) => {
    onDeleteChild?.(component.id, childId)
  }

  const renderChildren = () => {
    if (!component.children || component.children.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center min-h-32">
          <div className="text-center text-slate-400">
            <Box className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">拖拽组件到这里</p>
          </div>
        </div>
      )
    }

    switch (containerConfig.layout) {
      case 'grid':
        return (
          <div 
            className="grid grid-cols-2 gap-3 flex-1"
            style={{ gap: containerConfig.gap }}
          >
            {component.children.map((child, index) => (
              <ContainerChildComponent
                key={`${child.id}-${child.type}`}
                component={child}
                index={index}
                containerId={component.id}
                isPreviewMode={isPreviewMode}
                isSelected={selectedChildId === child.id}
                onSelect={handleChildSelect}
                onDelete={handleChildDelete}
                onMove={handleChildMove}
              />
            ))}
          </div>
        )
      
      case 'flex':
        return (
          <div 
            className="flex flex-wrap gap-2 flex-1"
            style={{ gap: containerConfig.gap }}
          >
            {component.children.map((child, index) => (
              <ContainerChildComponent
                key={`${child.id}-${child.type}`}
                component={child}
                index={index}
                containerId={component.id}
                isPreviewMode={isPreviewMode}
                isSelected={selectedChildId === child.id}
                onSelect={handleChildSelect}
                onDelete={handleChildDelete}
                onMove={handleChildMove}
                className="flex-1 min-w-48"
              />
            ))}
          </div>
        )
      
      case 'absolute':
        return (
          <div className="relative flex-1" style={{ minHeight: '200px' }}>
            {component.children.map((child, index) => (
              <ContainerChildComponent
                key={`${child.id}-${child.type}`}
                component={child}
                index={index}
                containerId={component.id}
                isPreviewMode={isPreviewMode}
                isSelected={selectedChildId === child.id}
                onSelect={handleChildSelect}
                onDelete={handleChildDelete}
                onMove={handleChildMove}
                className="absolute"
                style={{
                  left: child.position.x,
                  top: child.position.y,
                  width: child.size.width,
                  height: child.size.height
                }}
              />
            ))}
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div
      ref={drop}
      className={cn(
        "relative flex flex-col",
        "border-2 border-dashed border-slate-300 rounded-lg",
        isOver && canDrop && "border-blue-400 bg-blue-50",
        isSelected && "ring-2 ring-blue-500",
        className
      )}
      style={{
        backgroundColor: containerConfig.backgroundColor,
        padding: containerConfig.padding,
        borderStyle: containerConfig.borderStyle === 'none' ? 'solid' : containerConfig.borderStyle,
        borderColor: isOver && canDrop ? '#3b82f6' : containerConfig.borderColor,
        borderWidth: containerConfig.borderWidth,
        minHeight: '120px'
      }}
    >
      {/* 容器标题区域 */}
      {!isPreviewMode && (
        <div className="flex items-center justify-between mb-2 px-2 py-1 bg-slate-50 rounded-md">
          <div className="flex items-center gap-1">
            <Box className="h-3 w-3 text-slate-600" />
            <span className="text-xs font-medium text-slate-700">
              {component.title}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500">
              {component.children?.length || 0} 项
            </span>
            <Settings className="h-3 w-3 text-slate-400" />
          </div>
        </div>
      )}

      {/* 预览模式标题 */}
      {isPreviewMode && (
        <div className="text-sm font-medium text-slate-700 mb-2 text-center">
          {component.title}
        </div>
      )}

      {/* 容器内容区域 */}
      {renderChildren()}

      {/* 拖拽提示 */}
      {isOver && canDrop && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-90 rounded-lg">
          <div className="text-center">
            <Plus className="h-6 w-6 text-blue-600 mx-auto mb-1" />
            <p className="text-sm font-medium text-blue-600">添加到容器</p>
          </div>
        </div>
      )}
    </div>
  )
}