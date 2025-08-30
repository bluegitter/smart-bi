'use client'

import React from 'react'
import { Bot, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useDatasetAI } from '@/contexts/DatasetAIContext'
import type { Dataset } from '@/types/dataset'

interface DatasetChatButtonProps {
  dataset: Dataset
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'sm' | 'default' | 'lg'
  className?: string
  children?: React.ReactNode
}

export function DatasetChatButton({
  dataset,
  variant = 'default',
  size = 'default',
  className = '',
  children
}: DatasetChatButtonProps) {
  const { openAIChatWithDataset } = useDatasetAI()

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => openAIChatWithDataset(dataset)}
      className={`${className} group transition-all duration-200`}
    >
      {children || (
        <>
          <Bot className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
          AI问答
        </>
      )}
    </Button>
  )
}

// 专门的浮动AI助手按钮
export function FloatingDatasetChatButton({ 
  dataset,
  size = 'default',
  children
}: Omit<DatasetChatButtonProps, 'variant' | 'className'>) {
  const { openAIChatWithDataset } = useDatasetAI()

  return (
    <Button
      variant="default"
      size={size}
      onClick={() => openAIChatWithDataset(dataset)}
      className="fixed bottom-6 right-6 z-40 shadow-lg hover:shadow-xl bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white font-medium px-6 py-3 rounded-full group transition-all duration-200"
    >
      {children || (
        <>
          <MessageSquare className="h-5 w-5 mr-2 group-hover:animate-pulse" />
          智能问答
        </>
      )}
    </Button>
  )
}