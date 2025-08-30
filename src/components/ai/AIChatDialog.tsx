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
  FileText,
  Eye,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer'
import { getAuthHeaders } from '@/lib/authUtils'
import { cn } from '@/lib/utils'
import type { Dataset } from '@/types/dataset'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIChatDialogProps {
  isOpen: boolean
  onClose: () => void
  initialDatasetId?: string  // 可选的初始数据集ID
  allowDatasetSelection?: boolean  // 是否允许选择数据集
}

export function AIChatDialog({ 
  isOpen, 
  onClose, 
  initialDatasetId,
  allowDatasetSelection = true 
}: AIChatDialogProps) {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [inputValue, setInputValue] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [hasLLMConfig, setHasLLMConfig] = React.useState(false)
  // 数据集相关状态
  const [selectedDataset, setSelectedDataset] = React.useState<Dataset | null>(null)
  const [datasets, setDatasets] = React.useState<Dataset[]>([])
  const [showDatasetSelector, setShowDatasetSelector] = React.useState(false)
  const [contextSettings, setContextSettings] = React.useState({
    includeSchema: true,
    includePreview: false,
    previewLimit: 10
  })
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // 检查LLM配置和加载数据集
  React.useEffect(() => {
    if (isOpen) {
      checkLLMConfig()
      if (allowDatasetSelection) {
        loadDatasets()
      }
      if (initialDatasetId) {
        loadInitialDataset(initialDatasetId)
      }
    }
  }, [isOpen, allowDatasetSelection, initialDatasetId])

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

  const loadDatasets = async () => {
    try {
      const response = await fetch('/api/datasets', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ limit: 50, sortBy: 'updatedAt', sortOrder: 'desc' })
      })
      if (response.ok) {
        const data = await response.json()
        setDatasets(data.datasets || [])
      }
    } catch (error) {
      console.error('加载数据集失败:', error)
    }
  }

  const loadInitialDataset = async (datasetId: string) => {
    try {
      const response = await fetch(`/api/datasets/${datasetId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({})
      })
      if (response.ok) {
        const data = await response.json()
        setSelectedDataset(data.dataset)
      }
    } catch (error) {
      console.error('加载初始数据集失败:', error)
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
      // 根据是否选择了数据集决定使用哪个API
      const apiUrl = selectedDataset ? '/api/ai/dataset-chat' : '/api/ai/chat'
      const requestBody = selectedDataset ? {
        datasetId: selectedDataset._id,
        message: userMessage.content,
        history: messages.slice(-8), // 数据集模式下少发送一些历史记录
        includeSchema: contextSettings.includeSchema,
        includePreview: contextSettings.includePreview,
        previewLimit: contextSettings.previewLimit
      } : {
        message: userMessage.content,
        history: messages.slice(-10) // 普通模式发送更多历史记录
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestBody)
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
      <Card className="w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl border-0 bg-white/95 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300">
        {/* 头部 */}
        <div className={cn(
          "flex items-center justify-between p-6 border-b border-slate-200/60",
          selectedDataset 
            ? "bg-gradient-to-r from-emerald-50/50 to-blue-50/50"
            : "bg-gradient-to-r from-blue-50/50 to-purple-50/50"
        )}>
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg",
              selectedDataset
                ? "bg-gradient-to-br from-emerald-500 via-emerald-600 to-blue-600"
                : "bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600"
            )}>
              {selectedDataset ? (
                <Database className="h-5 w-5 text-white" />
              ) : (
                <Bot className="h-5 w-5 text-white" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className={cn(
                  "text-xl font-bold bg-clip-text text-transparent",
                  selectedDataset
                    ? "bg-gradient-to-r from-emerald-600 to-blue-600"
                    : "bg-gradient-to-r from-blue-600 to-purple-600"
                )}>
                  {selectedDataset ? '数据集智能问答' : 'AI 智能问答'}
                </h2>
                
                {/* 数据集选择器 */}
                {allowDatasetSelection && (
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDatasetSelector(!showDatasetSelector)}
                      className="h-8 px-3 text-xs text-slate-600 hover:bg-slate-100/60 border border-slate-200"
                    >
                      {selectedDataset ? '切换数据集' : '选择数据集'}
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-slate-600 font-medium mt-1">
                {selectedDataset 
                  ? `基于 ${selectedDataset.displayName} 数据集的智能分析助手`
                  : '基于大语言模型的智能对话助手'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 数据集上下文控制 */}
            {selectedDataset && (
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
            )}

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

        {/* 数据集选择器下拉菜单 */}
        {showDatasetSelector && allowDatasetSelection && (
          <div className="relative">
            <div className="absolute top-0 left-6 right-6 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
              <div className="p-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">选择数据集</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedDataset(null)
                      setShowDatasetSelector(false)
                    }}
                    className="h-6 px-2 text-xs text-slate-500 hover:text-slate-700"
                  >
                    {selectedDataset ? '清除选择' : '通用模式'}
                  </Button>
                </div>
              </div>
              <div className="py-2">
                {datasets.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-slate-500 text-center">
                    没有可用的数据集
                  </div>
                ) : (
                  datasets.map((dataset) => (
                    <button
                      key={dataset._id}
                      onClick={() => {
                        setSelectedDataset(dataset)
                        setShowDatasetSelector(false)
                        // 清空之前的对话历史
                        setMessages([])
                        setError(null)
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-left hover:bg-slate-50 transition-colors",
                        selectedDataset?._id === dataset._id && "bg-emerald-50 border-l-2 border-l-emerald-500"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Database className="h-4 w-4 text-slate-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {dataset.displayName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">
                              {dataset.fields.length} 字段
                            </span>
                            {dataset.metadata.recordCount && (
                              <>
                                <span className="text-xs text-slate-400">•</span>
                                <span className="text-xs text-slate-500">
                                  {dataset.metadata.recordCount.toLocaleString()} 记录
                                </span>
                              </>
                            )}
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500">{dataset.category}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 消息区域 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-br from-slate-50/50 to-blue-50/30">
          {!hasLLMConfig ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <AlertCircle className="h-10 w-10 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">
                未配置大语言模型
              </h3>
              <p className="text-slate-600 mb-6 max-w-lg leading-relaxed">
                要使用AI问答功能，请先配置至少一个大语言模型。支持OpenAI、智谱AI、月之暗面、DeepSeek等多种提供商。
              </p>
              <Button 
                onClick={() => window.open('/settings?tab=llm', '_blank')}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Settings className="h-4 w-4" />
                立即配置
              </Button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <MessageSquare className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">
                开始AI对话
              </h3>
              <p className="text-slate-600 mb-6 max-w-lg leading-relaxed">
                您可以询问关于数据分析、业务洞察、技术问题等任何内容。AI助手将基于您的问题提供专业的解答和建议。
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
                {[
                  '如何分析销售数据趋势？',
                  '什么是数据可视化最佳实践？',
                  '如何提高数据质量？',
                  '解释一下用户留存率指标'
                ].map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setInputValue(suggestion)}
                    className="text-left justify-start h-auto py-3 px-4 whitespace-normal border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md"
                  >
                    {suggestion}
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
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      "max-w-[70%] rounded-xl px-5 py-4 text-sm shadow-sm",
                      message.role === 'user'
                        ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-200"
                        : "bg-white/80 text-slate-800 border border-slate-200/60 backdrop-blur-sm"
                    )}
                  >
                    {message.role === 'assistant' ? (
                      <MarkdownRenderer 
                        content={message.content}
                        className="text-slate-800"
                      />
                    ) : (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    )}
                    <div
                      className={cn(
                        "text-xs mt-2 opacity-70 font-medium",
                        message.role === 'user' ? "text-blue-100" : "text-slate-500"
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
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-white/80 text-slate-800 border border-slate-200/60 backdrop-blur-sm rounded-xl px-5 py-4 text-sm flex items-center gap-2 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="font-medium">AI正在思考中...</span>
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
                placeholder="输入您的问题..."
                className="flex-1 border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-lg bg-white/80 backdrop-blur-sm"
                disabled={isLoading}
                maxLength={2000}
              />
              <Button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="text-xs text-slate-500 mt-3 flex items-center justify-between font-medium">
              <span>按 Enter 发送消息，Shift + Enter 换行</span>
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