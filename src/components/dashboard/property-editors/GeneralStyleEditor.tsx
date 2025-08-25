'use client'

import React, { useState, useEffect } from 'react'
import type { ComponentLayout } from '@/types'

interface GeneralStyleEditorProps {
  selectedComponent: ComponentLayout
  onStyleUpdate: (styleUpdates: any) => void
}

const colorSchemes = [
  { name: '默认', colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'] },
  { name: '蓝色系', colors: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'] },
  { name: '绿色系', colors: ['#166534', '#16a34a', '#22c55e', '#4ade80', '#bbf7d0'] },
  { name: '紫色系', colors: ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#e9d5ff'] },
  { name: '暖色系', colors: ['#dc2626', '#ea580c', '#f59e0b', '#eab308', '#84cc16'] }
]

export function GeneralStyleEditor({ selectedComponent, onStyleUpdate }: GeneralStyleEditorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedScheme, setSelectedScheme] = useState<string>('')
  
  const currentColorScheme = selectedComponent?.config?.style?.colorScheme
  const currentSchemeName = colorSchemes.find(scheme => 
    JSON.stringify(scheme.colors) === JSON.stringify(currentColorScheme)
  )?.name || selectedScheme
  
  // 当组件切换时，重置本地状态以匹配当前配置
  useEffect(() => {
    const matchedScheme = colorSchemes.find(scheme => 
      JSON.stringify(scheme.colors) === JSON.stringify(currentColorScheme)
    )
    if (matchedScheme) {
      setSelectedScheme(matchedScheme.name)
    } else {
      setSelectedScheme('')
    }
  }, [selectedComponent?.id, currentColorScheme])
  
  const handleSchemeSelect = (scheme: typeof colorSchemes[0]) => {
    setSelectedScheme(scheme.name)
    onStyleUpdate({ colorScheme: scheme.colors })
    setIsOpen(false)
  }
  
  // 优先使用当前配置中的配色方案匹配预设方案
  const displayScheme = colorSchemes.find(scheme => 
    JSON.stringify(scheme.colors) === JSON.stringify(currentColorScheme)
  ) || colorSchemes.find(s => s.name === selectedScheme)
  
  const displayColors = displayScheme?.colors || currentColorScheme
  const displayName = displayScheme?.name
  
  return (
    <div className="space-y-4">
      {/* 配色方案 */}
      <div className="relative">
        <label className="block text-sm font-medium mb-2">配色方案</label>
        
        {/* 自定义下拉框 */}
        <div className="relative">
          {/* 下拉框按钮 */}
          <button
            type="button"
            className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {displayColors && displayColors.length > 0 ? (
                <>
                  <div className="flex gap-0.5 flex-shrink-0">
                    {displayColors.slice(0, 5).map((color: string, index: number) => (
                      <div
                        key={index}
                        className="w-4 h-4 rounded-sm border border-gray-200"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                    {displayColors.length > 5 && (
                      <div className="w-4 h-4 rounded-sm border border-gray-200 bg-gray-100 flex items-center justify-center">
                        <span className="text-xs text-gray-500">+{displayColors.length - 5}</span>
                      </div>
                    )}
                  </div>
                  <span className="truncate">{displayName || '自定义配色'}</span>
                </>
              ) : (
                <span className="text-gray-500">选择配色方案</span>
              )}
            </div>
            <svg
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* 下拉选项 */}
          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              <div className="py-1">
                {colorSchemes.map((scheme) => (
                  <div
                    key={scheme.name}
                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors min-h-[40px]"
                    onClick={() => handleSchemeSelect(scheme)}
                  >
                    {/* 色块预览 */}
                    <div className="flex gap-1 flex-shrink-0">
                      {scheme.colors.map((color, index) => (
                        <div
                          key={index}
                          className="w-4 h-4 rounded border border-gray-300 shadow-sm"
                          style={{ 
                            backgroundColor: color,
                            minWidth: '16px',
                            minHeight: '16px'
                          }}
                          title={color}
                        />
                      ))}
                    </div>
                    
                    {/* 方案名称 */}
                    <span className="text-sm text-gray-900 flex-1">{scheme.name}</span>
                    
                    {/* 选中标记 */}
                    {currentSchemeName === scheme.name && (
                      <div className="flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* 点击外部关闭下拉框 */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>

      {/* 通用背景设置 */}
      <div>
        <label className="block text-sm font-medium mb-2">背景</label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showBackground"
              className="rounded"
              defaultChecked={true}
              onChange={(e) => onStyleUpdate({ showBackground: e.target.checked })}
            />
            <label htmlFor="showBackground" className="text-sm">显示背景</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showBorder"
              className="rounded"
              defaultChecked={true}
              onChange={(e) => onStyleUpdate({ showBorder: e.target.checked })}
            />
            <label htmlFor="showBorder" className="text-sm">显示边框</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showShadow"
              className="rounded"
              defaultChecked={false}
              onChange={(e) => onStyleUpdate({ showShadow: e.target.checked })}
            />
            <label htmlFor="showShadow" className="text-sm">显示阴影</label>
          </div>
        </div>
      </div>

      {/* 透明度 */}
      <div>
        <label className="block text-sm font-medium mb-2">透明度</label>
        <input
          type="range"
          min="0"
          max="100"
          defaultValue="100"
          className="w-full"
          onChange={(e) => onStyleUpdate({ opacity: Number(e.target.value) / 100 })}
        />
      </div>
    </div>
  )
}