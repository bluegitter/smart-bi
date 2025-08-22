'use client'

import React, { useState } from 'react'
import { Filter, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

interface MetricFiltersProps {
  categories: string[]
  allTags: string[]
  selectedCategory: string
  selectedTags: string[]
  onCategoryChange: (category: string) => void
  onTagsChange: (tags: string[]) => void
  onClearFilters: () => void
}

export function MetricFilters({
  categories,
  allTags,
  selectedCategory,
  selectedTags,
  onCategoryChange,
  onTagsChange,
  onClearFilters
}: MetricFiltersProps) {
  const [showTagDropdown, setShowTagDropdown] = useState(false)

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag))
    } else {
      onTagsChange([...selectedTags, tag])
    }
  }

  const hasActiveFilters = selectedCategory || selectedTags.length > 0

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-700">筛选条件</span>
            {hasActiveFilters && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {(selectedCategory ? 1 : 0) + selectedTags.length} 个筛选
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              清除全部
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {/* 分类筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分类
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">所有分类</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* 标签筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标签
            </label>
            <div className="relative">
              <Button
                variant="outline"
                className="w-full justify-between text-sm"
                onClick={() => setShowTagDropdown(!showTagDropdown)}
              >
                <span>
                  {selectedTags.length > 0 
                    ? `已选择 ${selectedTags.length} 个标签`
                    : '选择标签'
                  }
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${
                  showTagDropdown ? 'rotate-180' : ''
                }`} />
              </Button>
              
              {showTagDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                  {allTags.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500 text-center">
                      暂无可用标签
                    </div>
                  ) : (
                    <div className="p-2">
                      {allTags.map(tag => (
                        <label
                          key={tag}
                          className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTags.includes(tag)}
                            onChange={() => handleTagToggle(tag)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700">{tag}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 已选择的标签显示 */}
          {selectedTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                已选择的标签
              </label>
              <div className="flex flex-wrap gap-1">
                {selectedTags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      onClick={() => handleTagToggle(tag)}
                      className="ml-1 hover:text-blue-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}