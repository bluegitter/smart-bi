import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { LLMConfig } from '@/models/LLMConfig'
import { Dataset } from '@/models/Dataset'
import { connectDB } from '@/lib/mongodb'
import { z } from 'zod'
import type { Dataset as DatasetType } from '@/types/dataset'
import { extractQueryIntent, validateQueryIntent } from '@/lib/intent-extraction'
import { intentToSQL } from '@/lib/dsl-to-sql'
import { IntentExtractionRequest } from '@/types/query-intent'

// 数据集AI问答请求验证模式
const datasetChatRequestSchema = z.object({
  datasetId: z.string().min(1, '数据集ID不能为空'),
  message: z.string().min(1, '消息内容不能为空').max(2000, '消息内容不能超过2000字符'),
  history: z.array(z.object({
    id: z.string(),
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    timestamp: z.date().or(z.string())
  })).optional().default([]),
  includeSchema: z.boolean().optional().default(true),
  includePreview: z.boolean().optional().default(false),
  previewLimit: z.number().min(1).max(100).optional().default(10)
})

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// POST /api/ai/dataset-chat - 基于数据集的AI问答
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    await connectDB()

    const body = await request.json()
    
    // 验证请求数据
    const validationResult = datasetChatRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: '请求数据无效',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { datasetId, message, history, includeSchema, includePreview, previewLimit } = validationResult.data

    console.log(`🤖 [Dataset Chat] 用户 ${user.name} 基于数据集进行AI对话:`)
    console.log(`   📊 数据集ID: ${datasetId}`)
    console.log(`   📝 消息: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`)
    console.log(`   📚 历史记录: ${history.length} 条消息`)

    // 获取用户的默认LLM配置
    const defaultConfig = await LLMConfig.findOne({
      userId: user._id,
      isDefault: true,
      isActive: true
    }).select('+config.apiKey')

    if (!defaultConfig) {
      console.log(`❌ [Dataset Chat] 用户 ${user._id} 未配置默认LLM`)
      return NextResponse.json(
        { error: '未找到可用的AI模型配置，请先在设置中配置LLM服务' },
        { status: 400 }
      )
    }

    // 获取数据集信息
    let dataset: Dataset | null = null
    try {
      const datasetResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/datasets/${datasetId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${request.headers.get('Authorization')?.replace('Bearer ', '')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      if (datasetResponse.ok) {
        const datasetData = await datasetResponse.json()
        dataset = datasetData.dataset
      }
    } catch (datasetError) {
      console.error('获取数据集失败:', datasetError)
    }

    if (!dataset) {
      return NextResponse.json(
        { error: '无法访问指定的数据集，请检查数据集是否存在或您是否有权限访问' },
        { status: 404 }
      )
    }

    console.log(`📊 [Dataset Chat] 数据集: ${dataset.displayName} (${dataset.type})`)
    console.log(`🔧 [Dataset Chat] 使用配置: ${defaultConfig.displayName} (${defaultConfig.provider}/${defaultConfig.config.model})`)

    const startTime = Date.now()

    try {
      // 新架构：自然语言 → 意图提取 → DSL → SQL → 查询执行
      console.log(`🧠 [Dataset Chat] 开始意图提取: ${message}`)

      // 第1步：构建意图提取请求
      const intentRequest: IntentExtractionRequest = {
        query: message,
        datasetSchema: {
          name: dataset.name,
          displayName: dataset.displayName,
          fields: dataset.fields.map(field => ({
            name: field.name,
            displayName: field.displayName || field.name,
            type: field.type,
            description: field.description,
            isTimeField: field.isTimeField,
            isMetric: field.isMetric,
            isDimension: field.isDimension
          }))
        }
      }

      // 第2步：提取查询意图
      const intentResult = await extractQueryIntent(intentRequest, {
        provider: defaultConfig.provider,
        config: defaultConfig.config
      })
      
      console.log(`🎯 [Dataset Chat] 意图提取完成:`)
      console.log(`   🔍 置信度: ${intentResult.confidence}`)
      console.log(`   📊 指标数: ${intentResult.intent.metrics.length}`)
      console.log(`   📈 维度数: ${intentResult.intent.dimensions.length}`)
      console.log(`   🔧 过滤条件: ${intentResult.intent.filters.length}`)

      // 验证提取的意图
      const validation = validateQueryIntent(intentResult.intent)
      if (!validation.valid) {
        console.warn(`⚠️ [Dataset Chat] 意图验证失败:`, validation.errors)
        
        return NextResponse.json({
          message: `抱歉，无法理解您的查询需求。问题：\n${validation.errors.join('\n')}\n\n建议：\n${intentResult.suggestions?.join('\n') || '请提供更具体的查询描述，包括您关心的指标或维度信息。'}`,
          model: defaultConfig.config.model,
          provider: defaultConfig.provider,
          responseTime: Date.now() - startTime,
          datasetInfo: {
            id: dataset._id,
            name: dataset.displayName,
            type: dataset.type
          },
          intentResult: {
            confidence: intentResult.confidence,
            explanation: intentResult.explanation,
            errors: validation.errors
          }
        })
      }

      // 第3步：生成DSL和SQL
      const { dsl, sql } = intentToSQL(intentResult.intent, dataset)
      
      console.log(`🔨 [Dataset Chat] SQL生成完成:`)
      console.log(`   📝 SQL: ${sql.substring(0, 200)}${sql.length > 200 ? '...' : ''}`)

      // 第4步：执行查询
      const queryResult = await executeDatasetQuery(sql, dataset, request)
      
      // 第5步：构建响应消息
      let responseMessage = ''
      
      // 添加查询说明
      responseMessage += `**查询分析** (置信度: ${Math.round(intentResult.confidence * 100)}%)\n`
      responseMessage += `${intentResult.explanation}\n\n`
      
      // 显示查询结果
      if (queryResult.success && queryResult.data) {
        responseMessage += `**查询结果**\n`
        responseMessage += formatQueryResults(queryResult.data, intentResult.intent)
        
        if (queryResult.data.length === (intentResult.intent.limit || 100)) {
          responseMessage += `\n*注：已显示前${queryResult.data.length}条记录*`
        }
      } else {
        responseMessage += `**查询执行失败**\n`
        responseMessage += `错误信息：${queryResult.error}\n\n`
        responseMessage += `生成的SQL：\n\`\`\`sql\n${sql}\n\`\`\`\n\n`
        responseMessage += `建议：${intentResult.suggestions?.join('；') || '请检查查询条件是否正确。'}`
      }

      // 添加改进建议
      if (intentResult.suggestions && intentResult.suggestions.length > 0) {
        responseMessage += `\n\n**优化建议**\n${intentResult.suggestions.map(s => `• ${s}`).join('\n')}`
      }

      const responseTime = Date.now() - startTime
      
      console.log(`✅ [Dataset Chat] 查询完成:`)
      console.log(`   ⏱️  总响应时间: ${responseTime}ms`)
      console.log(`   📊 返回记录数: ${queryResult.success ? queryResult.data?.length || 0 : 0}`)
      
      return NextResponse.json({
        message: responseMessage,
        model: defaultConfig.config.model,
        provider: defaultConfig.provider,
        responseTime,
        datasetInfo: {
          id: dataset._id,
          name: dataset.displayName,
          type: dataset.type,
          recordCount: dataset.metadata?.recordCount || 0,
          fieldsCount: dataset.fields.length
        },
        queryInfo: {
          sql: sql,
          dsl: dsl,
          intent: intentResult.intent,
          confidence: intentResult.confidence,
          recordsReturned: queryResult.success ? queryResult.data?.length || 0 : 0
        }
      })
      
    } catch (llmError) {
      const errorMsg = llmError instanceof Error ? llmError.message : '查询处理异常'
      console.log(`❌ [Dataset Chat] 查询处理失败:`)
      console.log(`   ⏱️  响应时间: ${Date.now() - startTime}ms`)
      console.log(`   🔥 错误信息: ${errorMsg}`)
      
      return NextResponse.json(
        { error: `查询处理异常: ${errorMsg}` },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('数据集AI问答服务失败:', error)
    return NextResponse.json(
      { error: '数据集AI问答服务异常' },
      { status: 500 }
    )
  }
}

// 构建数据集上下文信息
async function buildDatasetContext(
  dataset: DatasetType, 
  includeSchema: boolean, 
  includePreview: boolean, 
  previewLimit: number,
  request: NextRequest
): Promise<{
  schema?: string
  preview?: {
    columns: Array<{ name: string; displayName?: string }>
    rows: unknown[][]
  }
  stats?: string
}> {
  const context: {
    schema?: string
    preview?: {
      columns: Array<{ name: string; displayName?: string }>
      rows: unknown[][]
    }
    stats?: string
  } = {}

  // 包含数据集架构信息
  if (includeSchema && dataset.fields.length > 0) {
    const schemaInfo = dataset.fields.map(field => {
      const fieldInfo = `${field.displayName || field.name} (${field.type})`
      const extras = []
      if (field.fieldType) extras.push(`${field.fieldType}`)
      if (field.aggregationType) extras.push(`聚合:${field.aggregationType}`)
      if (field.description) extras.push(`说明:${field.description}`)
      return extras.length > 0 ? `${fieldInfo} - ${extras.join(', ')}` : fieldInfo
    }).join('\n')
    
    context.schema = schemaInfo
  }

  // 包含数据预览
  if (includePreview) {
    try {
      const previewResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/datasets/${dataset._id}/preview`, {
        method: 'POST',
        headers: {
          'Authorization': request.headers.get('Authorization') || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ limit: previewLimit })
      })

      if (previewResponse.ok) {
        const previewData = await previewResponse.json()
        context.preview = previewData.preview
      }
    } catch (previewError) {
      console.error('获取数据预览失败:', previewError)
    }
  }

  // 包含统计信息
  if (dataset.metadata) {
    const stats = []
    if (dataset.metadata.recordCount) stats.push(`记录数: ${dataset.metadata.recordCount.toLocaleString()}`)
    if (dataset.metadata.columns) stats.push(`字段数: ${dataset.metadata.columns}`)
    if (dataset.qualityScore) stats.push(`质量评分: ${dataset.qualityScore}/100`)
    context.stats = stats.join(', ')
  }

  return context
}

// 注意：此函数已废弃，新架构不再使用旧的工具调用方式
// 保留用于兼容性，实际查询由新的意图提取架构处理

// 复用现有的callLLMAPI函数（从chat/route.ts复制）
async function callLLMAPI(config: {
  provider: string
  config: {
    apiKey: string
    apiUrl?: string
    model: string
    maxTokens?: number
    temperature?: number
    topP?: number
    frequencyPenalty?: number
    presencePenalty?: number
  }
}, messages: Message[]): Promise<string> {
  const { provider, config: llmConfig } = config
  const { apiKey, apiUrl, model } = llmConfig

  let requestUrl: string
  let requestHeaders: Record<string, string>
  let requestBody: Record<string, unknown>

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
    if (result.content && result.content[0] && result.content[0].text) {
      return result.content[0].text
    } else {
      throw new Error('Anthropic API响应格式异常')
    }
  } else {
    if (result.choices && result.choices[0] && result.choices[0].message) {
      return result.choices[0].message.content
    } else {
      throw new Error('LLM API响应格式异常')
    }
  }
}

// 支持工具调用的LLM API函数
async function callLLMAPIWithTools(config: {
  provider: string
  config: {
    apiKey: string
    apiUrl?: string
    model: string
    maxTokens?: number
    temperature?: number
    topP?: number
    frequencyPenalty?: number
    presencePenalty?: number
  }
}, messages: Message[], datasetId: string): Promise<string> {
  const { provider, config: llmConfig } = config
  const { apiKey, apiUrl, model } = llmConfig

  // 定义数据查询工具
  const tools = [
    {
      type: "function",
      function: {
        name: "queryDataset",
        description: "查询数据集中的真实数据。当用户询问任何具体数据时必须调用此函数！必须返回标准JSON格式的参数。",
        parameters: {
          type: "object",
          properties: {
            sql: {
              type: "string",
              description: "要执行的SQL查询语句（仅支持SELECT语句，不要包含解释文字）"
            },
            limit: {
              type: "number",
              description: "查询结果的最大行数限制（1-100，默认20）",
              minimum: 1,
              maximum: 100
            }
          },
          required: ["sql"],
          additionalProperties: false
        }
      }
    }
  ]

  let requestUrl: string
  let requestHeaders: Record<string, string>
  let requestBody: Record<string, unknown>

  // 只有OpenAI和兼容的API支持工具调用
  if (provider === 'openai' || provider === 'zhipu' || provider === 'moonshot' || provider === 'deepseek') {
    if (apiUrl) {
      requestUrl = apiUrl.endsWith('/chat/completions') 
        ? apiUrl 
        : `${apiUrl.replace(/\/$/, '')}/chat/completions`
    } else {
      switch (provider) {
        case 'openai':
          requestUrl = 'https://api.openai.com/v1/chat/completions'
          break
        case 'zhipu':
          requestUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
          break
        case 'moonshot':
          requestUrl = 'https://api.moonshot.cn/v1/chat/completions'
          break
        case 'deepseek':
          requestUrl = 'https://api.deepseek.com/chat/completions'
          break
        default:
          requestUrl = apiUrl || ''
      }
    }
    
    requestHeaders = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
    
    // 检查用户消息是否需要强制工具调用
    const userMessage = messages[messages.length - 1]?.content || ''
    const needsQuery = /(?:显示|查看|查询|统计|汇总|前\d+|最[高低新]|2024|202[0-9]|数据|记录|条|行)/i.test(userMessage)
    
    requestBody = {
      model,
      messages,
      tools,
      tool_choice: needsQuery ? {"type": "function", "function": {"name": "queryDataset"}} : "auto",
      max_tokens: llmConfig.maxTokens || 1000,
      temperature: llmConfig.temperature || 0.7,
      top_p: llmConfig.topP,
      frequency_penalty: llmConfig.frequencyPenalty,
      presence_penalty: llmConfig.presencePenalty
    }
  } else {
    // 对于不支持工具调用的提供商，回退到普通调用
    return callLLMAPI(config, messages)
  }

  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: requestHeaders,
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(60000)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`LLM API请求失败 (${response.status}): ${errorText}`)
  }

  const result = await response.json()
  
  // 处理工具调用
  if (result.choices && result.choices[0]) {
    const message = result.choices[0].message
    
    // 检查是否有工具调用
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0]
      
      if (toolCall.function.name === 'queryDataset') {
        try {
          // 使用健壮的参数解析函数
          const args = parseToolArguments(toolCall.function.arguments)
          const queryResult = await executeDatasetQueryOld(datasetId, args.sql, args.limit || 20)
          
          // 将查询结果格式化为Markdown表格
          let resultMarkdown = `**查询结果：**\n\n`
          
          if (queryResult.data.rowCount === 0) {
            resultMarkdown += '查询没有返回任何数据。\n\n'
          } else {
            // 创建表格头
            const headers = queryResult.data.columns.map((col: { name: string }) => col.name).join(' | ')
            const separator = queryResult.data.columns.map(() => '---').join(' | ')
            
            resultMarkdown += `| ${headers} |\n`
            resultMarkdown += `| ${separator} |\n`
            
            // 添加数据行
            queryResult.data.rows.forEach((row: unknown[]) => {
              const cells = row.map(cell => cell === null || cell === undefined ? '' : String(cell)).join(' | ')
              resultMarkdown += `| ${cells} |\n`
            })
            
            resultMarkdown += `\n**查询统计：**\n`
            resultMarkdown += `- 返回行数：${queryResult.data.rowCount}\n`
            resultMarkdown += `- 执行时间：${queryResult.data.executionTime}ms\n`
            resultMarkdown += `- 执行的SQL：\\\`${queryResult.data.sql}\\\`\n\n`
          }
          
          return resultMarkdown + (message.content || '根据查询结果，我为您提供以上数据分析。')
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '未知错误'
          console.error('数据集查询工具调用失败:', error)
          
          // 为用户提供更具体的错误指导
          let guidance = ''
          if (errorMsg.includes('不存在') || errorMsg.includes('not exist')) {
            guidance = '\n\n**可能的解决方案：**\n- 检查字段名是否正确\n- 确认表名是否存在\n- 查看数据集架构信息'
          } else if (errorMsg.includes('语法') || errorMsg.includes('syntax')) {
            guidance = '\n\n**可能的解决方案：**\n- 检查SQL语法是否正确\n- 确认使用的是SELECT语句\n- 检查字段名和表名的拼写'
          } else if (errorMsg.includes('权限') || errorMsg.includes('permission')) {
            guidance = '\n\n**可能的解决方案：**\n- 联系管理员检查数据集访问权限\n- 确认当前用户有查询该数据集的权限'
          } else {
            guidance = '\n\n**建议：**\n- 请检查数据集是否配置正确\n- 尝试使用更简单的查询语句\n- 查看数据集的字段信息和数据预览'
          }
          
          return `⚠️ **查询执行失败**\n\n**错误信息：** ${errorMsg}${guidance}\n\n如需帮助，请提供更多关于数据集结构的信息，我可以协助构建正确的查询语句。`
        }
      }
    }
    
    // 普通响应
    return message.content || ''
  } else {
    throw new Error('LLM API响应格式异常')
  }
}

