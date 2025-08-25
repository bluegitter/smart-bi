'use client'

import React from 'react'
import { MapPin, Navigation, ZoomIn, ZoomOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ComponentLayout } from '@/types'
import { TileMapComponent } from './TileMapComponent'

interface MapComponentProps {
  component: ComponentLayout
  width?: number
  height?: number
  className?: string
}

// 简单的地图组件实现（基于CSS和SVG的模拟地图）
export function SimpleMapComponent({ component, width, height, className }: MapComponentProps) {
  const mapConfig = component.config?.map || {}
  
  // 默认配置
  const defaultConfig = {
    center: { lat: 39.9042, lng: 116.4074 }, // 北京
    zoom: 10,
    mapType: 'roadmap',
    tileProvider: 'openstreetmap',
    enableTileMap: true,
    showControls: true,
    showZoomControl: true,
    showFullscreenControl: true,
    showStreetViewControl: false
  }
  
  const config = { ...defaultConfig, ...mapConfig }

  // 如果启用了瓦片地图，使用TileMapComponent
  if (config.enableTileMap) {
    return (
      <TileMapComponent
        component={component}
        width={width}
        height={height}
        className={className}
      />
    )
  }
  
  // 根据缩放级别计算网格密度
  const getGridSize = (zoom: number) => {
    return Math.max(20, 100 - zoom * 3)
  }
  
  const gridSize = getGridSize(config.zoom)
  
  // 根据地图类型选择颜色主题
  const getMapTheme = (mapType: string) => {
    switch (mapType) {
      case 'satellite':
        return {
          background: 'linear-gradient(135deg, #2d5016 0%, #3d6b1c 50%, #4a7c23 100%)',
          gridColor: '#5a8c33',
          textColor: '#ffffff'
        }
      case 'terrain':
        return {
          background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 30%, #228B22 60%, #32CD32 100%)',
          gridColor: '#654321',
          textColor: '#ffffff'
        }
      case 'hybrid':
        return {
          background: 'linear-gradient(135deg, #2d3748 0%, #4a5568 50%, #2d5016 100%)',
          gridColor: '#718096',
          textColor: '#ffffff'
        }
      default: // roadmap
        return {
          background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 50%, #e2e8f0 100%)',
          gridColor: '#cbd5e1',
          textColor: '#2d3748'
        }
    }
  }
  
  const theme = getMapTheme(config.mapType)
  
  // 生成一些模拟的地标点
  const landmarks = [
    { name: '地标A', x: 30, y: 40, type: 'poi' },
    { name: '地标B', x: 70, y: 25, type: 'building' },
    { name: '地标C', x: 50, y: 60, type: 'park' },
    { name: '中心点', x: 50, y: 50, type: 'center' }
  ]
  
  return (
    <div 
      className={cn("relative overflow-hidden w-full h-full", className)}
      style={{ 
        background: theme.background,
        color: theme.textColor
      }}
    >
      {/* 网格背景 */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(${theme.gridColor} 1px, transparent 1px),
            linear-gradient(90deg, ${theme.gridColor} 1px, transparent 1px)
          `,
          backgroundSize: `${gridSize}px ${gridSize}px`
        }}
      />
      
      {/* 模拟的道路/河流 */}
      <svg className="absolute inset-0 w-full h-full opacity-40">
        {/* 主要道路 */}
        <path
          d="M 0,50 Q 25,30 50,50 T 100,45"
          stroke={config.mapType === 'roadmap' ? '#4299e1' : '#ffffff'}
          strokeWidth="2"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M 20,0 Q 40,25 45,50 Q 50,75 30,100"
          stroke={config.mapType === 'roadmap' ? '#4299e1' : '#ffffff'}
          strokeWidth="1.5"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
        {/* 次要道路 */}
        <path
          d="M 0,25 L 100,30"
          stroke={config.mapType === 'roadmap' ? '#9ca3af' : 'rgba(255,255,255,0.6)'}
          strokeWidth="1"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M 0,75 L 100,70"
          stroke={config.mapType === 'roadmap' ? '#9ca3af' : 'rgba(255,255,255,0.6)'}
          strokeWidth="1"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      
      {/* 地标点 */}
      {landmarks.map((landmark, index) => (
        <div
          key={index}
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${landmark.x}%`,
            top: `${landmark.y}%`,
          }}
        >
          {landmark.type === 'center' ? (
            <div className="flex items-center justify-center">
              <MapPin 
                className={cn(
                  "w-6 h-6",
                  config.mapType === 'roadmap' ? 'text-red-500' : 'text-red-400'
                )} 
                fill="currentColor"
              />
            </div>
          ) : (
            <div 
              className={cn(
                "w-2 h-2 rounded-full",
                config.mapType === 'roadmap' ? 'bg-blue-500' : 'bg-yellow-400'
              )}
            />
          )}
          
          {/* 地标名称 - 只在高缩放级别显示 */}
          {config.zoom > 12 && (
            <div 
              className={cn(
                "absolute top-full left-1/2 transform -translate-x-1/2 mt-1",
                "px-1 py-0.5 rounded text-xs whitespace-nowrap",
                config.mapType === 'roadmap' 
                  ? 'bg-white text-gray-800 shadow-sm' 
                  : 'bg-black bg-opacity-60 text-white'
              )}
            >
              {landmark.name}
            </div>
          )}
        </div>
      ))}
      
      {/* 地图控件 */}
      {config.showControls && (
        <>
          {/* 缩放控制 */}
          {config.showZoomControl && (
            <div className="absolute top-4 left-4 flex flex-col bg-white rounded shadow-lg overflow-hidden">
              <button 
                className="p-2 hover:bg-gray-50 border-b"
                title="放大"
              >
                <ZoomIn className="w-4 h-4 text-gray-600" />
              </button>
              <button 
                className="p-2 hover:bg-gray-50"
                title="缩小"
              >
                <ZoomOut className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}
          
          {/* 导航控制 */}
          <div className="absolute top-4 right-4">
            <button 
              className="p-2 bg-white rounded shadow-lg hover:bg-gray-50"
              title="重新定位"
            >
              <Navigation className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          
          {/* 全屏控制 */}
          {config.showFullscreenControl && (
            <button 
              className="absolute bottom-4 right-4 p-2 bg-white rounded shadow-lg hover:bg-gray-50 text-xs"
              title="全屏"
            >
              ⛶
            </button>
          )}
        </>
      )}
      
      {/* 比例尺 */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 px-2 py-1 rounded text-xs">
        <div className="flex items-center gap-2">
          <div 
            className="border-b-2 border-l-2 border-r-2 border-gray-800 h-1"
            style={{ width: `${Math.max(20, config.zoom * 2)}px` }}
          />
          <span>{Math.round(1000 / config.zoom)}m</span>
        </div>
      </div>
      
      {/* 坐标信息 */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
        {config.center.lat.toFixed(4)}, {config.center.lng.toFixed(4)} | 缩放: {config.zoom}
      </div>
      
      {/* 地图类型标识 */}
      <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
        {config.mapType === 'roadmap' && '路线图'}
        {config.mapType === 'satellite' && '卫星图'}
        {config.mapType === 'hybrid' && '混合'}
        {config.mapType === 'terrain' && '地形'}
      </div>
    </div>
  )
}