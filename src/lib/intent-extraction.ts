/**
 * 意图提取服务 - 使用LLM将自然语言转换为结构化查询意图
 */

import { IntentExtractionRequest, IntentExtractionResponse, QueryIntent } from '@/types/query-intent'
import { LLMConfig } from '@/models/LLMConfig'

/**
 * 提取用户查询意图
 * 调用LLM分析用户自然语言，提取时间范围、指标、维度和过滤条件
 */
export async function extractQueryIntent(
  request: IntentExtractionRequest, 
  llmConfig?: { provider: string; config: any }
): Promise<IntentExtractionResponse> {
  const { query, datasetSchema } = request

  // 构建数据集字段信息的描述
  const fieldsDescription = datasetSchema.fields.map(field => {
    const typeInfo = []
    if (field.isTimeField) typeInfo.push('时间字段')
    if (field.isMetric) typeInfo.push('指标字段')
    if (field.isDimension) typeInfo.push('维度字段')
    
    return `- ${field.displayName} (${field.name}): ${field.type}${field.description ? ` - ${field.description}` : ''}${typeInfo.length ? ` [${typeInfo.join(', ')}]` : ''}`
  }).join('\n')

  const systemPrompt = `你是一个专业的数据分析意图提取专家。你的任务是分析用户的自然语言查询，并提取出结构化的查询意图。

数据集信息：
- 数据集名称：${datasetSchema.displayName} (${datasetSchema.name})
- 字段列表：
${fieldsDescription}

你需要从用户查询中提取以下信息：
1. 时间范围 (timeRange)：识别查询的时间条件
2. 指标 (metrics)：用户关心的数值型字段和聚合方式
3. 维度 (dimensions)：用户想要分组或查看的分类字段
4. 过滤条件 (filters)：除时间外的其他筛选条件
5. 排序和限制 (orderBy, limit)：结果排序和数量限制

时间范围类型说明：
- absolute: 绝对时间，如"2024年1月"
- relative: 相对时间，如"最近30天"  
- period: 周期性时间，如"每月"

聚合方式说明：
- sum: 求和
- count: 计数
- avg: 平均值
- max: 最大值
- min: 最小值
- distinct_count: 去重计数

请严格按照以下JSON格式返回结果，不要添加任何额外说明：

{
  "intent": {
    "timeRange": {
      "type": "absolute|relative|period",
      "start": "时间开始值",
      "end": "时间结束值", 
      "period": "day|week|month|quarter|year",
      "value": 数值,
      "format": "date|datetime|timestamp|period"
    },
    "metrics": [
      {
        "field": "英文字段名",
        "displayName": "中文显示名", 
        "aggregation": "聚合方式",
        "alias": "别名"
      }
    ],
    "dimensions": [
      {
        "field": "英文字段名",
        "displayName": "中文显示名",
        "groupBy": true,
        "orderBy": "asc|desc"
      }
    ],
    "filters": [
      {
        "field": "英文字段名",
        "displayName": "中文显示名",
        "operator": "=|!=|>|<|>=|<=|in|not_in|like|between",
        "value": "过滤值或数组",
        "dataType": "string|number|date|boolean"
      }
    ],
    "limit": 数量限制,
    "orderBy": {
      "field": "排序字段",
      "direction": "asc|desc"
    },
    "description": "原始查询描述"
  },
  "confidence": 0.95,
  "explanation": "意图提取的解释说明",
  "suggestions": ["改进建议1", "改进建议2"]
}`

  try {
    // 如果没有提供LLM配置，尝试获取默认配置
    if (!llmConfig) {
      throw new Error('需要提供LLM配置信息')
    }

    const { provider, config } = llmConfig
    const { apiKey, apiUrl, model } = config

    // 构建请求参数
    let requestUrl: string
    let requestHeaders: Record<string, string>
    let requestBody: Record<string, unknown>

    switch (provider) {
      case 'openai':
        // 处理自定义OpenAI兼容API URL
        if (apiUrl) {
          requestUrl = apiUrl.endsWith('/chat/completions') 
            ? apiUrl 
            : `${apiUrl.replace(/\/$/, '')}/v1/chat/completions`
        } else {
          requestUrl = 'https://api.openai.com/v1/chat/completions'
        }
        requestHeaders = {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
        requestBody = {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `请分析以下查询并提取意图：${query}` }
          ],
          temperature: 0.3,
          max_tokens: 2000
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
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `请分析以下查询并提取意图：${query}` }
          ],
          temperature: 0.3,
          max_tokens: 2000
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
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `请分析以下查询并提取意图：${query}` }
          ],
          temperature: 0.3,
          max_tokens: 2000
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
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `请分析以下查询并提取意图：${query}` }
          ],
          temperature: 0.3,
          max_tokens: 2000
        }
        break

      case 'custom':
        if (!apiUrl) {
          throw new Error('自定义提供商需要指定API URL')
        }
        requestUrl = apiUrl.endsWith('/chat/completions') 
          ? apiUrl 
          : `${apiUrl.replace(/\/$/, '')}/v1/chat/completions`
        requestHeaders = {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
        requestBody = {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `请分析以下查询并提取意图：${query}` }
          ],
          temperature: 0.3,
          max_tokens: 2000
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
      signal: AbortSignal.timeout(30000)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`LLM API请求失败 (${response.status}): ${errorText}`)
    }

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('AI响应为空')
    }

    // 解析AI响应的JSON
    let parsedResponse: IntentExtractionResponse
    try {
      parsedResponse = JSON.parse(content)
    } catch (parseError) {
      console.error('[意图提取] JSON解析失败:', content)
      
      // 尝试提取JSON内容
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          parsedResponse = JSON.parse(jsonMatch[0])
        } catch {
          throw new Error(`JSON解析失败: ${content}`)
        }
      } else {
        throw new Error(`无法找到JSON格式的响应: ${content}`)
      }
    }

    // 验证响应格式
    if (!parsedResponse.intent || !Array.isArray(parsedResponse.intent.metrics)) {
      throw new Error('响应格式不正确，缺少必需的intent.metrics字段')
    }

    // 设置默认值
    parsedResponse.intent.description = query
    parsedResponse.confidence = parsedResponse.confidence || 0.8
    parsedResponse.explanation = parsedResponse.explanation || '意图提取完成'

    console.log('[意图提取] 成功:', {
      query,
      intent: parsedResponse.intent,
      confidence: parsedResponse.confidence
    })

    return parsedResponse

  } catch (error) {
    console.error('[意图提取] 失败:', error)
    
    // 基于关键词的简单兜底逻辑
    const fallbackIntent = generateFallbackIntent(query, datasetSchema)
    
    console.log('[意图提取] 兜底机制结果:', {
      原始查询: query,
      提取的指标数: fallbackIntent.metrics.length,
      提取的维度数: fallbackIntent.dimensions.length,
      过滤条件数: fallbackIntent.filters.length,
      限制: fallbackIntent.limit
    })
    
    return {
      intent: fallbackIntent,
      confidence: 0.3, // 提高置信度，因为有简单的关键词匹配
      explanation: `LLM意图提取失败，使用关键词匹配: ${error instanceof Error ? error.message : '未知错误'}`,
      suggestions: [
        '请检查LLM配置是否正确',
        '尝试使用更明确的查询描述，如"显示前10条数据"',
        '包含具体的字段名或时间范围，如"2024年1月的营收数据"'
      ]
    }
  }
}

