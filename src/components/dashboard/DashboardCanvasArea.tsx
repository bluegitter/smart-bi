'use client'

import React from 'react'
import { Plus, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { AIGenerateDashboardDialog } from './AIGenerateDashboardDialog'
import { cn } from '@/lib/utils'
import type { ComponentLayout, DragItem, Metric } from '@/types'

interface DashboardCanvasAreaProps {
  canvasRef: React.RefObject<HTMLDivElement | null>
  components: ComponentLayout[]
  canvasWidth: number
  isPreviewMode: boolean
  isOver: boolean
  isSelecting: boolean
  selectionBox: {
    startX: number
    startY: number
    currentX: number
    currentY: number
  } | null
  alignmentGuides: {
    vertical: number[]
    horizontal: number[]
  }
  showHelpTip: boolean
  selectedComponent: ComponentLayout | null
  selectedComponents: ComponentLayout[]
  drop: (node: HTMLDivElement | null) => void
  onMouseDown: (e: React.MouseEvent) => void
  onClick: () => void
  onDoubleClick: () => void
  onSetShowHelpTip: (show: boolean) => void
  renderDraggableComponent: (component: ComponentLayout) => React.ReactNode
  onAddComponents: (components: ComponentLayout[]) => void
}

export function DashboardCanvasArea({
  canvasRef,
  components,
  canvasWidth,
  isPreviewMode,
  isOver,
  isSelecting,
  selectionBox,
  alignmentGuides,
  showHelpTip,
  selectedComponent,
  selectedComponents,
  drop,
  onMouseDown,
  onClick,
  onDoubleClick,
  onSetShowHelpTip,
  renderDraggableComponent,
  onAddComponents
}: DashboardCanvasAreaProps) {
  return (
    <div 
      className="flex-1 flex"
      style={{ 
        height: 'calc(100vh - 48px)',
        maxHeight: 'calc(100vh - 48px)',
        overflow: 'hidden'
      }}>
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
          width: `${canvasWidth}px`,
          transition: 'width 0.3s ease-in-out',
          ...(!isPreviewMode ? {
            backgroundImage: `
              radial-gradient(circle, #e2e8f0 0.5px, transparent 0.5px),
              radial-gradient(circle, #cbd5e1 1px, transparent 1px)
            `,
            backgroundSize: '4px 4px, 24px 24px',
            backgroundPosition: '0 0, 0 0'
          } : {})
        }}
        onMouseDown={onMouseDown}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
      >
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
            <EmptyCanvasPlaceholder onAddComponents={onAddComponents} />
          ) : (
            <>
              <HelpTip 
                show={!isPreviewMode && showHelpTip} 
                onClose={() => onSetShowHelpTip(false)} 
              />
              
              {components.map((component) => {
                const isSelected = selectedComponent?.id === component.id
                const isMultiSelected = selectedComponents.some(comp => comp.id === component.id) && selectedComponent?.id !== component.id
                
                return renderDraggableComponent(component)
              })}
              
              <SelectionBox 
                show={!isPreviewMode && selectionBox} 
                selectionBox={selectionBox} 
              />
              
              <AlignmentGuides 
                show={!isPreviewMode} 
                alignmentGuides={alignmentGuides} 
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyCanvasPlaceholder({ onAddComponents }: { onAddComponents: (components: ComponentLayout[]) => void }) {
  const [showAIDialog, setShowAIDialog] = React.useState(false)
  const [metrics, setMetrics] = React.useState<Metric[]>([])
  const [loadingMetrics, setLoadingMetrics] = React.useState(false)

  // 加载指标数据
  const loadMetrics = async () => {
    setLoadingMetrics(true)
    try {
      const response = await fetch('/api/metrics?limit=50')
      if (response.ok) {
        const data = await response.json()
        setMetrics(data.metrics || [])
      }
    } catch (error) {
      console.error('加载指标失败:', error)
    } finally {
      setLoadingMetrics(false)
    }
  }

  const handleAIGenerate = async () => {
    if (metrics.length === 0) {
      await loadMetrics()
    }
    setShowAIDialog(true)
  }

  const handleGenerate = (components: ComponentLayout[]) => {
    onAddComponents(components)
  }

  return (
    <>
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
            <Button 
              className="w-full" 
              onClick={handleAIGenerate}
              disabled={loadingMetrics}
            >
              {loadingMetrics ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  加载中...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  使用AI生成看板
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <AIGenerateDashboardDialog
        isOpen={showAIDialog}
        onClose={() => setShowAIDialog(false)}
        onGenerate={handleGenerate}
        metrics={metrics}
        loading={loadingMetrics}
      />
    </>
  )
}

function HelpTip({ show, onClose }: { show: boolean; onClose: () => void }) {
  if (!show) return null
  
  return (
    <div className="absolute bottom-4 left-4 bg-black/70 text-white text-xs px-3 py-2 rounded-lg pointer-events-none z-20 animate-fade-in">
      <div className="flex items-center gap-4">
        <span>按住 <kbd className="bg-white/20 px-1 rounded">Alt</kbd> 键：像素级精确移动和调整大小</span>
        <span>按住 <kbd className="bg-white/20 px-1 rounded">Shift</kbd> 键点击：多选组件</span>
        <span>拖拽空白区域：框选多个组件</span>
        <button 
          className="text-white/60 hover:text-white pointer-events-auto"
          onClick={onClose}
          title="关闭提示"
        >
          ×
        </button>
      </div>
    </div>
  )
}

function SelectionBox({ 
  show, 
  selectionBox 
}: { 
  show: boolean
  selectionBox: {
    startX: number
    startY: number
    currentX: number
    currentY: number
  } | null 
}) {
  if (!show || !selectionBox) return null
  
  return (
    <div
      className="absolute border-2 border-blue-500 bg-blue-100/20 pointer-events-none z-30"
      style={{
        left: Math.min(selectionBox.startX, selectionBox.currentX),
        top: Math.min(selectionBox.startY, selectionBox.currentY),
        width: Math.abs(selectionBox.currentX - selectionBox.startX),
        height: Math.abs(selectionBox.currentY - selectionBox.startY)
      }}
    />
  )
}

function AlignmentGuides({ 
  show, 
  alignmentGuides 
}: { 
  show: boolean
  alignmentGuides: {
    vertical: number[]
    horizontal: number[]
  }
}) {
  if (!show || (alignmentGuides.vertical.length === 0 && alignmentGuides.horizontal.length === 0)) {
    return null
  }
  
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {alignmentGuides.vertical.map((x, index) => (
        <div
          key={`v-${index}`}
          className="absolute top-0 bottom-0 w-0.5 opacity-60"
          style={{
            left: x,
            background: 'repeating-linear-gradient(to bottom, #94a3b8 0px, #94a3b8 4px, transparent 4px, transparent 8px)'
          }}
        />
      ))}
      {alignmentGuides.horizontal.map((y, index) => (
        <div
          key={`h-${index}`}
          className="absolute left-0 right-0 h-0.5 opacity-60"
          style={{
            top: y,
            background: 'repeating-linear-gradient(to right, #94a3b8 0px, #94a3b8 4px, transparent 4px, transparent 8px)'
          }}
        />
      ))}
    </div>
  )
}