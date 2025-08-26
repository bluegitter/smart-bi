'use client'

import React from 'react'
import { TrendingUp, TrendingDown, BarChart3, Loader2, RefreshCw, Database, Star, Zap, Target, Activity, Globe, Users, ShoppingCart, DollarSign, Calendar, Clock, Mail, Phone, MapPin, Settings, Home, Heart, Award, Bookmark, Camera, File, Folder, Image, Music, Play, Video, Wifi, Bluetooth, Battery, Volume2, PieChart, Hash, Type, Upload, X } from 'lucide-react'
import { useDatasetData } from '@/hooks/useDatasetData'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { ComponentLayout } from '@/types'

// 图标映射
const iconMap = {
  TrendingUp, TrendingDown, BarChart3, PieChart, Activity, Target, Database, DollarSign, 
  Users, ShoppingCart, Globe, Calendar, Clock, Mail, Phone, MapPin, 
  Star, Zap, Settings, Home, Heart, Award, Bookmark, Camera, File, 
  Folder, Image, Music, Play, Video, Wifi, Bluetooth, Battery, Volume2
}

// 渲染图标的函数
function renderIcon(iconName?: string, className?: string, style?: React.CSSProperties) {
  if (!iconName) return null
  const IconComponent = iconMap[iconName as keyof typeof iconMap]
  if (!IconComponent) return null
  return <IconComponent className={className} style={style} />
}