// 执行数据集查询的辅助函数（新架构版本）
async function executeDatasetQuery(sql: string, dataset: DatasetType, request: NextRequest): Promise<{
  success: boolean
  data?: Array<Record<string, unknown>>
  error?: string
  executionTime: number
}> {
  const startTime = Date.now()
  
  try {
    // 确保数据集ID存在
    if (!dataset._id && !dataset.id) {
      throw new Error('数据集ID缺失')
    }
    
    const datasetId = dataset._id || dataset.id
    console.log(`[Dataset Query] 执行查询 - 数据集ID: ${datasetId}`)
    
    // 调用数据集预览API来执行查询
    const apiUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/datasets/${datasetId}/query`
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql })
    })

    const executionTime = Date.now() - startTime

    if (response.ok) {
      const result = await response.json()
      return {
        success: true,
        data: result.data || [],
        executionTime
      }
    } else {
      const error = await response.json()
      return {
        success: false,
        error: error.error || '查询执行失败',
        executionTime
      }
    }
  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error('查询执行异常:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '查询执行异常',
      executionTime
    }
  }
}

// 格式化查询结果为Markdown表格
function formatQueryResults(data: Array<Record<string, unknown>>, intent: { metrics: Array<{ displayName: string }>, dimensions: Array<{ displayName: string }> }): string {
  if (!data || data.length === 0) {
    return '查询没有返回任何数据。\n'
  }

  // 获取所有列名
  const columns = Object.keys(data[0])
  
  // 创建表格头
  const headers = columns.join(' | ')
  const separator = columns.map(() => '---').join(' | ')
  
  let markdown = `| ${headers} |\n`
  markdown += `| ${separator} |\n`
  
  // 添加数据行（最多显示前50行）
  const rowsToShow = Math.min(data.length, 50)
  for (let i = 0; i < rowsToShow; i++) {
    const row = data[i]
    const cells = columns.map(col => {
      const value = row[col]
      if (value === null || value === undefined) return ''
      if (typeof value === 'number') {
        // 格式化数字，保留适当的小数位
        return Number.isInteger(value) ? value.toString() : value.toFixed(2)
      }
      return String(value)
    }).join(' | ')
    markdown += `| ${cells} |\n`
  }
  
  // 添加统计信息
  markdown += `\n**统计信息：**\n`
  markdown += `- 查询返回：${data.length} 条记录\n`
  if (data.length > rowsToShow) {
    markdown += `- 已显示：前 ${rowsToShow} 条记录\n`
  }
  
  // 如果有聚合指标，添加汇总信息
  if (intent.metrics.length > 0) {
    markdown += `- 包含指标：${intent.metrics.map(m => m.displayName).join('、')}\n`
  }
  if (intent.dimensions.length > 0) {
    markdown += `- 按维度分组：${intent.dimensions.map(d => d.displayName).join('、')}\n`
  }
  
  return markdown
}

// 旧版本的执行函数（保留用于兼容性）
async function executeDatasetQueryOld(datasetId: string, sql: string, limit: number = 20): Promise<{
  success: boolean
  data: {
    columns: Array<{ name: string }>
    rows: unknown[][]
    rowCount: number
    executionTime: number
    sql: string
    datasetInfo: {
      id: string
      name: string
      displayName: string
      type: string
    }
  }
}> {
  // 直接调用数据库查询，避免HTTP请求循环
  try {
    // 验证limit参数
    if (limit < 1 || limit > 100) {
      throw new Error('limit 必须在 1-100 之间')
    }

    // 获取数据集信息
    const dataset = await Dataset.findById(datasetId)
    if (!dataset) {
      throw new Error('数据集不存在')
    }

    // SQL安全检查
    const dangerousKeywords = [
      'DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 
      'CREATE', 'TRUNCATE', 'REPLACE', 'MERGE',
      'EXEC', 'EXECUTE', 'CALL', 'DECLARE'
    ]
    
    const upperSQL = sql.toUpperCase()
    for (const keyword of dangerousKeywords) {
      if (upperSQL.includes(keyword)) {
        throw new Error(`不允许执行包含 ${keyword} 的SQL语句，仅支持查询操作`)
      }
    }

    // 确保SQL以SELECT开头
    if (!upperSQL.trim().startsWith('SELECT')) {
      throw new Error('仅支持SELECT查询语句')
    }

    // 智能转换中文字段名为英文字段名
    let translatedSQL = translateSQLFields(sql.trim(), dataset)

    // 添加LIMIT限制
    let finalSQL = translatedSQL
    const upperTranslatedSQL = translatedSQL.toUpperCase()
    if (!upperTranslatedSQL.includes('LIMIT')) {
      finalSQL += ` LIMIT ${limit}`
    }

    // 执行查询
    const startTime = Date.now()
    let result
    const { executeQuery } = await import('@/lib/mysql')
    
    // 确保连接到数据库
    await connectDB()
    
    switch (dataset.type) {
      case 'table':
        // 对于表类型，需要构建完整的查询
        const tableQuery = finalSQL.replace(
          /FROM\s+[\w_]+/gi,
          `FROM ${dataset.dataSource?.schema ? `${dataset.dataSource.schema}.` : ''}${dataset.config?.table || dataset.name}`
        )
        result = await executeQuery(dataset.dataSource!._id, tableQuery)
        break
        
      case 'sql':
        // 对于SQL类型，可能需要包装用户的查询
        if (dataset.config?.sql) {
          // 如果用户查询是简单的字段选择，包装到数据集的SQL中
          if (finalSQL.toLowerCase().includes('from') === false) {
            finalSQL = `${finalSQL} FROM (${dataset.config.sql}) AS dataset_view LIMIT ${limit}`
          }
        }
        result = await executeQuery(dataset.dataSource!._id, finalSQL)
        break
        
      case 'view':
        // 视图类型处理
        const viewQuery = finalSQL.replace(
          /FROM\s+[\w_]+/gi,
          `FROM ${dataset.config?.view || dataset.name}`
        )
        result = await executeQuery(dataset.dataSource!._id, viewQuery)
        break
        
      default:
        throw new Error(`不支持的数据集类型: ${dataset.type}`)
    }

    const executionTime = Date.now() - startTime

    // 格式化结果
    return {
      success: true,
      data: {
        columns: result.columns || [],
        rows: result.rows || [],
        rowCount: result.rows?.length || 0,
        executionTime,
        sql: finalSQL,
        datasetInfo: {
          id: dataset._id,
          name: dataset.name,
          displayName: dataset.displayName,
          type: dataset.type
        }
      }
    }

  } catch (error) {
    console.error('数据集查询失败:', error)
    throw new Error(error instanceof Error ? error.message : '查询执行失败')
  }
}

// 智能转换SQL中的中文字段名为英文字段名
function translateSQLFields(sql: string, dataset: DatasetType): string {
  if (!dataset.fields || dataset.fields.length === 0) {
    return sql
  }

  let translatedSQL = sql

  // 创建中文到英文的映射
  const fieldMapping: { [key: string]: string } = {}
  
  dataset.fields.forEach(field => {
    if (field.displayName && field.name !== field.displayName) {
      // 将中文显示名映射到英文字段名
      fieldMapping[field.displayName] = field.name
      
      // 也处理带引号的情况
      fieldMapping[`"${field.displayName}"`] = `"${field.name}"`
      fieldMapping[`'${field.displayName}'`] = `'${field.name}'`
      fieldMapping[`\`${field.displayName}\``] = `\`${field.name}\``
    }
  })

  // 替换字段名
  Object.entries(fieldMapping).forEach(([chineseName, englishName]) => {
    // 使用全局正则替换，考虑各种引号情况
    const regex = new RegExp(chineseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    translatedSQL = translatedSQL.replace(regex, englishName)
  })

  // 处理表名转换（如果数据集有配置的实际表名）
  if (dataset.config?.table && dataset.displayName) {
    // 替换中文表名为英文表名
    const tablePatterns = [
      `"${dataset.displayName}"`,
      `'${dataset.displayName}'`,
      `\`${dataset.displayName}\``,
      dataset.displayName
    ]
    
    tablePatterns.forEach(pattern => {
      const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
      translatedSQL = translatedSQL.replace(regex, dataset.config?.table || dataset.name)
    })
  }

  console.log('[Dataset Chat] SQL转换:', { 原始: sql, 转换后: translatedSQL })
  return translatedSQL
}

