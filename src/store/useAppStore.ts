import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { AppState } from '@/types'

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        user: null,
        isAuthenticated: false,
        currentDashboard: null,
        dashboards: [],
        isEditing: false,
        selectedComponent: null,
        draggedMetric: null,
        sidebarCollapsed: false,
        headerHidden: false,
        isFullscreen: false,
        // 保存全屏前的状态
        previousSidebarCollapsed: false,
        previousHeaderHidden: false,
        loading: false,
        error: null,

        // Actions
        actions: {
          setUser: (user) => 
            set({ user, isAuthenticated: !!user }, false, 'setUser'),
          
          setCurrentDashboard: (dashboard) => 
            set({ currentDashboard: dashboard }, false, 'setCurrentDashboard'),
          
          setIsEditing: (editing) => 
            set({ isEditing: editing }, false, 'setIsEditing'),
          
          setSelectedComponent: (component) => 
            set({ selectedComponent: component }, false, 'setSelectedComponent'),
          
          toggleSidebar: () => 
            set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }), false, 'toggleSidebar'),
          
          toggleHeader: () => 
            set((state) => ({ headerHidden: !state.headerHidden }), false, 'toggleHeader'),
          
          toggleFullscreen: () => 
            set((state) => {
              if (!state.isFullscreen) {
                // 进入全屏：保存当前状态并隐藏sidebar和header
                return {
                  isFullscreen: true,
                  previousSidebarCollapsed: state.sidebarCollapsed,
                  previousHeaderHidden: state.headerHidden,
                  sidebarCollapsed: true,
                  headerHidden: true
                }
              } else {
                // 退出全屏：恢复之前的状态
                return {
                  isFullscreen: false,
                  sidebarCollapsed: state.previousSidebarCollapsed,
                  headerHidden: state.previousHeaderHidden
                }
              }
            }, false, 'toggleFullscreen'),
          
          setLoading: (loading) => 
            set({ loading }, false, 'setLoading'),
          
          setError: (error) => 
            set({ error }, false, 'setError'),
        },
      }),
      {
        name: 'smart-bi-store',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          sidebarCollapsed: state.sidebarCollapsed,
          headerHidden: state.headerHidden,
          isFullscreen: state.isFullscreen,
          previousSidebarCollapsed: state.previousSidebarCollapsed,
          previousHeaderHidden: state.previousHeaderHidden,
        }),
      }
    ),
    {
      name: 'SmartBI Store',
    }
  )
)

// 导出便捷的选择器hooks
export const useUser = () => useAppStore((state) => state.user)
export const useIsAuthenticated = () => useAppStore((state) => state.isAuthenticated)
export const useCurrentDashboard = () => useAppStore((state) => state.currentDashboard)
export const useDashboards = () => useAppStore((state) => state.dashboards)
export const useIsEditing = () => useAppStore((state) => state.isEditing)
export const useSelectedComponent = () => useAppStore((state) => state.selectedComponent)
export const useSidebarCollapsed = () => useAppStore((state) => state.sidebarCollapsed)
export const useHeaderHidden = () => useAppStore((state) => state.headerHidden)
export const useIsFullscreen = () => useAppStore((state) => state.isFullscreen)
export const useLoading = () => useAppStore((state) => state.loading)
export const useError = () => useAppStore((state) => state.error)
export const useActions = () => useAppStore((state) => state.actions)