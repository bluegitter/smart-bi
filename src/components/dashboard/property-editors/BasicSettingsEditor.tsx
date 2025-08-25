'use client'

import React from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import type { ComponentLayout } from '@/types'

interface BasicSettingsEditorProps {
  selectedComponent: ComponentLayout
  onUpdate: (updates: Partial<ComponentLayout>) => void
}

const chartTypeOptions = [
  { value: 'line-chart', label: '折线图', icon: '📈' },
  { value: 'bar-chart', label: '柱状图', icon: '📊' },
  { value: 'pie-chart', label: '饼图', icon: '🥧' },
  { value: 'table', label: '数据表', icon: '📋' },
  { value: 'kpi-card', label: '指标卡片', icon: '📌' },
  { value: 'gauge', label: '仪表盘', icon: '⏰' },
  { value: 'container', label: '容器组件', icon: '📦' }
]

// 可搜索的下拉选择组件
function SearchableSelect({ 
  value, 
  options, 
  onSelect, 
  placeholder = "请选择..." 
}: {
  value: string
  options: typeof chartTypeOptions
  onSelect: (value: string) => void
  placeholder?: string
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchText, setSearchText] = React.useState('')
  const [focusedIndex, setFocusedIndex] = React.useState(-1)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  // 过滤选项
  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchText.toLowerCase()) ||
    option.value.toLowerCase().includes(searchText.toLowerCase())
  )

  // 选中的选项
  const selectedOption = options.find(option => option.value === value)

  // 点击外部关闭下拉框
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchText('')
        setFocusedIndex(-1)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 键盘导航
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault()
        setIsOpen(true)
        setFocusedIndex(0)
        setTimeout(() => searchInputRef.current?.focus(), 0)
      }
      return
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setFocusedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        event.preventDefault()
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        )
        break
      case 'Enter':
        event.preventDefault()
        if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[focusedIndex].value)
        }
        break
      case 'Escape':
        event.preventDefault()
        setIsOpen(false)
        setSearchText('')
        setFocusedIndex(-1)
        break
    }
  }

  // 选择选项
  const handleSelect = (optionValue: string) => {
    onSelect(optionValue)
    setIsOpen(false)
    setSearchText('')
    setFocusedIndex(-1)
  }

  // 当搜索文本变化时重置焦点
  React.useEffect(() => {
    if (searchText) {
      setFocusedIndex(0)
    }
  }, [searchText])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 触发按钮 */}
      <button
        type="button"
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 text-left",
          "border border-slate-200 rounded-md bg-white hover:bg-slate-50",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          "transition-colors duration-200"
        )}
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) {
            setTimeout(() => searchInputRef.current?.focus(), 0)
          }
        }}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedOption ? (
            <>
              <span className="text-base shrink-0">{selectedOption.icon}</span>
              <span className="text-sm truncate">{selectedOption.label}</span>
            </>
          ) : (
            <span className="text-sm text-slate-500">{placeholder}</span>
          )}
        </div>
        <ChevronDown 
          className={cn(
            "h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className={cn(
          "absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg",
          "max-h-60 overflow-hidden"
        )}>
          {/* 搜索框 */}
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                className={cn(
                  "w-full pl-8 pr-3 py-1.5 text-sm",
                  "border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                )}
                placeholder="搜索组件类型..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* 选项列表 */}
          <div className="max-h-44 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-500 text-center">
                没有找到匹配的组件类型
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-left text-sm",
                    "hover:bg-slate-50 transition-colors duration-150",
                    value === option.value && "bg-blue-50 text-blue-700",
                    focusedIndex === index && "bg-slate-100"
                  )}
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  <span className="text-base shrink-0">{option.icon}</span>
                  <span className="truncate">{option.label}</span>
                  {value === option.value && (
                    <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function BasicSettingsEditor({ selectedComponent, onUpdate }: BasicSettingsEditorProps) {
  const handleChartTypeChange = (newType: ComponentLayout['type']) => {
    onUpdate({ type: newType })
  }

  const handleTitleChange = (newTitle: string) => {
    onUpdate({ title: newTitle })
  }

  return (
    <div className="space-y-4">
      {/* 组件类型 */}
      <div>
        <label className="block text-sm font-medium mb-2">组件类型</label>
        <SearchableSelect
          value={selectedComponent.type}
          options={chartTypeOptions}
          onSelect={(value) => handleChartTypeChange(value as ComponentLayout['type'])}
          placeholder="选择组件类型..."
        />
      </div>

      {/* 标题 */}
      <div>
        <label className="block text-sm font-medium mb-2">标题</label>
        <Input
          value={selectedComponent.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="输入组件标题"
        />
      </div>

      {/* 位置和尺寸 */}
      <div>
        <label className="block text-sm font-medium mb-2">位置和尺寸</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-slate-500 mb-1">X坐标</label>
            <Input
              type="number"
              value={selectedComponent.position.x.toString()}
              onChange={(e) => onUpdate({
                position: { ...selectedComponent.position, x: parseInt(e.target.value) || 0 }
              })}
              size="sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Y坐标</label>
            <Input
              type="number"
              value={selectedComponent.position.y.toString()}
              onChange={(e) => onUpdate({
                position: { ...selectedComponent.position, y: parseInt(e.target.value) || 0 }
              })}
              size="sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">宽度</label>
            <Input
              type="number"
              value={selectedComponent.size.width.toString()}
              onChange={(e) => onUpdate({
                size: { ...selectedComponent.size, width: parseInt(e.target.value) || 200 }
              })}
              size="sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">高度</label>
            <Input
              type="number"
              value={selectedComponent.size.height.toString()}
              onChange={(e) => onUpdate({
                size: { ...selectedComponent.size, height: parseInt(e.target.value) || 150 }
              })}
              size="sm"
            />
          </div>
        </div>
      </div>
    </div>
  )
}