// 数据集折线图
export function DatasetLineChart({ 
  component,
  width = 300, 
  height = 200
}: { 
  component: ComponentLayout
  width?: number
  height?: number
}) {
  const { data, loading, error, refreshData } = useDatasetData({
    datasetId: component.dataConfig?.datasetId,
    selectedMeasures: component.dataConfig?.selectedMeasures || [],
    selectedDimensions: component.dataConfig?.selectedDimensions || [],
    filters: component.dataConfig?.filters || [],
    enabled: !!component.dataConfig?.datasetId
  })

  if (loading && data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-sm text-gray-500">加载数据中...</p>
        </div>
      </div>
    )
  }

  if (error && data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Database className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-red-500 mb-2">数据加载失败</p>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={refreshData}
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            重试
          </Button>
        </div>
      </div>
    )
  }

  const measures = component.dataConfig?.selectedMeasures || []
  const dimensions = component.dataConfig?.selectedDimensions || []
  
  // 获取字段的显示名称
  const getDisplayName = (fieldName: string) => {
    // 优先从组件配置中获取字段的显示名称
    const fieldDisplayNames = component.dataConfig?.fieldDisplayNames || {}
    if (fieldDisplayNames[fieldName]) {
      return fieldDisplayNames[fieldName]
    }
    // 如果数据中有对应的显示名称列，使用它
    const displayNameKey = `${fieldName}_displayName`
    if (data.length > 0 && data[0].hasOwnProperty(displayNameKey)) {
      return data[0][displayNameKey]
    }
    // 否则使用字段名
    return fieldName
  }
  
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Database className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">暂无数据</p>
        </div>
      </div>
    )
  }

  // 简化的折线图渲染
  const maxValue = Math.max(...data.map(item => {
    return Math.max(...measures.map(measure => Number(item[measure]) || 0))
  }))

  // 获取配色方案和背景设置
  const colors = component.config?.style?.colorScheme || ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
  const primaryColor = colors[0] || '#3b82f6'
  const secondaryColor = colors[1] || '#ef4444'
  const backgroundType = component.config?.lineChart?.backgroundType || 'default'
  
  // 动态样式计算
  const getBackgroundStyles = () => {
    switch (backgroundType) {
      case 'solid':
        return {
          background: primaryColor,
          color: 'white'
        }
      case 'gradient':
        return {
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          color: 'white'
        }
      default:
        return {
          background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}05)`,
          borderColor: primaryColor,
          borderWidth: '1px',
          borderStyle: 'solid'
        }
    }
  }
  
  const backgroundStyles = getBackgroundStyles()
  const isDarkBackground = backgroundType === 'solid' || backgroundType === 'gradient'
  const textColor = isDarkBackground ? 'text-white' : 'text-gray-600'
  
  // 获取图表配置
  const chartConfig = component.config?.chart || {}
  const showGrid = chartConfig.showGrid !== false
  const showPoints = chartConfig.showPoints !== false
  const showArea = chartConfig.showArea || false
  const smooth = chartConfig.smooth || false
  const showLegend = chartConfig.showLegend !== false
  const maxRows = chartConfig.maxRows || 100
  const labelRotation = chartConfig.labelRotation || 'horizontal'
  const valueRotation = chartConfig.valueRotation || 'horizontal'
  
  // 限制显示的数据行数
  const displayData = data.slice(0, maxRows)

  return (
    <div 
      className="w-full h-full p-4 transition-all duration-200 rounded-b-lg"
      style={{
        ...backgroundStyles,
        opacity: component.config?.style?.opacity ?? 1
      }}
    >
      <svg width={width - 40} height={height - 40} className="overflow-visible">
        {/* 网格线 */}
        {showGrid && (
          <g>
            {/* 绘制水平网格线 */}
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
              const y = height - 60 - ratio * (height - 100)
              return (
                <line
                  key={`h-${ratio}`}
                  x1={40}
                  y1={y}
                  x2={width - 40}
                  y2={y}
                  stroke={isDarkBackground ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"}
                  strokeWidth="1"
                />
              )
            })}
            {/* 绘制垂直网格线 */}
            {displayData.map((_, index) => {
              const x = (index / (displayData.length - 1)) * (width - 80) + 40
              return (
                <line
                  key={`v-${index}`}
                  x1={x}
                  y1={height - 60}
                  x2={x}
                  y2={60}
                  stroke={isDarkBackground ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"}
                  strokeWidth="1"
                />
              )
            })}
          </g>
        )}
        {/* 绘制简单的折线 */}
        {measures.map((measure, measureIndex) => {
          const points = displayData.map((item, index) => {
            const x = (index / (displayData.length - 1)) * (width - 80) + 40
            const y = height - 60 - ((Number(item[measure]) || 0) / maxValue) * (height - 100)
            return `${x},${y}`
          }).join(' ')

          const color = component.config?.style?.colorScheme?.[measureIndex] || '#3b82f6'
          
          return (
            <g key={measure}>
              {/* 面积填充 */}
              {showArea && (
                <polygon
                  points={`40,${height - 60} ${points} ${width - 40},${height - 60}`}
                  fill={`${color}20`}
                  stroke="none"
                />
              )}
              {/* 折线 */}
              <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* 数据点 */}
              {showPoints && displayData.map((item, index) => {
                const x = (index / (displayData.length - 1)) * (width - 80) + 40
                const y = height - 60 - ((Number(item[measure]) || 0) / maxValue) * (height - 100)
                const value = Number(item[measure]) || 0
                
                // 根据valueRotation配置设置数值文字属性
                const getValueTextProps = () => {
                  switch (valueRotation) {
                    case 'vertical':
                      return {
                        x: x - 15,
                        y: y,
                        textAnchor: "middle" as const,
                        transform: `rotate(-90 ${x - 15} ${y})`,
                        dominantBaseline: "middle" as const
                      }
                    case 'diagonal':
                      return {
                        x: x + 8,
                        y: y - 8,
                        textAnchor: "start" as const,
                        transform: `rotate(-45 ${x + 8} ${y - 8})`,
                        dominantBaseline: "middle" as const
                      }
                    default: // horizontal
                      return {
                        x: x,
                        y: y - 8,
                        textAnchor: "middle" as const,
                        dominantBaseline: "middle" as const
                      }
                  }
                }
                
                const valueTextProps = getValueTextProps()
                
                return (
                  <g key={index}>
                    <circle
                      cx={x}
                      cy={y}
                      r="3"
                      fill={color}
                      stroke="white"
                      strokeWidth="1"
                    />
                    {/* 显示数值 */}
                    <text
                      x={valueTextProps.x}
                      y={valueTextProps.y}
                      textAnchor={valueTextProps.textAnchor}
                      dominantBaseline={valueTextProps.dominantBaseline}
                      transform={valueTextProps.transform}
                      className={`text-xs font-medium ${isDarkBackground ? 'fill-white/90' : 'fill-gray-700'}`}
                    >
                      {value.toLocaleString()}
                    </text>
                  </g>
                )
              })}
            </g>
          )
        })}
        
        {/* X轴标签 */}
        {displayData.map((item, index) => {
          const x = (index / (displayData.length - 1)) * (width - 80) + 40
          const label = dimensions.length > 0 ? String(item[dimensions[0]]) : `${index + 1}`
          
          // 根据labelRotation配置设置文字属性
          const getTextProps = () => {
            switch (labelRotation) {
              case 'vertical':
                return {
                  x: x,
                  y: height - 25,
                  textAnchor: "middle" as const,
                  transform: `rotate(-90 ${x} ${height - 25})`,
                  maxLength: 8
                }
              case 'diagonal':
                return {
                  x: x,
                  y: height - 15,
                  textAnchor: "start" as const,
                  transform: `rotate(-45 ${x} ${height - 15})`,
                  maxLength: 10
                }
              default: // horizontal
                return {
                  x: x,
                  y: height - 20,
                  textAnchor: "middle" as const,
                  maxLength: 8
                }
            }
          }
          
          const textProps = getTextProps()
          return (
            <text
              key={index}
              x={textProps.x}
              y={textProps.y}
              textAnchor={textProps.textAnchor}
              transform={textProps.transform}
              className={`text-xs ${isDarkBackground ? 'fill-white/80' : 'fill-gray-600'}`}
            >
              {label.length > textProps.maxLength ? label.substring(0, textProps.maxLength) + '...' : label}
            </text>
          )
        })}
      </svg>
      
      {/* 图例 */}
      {showLegend && measures.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {measures.map((measure, index) => (
            <div key={measure} className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: component.config?.style?.colorScheme?.[index] || '#3b82f6' }}
              />
              <span className={`text-xs ${textColor}`}>{getDisplayName(measure)}</span>
            </div>
          ))}
        </div>
      )}
      
    </div>
  )
}

// 数据集柱状图
export function DatasetBarChart({ 
  component,
  width = 300, 
  height = 200
}: { 
  component: ComponentLayout
  width?: number
  height?: number
}) {
  const { data, loading, error, refreshData } = useDatasetData({
    datasetId: component.dataConfig?.datasetId,
    selectedMeasures: component.dataConfig?.selectedMeasures || [],
    selectedDimensions: component.dataConfig?.selectedDimensions || [],
    filters: component.dataConfig?.filters || [],
    enabled: !!component.dataConfig?.datasetId
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-green-500" />
          <p className="text-sm text-gray-500">加载数据中...</p>
        </div>
      </div>
    )
  }

  if (error || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Database className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500 mb-2">
            {error ? '数据加载失败' : '暂无数据'}
          </p>
          {error && (
            <Button size="sm" variant="outline" onClick={refreshData} className="text-xs">
              <RefreshCw className="h-3 w-3 mr-1" />
              重试
            </Button>
          )}
        </div>
      </div>
    )
  }

  const measures = component.dataConfig?.selectedMeasures || []
  const dimensions = component.dataConfig?.selectedDimensions || []
  
  // 获取字段的显示名称
  const getDisplayName = (fieldName: string) => {
    const fieldDisplayNames = component.dataConfig?.fieldDisplayNames || {}
    if (fieldDisplayNames[fieldName]) {
      return fieldDisplayNames[fieldName]
    }
    const displayNameKey = `${fieldName}_displayName`
    if (data.length > 0 && data[0].hasOwnProperty(displayNameKey)) {
      return data[0][displayNameKey]
    }
    return fieldName
  }
  
  // 获取图表配置
  const chartConfig = component.config?.chart || {}
  const showValues = chartConfig.showValues || false
  const showLegend = chartConfig.showLegend !== false
  const barStyle = chartConfig.barStyle || 'rounded'
  const orientation = chartConfig.orientation || 'vertical'
  const maxRows = chartConfig.maxRows || 100
  const labelRotation = chartConfig.labelRotation || 'horizontal'
  const valueRotation = chartConfig.valueRotation || 'horizontal'
  
  // 限制显示的数据行数
  const displayData = data.slice(0, maxRows)
  
  const maxValue = Math.max(...data.map(item => {
    return Math.max(...measures.map(measure => Number(item[measure]) || 0))
  }))

  const barWidth = Math.max(20, (width - 80) / displayData.length - 10)

  // 获取配色方案和背景设置
  const colors = component.config?.style?.colorScheme || ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
  const primaryColor = colors[0] || '#3b82f6'
  const secondaryColor = colors[1] || '#ef4444'
  const backgroundType = component.config?.barChart?.backgroundType || 'default'
  
  // 动态样式计算
  const getBackgroundStyles = () => {
    switch (backgroundType) {
      case 'solid':
        return {
          background: primaryColor,
          color: 'white'
        }
      case 'gradient':
        return {
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          color: 'white'
        }
      default:
        return {
          background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}05)`,
          borderColor: primaryColor,
          borderWidth: '1px',
          borderStyle: 'solid'
        }
    }
  }
  
  const backgroundStyles = getBackgroundStyles()
  const isDarkBackground = backgroundType === 'solid' || backgroundType === 'gradient'
  const textColor = isDarkBackground ? 'text-white' : 'text-gray-600'

  return (
    <div 
      className="w-full h-full p-4 transition-all duration-200 rounded-b-lg"
      style={{
        ...backgroundStyles,
        opacity: component.config?.style?.opacity ?? 1
      }}
    >
      <svg width={width - 40} height={height - 40} className="overflow-visible">
        {/* 绘制柱状图 */}
        {displayData.map((item, dataIndex) => {
          return measures.map((measure, measureIndex) => {
            const value = Number(item[measure]) || 0
            const color = component.config?.style?.colorScheme?.[measureIndex] || '#10b981'
            
            if (orientation === 'horizontal') {
              // 水平柱状图
              const y = dataIndex * ((height - 80) / displayData.length) + 40 + measureIndex * (barWidth / measures.length)
              const barLength = (value / maxValue) * (width - 100)
              const x = 40
              
              return (
                <g key={`${dataIndex}-${measureIndex}`}>
                  <rect
                    x={x}
                    y={y}
                    width={barLength}
                    height={barWidth / measures.length}
                    fill={color}
                    rx={barStyle === 'rounded' ? 4 : 0}
                    ry={barStyle === 'rounded' ? 4 : 0}
                    className="hover:opacity-80"
                  />
                  {/* 显示数值 */}
                  {showValues && (() => {
                    // 根据valueRotation配置设置数值文字属性 - 水平柱状图
                    const getValueTextProps = () => {
                      const baseX = x + barLength + 5
                      const baseY = y + (barWidth / measures.length) / 2 + 3
                      
                      switch (valueRotation) {
                        case 'vertical':
                          return {
                            x: baseX,
                            y: baseY,
                            textAnchor: "middle" as const,
                            transform: `rotate(-90 ${baseX} ${baseY})`
                          }
                        case 'diagonal':
                          return {
                            x: baseX,
                            y: baseY,
                            textAnchor: "start" as const,
                            transform: `rotate(-45 ${baseX} ${baseY})`
                          }
                        default: // horizontal
                          return {
                            x: baseX,
                            y: baseY,
                            textAnchor: "start" as const
                          }
                      }
                    }
                    
                    const valueTextProps = getValueTextProps()
                    
                    return (
                      <text
                        x={valueTextProps.x}
                        y={valueTextProps.y}
                        textAnchor={valueTextProps.textAnchor}
                        transform={valueTextProps.transform}
                        className={`text-xs font-medium ${isDarkBackground ? 'fill-white/90' : 'fill-gray-700'}`}
                        fontSize="10"
                      >
                        {value.toLocaleString()}
                      </text>
                    )
                  })()}
                </g>
              )
            } else {
              // 垂直柱状图
              const x = dataIndex * ((width - 80) / displayData.length) + 40 + measureIndex * (barWidth / measures.length)
              const barHeight = (value / maxValue) * (height - 100)
              const y = height - 60 - barHeight
              
              return (
                <g key={`${dataIndex}-${measureIndex}`}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth / measures.length}
                    height={barHeight}
                    fill={color}
                    rx={barStyle === 'rounded' ? 4 : 0}
                    ry={barStyle === 'rounded' ? 4 : 0}
                    className="hover:opacity-80"
                  />
                  {/* 显示数值 */}
                  {showValues && (() => {
                    // 根据valueRotation配置设置数值文字属性 - 垂直柱状图
                    const getValueTextProps = () => {
                      const baseX = x + (barWidth / measures.length) / 2
                      const baseY = y - 5
                      
                      switch (valueRotation) {
                        case 'vertical':
                          return {
                            x: baseX - 15,
                            y: baseY + 5,
                            textAnchor: "middle" as const,
                            transform: `rotate(-90 ${baseX - 15} ${baseY + 5})`
                          }
                        case 'diagonal':
                          return {
                            x: baseX + 8,
                            y: baseY,
                            textAnchor: "start" as const,
                            transform: `rotate(-45 ${baseX + 8} ${baseY})`
                          }
                        default: // horizontal
                          return {
                            x: baseX,
                            y: baseY,
                            textAnchor: "middle" as const
                          }
                      }
                    }
                    
                    const valueTextProps = getValueTextProps()
                    
                    return (
                      <text
                        x={valueTextProps.x}
                        y={valueTextProps.y}
                        textAnchor={valueTextProps.textAnchor}
                        transform={valueTextProps.transform}
                        className={`text-xs font-medium ${isDarkBackground ? 'fill-white/90' : 'fill-gray-700'}`}
                        fontSize="10"
                      >
                        {value.toLocaleString()}
                      </text>
                    )
                  })()}
                </g>
              )
            }
          })
        })}
        
        {/* 轴标签 */}
        {displayData.map((item, index) => {
          const label = dimensions.length > 0 ? String(item[dimensions[0]]) : `${index + 1}`
          
          if (orientation === 'horizontal') {
            // 水平柱状图 - Y轴标签
            const y = index * ((height - 80) / displayData.length) + 40 + barWidth / 2
            return (
              <text
                key={index}
                x={35}
                y={y + 3}
                textAnchor="end"
                className={`text-xs ${isDarkBackground ? 'fill-white/80' : 'fill-gray-600'}`}
              >
                {label.length > 8 ? label.substring(0, 8) + '...' : label}
              </text>
            )
          } else {
            // 垂直柱状图 - X轴标签
            const x = index * ((width - 80) / displayData.length) + 40 + barWidth / 2
            
            // 根据labelRotation配置设置文字属性
            const getTextProps = () => {
              switch (labelRotation) {
                case 'vertical':
                  return {
                    x: x,
                    y: height - 25,
                    textAnchor: "middle" as const,
                    transform: `rotate(-90 ${x} ${height - 25})`,
                    maxLength: 8
                  }
                case 'diagonal':
                  return {
                    x: x,
                    y: height - 15,
                    textAnchor: "start" as const,
                    transform: `rotate(-45 ${x} ${height - 15})`,
                    maxLength: 10
                  }
                default: // horizontal
                  return {
                    x: x,
                    y: height - 20,
                    textAnchor: "middle" as const,
                    maxLength: 6
                  }
              }
            }
            
            const textProps = getTextProps()
            return (
              <text
                key={index}
                x={textProps.x}
                y={textProps.y}
                textAnchor={textProps.textAnchor}
                transform={textProps.transform}
                className={`text-xs ${isDarkBackground ? 'fill-white/80' : 'fill-gray-600'}`}
              >
                {label.length > textProps.maxLength ? label.substring(0, textProps.maxLength) + '...' : label}
              </text>
            )
          }
        })}
      </svg>
      
      {/* 图例 */}
      {showLegend && measures.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {measures.map((measure, index) => (
            <div key={measure} className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: component.config?.style?.colorScheme?.[index] || '#10b981' }}
              />
              <span className={`text-xs ${textColor}`}>{getDisplayName(measure)}</span>
            </div>
          ))}
        </div>
      )}
      
    </div>
  )
}

