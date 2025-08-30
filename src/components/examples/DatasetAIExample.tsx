'use client'

import React from 'react'
import { DatasetChatButton, FloatingDatasetChatButton } from '@/components/ai/DatasetChatButton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { Dataset } from '@/types/dataset'

// 这是一个示例组件，展示如何在数据集页面中集成AI问答功能
interface DatasetAIExampleProps {
  dataset: Dataset
}

export function DatasetAIExample({ dataset }: DatasetAIExampleProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{dataset.displayName}</span>
            {/* 在数据集标题旁边添加AI问答按钮 */}
            <DatasetChatButton
              dataset={dataset}
              variant="outline"
              size="sm"
              includeSchema={true}
              includePreview={false}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-600">记录数</h3>
              <p className="text-2xl font-bold text-slate-900">
                {dataset.metadata.recordCount?.toLocaleString() || '--'}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-600">字段数</h3>
              <p className="text-2xl font-bold text-slate-900">{dataset.fields.length}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-600">质量评分</h3>
              <p className="text-2xl font-bold text-slate-900">{dataset.qualityScore || '--'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">AI问答使用方式</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 基础问答 */}
              <Card className="border-emerald-200 bg-emerald-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-emerald-800">基础数据问答</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-emerald-700 mb-3">
                    包含数据集架构信息，适合询问字段含义、数据结构等问题
                  </p>
                  <DatasetChatButton
                    dataset={dataset}
                    variant="outline"
                    size="sm"
                    includeSchema={true}
                    includePreview={false}
                    className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                  >
                    开始基础问答
                  </DatasetChatButton>
                </CardContent>
              </Card>

              {/* 深度分析 */}
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-blue-800">深度数据分析</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-blue-700 mb-3">
                    包含数据预览，AI可以基于实际数据提供更精准的分析建议
                  </p>
                  <DatasetChatButton
                    dataset={dataset}
                    variant="outline"
                    size="sm"
                    includeSchema={true}
                    includePreview={true}
                    previewLimit={20}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    开始深度分析
                  </DatasetChatButton>
                </CardContent>
              </Card>
            </div>

            {/* 快速问题示例 */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-4">
              <h5 className="font-medium text-slate-800 mb-2">您可以询问的问题类型：</h5>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• 这个数据集包含哪些主要字段？</li>
                <li>• 如何分析{dataset.displayName}的数据趋势？</li>
                <li>• 基于这些数据我可以做什么类型的可视化？</li>
                <li>• 数据质量如何？有什么改进建议？</li>
                <li>• 适合用什么SQL查询来分析特定问题？</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 浮动AI助手按钮 - 在实际应用中，这个应该放在布局组件中 */}
      <FloatingDatasetChatButton
        dataset={dataset}
        includeSchema={true}
        includePreview={true}
        previewLimit={15}
      />
    </div>
  )
}