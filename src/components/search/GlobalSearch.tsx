'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  BarChart3, 
  Database, 
  Table, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  Loader2,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: string
  type: 'dashboard' | 'dataset' | 'datasource' | 'metric'
  title: string
  description?: string
  path: string
  updatedAt?: string
  category?: string
  icon?: React.ComponentType<{ className?: string }>
}

interface GlobalSearchProps {
  className?: string
  onClose?: () => void
}

export function GlobalSearch({ className, onClose }: GlobalSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [showResults, setShowResults] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // 搜索逻辑
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setShowResults(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data.results || [])
        setShowResults(true)
        setSelectedIndex(-1)
      }
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        performSearch(query)
      } else {
        setResults([])
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : results.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultClick(results[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        handleClose()
        break
    }
  }

  // 点击结果项
  const handleResultClick = (result: SearchResult) => {
    router.push(result.path)
    handleClose()
  }

  // 关闭搜索
  const handleClose = () => {
    setQuery('')
    setResults([])
    setShowResults(false)
    setSelectedIndex(-1)
    onClose?.()
  }

  // 获取类型图标和颜色
  const getTypeInfo = (type: SearchResult['type']) => {
    switch (type) {
      case 'dashboard':
        return { 
          icon: BarChart3, 
          color: 'text-blue-600 bg-blue-50',
          label: '看板'
        }
      case 'dataset':
        return { 
          icon: Table, 
          color: 'text-purple-600 bg-purple-50',
          label: '数据集'
        }
      case 'datasource':
        return { 
          icon: Database, 
          color: 'text-green-600 bg-green-50',
          label: '数据源'
        }
      case 'metric':
        return { 
          icon: TrendingUp, 
          color: 'text-orange-600 bg-orange-50',
          label: '指标'
        }
      default:
        return { 
          icon: Search, 
          color: 'text-slate-600 bg-slate-50',
          label: '其他'
        }
    }
  }

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
          setShowResults(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setShowResults(true)}
          placeholder="搜索看板、指标或数据源..."
          className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 bg-white"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setResults([])
              setShowResults(false)
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          </div>
        )}
      </div>

      {/* 搜索结果下拉框 */}
      {showResults && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto"
        >
          {results.length === 0 && query && !isLoading ? (
            <div className="p-6 text-center text-slate-500">
              <Search className="h-8 w-8 mx-auto mb-3 text-slate-300" />
              <p>没有找到相关结果</p>
              <p className="text-sm mt-1">尝试使用不同的关键词</p>
            </div>
          ) : (
            <>
              {query && !isLoading && results.length > 0 && (
                <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-sm text-slate-600">
                    找到 <span className="font-semibold text-slate-900">{results.length}</span> 个结果
                  </p>
                </div>
              )}
              
              <div className="py-2">
                {results.map((result, index) => {
                  const typeInfo = getTypeInfo(result.type)
                  const Icon = typeInfo.icon
                  const isSelected = index === selectedIndex
                  
                  return (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className={cn(
                        "w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors duration-200 flex items-center gap-3 group",
                        isSelected && "bg-blue-50 border-r-2 border-blue-500"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                        typeInfo.color
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-slate-900 truncate">
                            {result.title}
                          </h3>
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            {typeInfo.label}
                          </span>
                        </div>
                        {result.description && (
                          <p className="text-sm text-slate-600 truncate">
                            {result.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          {result.category && (
                            <span className="text-xs text-slate-500">
                              {result.category}
                            </span>
                          )}
                          {result.updatedAt && (
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Clock className="h-3 w-3" />
                              {new Date(result.updatedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <ArrowRight className={cn(
                        "h-4 w-4 text-slate-400 transition-all duration-200",
                        "group-hover:text-slate-600 group-hover:translate-x-0.5",
                        isSelected && "text-blue-500"
                      )} />
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* 快捷键提示 */}
          {results.length > 0 && (
            <div className="p-3 border-t border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-4">
                  <span>↑↓ 导航</span>
                  <span>↵ 打开</span>
                  <span>Esc 关闭</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}