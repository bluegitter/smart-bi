'use client'

import React from 'react'
import type { ComponentLayout } from '@/types'

interface ChartStyleEditorProps {
  selectedComponent: ComponentLayout
  onChartConfigUpdate: (chartUpdates: any) => void
}

export function ChartStyleEditor({ selectedComponent, onChartConfigUpdate }: ChartStyleEditorProps) {
  // 折线图设置
  if (selectedComponent.type === 'line-chart') {
    return (
      <div>
        <label className="block text-sm font-medium mb-2">折线图设置</label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showGrid"
              className="rounded"
              checked={selectedComponent.config?.chart?.showGrid !== false}
              onChange={(e) => onChartConfigUpdate({ showGrid: e.target.checked })}
            />
            <label htmlFor="showGrid" className="text-sm">显示网格</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showPoints"
              className="rounded"
              checked={selectedComponent.config?.chart?.showPoints !== false}
              onChange={(e) => onChartConfigUpdate({ showPoints: e.target.checked })}
            />
            <label htmlFor="showPoints" className="text-sm">显示数据点</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showArea"
              className="rounded"
              checked={selectedComponent.config?.chart?.showArea || false}
              onChange={(e) => onChartConfigUpdate({ showArea: e.target.checked })}
            />
            <label htmlFor="showArea" className="text-sm">面积填充</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="smooth"
              className="rounded"
              checked={selectedComponent.config?.chart?.smooth || false}
              onChange={(e) => onChartConfigUpdate({ smooth: e.target.checked })}
            />
            <label htmlFor="smooth" className="text-sm">平滑曲线</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showLegend"
              className="rounded"
              checked={selectedComponent.config?.chart?.showLegend !== false}
              onChange={(e) => onChartConfigUpdate({ showLegend: e.target.checked })}
            />
            <label htmlFor="showLegend" className="text-sm">显示图例</label>
          </div>
        </div>
      </div>
    )
  }

  // 柱状图设置
  if (selectedComponent.type === 'bar-chart') {
    return (
      <div>
        <label className="block text-sm font-medium mb-2">柱状图设置</label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showValues"
              className="rounded"
              checked={selectedComponent.config?.chart?.showValues || false}
              onChange={(e) => onChartConfigUpdate({ showValues: e.target.checked })}
            />
            <label htmlFor="showValues" className="text-sm">显示数值</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showLegend"
              className="rounded"
              checked={selectedComponent.config?.chart?.showLegend !== false}
              onChange={(e) => onChartConfigUpdate({ showLegend: e.target.checked })}
            />
            <label htmlFor="showLegend" className="text-sm">显示图例</label>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">柱子样式</label>
            <select 
              className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
              value={selectedComponent.config?.chart?.barStyle || 'rounded'}
              onChange={(e) => onChartConfigUpdate({ barStyle: e.target.value })}
            >
              <option value="rounded">圆角</option>
              <option value="square">方角</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">方向</label>
            <select 
              className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
              value={selectedComponent.config?.chart?.orientation || 'vertical'}
              onChange={(e) => onChartConfigUpdate({ orientation: e.target.value })}
            >
              <option value="vertical">垂直</option>
              <option value="horizontal">水平</option>
            </select>
          </div>
        </div>
      </div>
    )
  }

  // 饼图设置
  if (selectedComponent.type === 'pie-chart') {
    return (
      <div>
        <label className="block text-sm font-medium mb-2">饼图设置</label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showLabels"
              className="rounded"
              checked={selectedComponent.config?.chart?.showLabels !== false}
              onChange={(e) => onChartConfigUpdate({ showLabels: e.target.checked })}
            />
            <label htmlFor="showLabels" className="text-sm">显示标签</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showLegend"
              className="rounded"
              checked={selectedComponent.config?.chart?.showLegend !== false}
              onChange={(e) => onChartConfigUpdate({ showLegend: e.target.checked })}
            />
            <label htmlFor="showLegend" className="text-sm">显示图例</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showPercentage"
              className="rounded"
              checked={selectedComponent.config?.chart?.showPercentage !== false}
              onChange={(e) => onChartConfigUpdate({ showPercentage: e.target.checked })}
            />
            <label htmlFor="showPercentage" className="text-sm">显示百分比</label>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">内圆半径 (%)</label>
            <input
              type="range"
              min="0"
              max="80"
              value={selectedComponent.config?.chart?.innerRadius || 0}
              className="w-full"
              onChange={(e) => onChartConfigUpdate({ innerRadius: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>
    )
  }

  return null
}