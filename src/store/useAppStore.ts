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
export const useLoading = () => useAppStore((state) => state.loading)
export const useError = () => useAppStore((state) => state.error)
export const useActions = () => useAppStore((state) => state.actions)