'use client'

import React from 'react'
import { RealLineChart, RealBarChart, RealPieChart, RealKPICard } from '@/components/charts/RealDataCharts'

export default function TestDataPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          真实数据测试页面
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* 日销售额趋势 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">日销售额趋势</h2>
            <div className="h-64">
              <RealLineChart metricId="sales_001" width={500} height={250} />
            </div>
          </div>

          {/* 分类销售额分布 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">分类销售额分布</h2>
            <div className="h-64">
              <RealBarChart metricId="sales_002" width={500} height={250} />
            </div>
          </div>

          {/* 地区销售表现 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">地区销售表现</h2>
            <div className="h-64">
              <RealPieChart metricId="sales_003" width={500} height={250} />
            </div>
          </div>

          {/* 利润率KPI */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">部门利润率</h2>
            <div className="h-64">
              <RealKPICard metricId="finance_001" title="平均利润率" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 用户设备分布 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">用户设备分布</h2>
            <div className="h-48">
              <RealPieChart metricId="user_001" width={300} height={180} />
            </div>
          </div>

          {/* 用户行为分析 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">用户行为分析</h2>
            <div className="h-48">
              <RealBarChart metricId="user_002" width={300} height={180} />
            </div>
          </div>

          {/* 热销产品 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">热销产品TOP10</h2>
            <div className="h-48">
              <RealBarChart metricId="sales_004" width={300} height={180} />
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">技术说明</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• 所有图表数据来自本地MySQL测试数据库</p>
            <p>• 数据每60秒自动刷新一次</p>
            <p>• 点击右上角刷新按钮可手动刷新数据</p>
            <p>• 测试数据包含销售、财务、用户行为等多个维度</p>
            <p>• 支持线图、柱图、饼图、KPI卡片等多种图表类型</p>
          </div>
        </div>
      </div>
    </div>
  )
}