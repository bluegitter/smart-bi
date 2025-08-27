import { ObjectId } from './index'

// 支持的LLM提供商
export type LLMProvider = 
  | 'openai'
  | 'anthropic'
  | 'zhipu'
  | 'baidu'
  | 'alibaba'
  | 'tencent'
  | 'moonshot'
  | 'deepseek'
  | 'custom'

// LLM模型配置
export interface LLMConfig {
  _id: ObjectId
  name: string
  displayName: string
  provider: LLMProvider
  isActive: boolean
  isDefault: boolean
  
  // 连接配置
  config: {
    apiKey: string
    apiUrl?: string // 自定义API端点
    model: string
    temperature?: number
    maxTokens?: number
    topP?: number
    frequencyPenalty?: number
    presencePenalty?: number
  }
  
  // 功能支持
  capabilities: {
    chat: boolean
    completion: boolean
    embedding: boolean
    vision: boolean
    functionCalling: boolean
  }
  
  // 使用限制
  limits?: {
    maxRequestsPerMinute?: number
    maxRequestsPerDay?: number
    maxContextLength?: number
  }
  
  // 元数据
  description?: string
  version?: string
  tags: string[]
  
  // 审计字段
  userId: ObjectId
  createdAt: Date
  updatedAt: Date
}

// LLM提供商预设配置
export interface LLMProviderPreset {
  provider: LLMProvider
  name: string
  displayName: string
  description: string
  defaultApiUrl?: string
  supportedModels: LLMModelInfo[]
  capabilities: LLMConfig['capabilities']
  documentation?: string
  icon?: string
}

// 模型信息
export interface LLMModelInfo {
  model: string
  displayName: string
  description?: string
  contextLength: number
  inputCost?: number  // 每1K token的输入成本
  outputCost?: number // 每1K token的输出成本
  capabilities: string[]
}

// LLM对话消息
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  name?: string
}

