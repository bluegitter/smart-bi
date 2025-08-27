import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { LLMConfig } from '@/models/LLMConfig'
import { connectDB } from '@/lib/mongodb'
import { z } from 'zod'

// AI聊天请求验证模式
const chatRequestSchema = z.object({
  message: z.string().min(1, '消息内容不能为空').max(2000, '消息内容不能超过2000字符'),
  history: z.array(z.object({
    id: z.string(),
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    timestamp: z.date().or(z.string())
  })).optional().default([])
})

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// POST /api/ai/chat - AI聊天对话
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    await connectDB()

    const body = await request.json()
    
    // 验证请求数据
    const validationResult = chatRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: '请求数据无效',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { message, history } = validationResult.data

    console.log(`🤖 [AI Chat] 用户 ${user.name} 发起AI对话:`)
    console.log(`   📝 消息: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`)
    console.log(`   📚 历史记录: ${history.length} 条消息`)

    // 获取用户的默认LLM配置
    const defaultConfig = await LLMConfig.findOne({
      userId: user._id,
      isDefault: true,
      isActive: true
    }).select('+config.apiKey')

    if (!defaultConfig) {
      console.log(`❌ [AI Chat] 用户 ${user._id} 未配置默认LLM`)
      return NextResponse.json(
        { error: '未找到可用的AI模型配置，请先在设置中配置LLM服务' },
        { status: 400 }
      )
    }

    console.log(`🔧 [AI Chat] 使用配置: ${defaultConfig.displayName} (${defaultConfig.provider}/${defaultConfig.config.model})`)

    // 构建对话消息
    const messages: Message[] = []
    
    // 添加系统提示
    messages.push({
      role: 'assistant' as const,
      content: '你是Smart BI系统的AI智能助手。你可以帮助用户解答关于数据分析、商业智能、数据可视化等相关问题。请用专业但易懂的语言回答用户的问题。'
    })

    // 添加历史对话（最近10条）
    const recentHistory = history.slice(-10)
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      })
    })

    // 添加当前用户消息
    messages.push({
      role: 'user',
      content: message
    })

    const startTime = Date.now()

    try {
      // 调用LLM API
      const aiResponse = await callLLMAPI(defaultConfig, messages)
      const responseTime = Date.now() - startTime
      
      console.log(`✅ [AI Chat] AI响应成功:`)
      console.log(`   ⏱️  响应时间: ${responseTime}ms`)
      console.log(`   📄 响应长度: ${aiResponse.length} 字符`)
      
      return NextResponse.json({
        message: aiResponse,
        model: defaultConfig.config.model,
        provider: defaultConfig.provider,
        responseTime
      })
    } catch (llmError) {
      const errorMsg = llmError instanceof Error ? llmError.message : 'AI服务暂时不可用'
      console.log(`❌ [AI Chat] LLM调用失败:`)
      console.log(`   ⏱️  响应时间: ${Date.now() - startTime}ms`)
      console.log(`   🔥 错误信息: ${errorMsg}`)
      
      return NextResponse.json(
        { error: `AI服务异常: ${errorMsg}` },
        { status: 503 }
      )
    }

  } catch (error) {
    console.error('AI聊天服务失败:', error)
    return NextResponse.json(
      { error: 'AI聊天服务异常' },
      { status: 500 }
    )
  }
}

// 调用LLM API的具体实现
async function callLLMAPI(config: any, messages: Message[]): Promise<string> {
  const { provider, config: llmConfig } = config
  const { apiKey, apiUrl, model } = llmConfig

  let requestUrl: string
  let requestHeaders: Record<string, string>
  let requestBody: any

  // 根据不同提供商构建请求
  switch (provider) {
    case 'openai':
      if (apiUrl) {
        requestUrl = apiUrl.endsWith('/chat/completions') 
          ? apiUrl 
          : `${apiUrl.replace(/\/$/, '')}/chat/completions`
      } else {
        requestUrl = 'https://api.openai.com/v1/chat/completions'
      }
      requestHeaders = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
      requestBody = {
        model,
        messages,
        max_tokens: llmConfig.maxTokens || 1000,
        temperature: llmConfig.temperature || 0.7,
        top_p: llmConfig.topP,
        frequency_penalty: llmConfig.frequencyPenalty,
        presence_penalty: llmConfig.presencePenalty
      }
      break

    case 'anthropic':
      requestUrl = apiUrl || 'https://api.anthropic.com/v1/messages'
      requestHeaders = {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
      // Anthropic需要特殊的消息格式
      const anthropicMessages = messages.filter(m => m.role !== 'assistant' || messages.indexOf(m) > 0)
      requestBody = {
        model,
        messages: anthropicMessages,
        max_tokens: llmConfig.maxTokens || 1000,
        temperature: llmConfig.temperature || 0.7
      }
      break

    case 'zhipu':
      if (apiUrl) {
        requestUrl = apiUrl.endsWith('/chat/completions') 
          ? apiUrl 
          : `${apiUrl.replace(/\/$/, '')}/chat/completions`
      } else {
        requestUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
      }
      requestHeaders = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
      requestBody = {
        model,
        messages,
        max_tokens: llmConfig.maxTokens || 1000,
        temperature: llmConfig.temperature || 0.7
      }
      break

    case 'moonshot':
      if (apiUrl) {
        requestUrl = apiUrl.endsWith('/chat/completions') 
          ? apiUrl 
          : `${apiUrl.replace(/\/$/, '')}/chat/completions`
      } else {
        requestUrl = 'https://api.moonshot.cn/v1/chat/completions'
      }
      requestHeaders = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
      requestBody = {
        model,
        messages,
        max_tokens: llmConfig.maxTokens || 1000,
        temperature: llmConfig.temperature || 0.7
      }
      break

    case 'deepseek':
      if (apiUrl) {
        requestUrl = apiUrl.endsWith('/chat/completions') 
          ? apiUrl 
          : `${apiUrl.replace(/\/$/, '')}/chat/completions`
      } else {
        requestUrl = 'https://api.deepseek.com/v1/chat/completions'
      }
      requestHeaders = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
      requestBody = {
        model,
        messages,
        max_tokens: llmConfig.maxTokens || 1000,
        temperature: llmConfig.temperature || 0.7
      }
      break

    case 'custom':
      if (!apiUrl) {
        throw new Error('自定义提供商需要指定API URL')
      }
      requestUrl = apiUrl.endsWith('/chat/completions') 
        ? apiUrl 
        : `${apiUrl.replace(/\/$/, '')}/chat/completions`
      requestHeaders = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
      requestBody = {
        model,
        messages,
        max_tokens: llmConfig.maxTokens || 1000,
        temperature: llmConfig.temperature || 0.7
      }
      break

    default:
      throw new Error(`不支持的LLM提供商: ${provider}`)
  }

  // 发送请求到LLM API
  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: requestHeaders,
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(60000) // 60秒超时
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`LLM API请求失败 (${response.status}): ${errorText}`)
  }

  const result = await response.json()

  // 解析响应内容
  if (provider === 'anthropic') {
    // Anthropic响应格式
    if (result.content && result.content[0] && result.content[0].text) {
      return result.content[0].text
    } else {
      throw new Error('Anthropic API响应格式异常')
    }
  } else {
    // OpenAI兼容格式
    if (result.choices && result.choices[0] && result.choices[0].message) {
      return result.choices[0].message.content
    } else {
      throw new Error('LLM API响应格式异常')
    }
  }
}