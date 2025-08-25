'use client'

import React from 'react'
import type { ComponentLayout } from '@/types'

interface TableStyleEditorProps {
  selectedComponent: ComponentLayout
  onTableConfigUpdate: (tableUpdates: any) => void
}

export function TableStyleEditor({ selectedComponent, onTableConfigUpdate }: TableStyleEditorProps) {
  if (selectedComponent.type !== 'table') return null

  return (
    <div>
      <label className="block text-sm font-medium mb-2">数据表设置</label>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showHeader"
            className="rounded"
            defaultChecked={true}
            onChange={(e) => onTableConfigUpdate({ showHeader: e.target.checked })}
          />
          <label htmlFor="showHeader" className="text-sm">显示表头</label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showBorder"
            className="rounded"
            defaultChecked={false}
            onChange={(e) => onTableConfigUpdate({ showBorder: e.target.checked })}
          />
          <label htmlFor="showBorder" className="text-sm">显示边框</label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showStripes"
            className="rounded"
            defaultChecked={false}
            onChange={(e) => onTableConfigUpdate({ showStripes: e.target.checked })}
          />
          <label htmlFor="showStripes" className="text-sm">斑马纹</label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="compact"
            className="rounded"
            defaultChecked={false}
            onChange={(e) => onTableConfigUpdate({ compact: e.target.checked })}
          />
          <label htmlFor="compact" className="text-sm">紧凑模式</label>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">最大行数</label>
          <input
            type="number"
            min="3"
            max="20"
            defaultValue="6"
            className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
            onChange={(e) => onTableConfigUpdate({ maxRows: Number(e.target.value) })}
          />
        </div>
      </div>
    </div>
  )
}