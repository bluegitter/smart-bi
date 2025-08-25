'use client'

import React from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { ComponentLayout } from '@/types'

interface MapStyleEditorProps {
  selectedComponent: ComponentLayout
  onMapConfigUpdate: (updates: any) => void
}

export function MapStyleEditor({ selectedComponent, onMapConfigUpdate }: MapStyleEditorProps) {
  // 只在地图组件时显示
  if (selectedComponent.type !== 'map') {
    return null
  }

  const mapConfig = selectedComponent.config?.map || {}

  // 默认配置
  const defaultMapConfig = {
    center: { lat: 39.9042, lng: 116.4074 }, // 默认北京天安门
    zoom: 10,
    mapType: 'roadmap', // roadmap, satellite, hybrid, terrain
    tileProvider: 'openstreetmap', // 瓦片地图提供商
    showControls: true,
    showZoomControl: true,
    showFullscreenControl: true,
    showStreetViewControl: false,
    gestureHandling: 'cooperative', // cooperative, greedy, none, auto
    enableTileMap: true // 是否启用瓦片地图
  }

  const currentConfig = { ...defaultMapConfig, ...mapConfig }

  const handleCenterChange = (field: 'lat' | 'lng', value: string) => {
    const numValue = parseFloat(value) || 0
    onMapConfigUpdate({
      center: {
        ...currentConfig.center,
        [field]: numValue
      }
    })
  }

  const handleZoomChange = (value: string) => {
    const zoomValue = parseInt(value) || 10
    onMapConfigUpdate({
      zoom: Math.max(1, Math.min(20, zoomValue)) // 限制缩放范围 1-20
    })
  }

  const handleMapTypeChange = (mapType: string) => {
    onMapConfigUpdate({ mapType })
  }

  const handleControlToggle = (controlName: string, value: boolean) => {
    onMapConfigUpdate({ [controlName]: value })
  }

  // 预设城市坐标
  const presetCities = [
    { name: '北京', lat: 39.9042, lng: 116.4074 },
    { name: '上海', lat: 31.2304, lng: 121.4737 },
    { name: '广州', lat: 23.1291, lng: 113.2644 },
    { name: '深圳', lat: 22.5431, lng: 114.0579 },
    { name: '杭州', lat: 30.2741, lng: 120.1551 },
    { name: '成都', lat: 30.5728, lng: 104.0668 },
    { name: '武汉', lat: 30.5928, lng: 114.3055 },
    { name: '西安', lat: 34.3416, lng: 108.9398 },
    { name: '南昌', lat: 28.6820, lng: 115.8582 }
  ]

  const mapTypes = [
    { value: 'roadmap', label: '路线图' },
    { value: 'satellite', label: '卫星图' },
    { value: 'hybrid', label: '混合模式' },
    { value: 'terrain', label: '地形图' }
  ]

  // 瓦片地图提供商选项
  const tileProviders = [
    { 
      value: 'openstreetmap', 
      label: 'OpenStreetMap',
      description: '开源街道地图',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    },
    { 
      value: 'cartodb', 
      label: 'CartoDB 浅色',
      description: '简洁浅色风格',
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    },
    { 
      value: 'cartodb-dark', 
      label: 'CartoDB 深色',
      description: '深色主题风格',
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    },
    { 
      value: 'stamen-terrain', 
      label: 'Stamen 地形',
      description: '地形地貌风格',
      url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png'
    },
    { 
      value: 'stamen-watercolor', 
      label: 'Stamen 水彩',
      description: '艺术水彩风格',
      url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg'
    },
    { 
      value: 'gaode', 
      label: '高德地图',
      description: '中文地图服务',
      url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}'
    }
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">地图设置</CardTitle>
      </CardHeader>
      <CardContent className="pt-2 space-y-4">
        {/* 中心坐标 */}
        <div>
          <label className="block text-sm font-medium mb-2">地图中心</label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="block text-xs text-slate-500 mb-1">纬度 (Lat)</label>
              <Input
                type="number"
                step="0.0001"
                value={currentConfig.center.lat.toString()}
                onChange={(e) => handleCenterChange('lat', e.target.value)}
                placeholder="39.9042"
                size="sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">经度 (Lng)</label>
              <Input
                type="number"
                step="0.0001"
                value={currentConfig.center.lng.toString()}
                onChange={(e) => handleCenterChange('lng', e.target.value)}
                placeholder="116.4074"
                size="sm"
              />
            </div>
          </div>
          
          {/* 预设城市快捷按钮 */}
          <div className="space-y-1">
            <label className="block text-xs text-slate-500">快速定位</label>
            <div className="flex flex-wrap gap-1">
              {presetCities.map((city) => (
                <Button
                  key={city.name}
                  variant="outline"
                  size="sm"
                  className="text-xs h-6 px-2"
                  onClick={() => {
                    onMapConfigUpdate({
                      center: { lat: city.lat, lng: city.lng }
                    })
                  }}
                >
                  {city.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* 缩放级别 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            缩放级别 ({currentConfig.zoom})
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="1"
              max="20"
              value={currentConfig.zoom}
              onChange={(e) => handleZoomChange(e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>1 (最远)</span>
              <span>20 (最近)</span>
            </div>
          </div>
        </div>

        {/* 瓦片地图开关 */}
        <div>
          <label className="block text-sm font-medium mb-2">地图底图</label>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm">启用瓦片地图</span>
              <input
                type="checkbox"
                checked={currentConfig.enableTileMap}
                onChange={(e) => onMapConfigUpdate({ enableTileMap: e.target.checked })}
                className="rounded"
              />
            </label>
            
            {currentConfig.enableTileMap && (
              <>
                {/* 瓦片地图提供商 */}
                <div>
                  <label className="block text-sm font-medium mb-2">地图服务商</label>
                  <select
                    value={currentConfig.tileProvider}
                    onChange={(e) => onMapConfigUpdate({ tileProvider: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded text-sm"
                  >
                    {tileProviders.map((provider) => (
                      <option key={provider.value} value={provider.value}>
                        {provider.label} - {provider.description}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
            
            {!currentConfig.enableTileMap && (
              <>
                {/* 模拟地图类型 */}
                <div>
                  <label className="block text-sm font-medium mb-2">模拟地图类型</label>
                  <div className="grid grid-cols-2 gap-1">
                    {mapTypes.map((type) => (
                      <Button
                        key={type.value}
                        variant={currentConfig.mapType === type.value ? "default" : "outline"}
                        size="sm"
                        className="text-xs"
                        onClick={() => handleMapTypeChange(type.value)}
                      >
                        {type.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 地图控件 */}
        <div>
          <label className="block text-sm font-medium mb-2">地图控件</label>
          <div className="space-y-2">
            <label className="flex items-center justify-between">
              <span className="text-sm">显示控件</span>
              <input
                type="checkbox"
                checked={currentConfig.showControls}
                onChange={(e) => handleControlToggle('showControls', e.target.checked)}
                className="rounded"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <span className="text-sm">缩放控制</span>
              <input
                type="checkbox"
                checked={currentConfig.showZoomControl}
                onChange={(e) => handleControlToggle('showZoomControl', e.target.checked)}
                className="rounded"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <span className="text-sm">全屏控制</span>
              <input
                type="checkbox"
                checked={currentConfig.showFullscreenControl}
                onChange={(e) => handleControlToggle('showFullscreenControl', e.target.checked)}
                className="rounded"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <span className="text-sm">街景视图</span>
              <input
                type="checkbox"
                checked={currentConfig.showStreetViewControl}
                onChange={(e) => handleControlToggle('showStreetViewControl', e.target.checked)}
                className="rounded"
              />
            </label>
          </div>
        </div>

        {/* 手势处理 */}
        <div>
          <label className="block text-sm font-medium mb-2">手势处理</label>
          <select
            value={currentConfig.gestureHandling}
            onChange={(e) => onMapConfigUpdate({ gestureHandling: e.target.value })}
            className="w-full p-2 border border-slate-200 rounded text-sm"
          >
            <option value="cooperative">协同 (需按住Ctrl滚动)</option>
            <option value="greedy">贪婪 (直接滚动缩放)</option>
            <option value="none">无手势</option>
            <option value="auto">自动</option>
          </select>
        </div>

        {/* 当前坐标显示 */}
        <div className="bg-slate-50 p-2 rounded text-xs">
          <div className="text-slate-600 mb-1">当前设置:</div>
          <div>中心: {currentConfig.center.lat.toFixed(4)}, {currentConfig.center.lng.toFixed(4)}</div>
          <div>缩放: {currentConfig.zoom}</div>
          <div>类型: {mapTypes.find(t => t.value === currentConfig.mapType)?.label}</div>
        </div>
      </CardContent>
    </Card>
  )
}