/**
 * 生成兜底查询意图
 * 当LLM调用失败时，使用简单的关键词匹配
 */
function generateFallbackIntent(query: string, datasetSchema: any): QueryIntent {
  const intent: QueryIntent = {
    metrics: [],
    dimensions: [],
    filters: [],
    description: query
  }

  const queryLower = query.toLowerCase()

  // 检测常见的查询需求 - 扩大匹配范围
  if (queryLower.includes('显示') || queryLower.includes('查看') || queryLower.includes('查询') || 
      queryLower.includes('情况') || queryLower.includes('数据') || queryLower.includes('统计') ||
      queryLower.includes('分组') || queryLower.includes('收入') || queryLower.includes('支出') ||
      queryLower.includes('财务') || queryLower.includes('营收') || queryLower.includes('成本') ||
      query.match(/\d{4}年/)) { // 包含年份的查询
    // 如果包含"前N条"或"前几条"
    const limitMatch = query.match(/前(\d+)条|前几条/)
    if (limitMatch) {
      intent.limit = limitMatch[1] ? parseInt(limitMatch[1]) : 10
    } else {
      intent.limit = 20 // 默认显示20条
    }

    // 尝试识别时间相关的查询
    const timeMatches = [
      query.match(/(\d{4})年(\d{1,2})月/), // 2024年1月  
      query.match(/(\d{4})年/), // 2024年
      query.match(/(\d{6})/), // 202401
    ]

    console.log('[兜底机制] 时间匹配尝试:', { query, timeMatches })

    for (const match of timeMatches) {
      if (match) {
        console.log('[兜底机制] 找到时间匹配:', match)
        const timeField = datasetSchema.fields.find((f: any) => f.isTimeField)
        console.log('[兜底机制] 时间字段:', timeField)
        
        if (timeField) {
          let timeValue = match[0]
          // 转换时间格式
          if (match[0].includes('年')) {
            if (match[0].includes('月')) {
              // 2024年1月 -> 202401
              timeValue = match[0].replace(/(\d{4})年(\d{1,2})月/, (_, year, month) => {
                return year + month.padStart(2, '0')
              })
            } else {
              // 2024年 -> 2024
              timeValue = match[1]
            }
          }
          
          console.log('[兜底机制] 转换后的时间值:', timeValue)
          
          intent.filters.push({
            field: timeField.name,
            displayName: timeField.displayName,
            operator: queryLower.includes('年') && !queryLower.includes('月') ? '>=' : '=',
            value: timeValue,
            dataType: 'date'
          })
        } else {
          console.log('[兜底机制] 警告：未找到时间字段')
        }
        break
      }
    }

    // 尝试识别指标关键词
    const metricKeywords = ['营收', '收入', '成本', '支出', '利润', '金额', '数量', '总额', '费用']
    
    console.log('[兜底机制] 数据集字段:', datasetSchema.fields.map((f: any) => ({
      name: f.name, 
      displayName: f.displayName, 
      isMetric: f.isMetric,
      type: f.type
    })))
    
    // 先尝试通过isMetric标记找指标字段
    let foundMetrics = datasetSchema.fields.filter((field: any) => 
      field.isMetric && metricKeywords.some(keyword => 
        field.displayName.includes(keyword) || queryLower.includes(keyword)
      )
    )
    
    // 如果没有找到isMetric字段，尝试通过字段名和类型匹配
    if (foundMetrics.length === 0) {
      foundMetrics = datasetSchema.fields.filter((field: any) => 
        (field.type === 'number' || field.displayName.includes('金额') || field.displayName.includes('数量')) &&
        metricKeywords.some(keyword => 
          field.displayName.includes(keyword) || queryLower.includes(keyword)
        )
      )
    }
    
    console.log('[兜底机制] 找到的指标字段:', foundMetrics)

    // 如果查询中包含财务相关词汇，添加相关指标（过滤无意义字段）
    if (queryLower.includes('收支') || queryLower.includes('财务') || 
        queryLower.includes('收入') || queryLower.includes('支出') ||
        queryLower.includes('营收') || queryLower.includes('成本')) {
      
      // 过滤出有意义的数值字段
      const meaningfulMetrics = foundMetrics.filter((field: any) => 
        !field.name.toLowerCase().includes('id') && 
        !field.displayName.includes('主键') &&
        !field.displayName.includes('自增') &&
        !field.displayName.includes('时间') &&
        !field.displayName.includes('创建') &&
        !field.displayName.includes('日期') &&
        !field.name.toLowerCase().includes('date') &&
        !field.name.toLowerCase().includes('created') &&
        !field.name.toLowerCase().includes('updated')
      )
      
      meaningfulMetrics.forEach((field: any) => {
        intent.metrics.push({
          field: field.name,
          displayName: field.displayName,
          aggregation: 'sum',
          alias: `总${field.displayName}`
        })
      })
      console.log('[兜底机制] 添加了过滤后的财务相关指标:', meaningfulMetrics)
    }

    // 识别维度关键词（分组）
    console.log('[兜底机制] 检查分组关键词:', { 
      query,
      包含按: queryLower.includes('按'),
      包含分组: queryLower.includes('分组'),
      包含部门: queryLower.includes('部门')
    })
    
    if ((queryLower.includes('按') && queryLower.includes('分组')) || queryLower.includes('部门')) {
      const dimensionKeywords = ['部门', '地区', '类型', '级别', '分类']
      
      // 先尝试通过isDimension标记找维度字段
      let foundDimensions = datasetSchema.fields.filter((field: any) => 
        field.isDimension && dimensionKeywords.some(keyword => 
          field.displayName.includes(keyword) || queryLower.includes(keyword)
        )
      )
      
      // 如果没有找到isDimension字段，尝试通过字段名匹配
      if (foundDimensions.length === 0) {
        foundDimensions = datasetSchema.fields.filter((field: any) => 
          field.type === 'string' && dimensionKeywords.some(keyword => 
            field.displayName.includes(keyword) || queryLower.includes(keyword)
          )
        )
      }
      
      console.log('[兜底机制] 找到的维度字段:', foundDimensions)
      
      foundDimensions.forEach((field: any) => {
        intent.dimensions.push({
          field: field.name,
          displayName: field.displayName,
          groupBy: true,
          orderBy: 'desc' // 默认降序排列
        })
      })
      
      console.log('[兜底机制] 添加了分组维度:', intent.dimensions)
    }

    // 如果没有找到任何指标或维度，但查询看起来像是分析需求，尝试添加默认字段
    if (intent.metrics.length === 0 && intent.dimensions.length === 0) {
      // 对于财务查询，尝试添加合适的数值字段作为指标
      if (queryLower.includes('财务') || queryLower.includes('收支') || queryLower.includes('金额')) {
        const numericFields = datasetSchema.fields.filter((field: any) => 
          (field.type === 'number' || field.isMetric) &&
          !field.name.toLowerCase().includes('id') && 
          !field.displayName.includes('主键') &&
          !field.displayName.includes('自增') &&
          !field.displayName.includes('时间') &&
          !field.displayName.includes('创建') &&
          !field.name.toLowerCase().includes('date') &&
          !field.name.toLowerCase().includes('created') &&
          !field.name.toLowerCase().includes('updated')
        )
        numericFields.forEach((field: any) => {
          intent.metrics.push({
            field: field.name,
            displayName: field.displayName,
            aggregation: 'sum',
            alias: `总${field.displayName}`
          })
        })
        console.log('[兜底机制] 添加了筛选后的财务指标:', numericFields)
        
        // 添加第一个维度字段用于分组
        const dimensionField = datasetSchema.fields.find((field: any) => 
          field.isDimension || field.type === 'string'
        )
        if (dimensionField) {
          intent.dimensions.push({
            field: dimensionField.name,
            displayName: dimensionField.displayName,
            groupBy: true
          })
        }
      } else {
        // 其他查询，添加有意义的字段作为维度（排除ID等无意义字段）
        const meaningfulFields = datasetSchema.fields.filter((field: any) => 
          !field.name.toLowerCase().includes('id') && 
          !field.displayName.includes('主键') &&
          !field.displayName.includes('自增')
        ).slice(0, 3)
        
        meaningfulFields.forEach((field: any) => {
          intent.dimensions.push({
            field: field.name,
            displayName: field.displayName,
            groupBy: false
          })
        })
        
        console.log('[兜底机制] 添加了默认有意义字段:', meaningfulFields)
      }
    }
  }

  // 最终清理：如果找到了指标和分组维度，清除非分组的默认维度
  if (intent.metrics.length > 0) {
    const groupByDimensions = intent.dimensions.filter(d => d.groupBy)
    if (groupByDimensions.length > 0) {
      intent.dimensions = groupByDimensions
      console.log('[兜底机制] 清理后保留分组维度:', intent.dimensions)
    }
  }

  return intent
}

