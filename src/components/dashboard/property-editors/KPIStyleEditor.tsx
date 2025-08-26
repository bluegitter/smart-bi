'use client'

import React from 'react'
import { IconSelector } from '@/components/ui/IconSelector'
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
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">卡片样式</label>
          <select 
            className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
            value={selectedComponent.config?.kpi?.style || 'modern'}
            onChange={(e) => onKPIConfigUpdate({ style: e.target.value })}
          >
            <option value="modern">现代</option>
            <option value="minimal">简约</option>
            <option value="colorful">彩色</option>
          </select>
        </div>
        
        <div>
          <label className="block text-xs text-slate-500 mb-1">背景类型</label>
          <select 
            className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
            value={selectedComponent.config?.kpi?.backgroundType || 'default'}
            onChange={(e) => onKPIConfigUpdate({ backgroundType: e.target.value })}
          >
            <option value="default">默认</option>
            <option value="solid">纯色</option>
            <option value="gradient">渐变</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showIcon"
            className="rounded"
            checked={selectedComponent.config?.kpi?.showIcon !== false}
            onChange={(e) => onKPIConfigUpdate({ showIcon: e.target.checked })}
          />
          <label htmlFor="showIcon" className="text-sm">显示图标</label>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showTrend"
            className="rounded"
            checked={selectedComponent.config?.kpi?.showTrend !== false}
            onChange={(e) => onKPIConfigUpdate({ showTrend: e.target.checked })}
          />
          <label htmlFor="showTrend" className="text-sm">显示趋势</label>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showDescription"
            className="rounded"
            checked={selectedComponent.config?.kpi?.showDescription !== false}
            onChange={(e) => onKPIConfigUpdate({ showDescription: e.target.checked })}
          />
          <label htmlFor="showDescription" className="text-sm">显示描述</label>
        </div>
        
        {/* 内容区图标设置 */}
        <div className="pt-3 border-t border-slate-100">
          <label className="block text-xs text-slate-500 mb-2 font-medium">内容区图标</label>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">选择图标</label>
              <IconSelector
                value={selectedComponent.config?.kpi?.contentIcon}
                onChange={(iconName) => onKPIConfigUpdate({ contentIcon: iconName })}
                placeholder="选择内容区图标（可选）"
              />
            </div>
            
            {selectedComponent.config?.kpi?.contentIcon && (
              <>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">图标位置</label>
                  <select 
                    className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
                    value={selectedComponent.config?.kpi?.contentIconPosition || 'left'}
                    onChange={(e) => onKPIConfigUpdate({ contentIconPosition: e.target.value })}
                  >
                    <option value="left">左侧</option>
                    <option value="right">右侧</option>
                    <option value="top">顶部</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs text-slate-500 mb-1">图标大小</label>
                  <select 
                    className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
                    value={selectedComponent.config?.kpi?.contentIconSize || 'medium'}
                    onChange={(e) => onKPIConfigUpdate({ contentIconSize: e.target.value })}
                  >
                    <option value="small">小 (24px)</option>
                    <option value="medium">中 (32px)</option>
                    <option value="large">大 (48px)</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* 配色提示 */}
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
          💡 配色方案会自动跟随"样式设置"中的配色方案设置
        </div>
      </div>
    </div>
  )
}