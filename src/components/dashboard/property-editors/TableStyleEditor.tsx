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
            id="table-showHeader"
            className="rounded"
            checked={selectedComponent.config?.table?.showHeader !== false}
            onChange={(e) => onTableConfigUpdate({ showHeader: e.target.checked })}
          />
          <label htmlFor="table-showHeader" className="text-sm">显示表头</label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="table-showBorder"
            className="rounded"
            checked={selectedComponent.config?.table?.showBorder !== false}
            onChange={(e) => onTableConfigUpdate({ showBorder: e.target.checked })}
          />
          <label htmlFor="table-showBorder" className="text-sm">显示边框</label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="table-striped"
            className="rounded"
            checked={selectedComponent.config?.table?.striped !== false}
            onChange={(e) => onTableConfigUpdate({ striped: e.target.checked })}
          />
          <label htmlFor="table-striped" className="text-sm">斑马纹</label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="table-compact"
            className="rounded"
            checked={selectedComponent.config?.table?.compact || false}
            onChange={(e) => onTableConfigUpdate({ compact: e.target.checked })}
          />
          <label htmlFor="table-compact" className="text-sm">紧凑模式</label>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">最大行数</label>
          <input
            type="number"
            min="1"
            max="1000"
            value={selectedComponent.config?.table?.maxRows || 100}
            className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
            onChange={(e) => onTableConfigUpdate({ maxRows: Number(e.target.value) })}
          />
        </div>
      </div>
    </div>
  )
}