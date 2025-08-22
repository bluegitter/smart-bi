'use client'

import React from 'react'
import { TrendingUp, TrendingDown, BarChart3, Loader2, RefreshCw } from 'lucide-react'
import { useChartData, formatChartData } from '@/hooks/useChartData'
import { Button } from '@/components/ui/Button'

// 真实数据折线图
export function RealLineChart({ 
  metricId, 
  width = 300, 
  height = 200, 
  config 
}: { 
  metricId?: string
  width?: number
  height?: number
  config?: any
}) {
  const { data, loading, error, refreshData, lastUpdated } = useChartData({
    metricId,
    enabled: !!metricId
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

  const chartData = formatChartData.forLineChart(data)
  const safeData = chartData.length > 0 ? chartData : []
  
  if (safeData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">暂无数据</p>
        </div>
      </div>
    )
  }

  const colors = config?.style?.colorScheme || ['#3b82f6', '#ef4444']
  const padding = { top: 20, right: 40, bottom: 40, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const values = safeData.map(d => d.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const valueRange = maxValue - minValue || 1

  // 创建路径
  const path = safeData.map((d, i) => {
    const x = padding.left + (i / Math.max(safeData.length - 1, 1)) * chartWidth
    const y = padding.top + (1 - (d.value - minValue) / valueRange) * chartHeight
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  return (
    <div className="w-full h-full relative">
      {/* 刷新按钮 */}
      <Button
        size="sm"
        variant="ghost"
        onClick={refreshData}
        className="absolute top-1 right-1 h-6 w-6 p-0 z-10"
        disabled={loading}
      >
        <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
      </Button>

      <svg width={width} height={height} className="overflow-visible">
        {/* 网格线 */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + ratio * chartHeight
          const value = Math.round(maxValue - ratio * valueRange)
          return (
            <g key={ratio}>
              <line 
                x1={padding.left} 
                x2={padding.left + chartWidth} 
                y1={y} 
                y2={y} 
                stroke="#e2e8f0" 
                strokeWidth="0.5"
              />
              <text 
                x={padding.left - 8} 
                y={y + 3} 
                textAnchor="end" 
                fill="#64748b" 
                fontSize="10"
              >
                {value}
              </text>
            </g>
          )
        })}
        
        {/* X轴标签 */}
        {safeData.map((d, i) => {
          const x = padding.left + (i / Math.max(safeData.length - 1, 1)) * chartWidth
          return (
            <text 
              key={i}
              x={x} 
              y={height - 10} 
              textAnchor="middle" 
              fill="#64748b" 
              fontSize="10"
            >
              {d.name.length > 8 ? d.name.substring(0, 8) + '...' : d.name}
            </text>
          )
        })}
        
        {/* 数据线 */}
        <path
          d={path}
          fill="none"
          stroke={colors[0]}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* 数据点 */}
        {safeData.map((d, i) => {
          const x = padding.left + (i / Math.max(safeData.length - 1, 1)) * chartWidth
          const y = padding.top + (1 - (d.value - minValue) / valueRange) * chartHeight
          return (
            <circle 
              key={i}
              cx={x} 
              cy={y} 
              r="3" 
              fill="white" 
              stroke={colors[0]} 
              strokeWidth="2" 
            />
          )
        })}
      </svg>

      {/* 更新时间 */}
      {lastUpdated && (
        <div className="absolute bottom-1 left-1 text-xs text-gray-400">
          {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}

// 真实数据柱状图
export function RealBarChart({ 
  metricId, 
  width = 300, 
  height = 200, 
  config 
}: { 
  metricId?: string
  width?: number
  height?: number
  config?: any
}) {
  const { data, loading, error, refreshData, lastUpdated } = useChartData({
    metricId,
    enabled: !!metricId
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

  const chartData = formatChartData.forBarChart(data)
  const safeData = chartData.length > 0 ? chartData : []
  
  if (safeData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">暂无数据</p>
        </div>
      </div>
    )
  }

  const colors = config?.style?.colorScheme || ['#3b82f6']
  const padding = { top: 20, right: 20, bottom: 40, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const maxValue = Math.max(...safeData.map(d => d.value))
  const barWidth = chartWidth / safeData.length * 0.8
  const barSpacing = chartWidth / safeData.length * 0.2

  return (
    <div className="w-full h-full relative">
      {/* 刷新按钮 */}
      <Button
        size="sm"
        variant="ghost"
        onClick={refreshData}
        className="absolute top-1 right-1 h-6 w-6 p-0 z-10"
        disabled={loading}
      >
        <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
      </Button>

      <svg width={width} height={height} className="overflow-visible">
        {/* Y轴刻度 */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + ratio * chartHeight
          const value = Math.round(maxValue * (1 - ratio))
          return (
            <g key={ratio}>
              <line 
                x1={padding.left} 
                x2={padding.left + chartWidth} 
                y1={y} 
                y2={y} 
                stroke="#e2e8f0" 
                strokeWidth="0.5"
              />
              <text 
                x={padding.left - 8} 
                y={y + 3} 
                textAnchor="end" 
                fill="#64748b" 
                fontSize="10"
              >
                {value}
              </text>
            </g>
          )
        })}
        
        {/* 柱状图 */}
        {safeData.map((d, i) => {
          const barHeight = (d.value / maxValue) * chartHeight
          const x = padding.left + i * (barWidth + barSpacing) + barSpacing / 2
          const y = padding.top + chartHeight - barHeight
          
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={colors[i % colors.length]}
                rx="2"
              />
              <text 
                x={x + barWidth / 2} 
                y={height - 10} 
                textAnchor="middle" 
                fill="#64748b" 
                fontSize="10"
              >
                {d.name.length > 6 ? d.name.substring(0, 6) + '...' : d.name}
              </text>
              <text 
                x={x + barWidth / 2} 
                y={y - 5} 
                textAnchor="middle" 
                fill="#374151" 
                fontSize="9"
              >
                {d.value}
              </text>
            </g>
          )
        })}
      </svg>

      {/* 更新时间 */}
      {lastUpdated && (
        <div className="absolute bottom-1 left-1 text-xs text-gray-400">
          {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}

// 真实数据饼图
export function RealPieChart({ 
  metricId, 
  width = 300, 
  height = 200, 
  config 
}: { 
  metricId?: string
  width?: number
  height?: number
  config?: any
}) {
  const { data, loading, error, refreshData, lastUpdated } = useChartData({
    metricId,
    enabled: !!metricId
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

  const chartData = formatChartData.forPieChart(data)
  const safeData = chartData.length > 0 ? chartData : []
  
  if (safeData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">暂无数据</p>
        </div>
      </div>
    )
  }

  const total = safeData.reduce((sum, d) => sum + d.value, 0)
  const radius = Math.min(width, height) / 3
  const centerX = width / 2
  const centerY = height / 2

  let currentAngle = -Math.PI / 2

  return (
    <div className="w-full h-full relative">
      {/* 刷新按钮 */}
      <Button
        size="sm"
        variant="ghost"
        onClick={refreshData}
        className="absolute top-1 right-1 h-6 w-6 p-0 z-10"
        disabled={loading}
      >
        <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
      </Button>

      <svg width={width} height={height}>
        {safeData.map((d, i) => {
          const angle = (d.value / total) * 2 * Math.PI
          const startAngle = currentAngle
          const endAngle = currentAngle + angle
          
          const x1 = centerX + radius * Math.cos(startAngle)
          const y1 = centerY + radius * Math.sin(startAngle)
          const x2 = centerX + radius * Math.cos(endAngle)
          const y2 = centerY + radius * Math.sin(endAngle)
          
          const largeArcFlag = angle > Math.PI ? 1 : 0
          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ')
          
          currentAngle += angle
          
          return (
            <path
              key={i}
              d={pathData}
              fill={d.color}
              stroke="white"
              strokeWidth="2"
            />
          )
        })}
      </svg>

      {/* 图例 */}
      <div className="absolute bottom-2 left-2 text-xs">
        {safeData.slice(0, 3).map((d, i) => (
          <div key={i} className="flex items-center mb-1">
            <div 
              className="w-2 h-2 rounded-full mr-2" 
              style={{ backgroundColor: d.color }}
            />
            <span className="text-gray-600 truncate max-w-16">
              {d.name}
            </span>
          </div>
        ))}
      </div>

      {/* 更新时间 */}
      {lastUpdated && (
        <div className="absolute bottom-1 right-1 text-xs text-gray-400">
          {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}

// 真实数据KPI卡片
export function RealKPICard({ 
  metricId, 
  title,
  config 
}: { 
  metricId?: string
  title?: string
  config?: any
}) {
  const { data, loading, error, refreshData, lastUpdated } = useChartData({
    metricId,
    enabled: !!metricId
  })

  if (loading && data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-sm text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  if (error && data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-sm text-red-500 mb-2">加载失败</p>
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

  const kpiData = formatChartData.forKPICard(data)

  return (
    <div className="h-full p-4 flex flex-col justify-between relative">
      {/* 刷新按钮 */}
      <Button
        size="sm"
        variant="ghost"
        onClick={refreshData}
        className="absolute top-1 right-1 h-6 w-6 p-0 z-10"
        disabled={loading}
      >
        <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
      </Button>

      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-2">
          {title || kpiData.label}
        </h3>
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {kpiData.value}
        </div>
        <div className="flex items-center text-sm">
          {kpiData.trend === 'up' ? (
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          ) : kpiData.trend === 'down' ? (
            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
          ) : null}
          <span className={`${
            kpiData.trend === 'up' ? 'text-green-600' : 
            kpiData.trend === 'down' ? 'text-red-600' : 
            'text-gray-600'
          }`}>
            {kpiData.change}
          </span>
        </div>
      </div>
      
      <div className="text-xs text-gray-500">
        {kpiData.description}
      </div>

      {/* 更新时间 */}
      {lastUpdated && (
        <div className="absolute bottom-1 left-4 text-xs text-gray-400">
          {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}