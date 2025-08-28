import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { LLMConfig } from '@/models/LLMConfig'
import { connectDB } from '@/lib/mongodb'
import { z } from 'zod'
import type { CreateLLMConfigRequest } from '@/types/llm'

// LLM配置创建验证模式
const createLLMConfigSchema = z.object({
  name: z.string().min(1, '配置名称不能为空').max(100, '配置名称不能超过100字符'),
  displayName: z.string().min(1, '显示名称不能为空').max(200, '显示名称不能超过200字符'),
  provider: z.enum(['openai', 'anthropic', 'zhipu', 'baidu', 'alibaba', 'tencent', 'moonshot', 'deepseek', 'custom'], {
    errorMap: () => ({ message: '不支持的LLM提供商' })
  }),
  config: z.object({
    apiKey: z.string().min(1, 'API密钥不能为空'),
    apiUrl: z.string().url().optional(),
    model: z.string().min(1, '模型名称不能为空'),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).max(200000).optional(),
    topP: z.number().min(0).max(1).optional(),
    frequencyPenalty: z.number().min(-2).max(2).optional(),
    presencePenalty: z.number().min(-2).max(2).optional()
  }),
  capabilities: z.object({
    chat: z.boolean().optional(),
    completion: z.boolean().optional(),
    embedding: z.boolean().optional(),
    vision: z.boolean().optional(),
    functionCalling: z.boolean().optional()
  }).optional(),
  limits: z.object({
    maxRequestsPerMinute: z.number().positive().optional(),
    maxRequestsPerDay: z.number().positive().optional(),
    maxContextLength: z.number().positive().optional()
  }).optional(),
  description: z.string().max(500).optional(),
  tags: z.array(z.string()).optional()
})

// POST /api/llm/configs - 获取用户的LLM配置列表  
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const provider = searchParams.get('provider')
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const skip = (page - 1) * limit

    // 构建查询条件
    const query: any = { userId: user._id }
    
    if (activeOnly) {
      query.isActive = true
    }

    if (provider) {
      query.provider = provider
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    // 执行查询
    const [configs, total] = await Promise.all([
      LLMConfig.find(query)
        .sort({ isDefault: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LLMConfig.countDocuments(query)
    ])

    return NextResponse.json({
      configs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('获取LLM配置列表失败:', error)
    return NextResponse.json(
      { error: '获取配置列表失败' },
      { status: 500 }
    )
  }
}

// PUT /api/llm/configs - 创建LLM配置
export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    await connectDB()

    const body = await request.json()
    
    // 验证请求数据
    const validationResult = createLLMConfigSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: '数据验证失败',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // 检查配置名称是否已存在
    const existingConfig = await LLMConfig.findOne({
      userId: user._id,
      name: data.name
    })

    if (existingConfig) {
      return NextResponse.json(
        { error: '配置名称已存在' },
        { status: 409 }
      )
    }

    // 如果是第一个配置，设为默认
    const configCount = await LLMConfig.countDocuments({ userId: user._id })
    const isDefault = configCount === 0

    // 创建配置
    const config = new LLMConfig({
      ...data,
      userId: user._id,
      isDefault,
      isActive: true
    })

    await config.save()

    // 返回配置（不包含敏感信息）
    const result = await LLMConfig.findById(config._id)
    
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('创建LLM配置失败:', error)
    return NextResponse.json(
      { error: '创建配置失败' },
      { status: 500 }
    )
  }
}