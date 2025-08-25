'use client'

import React from 'react'
import { TrendingUp, TrendingDown, BarChart3, PieChart, Table, Activity } from 'lucide-react'

// 导出容器组件
export { ContainerComponent } from './ContainerComponent'

// Mock数据生成器
export const generateMockData = {
  lineChart: () => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月']
    return months.map(month => ({
      name: month,
      value: Math.floor(Math.random() * 300) + 200,
      value2: Math.floor(Math.random() * 400) + 100
    }))
  },
  barChart: () => {
    const products = ['产品A', '产品B', '产品C', '产品D', '产品E', '产品F']
    return products.map(product => ({
      name: product,
      value: Math.floor(Math.random() * 300) + 100
    }))
  },
  pieChart: () => [
    { name: '直接访问', value: Math.floor(Math.random() * 100) + 250, color: '#3b82f6' },
    { name: '搜索引擎', value: Math.floor(Math.random() * 100) + 200, color: '#ef4444' },
    { name: '社交媒体', value: Math.floor(Math.random() * 100) + 150, color: '#10b981' },
    { name: '邮件营销', value: Math.floor(Math.random() * 100) + 100, color: '#f59e0b' },
    { name: '其他', value: Math.floor(Math.random() * 50) + 50, color: '#8b5cf6' }
  ],
  tableData: () => {
    const names = ['张三', '李四', '王五', '赵六', '钱七', '陈八', '黄九', '周十']
    const departments = ['销售部', '市场部', '技术部', '运营部', '财务部']
    const statuses = ['优秀', '良好', '一般']
    
    return Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      name: names[i] || `员工${i + 1}`,
      department: departments[Math.floor(Math.random() * departments.length)],
      revenue: `¥${(Math.floor(Math.random() * 100) + 50).toLocaleString()},000`,
      status: statuses[Math.floor(Math.random() * statuses.length)]
    }))
  },
  kpiData: () => {
    const kpiTypes = [
      {
        label: '总收入',
        value: () => `¥${(Math.floor(Math.random() * 2000000) + 1000000).toLocaleString()}`,
        description: '本月累计收入'
      },
      {
        label: '新增用户',
        value: () => `${(Math.floor(Math.random() * 5000) + 1000).toLocaleString()}`,
        description: '本周新增注册用户'
      },
      {
        label: '订单数量',
        value: () => `${(Math.floor(Math.random() * 1000) + 500).toLocaleString()}`,
        description: '今日订单总数'
      },
      {
        label: '转化率',
        value: () => `${(Math.random() * 10 + 15).toFixed(2)}%`,
        description: '访问转化率'
      },
      {
        label: '客单价',
        value: () => `¥${(Math.random() * 500 + 200).toFixed(2)}`,
        description: '平均客单价'
      }
    ]
    
    const randomKpi = kpiTypes[Math.floor(Math.random() * kpiTypes.length)]
    const change = (Math.random() * 20 - 10).toFixed(1)
    
    return {
      label: randomKpi.label,
      value: randomKpi.value(),
      change: `${change > 0 ? '+' : ''}${change}%`,
      trend: (change > 0 ? 'up' : 'down') as const,
      description: randomKpi.description
    }
  },
  gaugeData: () => {
    const gaugeTypes = [
      { label: 'CPU使用率', unit: '%', max: 100, min: 30 },
      { label: '内存使用率', unit: '%', max: 100, min: 40 },
      { label: '磁盘使用率', unit: '%', max: 100, min: 20 },
      { label: '网络带宽', unit: 'Mbps', max: 1000, min: 100 },
      { label: '完成度', unit: '%', max: 100, min: 60 }
    ]
    
    const randomGauge = gaugeTypes[Math.floor(Math.random() * gaugeTypes.length)]
    const value = Math.floor(Math.random() * (randomGauge.max - randomGauge.min)) + randomGauge.min
    
    return {
      value,
      max: randomGauge.max,
      label: randomGauge.label,
      unit: randomGauge.unit
    }
  }
}

