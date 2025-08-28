'use client'

import React from 'react'
import { 
  Layout, 
  Save, 
  Eye, 
  Settings, 
  Maximize2, 
  Minimize2, 
  Loader2, 
  Database, 
  Grid3x3 
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface DashboardToolbarProps {
  dashboardName: string
  hasUnsavedChanges: boolean
  saving: boolean
  isPreviewMode: boolean
  isFullscreen: boolean
  sidebarCollapsed: boolean
  selectedComponent: any
  onComponentLibraryToggle: () => void
  onDatasetLibraryToggle: () => void
  onPropertyPanelToggle: () => void
  onPreviewToggle: () => void
  onFullscreenToggle: () => void
  onSave: () => void
}

export function DashboardToolbar({
  dashboardName,
  hasUnsavedChanges,
  saving,
  isPreviewMode,
  isFullscreen,
  sidebarCollapsed,
  selectedComponent,
  onComponentLibraryToggle,
  onDatasetLibraryToggle,
  onPropertyPanelToggle,
  onPreviewToggle,
  onFullscreenToggle,
  onSave
}: DashboardToolbarProps) {
  return (
    <div 
      className="h-12 border-b border-slate-200 pr-4 flex items-center justify-between flex-shrink-0 bg-white z-10"
      style={{
        paddingLeft: (() => {
          let padding = 16
          if (!sidebarCollapsed && !isFullscreen) {
            padding += 60
          }
          return `${padding}px`
        })(),
        transition: 'padding-left 0.3s ease-in-out'
      }}
    >
      <div className="flex items-center gap-2">
        <h1 className="font-semibold">
          {dashboardName}
          {hasUnsavedChanges && <span className="text-orange-500">*</span>}
        </h1>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={onComponentLibraryToggle}
            disabled={isPreviewMode}
            title="组件库"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={onDatasetLibraryToggle}
            disabled={isPreviewMode}
            title="数据集库"
          >
            <Database className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={onPropertyPanelToggle}
            disabled={!selectedComponent}
            title="属性设置"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={onPreviewToggle}
            title={isPreviewMode ? "编辑模式" : "预览模式"}
          >
            {isPreviewMode ? <Layout className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={onFullscreenToggle}
            title={isFullscreen ? "退出全屏" : "全屏模式"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <div className={cn(
        "flex items-center gap-2",
        !sidebarCollapsed && !isFullscreen && "hidden sm:flex"
      )}>
        <Button 
          size="sm"
          onClick={onSave}
          disabled={saving || !hasUnsavedChanges}
          className="flex items-center gap-1"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              保存
            </>
          )}
        </Button>
        
        <div className={cn(
          "flex items-center gap-2",
          !sidebarCollapsed || isFullscreen ? "flex" : "hidden sm:flex"
        )}>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onPreviewToggle}
            className={cn(isPreviewMode && "bg-blue-50 text-blue-700")}
          >
            {isPreviewMode ? (
              <>
                <Layout className="h-4 w-4 mr-1" />
                编辑
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-1" />
                预览
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onFullscreenToggle}
            className={cn(isFullscreen && "bg-blue-50 text-blue-700")}
            title={isFullscreen ? "退出全屏" : "全屏模式"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-4 w-4 mr-1" />
                退出全屏
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4 mr-1" />
                全屏
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}