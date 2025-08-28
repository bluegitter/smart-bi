import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { LLMConfig } from '@/models/LLMConfig'
import { connectDB } from '@/lib/mongodb'
import { z } from 'zod'
import type { UpdateLLMConfigRequest } from '@/types/llm'

// LLM配置更新验证模式
const updateLLMConfigSchema = z.object({
  name: z.string().min(1, '配置名称不能为空').max(100, '配置名称不能超过100字符').optional(),
  displayName: z.string().min(1, '显示名称不能为空').max(200, '显示名称不能超过200字符').optional(),
  provider: z.enum(['openai', 'anthropic', 'zhipu', 'baidu', 'alibaba', 'tencent', 'moonshot', 'deepseek', 'custom'], {
    errorMap: () => ({ message: '不支持的LLM提供商' })
  }).optional(),
  config: z.object({
    apiKey: z.string().min(1, 'API密钥不能为空').optional(),
    apiUrl: z.string().url().optional(),
    model: z.string().min(1, '模型名称不能为空').optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).max(200000).optional(),
    topP: z.number().min(0).max(1).optional(),
    frequencyPenalty: z.number().min(-2).max(2).optional(),
    presencePenalty: z.number().min(-2).max(2).optional()
  }).optional(),
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
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional()
})

// POST /api/llm/configs/[id] - 获取指定LLM配置
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

    const { id } = await params
    const config = await LLMConfig.findById(id).lean()
    
    if (!config) {
      return NextResponse.json(
        { error: '配置不存在' },
        { status: 404 }
      )
    }

    // 检查权限
    if (config.userId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: '无权访问此配置' },
        { status: 403 }
      )
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('获取LLM配置失败:', error)
    return NextResponse.json(
      { error: '获取配置失败' },
      { status: 500 }
    )
  }
}

// PUT /api/llm/configs/[id] - 更新LLM配置
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    await connectDB()

    const body = await request.json()
    
    // 验证请求数据
    const validationResult = updateLLMConfigSchema.safeParse(body)
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
    const { id } = await params

    // 查找现有配置
    const existingConfig = await LLMConfig.findById(id)
    
    if (!existingConfig) {
      return NextResponse.json(
        { error: '配置不存在' },
        { status: 404 }
      )
    }

    // 检查权限
    if (existingConfig.userId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: '无权修改此配置' },
        { status: 403 }
      )
    }

    // 如果要更新名称，检查新名称是否已存在
    if (data.name && data.name !== existingConfig.name) {
      const nameExists = await LLMConfig.findOne({
        userId: user._id,
        name: data.name,
        _id: { $ne: id }
      })

      if (nameExists) {
        return NextResponse.json(
          { error: '配置名称已存在' },
          { status: 409 }
        )
      }
    }

    // 更新配置
    const updatedConfig = await LLMConfig.findByIdAndUpdate(
      id,
      {
        ...data,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    )

    return NextResponse.json(updatedConfig)
  } catch (error) {
    console.error('更新LLM配置失败:', error)
    return NextResponse.json(
      { error: '更新配置失败' },
      { status: 500 }
    )
  }
}

// DELETE /api/llm/configs/[id] - 删除LLM配置
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    await connectDB()

    const { id } = await params

    // 查找现有配置
    const existingConfig = await LLMConfig.findById(id)
    
    if (!existingConfig) {
      return NextResponse.json(
        { error: '配置不存在' },
        { status: 404 }
      )
    }

    // 检查权限
    if (existingConfig.userId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: '无权删除此配置' },
        { status: 403 }
      )
    }

    // 如果是默认配置，不允许删除
    if (existingConfig.isDefault) {
      return NextResponse.json(
        { error: '不能删除默认配置，请先设置其他配置为默认配置' },
        { status: 400 }
      )
    }

    // 删除配置
    await LLMConfig.findByIdAndDelete(id)

    return NextResponse.json({ message: '配置删除成功' })
  } catch (error) {
    console.error('删除LLM配置失败:', error)
    return NextResponse.json(
      { error: '删除配置失败' },
      { status: 500 }
    )
  }
}