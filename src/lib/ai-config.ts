/**
 * AI服务配置和通用调用接口
 */

import { LLMConfig } from '@/models/LLMConfig'
import { connectDB } from '@/lib/mongodb'

interface AIProvider {
  chat(params: {
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
    temperature?: number
    max_tokens?: number
  }): Promise<{
    choices: Array<{
      message: {
        content: string
      }
    }>
  }>
}

/**
 * 获取默认的AI提供商配置
 */
export async function getAIProvider(): Promise<AIProvider> {
  await connectDB()

  // 这里简化处理，实际应该根据用户配置选择
  // 目前直接返回一个通用的AI调用接口
  return {
    async chat(params) {
      // 这里应该调用实际配置的LLM API
      // 为了简化，我们返回一个模拟的响应
      // 在实际使用时，应该根据配置调用相应的LLM服务
      
      throw new Error('AI配置尚未完善，请在意图提取服务中直接调用LLM API')
    }
  }
}

/**
 * 通用的LLM调用函数
 * 支持多种LLM提供商的统一接口
 */
export async function callLLM(params: {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  temperature?: number
  max_tokens?: number
  provider?: string
  model?: string
  apiKey?: string
  apiUrl?: string
}): Promise<string> {
  const {
    messages,
    temperature = 0.3,
    max_tokens = 2000,
    provider = 'openai',
    model = 'gpt-3.5-turbo',
    apiKey,
    apiUrl
  } = params

  if (!apiKey) {
    throw new Error('API密钥未配置')
  }

  let requestUrl: string
  let requestHeaders: Record<string, string>
  let requestBody: Record<string, unknown>

  // 根据不同提供商构建请求
  switch (provider) {
    case 'openai':
      requestUrl = apiUrl || 'https://api.openai.com/v1/chat/completions'
      requestHeaders = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
      requestBody = {
        model,
        messages,
        max_tokens,
        temperature
      }
      break

    case 'zhipu':
      requestUrl = apiUrl || 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
      requestHeaders = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
      requestBody = {
        model,
        messages,
        max_tokens,
        temperature
      }
      break

    case 'moonshot':
      requestUrl = apiUrl || 'https://api.moonshot.cn/v1/chat/completions'
      requestHeaders = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
      requestBody = {
        model,
        messages,
        max_tokens,
        temperature
      }
      break

    case 'deepseek':
      requestUrl = apiUrl || 'https://api.deepseek.com/v1/chat/completions'
      requestHeaders = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
      requestBody = {
        model,
        messages,
        max_tokens,
        temperature
      }
      break

    default:
      throw new Error(`不支持的LLM提供商: ${provider}`)
  }

  // 发送请求
  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: requestHeaders,
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(30000) // 30秒超时
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`LLM API请求失败 (${response.status}): ${errorText}`)
  }

  const result = await response.json()

  // 解析响应
  if (result.choices && result.choices[0] && result.choices[0].message) {
    return result.choices[0].message.content
  } else {
    throw new Error('LLM API响应格式异常')
  }
}