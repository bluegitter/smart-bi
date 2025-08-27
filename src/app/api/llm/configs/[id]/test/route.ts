import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { LLMConfig } from '@/models/LLMConfig'
import { connectDB } from '@/lib/mongodb'
import type { LLMTestResult } from '@/types/llm'

// POST /api/llm/configs/[id]/test - 测试LLM配置连接
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    await connectDB()

    // 等待并获取参数
    const { id } = await params

    // 查找配置
    const config = await LLMConfig.findById(id).select('+config.apiKey')
    
    if (!config) {
      console.log(`❌ [LLM Test] 配置不存在: ${id}`)
      return NextResponse.json(
        { error: '配置不存在' },
        { status: 404 }
      )
    }

    // 检查权限
    if (config.userId.toString() !== user._id.toString()) {
      console.log(`❌ [LLM Test] 用户 ${user._id} 无权测试配置 ${id}`)
      return NextResponse.json(
        { error: '无权测试此配置' },
        { status: 403 }
      )
    }

    console.log(`🧪 [LLM Test] 开始测试连接:`)
    console.log(`   📋 配置ID: ${id}`)
    console.log(`   👤 用户: ${user.name} (${user.email})`)
    console.log(`   🏷️  配置名称: ${config.displayName}`)
    console.log(`   🔧 提供商: ${config.provider}`)
    console.log(`   🤖 模型: ${config.config.model}`)
    console.log(`   🌐 API地址: ${config.config.apiUrl || '使用默认地址'}`)

    const startTime = Date.now()
    let testResult: LLMTestResult

    try {
      // 根据不同提供商执行测试
      testResult = await testLLMConnection(config)
      testResult.responseTime = Date.now() - startTime
      
      console.log(`✅ [LLM Test] 连接测试成功:`)
      console.log(`   ⏱️  响应时间: ${testResult.responseTime}ms`)
      console.log(`   📊 Token使用: prompt=${testResult.usage?.promptTokens}, completion=${testResult.usage?.completionTokens}, total=${testResult.usage?.totalTokens}`)
      console.log(`   📈 模型信息: ${testResult.modelInfo?.model}`)
    } catch (testError) {
      const errorMsg = testError instanceof Error ? testError.message : '连接测试失败'
      console.log(`❌ [LLM Test] 连接测试失败:`)
      console.log(`   ⏱️  响应时间: ${Date.now() - startTime}ms`)
      console.log(`   🔥 错误信息: ${errorMsg}`)
      
      testResult = {
        success: false,
        responseTime: Date.now() - startTime,
        error: errorMsg
      }
    }

    return NextResponse.json(testResult)
  } catch (error) {
    console.error('LLM配置测试失败:', error)
    return NextResponse.json(
      { error: '测试连接失败' },
      { status: 500 }
    )
  }
}

// 测试LLM连接的具体实现
async function testLLMConnection(config: any): Promise<LLMTestResult> {
  const { provider, config: llmConfig } = config
  const { apiKey, apiUrl, model } = llmConfig

  // 构建测试消息
  const testMessages = [
    {
      role: 'user' as const,
      content: '你好，这是一个连接测试。请简单回复"连接成功"。'
    }
  ]

  let requestUrl: string
  let requestHeaders: Record<string, string>
  let requestBody: any

  // 根据不同提供商构建请求
  switch (provider) {
    case 'openai':
      // 如果提供了自定义API URL，需要确保包含完整的端点路径
      if (apiUrl) {
        // 如果自定义URL已经包含了chat/completions端点，直接使用
        // 否则添加chat/completions端点
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
        messages: testMessages,
        max_tokens: 50,
        temperature: 0.1
      }
      break

    case 'anthropic':
      requestUrl = apiUrl || 'https://api.anthropic.com/v1/messages'
      requestHeaders = {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
      requestBody = {
        model,
        messages: testMessages,
        max_tokens: 50
      }
      break

    case 'zhipu':
      // 智谱AI OpenAI兼容接口
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
        messages: testMessages,
        max_tokens: 50,
        temperature: 0.1
      }
      break

    case 'moonshot':
      // Moonshot OpenAI兼容接口
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
        messages: testMessages,
        max_tokens: 50,
        temperature: 0.1
      }
      break

    case 'deepseek':
      // DeepSeek OpenAI兼容接口
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
        messages: testMessages,
        max_tokens: 50,
        temperature: 0.1
      }
      break

    case 'custom':
      if (!apiUrl) {
        throw new Error('自定义提供商需要指定API URL')
      }
      // 自定义提供商，智能处理API URL
      requestUrl = apiUrl.endsWith('/chat/completions') 
        ? apiUrl 
        : `${apiUrl.replace(/\/$/, '')}/chat/completions`
      requestHeaders = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
      requestBody = {
        model,
        messages: testMessages,
        max_tokens: 50,
        temperature: 0.1
      }
      break

    default:
      throw new Error(`不支持的LLM提供商: ${provider}`)
  }

  // 发送测试请求
  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: requestHeaders,
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(30000) // 30秒超时
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API请求失败 (${response.status}): ${errorText}`)
  }

  const result = await response.json()

  // 解析响应
  let usage
  let modelInfo

  if (provider === 'anthropic') {
    // Anthropic响应格式
    usage = {
      promptTokens: result.usage?.input_tokens || 0,
      completionTokens: result.usage?.output_tokens || 0,
      totalTokens: (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0)
    }
    modelInfo = {
      model: result.model || model,
      capabilities: ['chat', 'completion']
    }
  } else {
    // OpenAI兼容格式
    usage = {
      promptTokens: result.usage?.prompt_tokens || 0,
      completionTokens: result.usage?.completion_tokens || 0,
      totalTokens: result.usage?.total_tokens || 0
    }
    modelInfo = {
      model: result.model || model,
      capabilities: ['chat', 'completion']
    }
  }

  return {
    success: true,
    responseTime: 0, // 将在调用处设置
    modelInfo,
    usage
  }
}