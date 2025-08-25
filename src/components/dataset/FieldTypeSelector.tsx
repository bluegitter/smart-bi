'use client'

import React from 'react'
import { Settings, Hash, Type, Calendar, MoreHorizontal, Calculator, Edit3, Copy, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { DatasetField } from '@/types/dataset'

interface FieldTypeSelectorProps {
  field: DatasetField
  onChange: (updates: Partial<DatasetField>) => void
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
}

export function FieldTypeSelector({ field, onChange, onEdit, onDuplicate, onDelete }: FieldTypeSelectorProps) {
  const [showMenu, setShowMenu] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  // 计算菜单位置，防止超出窗口
  const [menuPosition, setMenuPosition] = React.useState<{
    horizontal: 'right' | 'left'
    vertical: 'down' | 'up'
  }>({ horizontal: 'right', vertical: 'down' })
  
  React.useEffect(() => {
    if (showMenu && menuRef.current) {
      // 延迟计算，确保菜单已经渲染完成
      const timeoutId = setTimeout(() => {
        if (menuRef.current) {
          const menuRect = menuRef.current.getBoundingClientRect()
          const buttonRect = menuRef.current.parentElement?.getBoundingClientRect()
          const viewportWidth = window.innerWidth
          const viewportHeight = window.innerHeight
          const padding = 20 // 距离视窗边缘的安全距离
          
          let horizontal: 'right' | 'left' = 'right'
          let vertical: 'down' | 'up' = 'down'
          
          if (buttonRect) {
            // 计算水平位置
            const menuWidth = Math.max(200, menuRect.width) // 使用实际宽度或最小宽度
            if (buttonRect.right + menuWidth > viewportWidth - padding) {
              horizontal = 'left'
            }
            
            // 计算垂直位置
            const menuHeight = menuRect.height
            const spaceBelow = viewportHeight - buttonRect.bottom - 28 // 减去top-7的间距
            const spaceAbove = buttonRect.top - 28 // 减去bottom-7的间距
            
            // 如果下方空间不够且上方空间更充裕，则向上展开
            if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
              vertical = 'up'
            }
          }
          
          setMenuPosition({ horizontal, vertical })
        }
      }, 0)
      
      return () => clearTimeout(timeoutId)
    }
  }, [showMenu])

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
        className="h-6 w-6 hover:bg-gray-100 transition-colors"
        onClick={() => setShowMenu(!showMenu)}
      >
        <MoreHorizontal className="h-3 w-3 text-gray-500" />
      </Button>

      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div 
            ref={menuRef}
            className={`absolute ${
              menuPosition.horizontal === 'right' ? 'right-0' : 'left-0'
            } ${
              menuPosition.vertical === 'down' ? 'top-7' : 'bottom-7'
            } z-20 bg-white border border-gray-200 rounded-lg shadow-xl py-2 min-w-[200px] max-h-96 overflow-y-auto`}
          >
            {/* 字段操作 */}
            <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 mb-2">
              字段操作
            </div>
            
            {onEdit && (
              <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center gap-2 transition-colors"
                onClick={() => { onEdit(); setShowMenu(false) }}
              >
                <Edit3 className="h-4 w-4 text-blue-600" />
                编辑字段
              </button>
            )}
            
            {onDuplicate && (
              <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-green-50 flex items-center gap-2 transition-colors"
                onClick={() => { onDuplicate(); setShowMenu(false) }}
              >
                <Copy className="h-4 w-4 text-green-600" />
                复制字段
              </button>
            )}
            
            {onDelete && (
              <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 flex items-center gap-2 transition-colors"
                onClick={() => { onDelete(); setShowMenu(false) }}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
                删除字段
              </button>
            )}
            
            <div className="border-t border-gray-100 my-2"></div>
            
            {/* 字段类型选择 */}
            <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              字段类型
            </div>
            
            <button
              className={`w-full text-left px-3 py-2 text-sm hover:bg-purple-50 flex items-center gap-2 transition-colors ${
                field.fieldType === 'dimension' ? 'bg-purple-50 text-purple-700 font-medium' : ''
              }`}
              onClick={() => handleFieldTypeChange('dimension')}
            >
              <Type className="h-4 w-4 text-purple-600" />
              维度
            </button>
            
            <button
              className={`w-full text-left px-3 py-2 text-sm hover:bg-green-50 flex items-center gap-2 transition-colors ${
                field.fieldType === 'measure' ? 'bg-green-50 text-green-700 font-medium' : ''
              }`}
              onClick={() => handleFieldTypeChange('measure')}
            >
              <Hash className="h-4 w-4 text-green-600" />
              度量
            </button>

            <button
              className={`w-full text-left px-3 py-2 text-sm hover:bg-orange-50 flex items-center gap-2 transition-colors ${
                field.fieldType === 'calculated' ? 'bg-orange-50 text-orange-700 font-medium' : ''
              }`}
              onClick={() => handleFieldTypeChange('calculated')}
            >
              <Calculator className="h-4 w-4 text-orange-600" />
              计算字段
            </button>

            {/* 度量聚合类型 */}
            {field.fieldType === 'measure' && (
              <>
                <div className="border-t border-gray-100 my-2"></div>
                <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  聚合方式
                </div>
                
                {[
                  { key: 'SUM', label: '求和', desc: '数值相加' },
                  { key: 'AVG', label: '平均值', desc: '数值平均' },
                  { key: 'COUNT', label: '计数', desc: '记录数量' },
                  { key: 'MAX', label: '最大值', desc: '最大数值' },
                  { key: 'MIN', label: '最小值', desc: '最小数值' },
                  { key: 'DISTINCT', label: '去重计数', desc: '唯一值数量' }
                ].map((agg) => (
                  <button
                    key={agg.key}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-green-50 transition-colors ${
                      field.aggregationType === agg.key ? 'bg-green-50 text-green-700 font-medium' : ''
                    }`}
                    onClick={() => handleAggregationTypeChange(agg.key as any)}
                  >
                    <div className="flex items-center justify-between">
                      <span>{agg.label}</span>
                      <span className="text-xs text-gray-400">{agg.key}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{agg.desc}</div>
                  </button>
                ))}
              </>
            )}

            {/* 维度级别 */}
            {field.fieldType === 'dimension' && (
              <>
                <div className="border-t border-gray-100 my-2"></div>
                <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  维度类型
                </div>
                
                {[
                  { key: 'categorical', label: '分类型', desc: '离散分类数据', icon: Type },
                  { key: 'ordinal', label: '有序型', desc: '有序分类数据', icon: Type },
                  { key: 'temporal', label: '时间型', desc: '时间序列数据', icon: Calendar }
                ].map((dim) => (
                  <button
                    key={dim.key}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-purple-50 transition-colors ${
                      field.dimensionLevel === dim.key ? 'bg-purple-50 text-purple-700 font-medium' : ''
                    }`}
                    onClick={() => handleDimensionLevelChange(dim.key as any)}
                  >
                    <div className="flex items-center gap-2">
                      <dim.icon className="h-3 w-3 text-purple-600" />
                      <span>{dim.label}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 ml-5">{dim.desc}</div>
                  </button>
                ))}
              </>
            )}

            {/* 计算字段表达式 */}
            {field.fieldType === 'calculated' && field.expression && (
              <>
                <div className="border-t border-gray-100 my-2"></div>
                <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  计算表达式
                </div>
                <div className="px-3 py-2 text-xs text-gray-600 bg-gray-50 mx-2 rounded font-mono">
                  {field.expression}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}