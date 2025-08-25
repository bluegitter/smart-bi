'use client'

import React from 'react'
import type { ComponentLayout } from '@/types'

interface ContainerStyleEditorProps {
  selectedComponent: ComponentLayout
  onContainerConfigUpdate: (containerUpdates: any) => void
}

export function ContainerStyleEditor({ selectedComponent, onContainerConfigUpdate }: ContainerStyleEditorProps) {
  if (selectedComponent.type !== 'container') return null

  return (
    <div>
      <label className="block text-sm font-medium mb-2">容器设置</label>
      <div className="space-y-2">
        <div>
          <label className="block text-xs text-slate-500 mb-1">布局方式</label>
          <select 
            className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
            value={selectedComponent.containerConfig?.layout || 'flex'}
            onChange={(e) => onContainerConfigUpdate({ layout: e.target.value })}
          >
            <option value="flex">弹性布局</option>
            <option value="grid">网格布局</option>
            <option value="absolute">绝对定位</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">内边距 (px)</label>
          <input
            type="number"
            min="0"
            max="50"
            value={selectedComponent.containerConfig?.padding || 16}
            className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
            onChange={(e) => onContainerConfigUpdate({ padding: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">间距 (px)</label>
          <input
            type="number"
            min="0"
            max="30"
            value={selectedComponent.containerConfig?.gap || 12}
            className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
            onChange={(e) => onContainerConfigUpdate({ gap: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">边框样式</label>
          <select 
            className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
            value={selectedComponent.containerConfig?.borderStyle || 'solid'}
            onChange={(e) => onContainerConfigUpdate({ borderStyle: e.target.value })}
          >
            <option value="solid">实线</option>
            <option value="dashed">虚线</option>
            <option value="none">无边框</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">边框颜色</label>
          <input
            type="color"
            value={selectedComponent.containerConfig?.borderColor || '#e2e8f0'}
            className="w-full h-8 border border-slate-200 rounded"
            onChange={(e) => onContainerConfigUpdate({ borderColor: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">背景颜色</label>
          <input
            type="color"
            value={selectedComponent.containerConfig?.backgroundColor || '#ffffff'}
            className="w-full h-8 border border-slate-200 rounded"
            onChange={(e) => onContainerConfigUpdate({ backgroundColor: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}