// 简单的SVG折线图组件
export function SimpleLineChart({ data, width = 300, height = 200, config }: { 
  data: any[], 
  width?: number, 
  height?: number,
  config?: any
}) {
  // 确保 data 是数组且不为空
  const safeData = Array.isArray(data) && data.length > 0 ? data : generateMockData.lineChart()
  const colors = config?.style?.colorScheme || ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
  const showGrid = config?.chart?.showGrid !== false
  const showPoints = config?.chart?.showPoints !== false
  const showArea = config?.chart?.showArea || false
  const smooth = config?.chart?.smooth || false
  const showLegend = config?.chart?.showLegend !== false
  
  const maxValue = Math.max(...safeData.map(d => Math.max(d.value, d.value2 || 0)))
  const minValue = Math.min(...safeData.map(d => Math.min(d.value, d.value2 || 0)))
  // 动态调整padding，当不显示图例时增加图表区域
  const legendWidth = showLegend ? 120 : 0
  const padding = { top: 20, right: 30 + legendWidth, bottom: 40, left: 40 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // 生成路径点
  const getPath = (values: number[], smooth: boolean = false) => {
    const points = values.map((value, i) => ({
      x: padding.left + (i / (safeData.length - 1)) * chartWidth,
      y: padding.top + (1 - (value - minValue) / (maxValue - minValue)) * chartHeight
    }))
    
    if (smooth && points.length > 2) {
      // 简单的曲线平滑
      let path = `M ${points[0].x} ${points[0].y}`
      for (let i = 1; i < points.length; i++) {
        const cp1x = points[i-1].x + (points[i].x - points[i-1].x) / 3
        const cp1y = points[i-1].y
        const cp2x = points[i].x - (points[i].x - points[i-1].x) / 3
        const cp2y = points[i].y
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i].x} ${points[i].y}`
      }
      return path
    } else {
      return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    }
  }

  const path1 = getPath(safeData.map(d => d.value), smooth)
  const path2 = getPath(safeData.map(d => d.value2 || 0), smooth)

  return (
    <div className="w-full h-full bg-white rounded-lg">
      <svg width={width} height={height} className="text-xs">
        <defs>
          {/* 渐变定义 */}
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors[0]} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={colors[0]} stopOpacity="0.05"/>
          </linearGradient>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors[1]} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={colors[1]} stopOpacity="0.05"/>
          </linearGradient>
          
          {/* 网格线图案 */}
          {showGrid && (
            <pattern id="lineGrid" width="40" height="30" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#f1f5f9" strokeWidth="0.5"/>
            </pattern>
          )}
        </defs>
        
        {/* 背景 */}
        <rect width="100%" height="100%" fill="#fafafa" />
        
        {/* 网格线 */}
        {showGrid && (
          <rect 
            x={padding.left} 
            y={padding.top} 
            width={chartWidth} 
            height={chartHeight} 
            fill="url(#lineGrid)" 
          />
        )}
        
        {/* Y轴刻度线和标签 */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding.top + chartHeight * ratio
          const value = Math.round(maxValue - (maxValue - minValue) * ratio)
          return (
            <g key={i}>
              <line 
                x1={padding.left} 
                y1={y} 
                x2={padding.left + chartWidth} 
                y2={y} 
                stroke="#e2e8f0" 
                strokeWidth="0.5"
                strokeDasharray="2,2"
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
          const x = padding.left + (i / (safeData.length - 1)) * chartWidth
          return (
            <text 
              key={i}
              x={x} 
              y={height - 10} 
              textAnchor="middle" 
              fill="#64748b" 
              fontSize="10"
            >
              {d.name}
            </text>
          )
        })}
        
        {/* 面积填充 */}
        {showArea && (
          <>
            <path
              d={`${path1} L ${padding.left + chartWidth} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`}
              fill="url(#gradient1)"
            />
            <path
              d={`${path2} L ${padding.left + chartWidth} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`}
              fill="url(#gradient2)"
            />
          </>
        )}
        
        {/* 数据线 */}
        <path
          d={path1}
          fill="none"
          stroke={colors[0]}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={path2}
          fill="none"
          stroke={colors[1]}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* 数据点 */}
        {showPoints && safeData.map((d, i) => {
          const x = padding.left + (i / (safeData.length - 1)) * chartWidth
          const y1 = padding.top + (1 - (d.value - minValue) / (maxValue - minValue)) * chartHeight
          const y2 = padding.top + (1 - ((d.value2 || 0) - minValue) / (maxValue - minValue)) * chartHeight
          return (
            <g key={i}>
              <circle cx={x} cy={y1} r="3" fill="white" stroke={colors[0]} strokeWidth="2" />
              <circle cx={x} cy={y2} r="3" fill="white" stroke={colors[1]} strokeWidth="2" />
            </g>
          )
        })}
        
        {/* 图例 */}
        {showLegend && (
          <g transform={`translate(${width - legendWidth + 10}, 20)`}>
            <rect x="0" y="0" width="12" height="2" fill={colors[0]} />
            <text x="16" y="6" fill="#374151" fontSize="10">主要指标</text>
            <rect x="0" y="12" width="12" height="2" fill={colors[1]} />
            <text x="16" y="18" fill="#374151" fontSize="10">次要指标</text>
          </g>
        )}
      </svg>
    </div>
  )
}

// 简单的SVG柱状图组件
export function SimpleBarChart({ data, width = 300, height = 200, config }: { 
  data: any[], 
  width?: number, 
  height?: number,
  config?: any
}) {
  // 确保 data 是数组且不为空
  const safeData = Array.isArray(data) && data.length > 0 ? data : generateMockData.barChart()
  const colors = config?.style?.colorScheme || ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
  const showGrid = config?.chart?.showGrid !== false
  const showValues = config?.chart?.showValues || false
  const showLegend = config?.chart?.showLegend !== false
  const barStyle = config?.chart?.barStyle || 'rounded' // 'rounded' | 'square'
  const orientation = config?.chart?.orientation || 'vertical' // 'vertical' | 'horizontal'
  
  const maxValue = Math.max(...safeData.map(d => d.value))
  // 动态调整padding，当不显示图例时增加图表区域
  const legendHeight = showLegend ? 30 : 0
  const padding = { top: 20, right: 30, bottom: 50 + legendHeight, left: 60 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  if (orientation === 'horizontal') {
    // 水平柱状图
    const barHeight = chartHeight / safeData.length * 0.8
    
    return (
      <div className="w-full h-full bg-white rounded-lg">
        <svg width={width} height={height} className="text-xs">
          <defs>
            {/* 渐变定义 */}
            {colors.map((color, i) => (
              <linearGradient key={i} id={`barGradient${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={color} stopOpacity="0.8"/>
                <stop offset="100%" stopColor={color} stopOpacity="1"/>
              </linearGradient>
            ))}
          </defs>
          
          {/* 背景 */}
          <rect width="100%" height="100%" fill="#fafafa" />
          
          {/* 网格线 */}
          {showGrid && (
            <g>
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const x = padding.left + chartWidth * ratio
                return (
                  <line 
                    key={i}
                    x1={x} 
                    y1={padding.top} 
                    x2={x} 
                    y2={padding.top + chartHeight} 
                    stroke="#e2e8f0" 
                    strokeWidth="0.5"
                    strokeDasharray="2,2"
                  />
                )
              })}
            </g>
          )}
          
          {/* 柱子 */}
          {safeData.map((d, i) => {
            const barWidth = (d.value / maxValue) * chartWidth
            const x = padding.left
            const y = padding.top + (i + 0.1) * (chartHeight / safeData.length)
            const color = colors[i % colors.length]
            
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={`url(#barGradient${i % colors.length})`}
                  rx={barStyle === 'rounded' ? 4 : 0}
                  className="hover:opacity-80 transition-opacity"
                />
                
                {/* 数值标签 */}
                {showValues && (
                  <text
                    x={x + barWidth + 5}
                    y={y + barHeight / 2 + 3}
                    fill="#374151"
                    fontSize="10"
                    fontWeight="500"
                  >
                    {d.value}
                  </text>
                )}
                
                {/* Y轴标签 */}
                <text
                  x={padding.left - 8}
                  y={y + barHeight / 2 + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="10"
                >
                  {d.name}
                </text>
              </g>
            )
          })}
          
          {/* X轴刻度 */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const x = padding.left + chartWidth * ratio
            const value = Math.round(maxValue * ratio)
            return (
              <text 
                key={i}
                x={x} 
                y={height - legendHeight - 10} 
                textAnchor="middle" 
                fill="#64748b" 
                fontSize="10"
              >
                {value}
              </text>
            )
          })}
          
          {/* 图例 */}
          {showLegend && (
            <g transform={`translate(${padding.left}, ${height - 20})`}>
              {safeData.slice(0, Math.min(5, safeData.length)).map((d, i) => (
                <g key={i} transform={`translate(${i * 80}, 0)`}>
                  <rect x="0" y="0" width="12" height="8" rx="2" fill={colors[i % colors.length]} />
                  <text x="16" y="6" fill="#374151" fontSize="9" className="truncate">
                    {d.name.length > 8 ? d.name.substring(0, 8) + '...' : d.name}
                  </text>
                </g>
              ))}
            </g>
          )}
        </svg>
      </div>
    )
  }

  // 垂直柱状图
  const barWidth = chartWidth / safeData.length * 0.7
  const spacing = chartWidth / safeData.length * 0.3

  return (
    <div className="w-full h-full bg-white rounded-lg">
      <svg width={width} height={height} className="text-xs">
        <defs>
          {/* 渐变定义 */}
          {colors.map((color, i) => (
            <linearGradient key={i} id={`barGradient${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.9"/>
              <stop offset="100%" stopColor={color} stopOpacity="1"/>
            </linearGradient>
          ))}
        </defs>
        
        {/* 背景 */}
        <rect width="100%" height="100%" fill="#fafafa" />
        
        {/* 网格线 */}
        {showGrid && (
          <g>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = padding.top + chartHeight * ratio
              return (
                <line 
                  key={i}
                  x1={padding.left} 
                  y1={y} 
                  x2={padding.left + chartWidth} 
                  y2={y} 
                  stroke="#e2e8f0" 
                  strokeWidth="0.5"
                  strokeDasharray="2,2"
                />
              )
            })}
          </g>
        )}
        
        {/* Y轴刻度线和标签 */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding.top + chartHeight * (1 - ratio)
          const value = Math.round(maxValue * ratio)
          return (
            <text 
              key={i}
              x={padding.left - 8} 
              y={y + 3} 
              textAnchor="end" 
              fill="#64748b" 
              fontSize="10"
            >
              {value}
            </text>
          )
        })}
        
        {/* 柱子 */}
        {safeData.map((d, i) => {
          const barHeight = (d.value / maxValue) * chartHeight
          const x = padding.left + (i * (chartWidth / safeData.length)) + (spacing / 2)
          const y = padding.top + chartHeight - barHeight
          const color = colors[i % colors.length]
          
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={`url(#barGradient${i % colors.length})`}
                rx={barStyle === 'rounded' ? 4 : 0}
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
              
              {/* 数值标签 */}
              {showValues && (
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fill="#374151"
                  fontSize="10"
                  fontWeight="500"
                >
                  {d.value}
                </text>
              )}
              
              {/* X轴标签 */}
              <text
                x={x + barWidth / 2}
                y={height - legendHeight - 15}
                textAnchor="middle"
                fill="#64748b"
                fontSize="10"
              >
                {d.name}
              </text>
            </g>
          )
        })}
        
        {/* 图例 */}
        {showLegend && (
          <g transform={`translate(${padding.left}, ${height - 20})`}>
            {safeData.slice(0, Math.min(5, safeData.length)).map((d, i) => (
              <g key={i} transform={`translate(${i * 80}, 0)`}>
                <rect x="0" y="0" width="12" height="8" rx="2" fill={colors[i % colors.length]} />
                <text x="16" y="6" fill="#374151" fontSize="9" className="truncate">
                  {d.name.length > 8 ? d.name.substring(0, 8) + '...' : d.name}
                </text>
              </g>
            ))}
          </g>
        )}
      </svg>
    </div>
  )
}

