'use client'

import { useState, useCallback } from 'react'
import { getAuthHeaders } from '@/lib/authUtils'
import type { Dataset } from '@/types/dataset'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatResponse {
  message: string
  model: string
  provider: string
  responseTime: number
  datasetInfo?: {
    id: string
    name: string
    type: string
    recordCount?: number
    fieldsCount: number
  }
}

interface DatasetChatOptions {
  includeSchema?: boolean
  includePreview?: boolean
  previewLimit?: number
}

export function useDatasetChat(dataset: Dataset) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (
    content: string,
    options: DatasetChatOptions = {}
  ): Promise<ChatResponse | null> => {
    if (!content.trim() || isLoading) return null

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/dataset-chat', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          datasetId: dataset._id,
          message: content.trim(),
          history: messages.slice(-8), // 最近8条消息作为上下文
          includeSchema: options.includeSchema ?? true,
          includePreview: options.includePreview ?? false,
          previewLimit: options.previewLimit ?? 10
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '请求失败')
      }

      const data: ChatResponse = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '发送消息失败'
      setError(errorMessage)
      console.error('数据集AI对话失败:', error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [dataset._id, messages, isLoading])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  const removeLastMessage = useCallback(() => {
    setMessages(prev => prev.slice(0, -1))
  }, [])

  const retryLastMessage = useCallback(async (options?: DatasetChatOptions) => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
      const lastUserMessage = messages[messages.length - 1]
      // 移除最后一条消息并重新发送
      setMessages(prev => prev.slice(0, -1))
      return await sendMessage(lastUserMessage.content, options)
    }
    return null
  }, [messages, sendMessage])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    removeLastMessage,
    retryLastMessage
  }
}