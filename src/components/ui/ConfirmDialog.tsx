'use client'

import React from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  loading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  type = 'danger',
  loading = false
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const typeConfig = {
    danger: {
      iconColor: 'text-red-600',
      buttonVariant: 'destructive' as const,
      bgColor: 'bg-red-50'
    },
    warning: {
      iconColor: 'text-yellow-600',
      buttonVariant: 'destructive' as const,
      bgColor: 'bg-yellow-50'
    },
    info: {
      iconColor: 'text-blue-600',
      buttonVariant: 'default' as const,
      bgColor: 'bg-blue-50'
    }
  }

  const config = typeConfig[type]

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", config.bgColor)}>
              <AlertTriangle className={cn("h-5 w-5", config.iconColor)} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={loading}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* 内容 */}
        <div className="p-6">
          <p className="text-slate-600">{message}</p>
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? '处理中...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Hook for easier usage
export function useConfirmDialog() {
  const [dialog, setDialog] = React.useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    confirmText?: string
    cancelText?: string
    type?: 'danger' | 'warning' | 'info'
    loading?: boolean
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })

  const showConfirm = React.useCallback((options: {
    title: string
    message: string
    onConfirm: () => void
    confirmText?: string
    cancelText?: string
    type?: 'danger' | 'warning' | 'info'
  }) => {
    setDialog({
      isOpen: true,
      ...options,
      loading: false
    })
  }, [])

  const hideConfirm = React.useCallback(() => {
    setDialog(prev => ({ ...prev, isOpen: false }))
  }, [])

  const setLoading = React.useCallback((loading: boolean) => {
    setDialog(prev => ({ ...prev, loading }))
  }, [])

  const handleConfirm = React.useCallback(async () => {
    setLoading(true)
    try {
      await dialog.onConfirm()
      hideConfirm()
    } catch (error) {
      console.error('Confirm action failed:', error)
    } finally {
      setLoading(false)
    }
  }, [dialog.onConfirm, hideConfirm, setLoading])

  const confirmDialog = (
    <ConfirmDialog
      isOpen={dialog.isOpen}
      onClose={hideConfirm}
      onConfirm={handleConfirm}
      title={dialog.title}
      message={dialog.message}
      confirmText={dialog.confirmText}
      cancelText={dialog.cancelText}
      type={dialog.type}
      loading={dialog.loading}
    />
  )

  return {
    showConfirm,
    hideConfirm,
    confirmDialog
  }
}