'use client'

import React, { useRef, useEffect, useState } from 'react'
import { MapPin, Navigation, ZoomIn, ZoomOut, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ComponentLayout } from '@/types'

interface TileMapComponentProps {
  component: ComponentLayout
  width?: number
  height?: number
  className?: string
}

// 瓦片坐标转换工具函数
const deg2rad = (deg: number) => deg * (Math.PI / 180)
const rad2deg = (rad: number) => rad * (180 / Math.PI)

// 经纬度转瓦片坐标
const latLngToTile = (lat: number, lng: number, zoom: number) => {
  const x = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom))
  const y = Math.floor(
    ((1 - Math.asinh(Math.tan(deg2rad(lat))) / Math.PI) / 2) * Math.pow(2, zoom)
  )
  return { x, y }
}

// 瓦片坐标转经纬度
const tileToLatLng = (x: number, y: number, zoom: number) => {
  const lng = (x / Math.pow(2, zoom)) * 360 - 180
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, zoom)
  const lat = rad2deg(Math.atan(Math.sinh(n)))
  return { lat, lng }
}

// 瓦片组件
const TileImage: React.FC<{
  x: number
  y: number
  z: number
  tileUrl: string
  onLoad: () => void
  onError: () => void
}> = ({ x, y, z, tileUrl, onLoad, onError }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // 替换瓦片URL中的占位符
  const formatTileUrl = (url: string, x: number, y: number, z: number) => {
    return url
      .replace('{x}', x.toString())
      .replace('{y}', y.toString())
      .replace('{z}', z.toString())
      .replace('{s}', ['a', 'b', 'c'][Math.floor(Math.random() * 3)]) // 随机子域名
      .replace('{r}', window.devicePixelRatio > 1 ? '@2x' : '')
  }

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
    onLoad()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError()
  }

  const finalUrl = formatTileUrl(tileUrl, x, y, z)

  return (
    <div className="absolute w-64 h-64 bg-slate-100">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        </div>
      )}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400 text-xs">
          加载失败
        </div>
      )}
      <img
        src={finalUrl}
        alt={`Tile ${z}/${x}/${y}`}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "w-full h-full object-cover",
          isLoading && "opacity-0",
          hasError && "opacity-0"
        )}
        loading="lazy"
      />
    </div>
  )
}

