'use client'

import React from 'react'
import { Database, Hash, Type, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Dataset } from '@/types/dataset'

interface CompactDatasetCardProps {
  dataset: Dataset
}

export function CompactDatasetCard({ dataset }: CompactDatasetCardProps) {
  return (
    <div className="p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <Database className="h-4 w-4 text-blue-600" />
        <span className="font-medium text-sm truncate">{dataset.displayName}</span>
      </div>
      
      {dataset.description && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
          {dataset.description}
        </p>
      )}
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Type className="h-3 w-3 text-purple-600" />
            <span>{dataset.dimensionCount || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Hash className="h-3 w-3 text-green-600" />
            <span>{dataset.measureCount || 0}</span>
          </div>
        </div>
        
        <div className={cn(
          "px-2 py-1 rounded text-xs",
          dataset.status === 'active' ? "bg-green-100 text-green-700" :
          dataset.status === 'processing' ? "bg-blue-100 text-blue-700" :
          dataset.status === 'error' ? "bg-red-100 text-red-700" :
          "bg-gray-100 text-gray-700"
        )}>
          {dataset.status === 'active' ? '正常' :
           dataset.status === 'processing' ? '处理中' :
           dataset.status === 'error' ? '错误' : '未激活'}
        </div>
      </div>
    </div>
  )
}