// 数据集KPI卡片
export function DatasetKPICard({ 
  component
}: { 
  component: ComponentLayout
}) {
  const { data, loading, error, refreshData } = useDatasetData({
    datasetId: component.dataConfig?.datasetId,
    selectedMeasures: component.dataConfig?.selectedMeasures || [],
    selectedDimensions: component.dataConfig?.selectedDimensions || [],
    filters: component.dataConfig?.filters || [],
    enabled: !!component.dataConfig?.datasetId
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
      </div>
    )
  }

  if (error || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <Database className="h-8 w-8 mb-2 text-gray-400" />
        <p className="text-sm text-gray-500 text-center mb-2">
          {error ? '数据获取失败' : '暂无数据'}
        </p>
        {error && (
          <Button size="sm" variant="ghost" onClick={refreshData} className="text-xs">
            <RefreshCw className="h-3 w-3 mr-1" />
            重试
          </Button>
        )}
      </div>
    )
  }

  const measures = component.dataConfig?.selectedMeasures || []
  
  // 获取字段的显示名称
  const getDisplayName = (fieldName: string) => {
    const fieldDisplayNames = component.dataConfig?.fieldDisplayNames || {}
    if (fieldDisplayNames[fieldName]) {
      return fieldDisplayNames[fieldName]
    }
    const displayNameKey = `${fieldName}_displayName`
    if (data.length > 0 && data[0].hasOwnProperty(displayNameKey)) {
      return data[0][displayNameKey]
    }
    return fieldName
  }
  
  if (measures.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-gray-500">请添加度量指标</p>
      </div>
    )
  }

  // 计算主要指标值（使用第一个度量的总和或平均值）
  const primaryMeasure = measures[0]
  const totalValue = data.reduce((sum, item) => sum + (Number(item[primaryMeasure]) || 0), 0)
  const avgValue = totalValue / data.length
  
  // 获取指标单位
  const getFieldUnit = (fieldName: string) => {
    // 优先从KPI配置中获取单位（用户手动设置的单位）
    if (component.config?.kpi?.unit) {
      return component.config.kpi.unit
    }
    
    // 从数据集字段配置中获取单位（次优先）
    const fieldConfig = component.dataConfig?.selectedMeasures?.find(measure => measure === fieldName)
    if (fieldConfig && component.dataConfig?.fieldUnits?.[fieldName]) {
      const unit = component.dataConfig.fieldUnits[fieldName]
      return unit
    }
    
    // 从组件配置中获取单位（备用，兼容旧版本）
    const fieldUnits = (component.config as any)?.kpi?.fieldUnits || {}
    if (fieldUnits[fieldName]) {
      const unit = fieldUnits[fieldName]
      return unit
    }
    
    // 从数据中获取单位字段（如果有）
    const unitKey = `${fieldName}_unit`
    if (data.length > 0 && data[0].hasOwnProperty(unitKey)) {
      const unit = data[0][unitKey]
      return unit
    }
    
    return '' // 如果没有设置单位就不显示
  }
  
  const primaryUnit = getFieldUnit(primaryMeasure)

  // 模拟趋势（简单比较前后期数据）
  const trend = data.length > 1 ? 
    (Number(data[data.length - 1][primaryMeasure]) || 0) - (Number(data[0][primaryMeasure]) || 0) : 0

  // 获取配色方案
  const colors = component.config?.style?.colorScheme || ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
  const primaryColor = colors[0] || '#3b82f6'
  const secondaryColor = colors[1] || '#ef4444'


  // 获取背景样式设置
  const backgroundType = component.config?.kpi?.backgroundType || 'default'
  
  // 动态样式计算
  const getCardStyles = () => {
    const backgroundImage = component.config?.kpi?.backgroundImage
    const backgroundSize = component.config?.kpi?.backgroundSize || 'contain'
    const backgroundPosition = component.config?.kpi?.backgroundPosition || 'right'
    const backgroundRepeat = component.config?.kpi?.backgroundRepeat || 'no-repeat'
    const backgroundScale = component.config?.kpi?.backgroundScale || 1
    const backgroundOpacity = component.config?.kpi?.backgroundOpacity || 1
    
    const baseStyles: React.CSSProperties = {}
    
    // 如果有背景图片，设置背景图片相关样式
    if (backgroundImage) {
      baseStyles.backgroundImage = `url(${backgroundImage})`
      baseStyles.backgroundPosition = backgroundPosition
      baseStyles.backgroundRepeat = backgroundRepeat
      baseStyles.position = 'relative'
      
      // 根据缩放比例调整背景大小
      if (backgroundSize === 'auto') {
        // 当设置为原始大小时，直接应用缩放百分比
        baseStyles.backgroundSize = `${backgroundScale * 100}% auto`
      } else if (backgroundSize === 'contain') {
        // contain模式下考虑缩放
        if (backgroundScale === 1) {
          baseStyles.backgroundSize = 'contain'
        } else {
          // 通过计算实际尺寸来实现缩放
          baseStyles.backgroundSize = `${backgroundScale * 100}% auto`
        }
      } else if (backgroundSize === 'cover') {
        // cover模式保持原样，缩放通过百分比实现
        baseStyles.backgroundSize = backgroundScale === 1 ? 'cover' : `${backgroundScale * 100}% auto`
      } else {
        // 强制拉伸等其他情况
        baseStyles.backgroundSize = backgroundSize
      }
      
      // 如果有透明度覆盖层，添加伪元素效果（通过内部div实现）
      if (backgroundOpacity < 1) {
        baseStyles.backgroundBlendMode = 'multiply'
      }
    }
    
    switch (backgroundType) {
      case 'solid':
        return {
          ...baseStyles,
          backgroundColor: backgroundImage ? 'transparent' : primaryColor,
          color: 'white'
        }
      case 'gradient':
        return {
          ...baseStyles,
          backgroundColor: backgroundImage ? 'transparent' : undefined,
          background: backgroundImage ? baseStyles.backgroundImage : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          color: 'white'
        }
      case 'image':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: 'white'
        }
      default:
        return {
          ...baseStyles,
          backgroundColor: backgroundImage ? 'transparent' : `rgba(${parseInt(primaryColor.slice(1,3), 16)}, ${parseInt(primaryColor.slice(3,5), 16)}, ${parseInt(primaryColor.slice(5,7), 16)}, 0.1)`,
          borderColor: primaryColor,
          borderWidth: '1px',
          borderStyle: 'solid'
        }
    }
  }
  
  const cardStyles = getCardStyles()
  const backgroundImage = component.config?.kpi?.backgroundImage
  const isDarkBackground = backgroundType === 'solid' || backgroundType === 'gradient'
  const textColor = isDarkBackground ? 'text-white' : 'text-gray-900'
  const subtextColor = isDarkBackground ? 'text-white/80' : 'text-gray-600'

  // 获取内容区图标设置
  const contentIcon = component.config?.kpi?.contentIcon
  const contentIconPosition = component.config?.kpi?.contentIconPosition || 'left'
  const contentIconSize = component.config?.kpi?.contentIconSize || 'medium'
  
  // 根据大小设置图标尺寸
  const getIconSizeClass = (size: string) => {
    switch (size) {
      case 'small': return 'h-6 w-6'
      case 'large': return 'h-12 w-12'
      default: return 'h-8 w-8'
    }
  }

  const iconSizeClass = getIconSizeClass(contentIconSize)
  const iconColorClass = isDarkBackground ? 'text-white/70' : ''

  // 根据图标位置决定布局
  const getLayoutClasses = () => {
    if (!contentIcon) return "flex flex-col h-full justify-center"
    
    switch (contentIconPosition) {
      case 'top':
        return "flex flex-col h-full justify-center items-center text-center"
      case 'right':
        return "flex flex-row h-full justify-between items-center"
      case 'left':
      default:
        return "flex flex-row h-full justify-start items-center gap-4"
    }
  }

  const backgroundOverlay = component.config?.kpi?.backgroundOverlay
  const overlayOpacity = component.config?.kpi?.overlayOpacity || 0.5

  return (
    <div 
      className="w-full h-full p-4 transition-all duration-200 rounded-b-lg relative overflow-hidden"
      style={{
        ...cardStyles,
        opacity: component.config?.style?.opacity ?? 1
      }}
    >
      {/* 背景图片覆盖层 */}
      {backgroundImage && backgroundOverlay && (
        <div 
          className="absolute inset-0 rounded-b-lg"
          style={{
            backgroundColor: backgroundOverlay === 'dark' ? 'rgba(0,0,0,' + overlayOpacity + ')' : 'rgba(255,255,255,' + overlayOpacity + ')',
            pointerEvents: 'none'
          }}
        />
      )}
      
      <div className={cn(getLayoutClasses(), "relative z-10")}>
        {/* 左侧或顶部图标 */}
        {contentIcon && (contentIconPosition === 'left' || contentIconPosition === 'top') && (
          <div className={cn(
            "flex items-center justify-center shrink-0",
            contentIconPosition === 'top' ? "mb-2" : ""
          )}>
            {renderIcon(contentIcon, cn(iconSizeClass, iconColorClass), isDarkBackground ? undefined : { color: primaryColor })}
          </div>
        )}

        {/* 主要内容区域 */}
        <div className={cn(
          "flex flex-col justify-center",
          contentIconPosition === 'top' ? "items-center text-center" : "flex-1 min-w-0"
        )}>
          <div className={cn(
            "font-bold mb-1",
            contentIcon && contentIconPosition !== 'top' ? "text-xl" : "text-2xl",
            textColor
          )}>
            {totalValue.toLocaleString()}{primaryUnit && ` ${primaryUnit}`}
          </div>
          <div className={cn(
            "text-xs mb-3",
            subtextColor
          )}>
            平均: {avgValue.toFixed(1)}{primaryUnit && ` ${primaryUnit}`}
          </div>
          <div className="flex items-center gap-1">
            {trend > 0 ? (
              <TrendingUp className={`h-4 w-4 ${isDarkBackground ? 'text-green-300' : 'text-green-500'}`} />
            ) : trend < 0 ? (
              <TrendingDown className={`h-4 w-4 ${isDarkBackground ? 'text-red-300' : 'text-red-500'}`} />
            ) : (
              <BarChart3 className={`h-4 w-4 ${isDarkBackground ? 'text-white/60' : 'text-gray-400'}`} />
            )}
            <span className={cn(
              "text-sm font-medium",
              trend > 0 
                ? (isDarkBackground ? "text-green-300" : "text-green-600")
                : trend < 0 
                ? (isDarkBackground ? "text-red-300" : "text-red-600") 
                : subtextColor
            )}>
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}{primaryUnit && ` ${primaryUnit}`}
            </span>
          </div>
        </div>

        {/* 右侧图标 */}
        {contentIcon && contentIconPosition === 'right' && (
          <div className="flex items-center justify-center shrink-0">
            {renderIcon(contentIcon, cn(iconSizeClass, iconColorClass), isDarkBackground ? undefined : { color: primaryColor })}
          </div>
        )}
      </div>
    </div>
  )
}

