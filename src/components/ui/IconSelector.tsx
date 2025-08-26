'use client'

import React from 'react'
import { ChevronDown, Search, X, Star, Zap, TrendingUp, Target, BarChart3, PieChart, Activity, Database, Globe, Users, ShoppingCart, DollarSign, Calendar, Clock, Mail, Phone, MapPin, Settings, Home, Heart, Award, Bookmark, Camera, File, Folder, Image, Music, Play, Video, Wifi, Bluetooth, Battery, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// 图标数据
const iconCategories = [
  {
    name: '图表分析',
    icons: [
      { name: 'TrendingUp', component: TrendingUp, label: '趋势上升' },
      { name: 'BarChart3', component: BarChart3, label: '柱状图' },
      { name: 'PieChart', component: PieChart, label: '饼图' },
      { name: 'Activity', component: Activity, label: '活动' },
      { name: 'Target', component: Target, label: '目标' }
    ]
  },
  {
    name: '业务数据',
    icons: [
      { name: 'Database', component: Database, label: '数据库' },
      { name: 'DollarSign', component: DollarSign, label: '金钱' },
      { name: 'Users', component: Users, label: '用户' },
      { name: 'ShoppingCart', component: ShoppingCart, label: '购物车' },
      { name: 'Globe', component: Globe, label: '全球' }
    ]
  },
  {
    name: '时间日期',
    icons: [
      { name: 'Calendar', component: Calendar, label: '日历' },
      { name: 'Clock', component: Clock, label: '时钟' }
    ]
  },
  {
    name: '通讯联系',
    icons: [
      { name: 'Mail', component: Mail, label: '邮件' },
      { name: 'Phone', component: Phone, label: '电话' },
      { name: 'MapPin', component: MapPin, label: '位置' }
    ]
  },
  {
    name: '常用功能',
    icons: [
      { name: 'Star', component: Star, label: '星标' },
      { name: 'Zap', component: Zap, label: '闪电' },
      { name: 'Settings', component: Settings, label: '设置' },
      { name: 'Home', component: Home, label: '首页' },
      { name: 'Heart', component: Heart, label: '心形' },
      { name: 'Award', component: Award, label: '奖励' },
      { name: 'Bookmark', component: Bookmark, label: '书签' }
    ]
  },
  {
    name: '媒体文件',
    icons: [
      { name: 'Camera', component: Camera, label: '相机' },
      { name: 'File', component: File, label: '文件' },
      { name: 'Folder', component: Folder, label: '文件夹' },
      { name: 'Image', component: Image, label: '图片' },
      { name: 'Music', component: Music, label: '音乐' },
      { name: 'Play', component: Play, label: '播放' },
      { name: 'Video', component: Video, label: '视频' }
    ]
  },
  {
    name: '系统设备',
    icons: [
      { name: 'Wifi', component: Wifi, label: 'WiFi' },
      { name: 'Bluetooth', component: Bluetooth, label: '蓝牙' },
      { name: 'Battery', component: Battery, label: '电池' },
      { name: 'Volume2', component: Volume2, label: '音量' }
    ]
  }
]

// 扁平化所有图标
const allIcons = iconCategories.flatMap(category => 
  category.icons.map(icon => ({ ...icon, category: category.name }))
)

interface IconSelectorProps {
  value?: string
  onChange: (iconName: string | undefined) => void
  placeholder?: string
}

export function IconSelector({ value, onChange, placeholder = "选择图标..." }: IconSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchText, setSearchText] = React.useState('')
  const [activeCategory, setActiveCategory] = React.useState('图表分析')
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  // 过滤图标
  const filteredIcons = React.useMemo(() => {
    if (!searchText) {
      return iconCategories.find(cat => cat.name === activeCategory)?.icons || []
    }
    return allIcons.filter(icon => 
      icon.label.toLowerCase().includes(searchText.toLowerCase()) ||
      icon.name.toLowerCase().includes(searchText.toLowerCase())
    )
  }, [searchText, activeCategory])

  // 当前选中的图标
  const selectedIcon = allIcons.find(icon => icon.name === value)

  // 点击外部关闭
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchText('')
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 选择图标
  const handleSelect = (iconName: string) => {
    onChange(iconName)
    setIsOpen(false)
    setSearchText('')
  }

  // 清除图标
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(undefined)
  }

  const IconComponent = selectedIcon?.component

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
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedIcon && IconComponent ? (
            <>
              <IconComponent className="h-4 w-4 text-slate-600 shrink-0" />
              <span className="text-sm truncate">{selectedIcon.label}</span>
            </>
          ) : (
            <span className="text-sm text-slate-500">{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {selectedIcon && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:bg-slate-200 rounded transition-colors"
            >
              <X className="h-3 w-3 text-slate-400" />
            </button>
          )}
          <ChevronDown 
            className={cn(
              "h-4 w-4 text-slate-400 transition-transform duration-200",
              isOpen && "rotate-180"
            )} 
          />
        </div>
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className={cn(
          "absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg",
          "min-w-[320px] max-h-96 overflow-hidden"
        )}>
          {/* 搜索框 */}
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                className={cn(
                  "w-full pl-10 pr-3 py-2 text-sm",
                  "border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                )}
                placeholder="搜索图标..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <div className="flex max-h-80">
            {/* 分类侧栏 */}
            {!searchText && (
              <div className="w-24 border-r border-slate-100 bg-slate-50">
                <div className="p-1 max-h-80 overflow-y-auto">
                  {iconCategories.map((category) => (
                    <button
                      key={category.name}
                      type="button"
                      className={cn(
                        "w-full px-2 py-2 text-xs text-left rounded transition-colors",
                        "hover:bg-slate-100",
                        activeCategory === category.name 
                          ? "bg-blue-100 text-blue-700 font-medium" 
                          : "text-slate-600"
                      )}
                      onClick={() => setActiveCategory(category.name)}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 图标网格 */}
            <div className="flex-1 p-2 max-h-80 overflow-y-auto">
              {filteredIcons.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  没有找到匹配的图标
                </div>
              ) : (
                <div className="grid grid-cols-6 gap-1">
                  {filteredIcons.map((icon) => {
                    const IconComp = icon.component
                    return (
                      <button
                        key={icon.name}
                        type="button"
                        className={cn(
                          "p-2 rounded-md hover:bg-slate-100 transition-colors",
                          "flex flex-col items-center justify-center gap-1 group",
                          value === icon.name && "bg-blue-100 text-blue-700"
                        )}
                        onClick={() => handleSelect(icon.name)}
                        title={icon.label}
                      >
                        <IconComp className="h-5 w-5" />
                        <span className="text-xs truncate w-full text-center">
                          {icon.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}