// LLM对话请求
export interface LLMChatRequest {
  messages: LLMMessage[]
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

// LLM对话响应
export interface LLMChatResponse {
  choices: {
    message: LLMMessage
    finishReason: 'stop' | 'length' | 'content_filter' | 'tool_calls'
  }[]
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
}

// LLM连接测试结果
export interface LLMTestResult {
  success: boolean
  responseTime: number
  error?: string
  modelInfo?: {
    model: string
    version?: string
    capabilities?: string[]
  }
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

// 创建LLM配置请求
export interface CreateLLMConfigRequest {
  name: string
  displayName: string
  provider: LLMProvider
  config: LLMConfig['config']
  capabilities?: LLMConfig['capabilities']
  limits?: LLMConfig['limits']
  description?: string
  tags?: string[]
}

// 更新LLM配置请求
export interface UpdateLLMConfigRequest extends Partial<CreateLLMConfigRequest> {
  isActive?: boolean
  isDefault?: boolean
}

// LLM配置列表响应
export interface LLMConfigListResponse {
  configs: LLMConfig[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// 预设的LLM提供商配置
export const LLM_PROVIDER_PRESETS: LLMProviderPreset[] = [
  {
    provider: 'openai',
    name: 'openai',
    displayName: 'OpenAI',
    description: 'OpenAI GPT系列模型，包括GPT-4、GPT-3.5等',
    defaultApiUrl: 'https://api.openai.com/v1',
    capabilities: {
      chat: true,
      completion: true,
      embedding: true,
      vision: true,
      functionCalling: true
    },
    supportedModels: [
      {
        model: 'gpt-4',
        displayName: 'GPT-4',
        contextLength: 8192,
        capabilities: ['chat', 'completion', 'vision', 'function_calling']
      },
      {
        model: 'gpt-4-turbo',
        displayName: 'GPT-4 Turbo',
        contextLength: 128000,
        capabilities: ['chat', 'completion', 'vision', 'function_calling']
      },
      {
        model: 'gpt-3.5-turbo',
        displayName: 'GPT-3.5 Turbo',
        contextLength: 4096,
        capabilities: ['chat', 'completion', 'function_calling']
      },
      {
        model: 'gpt-4o',
        displayName: 'GPT-4o',
        contextLength: 128000,
        capabilities: ['chat', 'completion', 'vision', 'function_calling']
      },
      {
        model: 'gpt-4o-mini',
        displayName: 'GPT-4o Mini',
        contextLength: 128000,
        capabilities: ['chat', 'completion', 'vision', 'function_calling']
      }
    ],
    documentation: 'https://platform.openai.com/docs'
  },
  {
    provider: 'anthropic',
    name: 'anthropic',
    displayName: 'Anthropic',
    description: 'Anthropic Claude系列模型',
    defaultApiUrl: 'https://api.anthropic.com/v1',
    capabilities: {
      chat: true,
      completion: true,
      embedding: false,
      vision: true,
      functionCalling: true
    },
    supportedModels: [
      {
        model: 'claude-3-opus-20240229',
        displayName: 'Claude 3 Opus',
        contextLength: 200000,
        capabilities: ['chat', 'completion', 'vision', 'function_calling']
      },
      {
        model: 'claude-3-sonnet-20240229',
        displayName: 'Claude 3 Sonnet',
        contextLength: 200000,
        capabilities: ['chat', 'completion', 'vision', 'function_calling']
      },
      {
        model: 'claude-3-haiku-20240307',
        displayName: 'Claude 3 Haiku',
        contextLength: 200000,
        capabilities: ['chat', 'completion', 'vision']
      },
      {
        model: 'claude-3-5-sonnet-20241022',
        displayName: 'Claude 3.5 Sonnet',
        contextLength: 200000,
        capabilities: ['chat', 'completion', 'vision', 'function_calling']
      },
      {
        model: 'claude-3-5-haiku-20241022',
        displayName: 'Claude 3.5 Haiku',
        contextLength: 200000,
        capabilities: ['chat', 'completion', 'vision']
      }
    ],
    documentation: 'https://docs.anthropic.com/claude/reference'
  },
  {
    provider: 'zhipu',
    name: 'zhipu',
    displayName: '智谱AI',
    description: '智谱AI GLM系列模型',
    defaultApiUrl: 'https://open.bigmodel.cn/api/paas/v4',
    capabilities: {
      chat: true,
      completion: true,
      embedding: true,
      vision: true,
      functionCalling: true
    },
    supportedModels: [
      {
        model: 'glm-4',
        displayName: 'GLM-4',
        contextLength: 128000,
        capabilities: ['chat', 'completion', 'function_calling']
      },
      {
        model: 'glm-4-vision',
        displayName: 'GLM-4 Vision',
        contextLength: 2048,
        capabilities: ['chat', 'vision']
      },
      {
        model: 'glm-3-turbo',
        displayName: 'GLM-3 Turbo',
        contextLength: 128000,
        capabilities: ['chat', 'completion']
      },
      {
        model: 'glm-4-plus',
        displayName: 'GLM-4 Plus',
        contextLength: 128000,
        capabilities: ['chat', 'completion', 'function_calling']
      },
      {
        model: 'glm-4-air',
        displayName: 'GLM-4 Air',
        contextLength: 128000,
        capabilities: ['chat', 'completion']
      }
    ]
  },
  {
    provider: 'moonshot',
    name: 'moonshot',
    displayName: 'Moonshot AI',
    description: 'Moonshot AI Kimi系列模型',
    defaultApiUrl: 'https://api.moonshot.cn/v1',
    capabilities: {
      chat: true,
      completion: true,
      embedding: false,
      vision: false,
      functionCalling: true
    },
    supportedModels: [
      {
        model: 'moonshot-v1-8k',
        displayName: 'Moonshot v1 8K',
        contextLength: 8192,
        capabilities: ['chat', 'completion']
      },
      {
        model: 'moonshot-v1-32k',
        displayName: 'Moonshot v1 32K',
        contextLength: 32768,
        capabilities: ['chat', 'completion']
      },
      {
        model: 'moonshot-v1-128k',
        displayName: 'Moonshot v1 128K',
        contextLength: 131072,
        capabilities: ['chat', 'completion']
      }
    ]
  },
  {
    provider: 'deepseek',
    name: 'deepseek',
    displayName: 'DeepSeek',
    description: 'DeepSeek系列模型',
    defaultApiUrl: 'https://api.deepseek.com/v1',
    capabilities: {
      chat: true,
      completion: true,
      embedding: false,
      vision: false,
      functionCalling: false
    },
    supportedModels: [
      {
        model: 'deepseek-chat',
        displayName: 'DeepSeek Chat',
        contextLength: 32768,
        capabilities: ['chat', 'completion']
      },
      {
        model: 'deepseek-coder',
        displayName: 'DeepSeek Coder',
        contextLength: 16384,
        capabilities: ['chat', 'completion']
      }
    ]
  }
]