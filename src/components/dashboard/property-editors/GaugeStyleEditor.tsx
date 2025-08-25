'use client'

import React from 'react'
import type { ComponentLayout } from '@/types'

interface GaugeStyleEditorProps {
  selectedComponent: ComponentLayout
  onGaugeConfigUpdate: (gaugeUpdates: any) => void
}

export function GaugeStyleEditor({ selectedComponent, onGaugeConfigUpdate }: GaugeStyleEditorProps) {
  if (selectedComponent.type !== 'gauge') return null

  return (
    <div>
      <label className="block text-sm font-medium mb-2">仪表盘设置</label>
      <div className="space-y-2">
        <div>
          <label className="block text-xs text-slate-500 mb-1">样式</label>
          <select 
            className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
            onChange={(e) => onGaugeConfigUpdate({ style: e.target.value })}
          >
            <option value="modern">现代</option>
            <option value="classic">经典</option>
            <option value="minimal">简约</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showLabels"
            className="rounded"
            defaultChecked={true}
            onChange={(e) => onGaugeConfigUpdate({ showLabels: e.target.checked })}
          />
          <label htmlFor="showLabels" className="text-sm">显示刻度</label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showThresholds"
            className="rounded"
            defaultChecked={false}
            onChange={(e) => onGaugeConfigUpdate({ showThresholds: e.target.checked })}
          />
          <label htmlFor="showThresholds" className="text-sm">显示阈值</label>
        </div>
      </div>
    </div>
  )
}