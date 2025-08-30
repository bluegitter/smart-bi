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

    // 构建更新对象，支持部分更新
    const updateData: any = {
      updatedAt: new Date()
    }

    // 只更新提供的字段
    if (data.name !== undefined) updateData.name = data.name
    if (data.displayName !== undefined) updateData.displayName = data.displayName
    if (data.provider !== undefined) updateData.provider = data.provider
    if (data.description !== undefined) updateData.description = data.description
    if (data.tags !== undefined) updateData.tags = data.tags
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault
    if (data.capabilities !== undefined) updateData.capabilities = data.capabilities
    if (data.limits !== undefined) updateData.limits = data.limits

    // 处理config对象的部分更新
    if (data.config) {
      const configUpdate: any = {}
      if (data.config.apiKey !== undefined) configUpdate['config.apiKey'] = data.config.apiKey
      if (data.config.apiUrl !== undefined) configUpdate['config.apiUrl'] = data.config.apiUrl
      if (data.config.model !== undefined) configUpdate['config.model'] = data.config.model
      if (data.config.temperature !== undefined) configUpdate['config.temperature'] = data.config.temperature
      if (data.config.maxTokens !== undefined) configUpdate['config.maxTokens'] = data.config.maxTokens
      if (data.config.topP !== undefined) configUpdate['config.topP'] = data.config.topP
      if (data.config.frequencyPenalty !== undefined) configUpdate['config.frequencyPenalty'] = data.config.frequencyPenalty
      if (data.config.presencePenalty !== undefined) configUpdate['config.presencePenalty'] = data.config.presencePenalty
      
      Object.assign(updateData, configUpdate)
    }

    // 更新配置
    const updatedConfig = await LLMConfig.findByIdAndUpdate(
      id,
      { $set: updateData },
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

    // 检查是否还有其他活跃配置，避免删除最后一个配置
    const activeConfigCount = await LLMConfig.countDocuments({
      userId: user._id,
      isActive: true,
      _id: { $ne: id }
    })

    if (activeConfigCount === 0) {
      return NextResponse.json(
        { error: '不能删除最后一个活跃配置，请先添加其他配置或停用当前配置' },
        { status: 400 }
      )
    }

    // 记录删除操作日志
    console.log(`用户 ${user._id} 删除LLM配置: ${existingConfig.name} (${existingConfig.displayName})`)

    // 执行删除操作
    await LLMConfig.findByIdAndDelete(id)

    return NextResponse.json({ 
      message: '配置删除成功',
      deletedConfig: {
        name: existingConfig.name,
        displayName: existingConfig.displayName,
        provider: existingConfig.provider
      }
    })
  } catch (error) {
    console.error('删除LLM配置失败:', error)
    return NextResponse.json(
      { error: '删除配置失败' },
      { status: 500 }
    )
  }
}