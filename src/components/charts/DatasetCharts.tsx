'use client'

import React from 'react'
import { TrendingUp, TrendingDown, BarChart3, Loader2, RefreshCw, Database } from 'lucide-react'
import { useDatasetData } from '@/hooks/useDatasetData'
import { Button } from '@/components/ui/Button'
import type { ComponentLayout } from '@/types'

// 工具函数：合并类名
function cn(...classes: (string | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
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

  return (
    <div 
      className="w-full h-full p-4 transition-all duration-200 rounded-b-lg"
      style={{
        ...backgroundStyles,
        opacity: component.config?.style?.opacity ?? 1
      }}
    >
      <svg width={width - 40} height={height - 40} className="overflow-visible">
        {/* 绘制简单的折线 */}
        {measures.map((measure, measureIndex) => {
          const points = data.map((item, index) => {
            const x = (index / (data.length - 1)) * (width - 80) + 40
            const y = height - 60 - ((Number(item[measure]) || 0) / maxValue) * (height - 100)
            return `${x},${y}`
          }).join(' ')

          return (
            <g key={measure}>
              <polyline
                points={points}
                fill="none"
                stroke={component.config?.style?.colorScheme?.[measureIndex] || '#3b82f6'}
                strokeWidth="2"
              />
              {/* 数据点 */}
              {data.map((item, index) => {
                const x = (index / (data.length - 1)) * (width - 80) + 40
                const y = height - 60 - ((Number(item[measure]) || 0) / maxValue) * (height - 100)
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="3"
                    fill={component.config?.style?.colorScheme?.[measureIndex] || '#3b82f6'}
                  />
                )
              })}
            </g>
          )
        })}
        
        {/* X轴标签 */}
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * (width - 80) + 40
          const label = dimensions.length > 0 ? String(item[dimensions[0]]) : `${index + 1}`
          return (
            <text
              key={index}
              x={x}
              y={height - 20}
              textAnchor="middle"
              className={`text-xs ${isDarkBackground ? 'fill-white/80' : 'fill-gray-600'}`}
            >
              {label.length > 8 ? label.substring(0, 8) + '...' : label}
            </text>
          )
        })}
      </svg>
      
      {/* 图例 */}
      {measures.length > 0 && (
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
  
  const maxValue = Math.max(...data.map(item => {
    return Math.max(...measures.map(measure => Number(item[measure]) || 0))
  }))

  const barWidth = Math.max(20, (width - 80) / data.length - 10)

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
        {data.map((item, dataIndex) => {
          return measures.map((measure, measureIndex) => {
            const x = dataIndex * ((width - 80) / data.length) + 40 + measureIndex * (barWidth / measures.length)
            const value = Number(item[measure]) || 0
            const barHeight = (value / maxValue) * (height - 100)
            const y = height - 60 - barHeight

            return (
              <rect
                key={`${dataIndex}-${measureIndex}`}
                x={x}
                y={y}
                width={barWidth / measures.length}
                height={barHeight}
                fill={component.config?.style?.colorScheme?.[measureIndex] || '#10b981'}
                className="hover:opacity-80"
              />
            )
          })
        })}
        
        {/* X轴标签 */}
        {data.map((item, index) => {
          const x = index * ((width - 80) / data.length) + 40 + barWidth / 2
          const label = dimensions.length > 0 ? String(item[dimensions[0]]) : `${index + 1}`
          return (
            <text
              key={index}
              x={x}
              y={height - 20}
              textAnchor="middle"
              className={`text-xs ${isDarkBackground ? 'fill-white/80' : 'fill-gray-600'}`}
            >
              {label.length > 6 ? label.substring(0, 6) + '...' : label}
            </text>
          )
        })}
      </svg>
      
      {/* 图例 */}
      {measures.length > 0 && (
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
    console.log('Getting unit for field:', fieldName)
    console.log('Component dataConfig:', component.dataConfig)
    console.log('FieldUnits:', component.dataConfig?.fieldUnits)
    
    // 从数据集字段配置中获取单位（优先）
    const fieldConfig = component.dataConfig?.selectedMeasures?.find(measure => measure === fieldName)
    if (fieldConfig && component.dataConfig?.fieldUnits?.[fieldName]) {
      const unit = component.dataConfig.fieldUnits[fieldName]
      console.log('Found unit from fieldUnits:', unit)
      return unit
    }
    
    // 从组件配置中获取单位（备用）
    const fieldUnits = component.config?.kpi?.fieldUnits || {}
    if (fieldUnits[fieldName]) {
      const unit = fieldUnits[fieldName]
      console.log('Found unit from config:', unit)
      return unit
    }
    
    // 从数据中获取单位字段（如果有）
    const unitKey = `${fieldName}_unit`
    if (data.length > 0 && data[0].hasOwnProperty(unitKey)) {
      const unit = data[0][unitKey]
      console.log('Found unit from data:', unit)
      return unit
    }
    
    console.log('No unit found for field:', fieldName)
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
  const cardStyle = component.config?.kpi?.style || 'modern'
  
  // 动态样式计算
  const getCardStyles = () => {
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
  
  const cardStyles = getCardStyles()
  const isDarkBackground = backgroundType === 'solid' || backgroundType === 'gradient'
  const textColor = isDarkBackground ? 'text-white' : 'text-gray-900'
  const subtextColor = isDarkBackground ? 'text-white/80' : 'text-gray-600'

  return (
    <div 
      className="w-full h-full p-4 transition-all duration-200 rounded-b-lg"
      style={{
        ...cardStyles,
        opacity: component.config?.style?.opacity ?? 1
      }}
    >
      <div className="flex flex-col h-full justify-center">
        <div className={`text-2xl font-bold mb-1 ${textColor}`}>
          {totalValue.toLocaleString()}{primaryUnit && ` ${primaryUnit}`}
        </div>
        <div className={`text-xs mb-3 ${subtextColor}`}>
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
  const radius = Math.min(width, height) / 2 - 40
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
          
          const startX = centerX + radius * Math.cos(currentAngle)
          const startY = centerY + radius * Math.sin(currentAngle)
          
          currentAngle += angle
          
          const endX = centerX + radius * Math.cos(currentAngle)
          const endY = centerY + radius * Math.sin(currentAngle)
          
          const largeArcFlag = angle > Math.PI ? 1 : 0
          
          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${startX} ${startY}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            'Z'
          ].join(' ')

          const color = component.config?.style?.colorScheme?.[index % (component.config?.style?.colorScheme?.length || 1)] || '#3b82f6'
          
          return (
            <path
              key={index}
              d={pathData}
              fill={color}
              className="hover:opacity-80"
            />
          )
        })}
      </svg>
      
      {/* 图例 */}
      <div className="flex flex-wrap gap-2 mt-2">
        {data.map((item, index) => {
          const label = dimensions.length > 0 ? String(item[dimensions[0]]) : `项目${index + 1}`
          const value = Number(item[primaryMeasure]) || 0
          const percentage = ((value / total) * 100).toFixed(1)
          const color = component.config?.style?.colorScheme?.[index % (component.config?.style?.colorScheme?.length || 1)] || '#3b82f6'
          
          return (
            <div key={index} className="flex items-center gap-1 text-xs">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className={textColor}>{label} ({percentage}%)</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

