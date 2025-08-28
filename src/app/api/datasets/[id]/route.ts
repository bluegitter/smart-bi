import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { DatasetService } from '@/lib/services/datasetService'
import type { UpdateDatasetRequest } from '@/types/dataset'

// POST /api/datasets/[id] - 获取数据集详情
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    const { id } = await params
    const dataset = await DatasetService.getDataset(user._id, id)
    
    return NextResponse.json({ dataset })
  } catch (error) {
    console.error('获取数据集失败:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '获取数据集失败' 
    }, { status: 500 })
  }
}

// PUT /api/datasets/[id] - 更新数据集
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    const { id } = await params
    const body: UpdateDatasetRequest = await request.json()
    
    console.log('API接收到的数据:', JSON.stringify(body, null, 2))
    console.log('字段数据:', body.fields?.map(f => ({ name: f.name, fieldType: f.fieldType, unit: f.unit })))
    
    const dataset = await DatasetService.updateDataset(user._id, id, body)
    
    return NextResponse.json({ dataset })
  } catch (error) {
    console.error('更新数据集失败:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '更新数据集失败' 
    }, { status: 500 })
  }
}

// DELETE /api/datasets/[id] - 删除数据集
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    const { id } = await params
    await DatasetService.deleteDataset(user._id, id)
    
    return NextResponse.json({ message: '数据集删除成功' })
  } catch (error) {
    console.error('删除数据集失败:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '删除数据集失败' 
    }, { status: 500 })
  }
}