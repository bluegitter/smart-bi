'use client'

import React from 'react'
import { 
  X, 
  Send, 
  MessageSquare, 
  Bot, 
  User, 
  Loader2, 
  AlertCircle,
  Settings,
  Trash2,
  RotateCcw,
  Database,
  Eye,
  FileText,
  BarChart3,
  Lightbulb
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { getAuthHeaders } from '@/lib/authUtils'
import { cn } from '@/lib/utils'
import type { Dataset } from '@/types/dataset'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface DatasetAIChatDialogProps {
  isOpen: boolean
  onClose: () => void
  dataset: Dataset
  includeSchema?: boolean
  includePreview?: boolean
  previewLimit?: number
}

export function DatasetAIChatDialog({ 
  isOpen, 
  onClose, 
  dataset,
  includeSchema = true,
  includePreview = false,
  previewLimit = 10
}: DatasetAIChatDialogProps) {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [inputValue, setInputValue] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [hasLLMConfig, setHasLLMConfig] = React.useState(false)
  const [contextSettings, setContextSettings] = React.useState({
    includeSchema,
    includePreview,
    previewLimit
  })
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // 检查LLM配置
  React.useEffect(() => {
    if (isOpen) {
      checkLLMConfig()
    }
  }, [isOpen])

  // 自动滚动到底部
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const checkLLMConfig = async () => {
    try {
      const response = await fetch('/api/llm/configs', {
        method: 'POST',
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        setHasLLMConfig(data.configs && data.configs.length > 0)
      } else {
        setHasLLMConfig(false)
      }
    } catch (error) {
      console.error('检查LLM配置失败:', error)
      setHasLLMConfig(false)
    }
  }

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/dataset-chat', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          datasetId: dataset._id,
          message: userMessage.content,
          history: messages.slice(-8), // 只发送最近8条消息作为上下文
          includeSchema: contextSettings.includeSchema,
          includePreview: contextSettings.includePreview,
          previewLimit: contextSettings.previewLimit
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '请求失败')
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('发送消息失败:', error)
      setError(error instanceof Error ? error.message : '发送消息失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearMessages = () => {
    setMessages([])
    setError(null)
  }

  const retryLastMessage = () => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
      const lastUserMessage = messages[messages.length - 1]
      setInputValue(lastUserMessage.content)
      setMessages(prev => prev.slice(0, -1))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in-0 duration-200">
      <Card className="w-full max-w-6xl h-[85vh] flex flex-col shadow-2xl border-0 bg-white/95 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200/60 bg-gradient-to-r from-emerald-50/50 to-blue-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 via-emerald-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Database className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                数据集智能问答
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-slate-600 font-medium">{dataset.displayName}</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  {dataset.type === 'table' ? '数据表' : dataset.type === 'sql' ? 'SQL查询' : '数据视图'}
                </span>
                {dataset.metadata.recordCount && (
                  <span className="text-xs text-slate-500">
                    {dataset.metadata.recordCount.toLocaleString()} 行数据
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 上下文设置 */}
            <div className="flex items-center gap-1 mr-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setContextSettings(prev => ({ ...prev, includeSchema: !prev.includeSchema }))}
                className={cn(
                  "text-xs px-2 py-1 h-7 rounded transition-colors",
                  contextSettings.includeSchema 
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" 
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                )}
                title="包含数据集架构信息"
              >
                <FileText className="h-3 w-3 mr-1" />
                架构
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setContextSettings(prev => ({ ...prev, includePreview: !prev.includePreview }))}
                className={cn(
                  "text-xs px-2 py-1 h-7 rounded transition-colors",
                  contextSettings.includePreview 
                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200" 
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                )}
                title="包含数据预览"
              >
                <Eye className="h-3 w-3 mr-1" />
                预览
              </Button>
            </div>

            {messages.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={retryLastMessage}
                  className="text-slate-500 hover:text-slate-700 hover:bg-slate-100/60 rounded-lg transition-colors"
                  title="重试上一条消息"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearMessages}
                  className="text-slate-500 hover:text-slate-700 hover:bg-slate-100/60 rounded-lg transition-colors"
                  title="清空对话"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('/settings?tab=llm', '_blank')}
              className="text-slate-500 hover:text-slate-700 hover:bg-slate-100/60 rounded-lg transition-colors"
              title="配置LLM"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* 消息区域 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-br from-slate-50/50 to-emerald-50/30">
          {!hasLLMConfig ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <AlertCircle className="h-10 w-10 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">
                未配置大语言模型
              </h3>
              <p className="text-slate-600 mb-6 max-w-lg leading-relaxed">
                要使用数据集AI问答功能，请先配置至少一个大语言模型。支持OpenAI、智谱AI、月之暗面、DeepSeek等多种提供商。
              </p>
              <Button 
                onClick={() => window.open('/settings?tab=llm', '_blank')}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white font-medium px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Settings className="h-4 w-4" />
                立即配置
              </Button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <MessageSquare className="h-10 w-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">
                开始数据集AI问答
              </h3>
              <p className="text-slate-600 mb-6 max-w-lg leading-relaxed">
                基于 <strong>{dataset.displayName}</strong> 数据集进行智能问答。AI助手了解该数据集的结构和内容，可以为您提供专业的数据分析建议。
              </p>
              
              {/* 数据集快速信息 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 max-w-2xl">
                <div className="bg-white/60 rounded-lg p-3 text-center border border-slate-200/60">
                  <div className="text-lg font-bold text-emerald-600">{dataset.fields.length}</div>
                  <div className="text-xs text-slate-500">字段数</div>
                </div>
                <div className="bg-white/60 rounded-lg p-3 text-center border border-slate-200/60">
                  <div className="text-lg font-bold text-blue-600">
                    {dataset.metadata.recordCount?.toLocaleString() || '--'}
                  </div>
                  <div className="text-xs text-slate-500">记录数</div>
                </div>
                <div className="bg-white/60 rounded-lg p-3 text-center border border-slate-200/60">
                  <div className="text-lg font-bold text-purple-600">{dataset.category}</div>
                  <div className="text-xs text-slate-500">分类</div>
                </div>
                <div className="bg-white/60 rounded-lg p-3 text-center border border-slate-200/60">
                  <div className="text-lg font-bold text-orange-600">
                    {dataset.qualityScore || '--'}
                  </div>
                  <div className="text-xs text-slate-500">质量评分</div>
                </div>
              </div>

              {/* 建议问题 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
                {[
                  { icon: BarChart3, text: `分析${dataset.displayName}的数据分布特征`, color: 'emerald' },
                  { icon: Lightbulb, text: `基于这个数据集给我一些分析建议`, color: 'blue' },
                  { icon: FileText, text: `解释一下各个字段的含义和用途`, color: 'purple' },
                  { icon: Database, text: `这个数据集适合做什么类型的分析？`, color: 'orange' }
                ].map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setInputValue(suggestion.text)}
                    className="text-left justify-start h-auto py-3 px-4 whitespace-normal border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md"
                  >
                    <suggestion.icon className={cn("h-4 w-4 mr-3 flex-shrink-0", {
                      'text-emerald-500': suggestion.color === 'emerald',
                      'text-blue-500': suggestion.color === 'blue',
                      'text-purple-500': suggestion.color === 'purple',
                      'text-orange-500': suggestion.color === 'orange'
                    })} />
                    {suggestion.text}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 via-emerald-600 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      "max-w-[75%] rounded-xl px-5 py-4 text-sm shadow-sm",
                      message.role === 'user'
                        ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-200"
                        : "bg-white/80 text-slate-800 border border-slate-200/60 backdrop-blur-sm"
                    )}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div
                      className={cn(
                        "text-xs mt-2 opacity-70 font-medium",
                        message.role === 'user' ? "text-emerald-100" : "text-slate-500"
                      )}
                    >
                      {message.timestamp.toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-9 h-9 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                      <User className="h-4 w-4 text-slate-600" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 via-emerald-600 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-white/80 text-slate-800 border border-slate-200/60 backdrop-blur-sm rounded-xl px-5 py-4 text-sm flex items-center gap-2 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                    <span className="font-medium">AI正在分析数据...</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex gap-3 justify-start">
                  <div className="w-9 h-9 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="bg-red-50/80 text-red-800 border border-red-200/60 backdrop-blur-sm rounded-xl px-5 py-4 text-sm max-w-[70%] shadow-sm">
                    <div className="font-semibold mb-2">出现错误</div>
                    <div className="mb-3">{error}</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={retryLastMessage}
                      className="h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-100/60 rounded-lg transition-colors font-medium"
                    >
                      重试
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        {hasLLMConfig && (
          <div className="border-t border-slate-200/60 bg-white/50 backdrop-blur-sm p-6">
            <div className="flex gap-3">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`询问关于 ${dataset.displayName} 数据集的问题...`}
                className="flex-1 border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20 rounded-lg bg-white/80 backdrop-blur-sm"
                disabled={isLoading}
                maxLength={2000}
              />
              <Button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="px-6 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="text-xs text-slate-500 mt-3 flex items-center justify-between font-medium">
              <div className="flex items-center gap-4">
                <span>按 Enter 发送消息，Shift + Enter 换行</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">上下文:</span>
                  {contextSettings.includeSchema && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-emerald-50 text-emerald-600 border border-emerald-200">
                      架构
                    </span>
                  )}
                  {contextSettings.includePreview && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-50 text-blue-600 border border-blue-200">
                      预览
                    </span>
                  )}
                </div>
              </div>
              <span className={cn(
                "transition-colors",
                inputValue.length > 1800 ? "text-amber-600" : "text-slate-500"
              )}>{inputValue.length}/2000</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}