// 修复LLM工具调用参数的JSON格式问题
function parseToolArguments(argumentsString: string): { sql: string; limit?: number } {
  console.log('[Dataset Chat] 原始参数字符串:', argumentsString)
  
  try {
    // 首先尝试直接解析
    const parsed = JSON.parse(argumentsString)
    if (parsed.sql) {
      return parsed
    }
  } catch {
    // 直接解析失败，尝试修复
  }
  
  // 清理常见的格式问题
  let cleaned = argumentsString
  
  // 移除开头和结尾的非JSON内容
  const jsonStart = cleaned.indexOf('{')
  const jsonEnd = cleaned.lastIndexOf('}')
  
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1)
  }
  
  // 尝试再次解析清理后的字符串
  try {
    const parsed = JSON.parse(cleaned)
    if (parsed.sql) {
      return parsed
    }
  } catch {
    // 仍然失败，使用正则提取
  }
  
  // 使用正则表达式提取SQL和limit
  const sqlPatterns = [
    /"sql":\s*"([^"]*(?:\\.[^"]*)*)"/i,  // 处理包含转义字符的情况
    /'sql':\s*'([^']*(?:\\.[^']*)*)'/i,  // 处理包含转义字符的情况
    /"sql":\s*`([^`]+)`/i,
    /"sql":\s*"([^"]+)/i,  // 处理截断的情况，没有结束引号
    /'sql':\s*'([^']+)/i   // 处理截断的情况，没有结束引号
  ]
  
  const limitPatterns = [
    /"limit":\s*(\d+)/i,
    /'limit':\s*(\d+)/i
  ]
  
  let sql = ''
  let limit = 20
  
  // 尝试匹配SQL
  for (const pattern of sqlPatterns) {
    const match = argumentsString.match(pattern)
    if (match) {
      sql = match[1]
      break
    }
  }
  
  // 尝试匹配limit
  for (const pattern of limitPatterns) {
    const match = argumentsString.match(pattern)
    if (match) {
      limit = parseInt(match[1])
      break
    }
  }
  
  if (!sql) {
    // 最后尝试：寻找SELECT关键词并提取完整SQL
    const selectMatch = argumentsString.match(/SELECT[\s\S]+?(?=LIMIT|\}|$)/i)
    if (selectMatch) {
      sql = selectMatch[0].trim()
    } else {
      // 如果整个字符串看起来像是SQL
      const trimmed = argumentsString.trim()
      if (trimmed.toLowerCase().startsWith('select')) {
        sql = trimmed
      } else {
        throw new Error('无法从工具调用参数中提取SQL语句')
      }
    }
  }
  
  // 清理SQL语句中可能的残留字符
  sql = sql.replace(/[{}"]$/, '').trim()
  
  console.log('[Dataset Chat] 提取的参数:', { sql, limit })
  return { sql, limit }
}