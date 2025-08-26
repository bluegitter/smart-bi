'use client'

import React from 'react'
import { ChevronDown, Search, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectItem {
  id: string
  name: string
  displayName?: string
  type?: string
  icon?: React.ComponentType<{ className?: string }>
}

interface CustomSelectProps {
  items: SelectItem[]
  value: string
  onValueChange: (value: string) => void
  placeholder: string
  loading?: boolean
  disabled?: boolean
  searchable?: boolean
  className?: string
  compact?: boolean
}

export function CustomSelect({
  items,
  value,
  onValueChange,
  placeholder,
  loading = false,
  disabled = false,
  searchable = true,
  className,
  compact = false
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // 筛选项目
  const filteredItems = React.useMemo(() => {
    if (!searchQuery.trim()) return items
    
    const query = searchQuery.toLowerCase().trim()
    return items.filter(item => 
      item.name.toLowerCase().includes(query) ||
      (item.displayName && item.displayName.toLowerCase().includes(query)) ||
      (item.type && item.type.toLowerCase().includes(query))
    )
  }, [items, searchQuery])

  // 选中的项目
  const selectedItem = items.find(item => item.id === value)

  // 点击外部关闭下拉框
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (item: SelectItem) => {
    onValueChange(item.id)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* 触发按钮 */}
      <button
        type="button"
        className={cn(
          "w-full flex items-center justify-between text-left border border-gray-300 rounded-md bg-white hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors",
          compact ? "px-2 py-1 text-xs h-7" : "px-3 py-2 text-sm",
          disabled && "opacity-50 cursor-not-allowed",
          isOpen && "ring-2 ring-blue-500 border-blue-500",
          className
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <div className={cn("flex items-center flex-1 min-w-0", compact ? "gap-1" : "gap-2")}>
          {selectedItem ? (
            <>
              {selectedItem.icon && (
                <selectedItem.icon className={cn(
                  "text-gray-600 flex-shrink-0",
                  compact ? "h-3 w-3" : "h-4 w-4"
                )} />
              )}
              <span className="truncate">{selectedItem.displayName || selectedItem.name}</span>
              {selectedItem.type && !compact && (
                <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                  {selectedItem.type}
                </span>
              )}
            </>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={cn(
          "text-gray-400 transition-transform flex-shrink-0",
          compact ? "h-3 w-3" : "h-4 w-4",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* 下拉内容 */}
      {isOpen && (
        <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* 搜索框 */}
          {searchable && (
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索..."
                  className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 选项列表 */}
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                加载中...
              </div>
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors",
                    value === item.id && "bg-blue-50 text-blue-700"
                  )}
                  onClick={() => handleSelect(item)}
                >
                  {item.icon && <item.icon className="h-4 w-4 text-gray-600 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{item.displayName || item.name}</div>
                    {item.name !== (item.displayName || item.name) && (
                      <div className="text-xs text-gray-500 truncate">{item.name}</div>
                    )}
                  </div>
                  {item.type && (
                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded flex-shrink-0">
                      {item.type}
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">
                {searchQuery ? '未找到匹配项' : '暂无选项'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}