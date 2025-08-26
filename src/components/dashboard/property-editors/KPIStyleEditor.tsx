'use client'

import React from 'react'
import { IconSelector } from '@/components/ui/IconSelector'
import { Input } from '@/components/ui/Input'
import { BackgroundImageUpload } from '@/components/charts/DatasetCharts'
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
          <label className="block text-xs text-slate-500 mb-1">背景类型</label>
          <select 
            className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
            value={selectedComponent.config?.kpi?.backgroundType || 'default'}
            onChange={(e) => onKPIConfigUpdate({ backgroundType: e.target.value })}
          >
            <option value="default">默认</option>
            <option value="solid">纯色</option>
            <option value="gradient">渐变</option>
            <option value="image">图片</option>
          </select>
        </div>

        {/* 背景图片设置 */}
        {(selectedComponent.config?.kpi?.backgroundType === 'image' || selectedComponent.config?.kpi?.backgroundImage) && (
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div>
              <label className="block text-xs text-slate-500 mb-2 font-medium">背景图片</label>
              <BackgroundImageUpload
                currentImage={selectedComponent.config?.kpi?.backgroundImage}
                onImageChange={(imageUrl) => onKPIConfigUpdate({ 
                  backgroundImage: imageUrl,
                  backgroundType: 'image'
                })}
                onImageRemove={() => onKPIConfigUpdate({ 
                  backgroundImage: undefined,
                  backgroundType: 'default'
                })}
              />
            </div>

            {selectedComponent.config?.kpi?.backgroundImage && (
              <>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">填充方式</label>
                  <select 
                    className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
                    value={selectedComponent.config?.kpi?.backgroundSize || 'contain'}
                    onChange={(e) => onKPIConfigUpdate({ backgroundSize: e.target.value })}
                  >
                    <option value="cover">拉伸覆盖</option>
                    <option value="contain">完整显示</option>
                    <option value="auto">原始大小</option>
                    <option value="100% 100%">强制拉伸</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">图片位置</label>
                  <select 
                    className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
                    value={selectedComponent.config?.kpi?.backgroundPosition || 'right'}
                    onChange={(e) => onKPIConfigUpdate({ backgroundPosition: e.target.value })}
                  >
                    <option value="center">居中</option>
                    <option value="top">顶部</option>
                    <option value="bottom">底部</option>
                    <option value="left">左侧</option>
                    <option value="right">右侧</option>
                    <option value="top left">左上</option>
                    <option value="top right">右上</option>
                    <option value="bottom left">左下</option>
                    <option value="bottom right">右下</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    图片缩放 ({Math.round((selectedComponent.config?.kpi?.backgroundScale || 1) * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={selectedComponent.config?.kpi?.backgroundScale || 1}
                    onChange={(e) => onKPIConfigUpdate({ backgroundScale: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">平铺方式</label>
                  <select 
                    className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
                    value={selectedComponent.config?.kpi?.backgroundRepeat || 'no-repeat'}
                    onChange={(e) => onKPIConfigUpdate({ backgroundRepeat: e.target.value })}
                  >
                    <option value="no-repeat">不重复</option>
                    <option value="repeat">全方向平铺</option>
                    <option value="repeat-x">水平平铺</option>
                    <option value="repeat-y">垂直平铺</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">覆盖层</label>
                  <select 
                    className="w-full h-8 px-2 py-1 border border-slate-200 rounded text-sm"
                    value={selectedComponent.config?.kpi?.backgroundOverlay || ''}
                    onChange={(e) => onKPIConfigUpdate({ backgroundOverlay: e.target.value || undefined })}
                  >
                    <option value="">无覆盖</option>
                    <option value="dark">深色覆盖</option>
                    <option value="light">浅色覆盖</option>
                  </select>
                </div>

                {selectedComponent.config?.kpi?.backgroundOverlay && (
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      覆盖层透明度 ({Math.round((selectedComponent.config?.kpi?.overlayOpacity || 0.5) * 100)}%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={selectedComponent.config?.kpi?.overlayOpacity || 0.5}
                      onChange={(e) => onKPIConfigUpdate({ overlayOpacity: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
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

        {/* 指标单位设置 */}
        <div>
          <label className="block text-xs text-slate-500 mb-1">指标单位</label>
          <Input
            placeholder="例如：万元、%、人次等"
            value={selectedComponent.config?.kpi?.unit || ''}
            onChange={(e) => onKPIConfigUpdate({ unit: e.target.value })}
            size="sm"
          />
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