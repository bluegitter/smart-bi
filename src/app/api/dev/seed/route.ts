import { NextResponse } from 'next/server'
import { initializeSeedData, clearAllData } from '@/lib/seedData'

// 仅在开发环境可用的种子数据初始化端点
export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  try {
    await initializeSeedData()
    
    return NextResponse.json({
      message: '种子数据初始化成功',
      success: true
    })
  } catch (error) {
    console.error('种子数据初始化失败:', error)
    return NextResponse.json(
      { 
        error: '种子数据初始化失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// 清除所有数据（开发环境）
export async function DELETE() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  try {
    await clearAllData()
    
    return NextResponse.json({
      message: '所有数据已清除',
      success: true
    })
  } catch (error) {
    console.error('清除数据失败:', error)
    return NextResponse.json(
      { 
        error: '清除数据失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}