/**
 * 验证提取的意图是否有效
 */
export function validateQueryIntent(intent: QueryIntent): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // 检查是否有指标或维度（对于基本查询场景放宽要求）
  if (intent.metrics.length === 0 && intent.dimensions.length === 0 && !intent.limit) {
    errors.push('查询意图必须包含至少一个指标、维度或数据限制条件')
  }

  // 验证指标字段
  intent.metrics.forEach((metric, index) => {
    if (!metric.field || !metric.displayName) {
      errors.push(`指标 ${index + 1} 缺少必需的字段信息`)
    }
    if (!['sum', 'count', 'avg', 'max', 'min', 'distinct_count'].includes(metric.aggregation)) {
      errors.push(`指标 ${index + 1} 的聚合方式无效: ${metric.aggregation}`)
    }
  })

  // 验证维度字段
  intent.dimensions.forEach((dimension, index) => {
    if (!dimension.field || !dimension.displayName) {
      errors.push(`维度 ${index + 1} 缺少必需的字段信息`)
    }
  })

  // 验证过滤条件
  intent.filters.forEach((filter, index) => {
    if (!filter.field || !filter.displayName || filter.value === undefined) {
      errors.push(`过滤条件 ${index + 1} 缺少必需的字段信息`)
    }
    const validOperators = ['=', '!=', '>', '<', '>=', '<=', 'in', 'not_in', 'like', 'between']
    if (!validOperators.includes(filter.operator)) {
      errors.push(`过滤条件 ${index + 1} 的操作符无效: ${filter.operator}`)
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}