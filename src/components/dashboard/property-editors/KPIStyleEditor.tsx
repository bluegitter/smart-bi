'use client'

import React from 'react'
import type { ComponentLayout } from '@/types'

interface KPIStyleEditorProps {
  selectedComponent: ComponentLayout
  onKPIConfigUpdate: (kpiUpdates: any) => void
}

export function KPIStyleEditor({ selectedComponent, onKPIConfigUpdate }: KPIStyleEditorProps) {
  if (selectedComponent.type !== 'kpi-card') return null

  return (
    <div>
      <label className="block text-sm font-medium mb-2">指标卡设置</label>
      <div className="space-y-2">
        <div>
          <label className="block text-xs text-slate-500 mb-1">卡片样式</label>
          <select 
            className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
            onChange={(e) => onKPIConfigUpdate({ style: e.target.value })}
          >
            <option value="modern">现代</option>
            <option value="minimal">简约</option>
            <option value="colorful">彩色</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showIcon"
            className="rounded"
            defaultChecked={true}
            onChange={(e) => onKPIConfigUpdate({ showIcon: e.target.checked })}
          />
          <label htmlFor="showIcon" className="text-sm">显示图标</label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showTrend"
            className="rounded"
            defaultChecked={true}
            onChange={(e) => onKPIConfigUpdate({ showTrend: e.target.checked })}
          />
          <label htmlFor="showTrend" className="text-sm">显示趋势</label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showDescription"
            className="rounded"
            defaultChecked={true}
            onChange={(e) => onKPIConfigUpdate({ showDescription: e.target.checked })}
          />
          <label htmlFor="showDescription" className="text-sm">显示描述</label>
        </div>
      </div>
    </div>
  )
}