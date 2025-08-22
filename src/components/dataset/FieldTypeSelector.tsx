'use client'

import React from 'react'
import { Settings, Hash, Type, Calendar, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { DatasetField } from '@/types/dataset'

interface FieldTypeSelectorProps {
  field: DatasetField
  onChange: (updates: Partial<DatasetField>) => void
}

export function FieldTypeSelector({ field, onChange }: FieldTypeSelectorProps) {
  const [showMenu, setShowMenu] = React.useState(false)

  const handleFieldTypeChange = (fieldType: 'dimension' | 'measure' | 'calculated') => {
    const updates: Partial<DatasetField> = { fieldType }
    
    // 根据字段类型设置默认属性
    if (fieldType === 'measure' && !field.aggregationType) {
      updates.aggregationType = 'SUM'
    } else if (fieldType === 'dimension' && !field.dimensionLevel) {
      updates.dimensionLevel = field.type === 'date' ? 'temporal' : 'categorical'
    }
    
    onChange(updates)
    setShowMenu(false)
  }

  const handleAggregationTypeChange = (aggregationType: DatasetField['aggregationType']) => {
    onChange({ aggregationType })
    setShowMenu(false)
  }

  const handleDimensionLevelChange = (dimensionLevel: DatasetField['dimensionLevel']) => {
    onChange({ dimensionLevel })
    setShowMenu(false)
  }

  const getFieldTypeIcon = () => {
    switch (field.fieldType) {
      case 'measure':
        return <Hash className="h-3 w-3 text-green-600" />
      case 'dimension':
        return field.type === 'date' 
          ? <Calendar className="h-3 w-3 text-blue-600" />
          : <Type className="h-3 w-3 text-purple-600" />
      default:
        return <Settings className="h-3 w-3 text-gray-600" />
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => setShowMenu(!showMenu)}
      >
        {getFieldTypeIcon()}
      </Button>

      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-7 z-20 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[160px]">
            {/* 字段类型选择 */}
            <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
              字段类型
            </div>
            
            <button
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                field.fieldType === 'dimension' ? 'bg-blue-50 text-blue-700' : ''
              }`}
              onClick={() => handleFieldTypeChange('dimension')}
            >
              <Type className="h-4 w-4 text-purple-600" />
              维度
            </button>
            
            <button
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                field.fieldType === 'measure' ? 'bg-blue-50 text-blue-700' : ''
              }`}
              onClick={() => handleFieldTypeChange('measure')}
            >
              <Hash className="h-4 w-4 text-green-600" />
              度量
            </button>

            {/* 度量聚合类型 */}
            {field.fieldType === 'measure' && (
              <>
                <div className="px-3 py-2 text-xs font-medium text-gray-500 border-t border-gray-100 mt-1">
                  聚合方式
                </div>
                
                {['SUM', 'AVG', 'COUNT', 'MAX', 'MIN'].map((agg) => (
                  <button
                    key={agg}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                      field.aggregationType === agg ? 'bg-blue-50 text-blue-700' : ''
                    }`}
                    onClick={() => handleAggregationTypeChange(agg as any)}
                  >
                    {agg}
                  </button>
                ))}
              </>
            )}

            {/* 维度级别 */}
            {field.fieldType === 'dimension' && (
              <>
                <div className="px-3 py-2 text-xs font-medium text-gray-500 border-t border-gray-100 mt-1">
                  维度类型
                </div>
                
                <button
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                    field.dimensionLevel === 'categorical' ? 'bg-blue-50 text-blue-700' : ''
                  }`}
                  onClick={() => handleDimensionLevelChange('categorical')}
                >
                  分类型
                </button>
                
                <button
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                    field.dimensionLevel === 'ordinal' ? 'bg-blue-50 text-blue-700' : ''
                  }`}
                  onClick={() => handleDimensionLevelChange('ordinal')}
                >
                  有序型
                </button>
                
                <button
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                    field.dimensionLevel === 'temporal' ? 'bg-blue-50 text-blue-700' : ''
                  }`}
                  onClick={() => handleDimensionLevelChange('temporal')}
                >
                  时间型
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}