// 简单的饼图组件
export function SimplePieChart({ data, width = 300, height = 200, config }: { 
  data: any[], 
  width?: number, 
  height?: number,
  config?: any
}) {
  // 确保 data 是数组且不为空
  const safeData = Array.isArray(data) && data.length > 0 ? data : generateMockData.pieChart()
  const colors = config?.style?.colorScheme || ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
  const showLabels = config?.chart?.showLabels !== false
  const showLegend = config?.chart?.showLegend !== false
  const innerRadius = config?.chart?.innerRadius || 0 // 环形图
  const showPercentage = config?.chart?.showPercentage !== false
  
  const coloredData = safeData.map((d, i) => ({
    ...d,
    color: d.color || colors[i % colors.length]
  }))
  
  const total = coloredData.reduce((sum, d) => sum + d.value, 0)
  const chartSize = Math.min(width * 0.6, height - 40)
  const outerRadius = chartSize / 2 - 10
  const actualInnerRadius = (innerRadius / 100) * outerRadius
  const centerX = chartSize / 2 + 10
  const centerY = height / 2

  let currentAngle = -Math.PI / 2 // 从顶部开始

  return (
    <div className="w-full h-full bg-white rounded-lg flex items-center">
      {/* 饼图 */}
      <div className="flex-shrink-0">
        <svg width={chartSize + 20} height={height}>
          <defs>
            {/* 阴影滤镜 */}
            <filter id="pieShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1"/>
            </filter>
            
            {/* 渐变定义 */}
            {coloredData.map((d, i) => (
              <radialGradient key={i} id={`pieGradient${i}`} cx="30%" cy="30%">
                <stop offset="0%" stopColor={d.color} stopOpacity="0.9"/>
                <stop offset="100%" stopColor={d.color} stopOpacity="1"/>
              </radialGradient>
            ))}
          </defs>
          
          {/* 背景圆 */}
          <circle
            cx={centerX}
            cy={centerY}
            r={outerRadius + 2}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="2"
          />
          
          {coloredData.map((d, i) => {
            const angle = (d.value / total) * 2 * Math.PI
            const midAngle = currentAngle + angle / 2
            
            // 外层弧线端点
            const x1 = centerX + outerRadius * Math.cos(currentAngle)
            const y1 = centerY + outerRadius * Math.sin(currentAngle)
            const x2 = centerX + outerRadius * Math.cos(currentAngle + angle)
            const y2 = centerY + outerRadius * Math.sin(currentAngle + angle)
            
            // 内层弧线端点
            const x3 = centerX + actualInnerRadius * Math.cos(currentAngle + angle)
            const y3 = centerY + actualInnerRadius * Math.sin(currentAngle + angle)
            const x4 = centerX + actualInnerRadius * Math.cos(currentAngle)
            const y4 = centerY + actualInnerRadius * Math.sin(currentAngle)
            
            const largeArcFlag = angle > Math.PI ? 1 : 0
            
            let pathData
            if (actualInnerRadius > 0) {
              // 环形图
              pathData = [
                `M ${x1} ${y1}`,
                `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                `L ${x3} ${y3}`,
                `A ${actualInnerRadius} ${actualInnerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
                'Z'
              ].join(' ')
            } else {
              // 饼图
              pathData = [
                `M ${centerX} ${centerY}`,
                `L ${x1} ${y1}`,
                `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ')
            }
            
            // 标签位置
            const labelRadius = outerRadius + 20
            const labelX = centerX + labelRadius * Math.cos(midAngle)
            const labelY = centerY + labelRadius * Math.sin(midAngle)
            
            const percentage = ((d.value / total) * 100).toFixed(1)
            
            currentAngle += angle
            
            return (
              <g key={i}>
                <path
                  d={pathData}
                  fill={`url(#pieGradient${i})`}
                  stroke="white"
                  strokeWidth="2"
                  filter="url(#pieShadow)"
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
                
                {/* 标签线和文字 */}
                {showLabels && percentage > 5 && (
                  <g>
                    <line
                      x1={centerX + (outerRadius + 5) * Math.cos(midAngle)}
                      y1={centerY + (outerRadius + 5) * Math.sin(midAngle)}
                      x2={centerX + (outerRadius + 15) * Math.cos(midAngle)}
                      y2={centerY + (outerRadius + 15) * Math.sin(midAngle)}
                      stroke="#64748b"
                      strokeWidth="1"
                    />
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor={labelX > centerX ? "start" : "end"}
                      fill="#374151"
                      fontSize="10"
                      fontWeight="500"
                    >
                      {showPercentage ? `${percentage}%` : d.value}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
          
          {/* 中心标题（环形图用） */}
          {actualInnerRadius > 20 && (
            <g>
              <text
                x={centerX}
                y={centerY - 5}
                textAnchor="middle"
                fill="#374151"
                fontSize="14"
                fontWeight="600"
              >
                总计
              </text>
              <text
                x={centerX}
                y={centerY + 10}
                textAnchor="middle"
                fill="#64748b"
                fontSize="12"
              >
                {total.toLocaleString()}
              </text>
            </g>
          )}
        </svg>
      </div>
      
      {/* 图例 */}
      {showLegend && (
        <div className="flex-1 ml-4 max-h-full overflow-y-auto">
          <div className="space-y-2">
            {coloredData.map((d, i) => {
              const percentage = ((d.value / total) * 100).toFixed(1)
              return (
                <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors">
                  <div className="flex items-center min-w-0 flex-1">
                    <div 
                      className="w-3 h-3 rounded-full mr-3 flex-shrink-0" 
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-sm text-gray-700 truncate">{d.name}</span>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <div className="text-sm font-medium text-gray-900">
                      {d.value.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {percentage}%
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// 简单的数据表组件
export function SimpleTable({ data, config }: { data: any[], config?: any }) {
  // 确保 data 是数组且不为空
  const safeData = Array.isArray(data) && data.length > 0 ? data : generateMockData.tableData()
  const showHeader = config?.table?.showHeader !== false
  const showBorder = config?.table?.showBorder !== false
  const showStripes = config?.table?.showStripes !== false
  const compact = config?.table?.compact || false
  const maxRows = config?.table?.maxRows || 6
  
  return (
    <div className="w-full h-full bg-white rounded-lg overflow-hidden">
      <div className="w-full h-full overflow-auto">
        <table className={`w-full ${showBorder ? 'border-collapse' : ''}`}>
          {showHeader && (
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
                <th className={`${showBorder ? 'border border-slate-200' : ''} ${compact ? 'px-2 py-1' : 'px-3 py-2'} text-left text-xs font-semibold text-slate-700 tracking-wider uppercase`}>
                  姓名
                </th>
                <th className={`${showBorder ? 'border border-slate-200' : ''} ${compact ? 'px-2 py-1' : 'px-3 py-2'} text-left text-xs font-semibold text-slate-700 tracking-wider uppercase`}>
                  部门
                </th>
                <th className={`${showBorder ? 'border border-slate-200' : ''} ${compact ? 'px-2 py-1' : 'px-3 py-2'} text-right text-xs font-semibold text-slate-700 tracking-wider uppercase`}>
                  收入
                </th>
                <th className={`${showBorder ? 'border border-slate-200' : ''} ${compact ? 'px-2 py-1' : 'px-3 py-2'} text-center text-xs font-semibold text-slate-700 tracking-wider uppercase`}>
                  状态
                </th>
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-slate-100">
            {safeData.slice(0, maxRows).map((row, i) => (
              <tr 
                key={i} 
                className={`
                  hover:bg-slate-50 transition-colors duration-150 ease-in-out
                  ${showStripes && i % 2 === 0 ? 'bg-slate-25' : 'bg-white'}
                `}
              >
                <td className={`${showBorder ? 'border border-slate-200' : ''} ${compact ? 'px-2 py-1' : 'px-3 py-2'} text-sm text-slate-900`}>
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-6 w-6">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium">
                        {row.name.charAt(0)}
                      </div>
                    </div>
                    <div className="ml-2 font-medium">{row.name}</div>
                  </div>
                </td>
                <td className={`${showBorder ? 'border border-slate-200' : ''} ${compact ? 'px-2 py-1' : 'px-3 py-2'} text-sm text-slate-600`}>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                    {row.department}
                  </span>
                </td>
                <td className={`${showBorder ? 'border border-slate-200' : ''} ${compact ? 'px-2 py-1' : 'px-3 py-2'} text-sm text-slate-900 text-right font-medium`}>
                  {row.revenue}
                </td>
                <td className={`${showBorder ? 'border border-slate-200' : ''} ${compact ? 'px-2 py-1' : 'px-3 py-2'} text-center`}>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    row.status === '优秀' 
                      ? 'bg-green-100 text-green-800' 
                      : row.status === '良好' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1 ${
                      row.status === '优秀' 
                        ? 'bg-green-400' 
                        : row.status === '良好' 
                          ? 'bg-blue-400' 
                          : 'bg-gray-400'
                    }`}></span>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* 分页指示器 */}
        {safeData.length > maxRows && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              显示 {Math.min(maxRows, safeData.length)} / {safeData.length} 条记录
            </div>
            <div className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer">
              查看全部 →
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// KPI卡片组件
export function SimpleKPICard({ data, title, config }: { data: any, title?: string, config?: any }) {
  
  
  // 确保 data 是有效对象
  const safeData = data && typeof data === 'object' ? data : generateMockData.kpiData()
  
  // 使用 useMemo 确保颜色配置变化时组件会重新渲染
  const colors = React.useMemo(() => {
    return config?.style?.colorScheme || ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
  }, [config?.style?.colorScheme])
  
  const cardStyle = config?.kpi?.style || 'modern' // 'modern' | 'minimal' | 'colorful'
  const showIcon = config?.kpi?.showIcon !== false
  const showTrend = config?.kpi?.showTrend !== false
  const showDescription = config?.kpi?.showDescription !== false
  
  // 获取背景样式设置
  const backgroundType = config?.kpi?.backgroundType || 'default' // 'default' | 'solid' | 'gradient'
  const primaryColor = colors[0] || '#3b82f6'
  const secondaryColor = colors[1] || '#ef4444'
  
  
  
  
  // 将十六进制颜色转换为RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 59, g: 130, b: 246 }
  }
  
  // 根据样式和背景类型选择配色
  const getCardStyles = () => {
    const baseClasses = 'w-full h-full rounded-xl p-4 shadow-sm transition-all duration-200 hover:shadow-lg group relative'
    const rgb = hexToRgb(primaryColor)
    const rgbSecondary = hexToRgb(secondaryColor)
    
    // 处理背景类型
    switch (backgroundType) {
      case 'solid':
        return {
          className: `${baseClasses} border`,
          style: {
            backgroundColor: primaryColor,
            borderColor: primaryColor,
            color: 'white'
          }
        }
      case 'gradient':
        return {
          className: `${baseClasses} border`,
          style: {
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
            borderColor: primaryColor,
            color: 'white'
          }
        }
      default:
        // 根据卡片样式选择默认背景
        switch (cardStyle) {
          case 'minimal':
            return {
              className: `${baseClasses} bg-white border border-slate-200 hover:border-slate-300`,
              style: {}
            }
          case 'colorful':
            return {
              className: `${baseClasses} border`,
              style: {
                background: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`,
                borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`
              }
            }
          default: // modern 样式
            console.log('💎 Modern样式计算:', { 
              primaryColor, 
              secondaryColor, 
              background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}05)`,
              borderColor: primaryColor
            })
            return {
              className: `${baseClasses} border`,
              style: {
                background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}05)`,
                borderColor: primaryColor,
                borderWidth: '1px',
                borderStyle: 'solid'
              }
            }
        }
    }
  }
  
  // 使用 useMemo 确保样式根据配置变化
  const cardStyles = React.useMemo(() => getCardStyles(), [primaryColor, secondaryColor, backgroundType, cardStyle])
  const isLightBackground = backgroundType === 'default' || (backgroundType === 'default' && cardStyle === 'colorful')
  const isDarkBackground = backgroundType === 'solid' || backgroundType === 'gradient'
  const textColor = isDarkBackground ? 'text-white' : 'text-slate-900'
  const subtextColor = isDarkBackground ? 'text-white/80' : 'text-slate-600'
  
  // 图标映射
  const getIcon = () => {
    const iconProps = { className: "w-5 h-5", strokeWidth: 2 }
    const label = safeData.label || ''
    if (label.includes('收入') || label.includes('金额')) {
      return <TrendingUp {...iconProps} />
    } else if (label.includes('用户') || label.includes('客户')) {
      return <Activity {...iconProps} />
    } else if (label.includes('订单') || label.includes('数量')) {
      return <BarChart3 {...iconProps} />
    }
    return <TrendingUp {...iconProps} />
  }
  
  const finalStyle = {
    ...cardStyles.style,
    // 强制样式优先级，防止被Tailwind覆盖
    backgroundColor: cardStyles.style?.backgroundColor || cardStyles.style?.background ? cardStyles.style.backgroundColor : undefined,
    background: cardStyles.style?.background,
    borderColor: cardStyles.style?.borderColor,
    // 添加透明度支持
    opacity: config?.style?.opacity ?? 1
  }

  return (
    <div 
      className={cardStyles.className} 
      style={finalStyle}
    >
      <div className="h-full flex flex-col justify-between">
        {/* 头部：标题和图标 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-semibold ${textColor} line-clamp-2`}>
              {safeData.label || '指标名称'}
            </div>
          </div>
          {showIcon && (
            <div className={`
              flex-shrink-0 ml-2 p-2 rounded-lg transition-colors duration-200
              ${isDarkBackground 
                ? 'bg-white/20 group-hover:bg-white/30'
                : (cardStyle === 'colorful' ? 'bg-white/80' : 'bg-slate-100 group-hover:bg-slate-200')
              }
            `}>
              <div className={isDarkBackground ? 'text-white' : 'text-slate-600'}>
                {getIcon()}
              </div>
            </div>
          )}
        </div>
        
        {/* 主要数值 */}
        <div className="mb-3">
          <div className={`text-2xl font-bold ${textColor} leading-none mb-1`}>
            {safeData.value || '0'}
          </div>
          
          {/* 变化趋势 */}
          {showTrend && safeData.change && (
            <div className={`flex items-center text-sm font-medium ${
              isDarkBackground 
                ? (safeData.trend === 'up' ? 'text-emerald-300' : 'text-rose-300')
                : (safeData.trend === 'up' ? 'text-emerald-600' : 'text-rose-600')
            }`}>
              {safeData.trend === 'up' ? (
                <TrendingUp className="w-3.5 h-3.5 mr-1" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 mr-1" />
              )}
              <span>{safeData.change}</span>
              {safeData.trend === 'up' ? (
                <span className={`ml-1 text-xs ${isDarkBackground ? 'text-white/70' : 'text-slate-500'}`}>↗</span>
              ) : (
                <span className={`ml-1 text-xs ${isDarkBackground ? 'text-white/70' : 'text-slate-500'}`}>↘</span>
              )}
            </div>
          )}
        </div>
        
        {/* 底部：描述 */}
        {showDescription && safeData.description && (
          <div className={`border-t pt-2 mt-auto ${isDarkBackground ? 'border-white/20' : 'border-slate-100'}`}>
            <div className={`text-xs leading-relaxed ${subtextColor}`}>
              {safeData.description}
            </div>
          </div>
        )}
        
        {/* 装饰性元素 */}
        <div className={`
          absolute top-0 right-0 w-16 h-16 opacity-5 pointer-events-none
          ${isDarkBackground ? 'text-white' : 'text-slate-400'}
        `}>
          <svg viewBox="0 0 100 100" fill="currentColor">
            <circle cx="80" cy="20" r="20"/>
            <circle cx="60" cy="40" r="15"/>
            <circle cx="90" cy="50" r="10"/>
          </svg>
        </div>
      </div>
    </div>
  )
}

// 仪表盘组件
export function SimpleGauge({ data, width = 180, height = 120, config }: { 
  data: any, 
  width?: number, 
  height?: number,
  config?: any
}) {
  // 确保 data 是有效对象
  const safeData = data && typeof data === 'object' ? data : generateMockData.gaugeData()
  const colors = config?.style?.colorScheme || ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
  const showLabels = config?.gauge?.showLabels !== false
  const showThresholds = config?.gauge?.showThresholds !== false
  const gaugeStyle = config?.gauge?.style || 'modern' // 'modern' | 'classic' | 'minimal'
  
  const centerX = width / 2
  const centerY = height - 30
  const radius = Math.min(width * 0.35, height * 0.6)
  const strokeWidth = gaugeStyle === 'minimal' ? 6 : 12
  const angle = ((safeData.value || 0) / (safeData.max || 100)) * Math.PI
  
  // 计算颜色（基于阈值）
  const getColor = (value: number, max: number) => {
    if (max === 0) return colors[2]
    const ratio = value / max
    if (ratio < 0.3) return colors[2] // 绿色 - 良好
    if (ratio < 0.7) return colors[3] // 黄色 - 警告
    return colors[1] // 红色 - 危险
  }
  
  const progressColor = getColor(safeData.value || 0, safeData.max || 100)
  
  // 指针端点
  const needleLength = radius - 10
  const needleX = centerX + needleLength * Math.cos(Math.PI - angle)
  const needleY = centerY - needleLength * Math.sin(Math.PI - angle)

  return (
    <div className="w-full h-full bg-white rounded-lg flex flex-col items-center justify-center p-2">
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          {/* 渐变定义 */}
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors[2]} />
            <stop offset="50%" stopColor={colors[3]} />
            <stop offset="100%" stopColor={colors[1]} />
          </linearGradient>
          
          <radialGradient id="centerGradient" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </radialGradient>
          
          {/* 阴影滤镜 */}
          <filter id="gaugeShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15"/>
          </filter>
        </defs>
        
        {/* 背景弧 */}
        <path
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />
        
        {/* 阈值标记 */}
        {showThresholds && (
          <g>
            {[0.3, 0.7].map((threshold, i) => {
              const thresholdAngle = threshold * Math.PI
              const x1 = centerX + (radius - strokeWidth/2 - 5) * Math.cos(Math.PI - thresholdAngle)
              const y1 = centerY - (radius - strokeWidth/2 - 5) * Math.sin(Math.PI - thresholdAngle)
              const x2 = centerX + (radius + 5) * Math.cos(Math.PI - thresholdAngle)
              const y2 = centerY - (radius + 5) * Math.sin(Math.PI - thresholdAngle)
              
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#64748b"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )
            })}
          </g>
        )}
        
        {/* 进度弧 */}
        <path
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${needleX} ${needleY}`}
          stroke={gaugeStyle === 'modern' ? 'url(#gaugeGradient)' : progressColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          filter="url(#gaugeShadow)"
          className="transition-all duration-500 ease-out"
        />
        
        {/* 刻度标签 */}
        {showLabels && (
          <g>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const labelAngle = ratio * Math.PI
              const labelRadius = radius + 20
              const labelX = centerX + labelRadius * Math.cos(Math.PI - labelAngle)
              const labelY = centerY - labelRadius * Math.sin(Math.PI - labelAngle) + 4
              const value = Math.round((safeData.max || 100) * ratio)
              
              return (
                <text
                  key={i}
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="10"
                  fontWeight="500"
                >
                  {value}
                </text>
              )
            })}
          </g>
        )}
        
        {/* 指针 */}
        {gaugeStyle !== 'minimal' && (
          <g>
            <line
              x1={centerX}
              y1={centerY}
              x2={needleX}
              y2={needleY}
              stroke="#1e293b"
              strokeWidth="3"
              strokeLinecap="round"
              filter="url(#gaugeShadow)"
              className="transition-all duration-500 ease-out"
            />
            
            {/* 指针装饰 */}
            <polygon
              points={`${centerX},${centerY - 6} ${centerX - 3},${centerY + 3} ${centerX + 3},${centerY + 3}`}
              fill="#1e293b"
              filter="url(#gaugeShadow)"
            />
          </g>
        )}
        
        {/* 中心圆 */}
        <circle 
          cx={centerX} 
          cy={centerY} 
          r={gaugeStyle === 'minimal' ? 4 : 8} 
          fill="url(#centerGradient)" 
          stroke="#cbd5e1"
          strokeWidth="2"
          filter="url(#gaugeShadow)"
        />
        
        {/* 中心数值（最小化样式时显示） */}
        {gaugeStyle === 'minimal' && (
          <text
            x={centerX}
            y={centerY - 25}
            textAnchor="middle"
            fill="#1e293b"
            fontSize="14"
            fontWeight="600"
          >
            {safeData.value || 0}
          </text>
        )}
      </svg>
      
      {/* 底部信息 */}
      <div className="text-center mt-2 space-y-1">
        <div className="text-lg font-bold text-slate-900">
          {safeData.value || 0}
          <span className="text-sm font-normal text-slate-600 ml-1">
            {safeData.unit || ''}
          </span>
        </div>
        <div className="text-xs text-slate-600 font-medium">
          {safeData.label || '指标名称'}
        </div>
        
        {/* 状态指示器 */}
        <div className="flex items-center justify-center mt-2">
          <div className={`w-2 h-2 rounded-full mr-2`} style={{ backgroundColor: progressColor }}></div>
          <span className="text-xs text-slate-500">
            {(((safeData.value || 0) / (safeData.max || 100)) * 100).toFixed(0)}% of {safeData.max || 100}
          </span>
        </div>
      </div>
    </div>
  )
}