export function TileMapComponent({ component, width, height, className }: TileMapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [lastMousePos, setLastMousePos] = useState<{ x: number; y: number } | null>(null)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 39.9042, lng: 116.4074 })
  const [mapZoom, setMapZoom] = useState(10)
  const [loadedTiles, setLoadedTiles] = useState<Set<string>>(new Set())

  const mapConfig = component.config?.map || {}
  
  // 默认配置
  const defaultConfig = {
    center: { lat: 39.9042, lng: 116.4074 },
    zoom: 10,
    tileProvider: 'openstreetmap',
    enableTileMap: true,
    showControls: true,
    showZoomControl: true
  }
  
  const config = { ...defaultConfig, ...mapConfig }

  // 瓦片URL映射
  const getTileUrl = (provider: string) => {
    const providers = {
      'openstreetmap': 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'cartodb': 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      'cartodb-dark': 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      'stamen-terrain': 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png',
      'stamen-watercolor': 'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg',
      'gaode': 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}'
    }
    return providers[provider as keyof typeof providers] || providers.openstreetmap
  }

  // 更新地图中心和缩放
  useEffect(() => {
    if (config.center) {
      setMapCenter(config.center)
    }
    if (config.zoom) {
      setMapZoom(config.zoom)
    }
  }, [config.center?.lat, config.center?.lng, config.zoom])

  // 计算需要显示的瓦片
  const getVisibleTiles = () => {
    if (!mapRef.current || !width || !height) return []

    const tileSize = 256
    const mapWidth = width
    const mapHeight = height
    
    // 计算中心瓦片
    const centerTile = latLngToTile(mapCenter.lat, mapCenter.lng, mapZoom)
    
    // 计算需要的瓦片范围
    const tilesX = Math.ceil(mapWidth / tileSize) + 2
    const tilesY = Math.ceil(mapHeight / tileSize) + 2
    
    const startX = centerTile.x - Math.floor(tilesX / 2)
    const startY = centerTile.y - Math.floor(tilesY / 2)
    
    const tiles = []
    for (let x = startX; x < startX + tilesX; x++) {
      for (let y = startY; y < startY + tilesY; y++) {
        if (x >= 0 && y >= 0 && x < Math.pow(2, mapZoom) && y < Math.pow(2, mapZoom)) {
          tiles.push({
            x,
            y,
            z: mapZoom,
            left: (x - centerTile.x) * tileSize + mapWidth / 2 - tileSize / 2,
            top: (y - centerTile.y) * tileSize + mapHeight / 2 - tileSize / 2
          })
        }
      }
    }
    
    return tiles
  }

  const visibleTiles = getVisibleTiles()
  const tileUrl = getTileUrl(config.tileProvider || 'openstreetmap')

  // 处理鼠标拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    if (config.gestureHandling === 'none') return
    
    setIsDragging(true)
    setLastMousePos({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !lastMousePos || !width || !height) return

    const deltaX = e.clientX - lastMousePos.x
    const deltaY = e.clientY - lastMousePos.y

    // 计算新的地图中心
    const pixelsPerDegree = (256 * Math.pow(2, mapZoom)) / 360
    const newLng = mapCenter.lng - deltaX / pixelsPerDegree
    const newLat = mapCenter.lat + deltaY / pixelsPerDegree

    // 限制纬度范围
    const clampedLat = Math.max(-85, Math.min(85, newLat))
    // 限制经度范围
    const clampedLng = ((newLng + 180) % 360) - 180

    setMapCenter({ lat: clampedLat, lng: clampedLng })
    setLastMousePos({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setLastMousePos(null)
  }

  // 处理滚轮缩放
  const handleWheel = (e: React.WheelEvent) => {
    if (config.gestureHandling === 'none') return
    if (config.gestureHandling === 'cooperative' && !e.ctrlKey) return
    
    e.preventDefault()
    const delta = e.deltaY > 0 ? -1 : 1
    handleZoom(delta)
  }

  // 处理缩放
  const handleZoom = (delta: number) => {
    const newZoom = Math.max(1, Math.min(18, mapZoom + delta))
    setMapZoom(newZoom)
  }

  const handleTileLoad = (tileKey: string) => {
    setLoadedTiles(prev => new Set(prev).add(tileKey))
  }

  const handleTileError = (tileKey: string) => {
    // 处理瓦片加载错误
    console.warn(`Failed to load tile: ${tileKey}`)
  }

  return (
    <div 
      ref={mapRef}
      className={cn("relative overflow-hidden bg-slate-100 w-full h-full", className)}
      style={{ 
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* 瓦片层 */}
      {visibleTiles.map(tile => {
        const tileKey = `${tile.z}/${tile.x}/${tile.y}`
        return (
          <div
            key={tileKey}
            style={{
              position: 'absolute',
              left: tile.left,
              top: tile.top,
              width: 256,
              height: 256
            }}
          >
            <TileImage
              x={tile.x}
              y={tile.y}
              z={tile.z}
              tileUrl={tileUrl}
              onLoad={() => handleTileLoad(tileKey)}
              onError={() => handleTileError(tileKey)}
            />
          </div>
        )
      })}

      {/* 中心标记 */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <MapPin className="w-6 h-6 text-red-500" fill="currentColor" />
      </div>

      {/* 地图控件 */}
      {config.showControls && (
        <>
          {/* 缩放控制 */}
          {config.showZoomControl && (
            <div className="absolute top-4 left-4 flex flex-col bg-white rounded shadow-lg overflow-hidden">
              <button 
                className="p-2 hover:bg-gray-50 border-b"
                onClick={() => handleZoom(1)}
                title="放大"
              >
                <ZoomIn className="w-4 h-4 text-gray-600" />
              </button>
              <button 
                className="p-2 hover:bg-gray-50"
                onClick={() => handleZoom(-1)}
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
              onClick={() => {
                setMapCenter(config.center)
                setMapZoom(config.zoom)
              }}
              title="重新定位"
            >
              <Navigation className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </>
      )}
      
      {/* 坐标信息 */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
        {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)} | 缩放: {mapZoom}
      </div>
      
      {/* 下半部内容区域 - 与容器边框对齐 */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-300">
        <div className="px-3 py-2 text-xs text-gray-700">
          {config.tileProvider === 'openstreetmap' && 'OpenStreetMap'}
          {config.tileProvider === 'cartodb' && 'CartoDB'}
          {config.tileProvider === 'cartodb-dark' && 'CartoDB Dark'}
          {config.tileProvider === 'stamen-terrain' && 'Stamen Terrain'}
          {config.tileProvider === 'stamen-watercolor' && 'Stamen Watercolor'}
          {config.tileProvider === 'gaode' && '高德地图'}
        </div>
      </div>

      {/* 加载状态 */}
      {visibleTiles.length > 0 && loadedTiles.size === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
          <div className="flex items-center gap-2 text-slate-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>加载地图中...</span>
          </div>
        </div>
      )}
    </div>
  )
}