// 数据集饼图
export function DatasetPieChart({ 
  component,
  width = 300, 
  height = 200
}: { 
  component: ComponentLayout
  width?: number
  height?: number
}) {
  const { data, loading, error, refreshData } = useDatasetData({
    datasetId: component.dataConfig?.datasetId,
    selectedMeasures: component.dataConfig?.selectedMeasures || [],
    selectedDimensions: component.dataConfig?.selectedDimensions || [],
    filters: component.dataConfig?.filters || [],
    enabled: !!component.dataConfig?.datasetId
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-orange-500" />
          <p className="text-sm text-gray-500">加载数据中...</p>
        </div>
      </div>
    )
  }

  if (error || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Database className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500 mb-2">
            {error ? '数据加载失败' : '暂无数据'}
          </p>
          {error && (
            <Button size="sm" variant="outline" onClick={refreshData} className="text-xs">
              <RefreshCw className="h-3 w-3 mr-1" />
              重试
            </Button>
          )}
        </div>
      </div>
    )
  }

  const measures = component.dataConfig?.selectedMeasures || []
  const dimensions = component.dataConfig?.selectedDimensions || []
  
  // 获取字段的显示名称
  const getDisplayName = (fieldName: string) => {
    const fieldDisplayNames = component.dataConfig?.fieldDisplayNames || {}
    if (fieldDisplayNames[fieldName]) {
      return fieldDisplayNames[fieldName]
    }
    const displayNameKey = `${fieldName}_displayName`
    if (data.length > 0 && data[0].hasOwnProperty(displayNameKey)) {
      return data[0][displayNameKey]
    }
    return fieldName
  }
  
  if (measures.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-gray-500">请添加度量指标</p>
      </div>
    )
  }

  // 计算饼图数据
  const primaryMeasure = measures[0]
  const total = data.reduce((sum, item) => sum + (Number(item[primaryMeasure]) || 0), 0)
  
  let currentAngle = 0
  const outerRadius = Math.min(width, height) / 2 - 40
  const innerRadiusActual = (outerRadius * innerRadius) / 100
  const centerX = width / 2
  const centerY = height / 2

  // 获取配色方案和背景设置
  const colors = component.config?.style?.colorScheme || ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
  const primaryColor = colors[0] || '#3b82f6'
  const secondaryColor = colors[1] || '#ef4444'
  const backgroundType = component.config?.pieChart?.backgroundType || 'default'
  
  // 动态样式计算
  const getBackgroundStyles = () => {
    switch (backgroundType) {
      case 'solid':
        return {
          background: primaryColor,
          color: 'white'
        }
      case 'gradient':
        return {
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          color: 'white'
        }
      default:
        return {
          background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}05)`,
          borderColor: primaryColor,
          borderWidth: '1px',
          borderStyle: 'solid'
        }
    }
  }
  
  const backgroundStyles = getBackgroundStyles()
  const isDarkBackground = backgroundType === 'solid' || backgroundType === 'gradient'
  const textColor = isDarkBackground ? 'text-white' : 'text-gray-600'
  
  // 获取图表配置
  const chartConfig = component.config?.chart || {}
  const showLabels = chartConfig.showLabels !== false
  const showLegend = chartConfig.showLegend !== false
  const showPercentage = chartConfig.showPercentage !== false
  const innerRadius = chartConfig.innerRadius || 0

  return (
    <div 
      className="w-full h-full p-4 transition-all duration-200 rounded-b-lg"
      style={{
        ...backgroundStyles,
        opacity: component.config?.style?.opacity ?? 1
      }}
    >
      <svg width={width - 40} height={height - 40}>
        {data.map((item, index) => {
          const value = Number(item[primaryMeasure]) || 0
          const percentage = (value / total) * 100
          const angle = (value / total) * 2 * Math.PI
          
          const startOuterX = centerX + outerRadius * Math.cos(currentAngle)
          const startOuterY = centerY + outerRadius * Math.sin(currentAngle)
          const startInnerX = centerX + innerRadiusActual * Math.cos(currentAngle)
          const startInnerY = centerY + innerRadiusActual * Math.sin(currentAngle)
          
          currentAngle += angle
          
          const endOuterX = centerX + outerRadius * Math.cos(currentAngle)
          const endOuterY = centerY + outerRadius * Math.sin(currentAngle)
          const endInnerX = centerX + innerRadiusActual * Math.cos(currentAngle)
          const endInnerY = centerY + innerRadiusActual * Math.sin(currentAngle)
          
          const largeArcFlag = angle > Math.PI ? 1 : 0
          
          const pathData = innerRadiusActual > 0 ? [
            // 甜甜圈路径
            `M ${startInnerX} ${startInnerY}`,
            `L ${startOuterX} ${startOuterY}`,
            `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuterX} ${endOuterY}`,
            `L ${endInnerX} ${endInnerY}`,
            `A ${innerRadiusActual} ${innerRadiusActual} 0 ${largeArcFlag} 0 ${startInnerX} ${startInnerY}`,
            'Z'
          ].join(' ') : [
            // 传统饼图路径
            `M ${centerX} ${centerY}`,
            `L ${startOuterX} ${startOuterY}`,
            `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuterX} ${endOuterY}`,
            'Z'
          ].join(' ')
          
          // 计算标签位置（中间半径处）
          const labelRadius = (outerRadius + innerRadiusActual) / 2
          const labelAngle = currentAngle - angle / 2
          const labelX = centerX + labelRadius * Math.cos(labelAngle)
          const labelY = centerY + labelRadius * Math.sin(labelAngle)

          const color = component.config?.style?.colorScheme?.[index % (component.config?.style?.colorScheme?.length || 1)] || '#3b82f6'
          
          return (
            <g key={index}>
              <path
                d={pathData}
                fill={color}
                className="hover:opacity-80"
              />
              {/* 显示标签 */}
              {showLabels && percentage > 2 && (
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={`text-xs ${isDarkBackground ? 'fill-white' : 'fill-gray-800'}`}
                  fontSize="10"
                  fontWeight="500"
                >
                  {showPercentage ? `${percentage.toFixed(1)}%` : value.toLocaleString()}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      
      {/* 图例 */}
      {showLegend && (
        <div className="flex flex-wrap gap-2 mt-2">
          {data.map((item, index) => {
            const label = dimensions.length > 0 ? String(item[dimensions[0]]) : `项目${index + 1}`
            const value = Number(item[primaryMeasure]) || 0
            const percentage = ((value / total) * 100).toFixed(1)
            const color = component.config?.style?.colorScheme?.[index % (component.config?.style?.colorScheme?.length || 1)] || '#3b82f6'
            
            return (
              <div key={index} className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className={textColor}>
                  {label} {showPercentage ? `(${percentage}%)` : `(${value.toLocaleString()})`}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// 数据集数据表组件
export function DatasetTable({ 
  component
}: { 
  component: ComponentLayout
}) {
  const { data, loading, error, refreshData } = useDatasetData({
    datasetId: component.dataConfig?.datasetId,
    selectedMeasures: component.dataConfig?.selectedMeasures || [],
    selectedDimensions: component.dataConfig?.selectedDimensions || [],
    filters: component.dataConfig?.filters || [],
    enabled: !!component.dataConfig?.datasetId
  })

  if (loading && data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-sm text-gray-500">加载数据中...</p>
        </div>
      </div>
    )
  }

  if (error && data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Database className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-red-500 mb-2">数据加载失败</p>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={refreshData}
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            重试
          </Button>
        </div>
      </div>
    )
  }

  const measures = component.dataConfig?.selectedMeasures || []
  const dimensions = component.dataConfig?.selectedDimensions || []
  
  // 获取字段的显示名称
  const getDisplayName = (fieldName: string) => {
    const fieldDisplayNames = component.dataConfig?.fieldDisplayNames || {}
    if (fieldDisplayNames[fieldName]) {
      return fieldDisplayNames[fieldName]
    }
    const displayNameKey = `${fieldName}_displayName`
    if (data.length > 0 && data[0].hasOwnProperty(displayNameKey)) {
      return data[0][displayNameKey]
    }
    return fieldName
  }
  
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Database className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">暂无数据</p>
        </div>
      </div>
    )
  }

  // 合并所有字段作为表格列
  const allFields = [...dimensions, ...measures]
  
  if (allFields.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Database className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">请添加维度或度量字段</p>
        </div>
      </div>
    )
  }

  // 获取配色方案
  const colors = component.config?.style?.colorScheme || ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
  const primaryColor = colors[0] || '#3b82f6'
  
  // 获取表格配置
  const tableConfig = component.config?.table || {}
  const showHeader = tableConfig.showHeader !== false
  const showBorder = tableConfig.showBorder !== false
  const striped = tableConfig.striped !== false
  const compact = tableConfig.compact || false
  const maxRows = tableConfig.maxRows || 100
  
  // 限制显示的数据行数
  const displayData = data.slice(0, maxRows)

  return (
    <div className="w-full h-full overflow-auto">
      <table className={cn(
        "w-full text-sm",
        showBorder ? "border-collapse" : "border-separate border-spacing-0"
      )}>
        {showHeader && (
          <thead className="sticky top-0 bg-white border-b-2" style={{ borderColor: primaryColor }}>
            <tr>
              {allFields.map((field) => (
                <th
                  key={field}
                  className={cn(
                    "text-left font-medium text-gray-900 bg-gray-50",
                    compact ? "px-2 py-1" : "px-3 py-2",
                    showBorder ? "border border-gray-200" : ""
                  )}
                  style={{ 
                    backgroundColor: `${primaryColor}10`,
                    color: primaryColor 
                  }}
                >
                  <div className="flex items-center gap-2">
                    {measures.includes(field) ? (
                      <Hash className="h-3 w-3" />
                    ) : (
                      <Type className="h-3 w-3" />
                    )}
                    {getDisplayName(field)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {displayData.map((row, rowIndex) => (
            <tr 
              key={rowIndex} 
              className={cn(
                "hover:bg-gray-50 transition-colors",
                showBorder ? "border-b" : "",
                striped ? (rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50/30") : ""
              )}
            >
              {allFields.map((field) => (
                <td 
                  key={field} 
                  className={cn(
                    "text-gray-700",
                    compact ? "px-2 py-1" : "px-3 py-2",
                    showBorder ? "border border-gray-200" : ""
                  )}
                >
                  {measures.includes(field) && typeof row[field] === 'number' 
                    ? row[field].toLocaleString() 
                    : String(row[field] || '-')
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > maxRows && (
        <div className="text-center py-2 text-sm text-gray-500 border-t">
          显示 {maxRows} / {data.length} 行数据
        </div>
      )}
    </div>
  )
}

// 背景图片上传组件
export function BackgroundImageUpload({ 
  currentImage, 
  onImageChange,
  onImageRemove,
  className = ""
}: {
  currentImage?: string
  onImageChange: (imageUrl: string) => void
  onImageRemove: () => void
  className?: string
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = React.useState(false)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    // 检查文件大小 (限制为5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB')
      return
    }

    setUploading(true)
    
    try {
      // 将文件转换为Base64 Data URL
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        console.log('Image uploaded successfully, size:', imageUrl.length, 'characters')
        console.log('Image URL preview:', imageUrl.substring(0, 100) + '...')
        onImageChange(imageUrl)
        setUploading(false)
      }
      reader.onerror = () => {
        alert('图片读取失败')
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      alert('图片上传失败')
      setUploading(false)
    }

    // 清空input值以便重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveImage = () => {
    onImageRemove()
  }

  return (
    <div className={cn("relative", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {currentImage ? (
        <div className="relative group">
          <div className="w-full h-32 rounded-lg border-2 border-dashed border-gray-300 relative overflow-hidden bg-white flex items-center justify-center">
            <img 
              src={currentImage}
              alt="Background preview"
              className="max-w-full max-h-full object-contain"
              onLoad={(e) => {
                // 图片加载成功时确保显示
                e.currentTarget.style.display = 'block'
              }}
              onError={(e) => {
                // 如果图片加载失败，显示错误状态
                console.error('Image failed to load:', currentImage)
                e.currentTarget.style.display = 'none'
                // 显示错误提示
                const container = e.currentTarget.parentElement
                if (container) {
                  container.innerHTML = `
                    <div class="text-center text-red-500 text-sm">
                      <p>图片加载失败</p>
                      <p class="text-xs text-gray-500 mt-1">请重新上传</p>
                    </div>
                  `
                }
              }}
              style={{ display: 'block' }}
            />
            {/* 覆盖层和操作按钮 */}
            <div className="absolute inset-0 bg-opacity-0 group-hover:bg-black group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2 pointer-events-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleUploadClick}
                  disabled={uploading}
                  className="text-xs bg-white hover:bg-gray-100"
                >
                  <Upload className="h-3 w-3 mr-1" />
                  更换
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRemoveImage}
                  className="text-xs bg-white hover:bg-gray-100 text-red-600 hover:text-red-700"
                >
                  <X className="h-3 w-3 mr-1" />
                  移除
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div 
          onClick={handleUploadClick}
          className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
              <p className="text-sm text-gray-600">上传中...</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-1">点击上传背景图片</p>
              <p className="text-xs text-gray-500">支持 JPG、PNG 格式，最大 5MB</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

