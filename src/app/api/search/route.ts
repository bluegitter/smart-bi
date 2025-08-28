import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { connectDB } from '@/lib/mongodb'
import { dashboardModel } from '@/lib/db/dashboardModel'
import { Dataset } from '@/models/Dataset'
import { DataSource } from '@/models/DataSource'

interface SearchResult {
  id: string
  type: 'dashboard' | 'dataset' | 'datasource' | 'metric'
  title: string
  description?: string
  path: string
  updatedAt?: string
  category?: string
}

// POST /api/search - 全局搜索
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    // 从请求体获取搜索参数
    let query
    try {
      const body = await request.json()
      query = body.q || body.query || ''
    } catch {
      query = ''
    }

    if (!query.trim()) {
      return NextResponse.json({ results: [] })
    }

    query = query.trim()

    await connectDB()

    const results: SearchResult[] = []

    // 搜索看板
    try {
      const dashboardResults = await dashboardModel.getDashboards({
        userId: user._id,
        search: query,
        limit: 10
      })

      dashboardResults.dashboards.forEach(dashboard => {
        results.push({
          id: dashboard._id.toString(),
          type: 'dashboard',
          title: dashboard.name,
          description: dashboard.description,
          path: `/dashboards/editor?id=${dashboard._id}`,
          updatedAt: dashboard.updatedAt?.toISOString(),
          category: '看板'
        })
      })
    } catch (error) {
      console.warn('Dashboard search failed:', error)
    }

    // 搜索数据集
    try {
      const datasets = await Dataset.find({
        $and: [
          {
            $or: [
              { userId: user._id },
              { 'permissions.userId': user._id }
            ]
          },
          {
            $or: [
              { name: { $regex: query, $options: 'i' } },
              { displayName: { $regex: query, $options: 'i' } },
              { description: { $regex: query, $options: 'i' } },
              { category: { $regex: query, $options: 'i' } }
            ]
          }
        ]
      })
      .limit(10)
      .sort({ updatedAt: -1 })
      .lean()

      datasets.forEach(dataset => {
        results.push({
          id: dataset._id.toString(),
          type: 'dataset',
          title: dataset.displayName || dataset.name,
          description: dataset.description,
          path: `/datasets/editor?id=${dataset._id}`,
          updatedAt: dataset.updatedAt?.toISOString(),
          category: dataset.category
        })
      })
    } catch (error) {
      console.warn('Dataset search failed:', error)
    }

    // 搜索数据源
    try {
      const datasources = await DataSource.find({
        $and: [
          { userId: user._id },
          {
            $or: [
              { name: { $regex: query, $options: 'i' } },
              { description: { $regex: query, $options: 'i' } },
              { type: { $regex: query, $options: 'i' } }
            ]
          }
        ]
      })
      .limit(5)
      .sort({ updatedAt: -1 })
      .lean()

      datasources.forEach(datasource => {
        results.push({
          id: datasource._id.toString(),
          type: 'datasource',
          title: datasource.name,
          description: datasource.description,
          path: `/datasources?id=${datasource._id}`,
          updatedAt: datasource.updatedAt?.toISOString(),
          category: datasource.type
        })
      })
    } catch (error) {
      console.warn('Datasource search failed:', error)
    }

    // 按相关性和时间排序
    results.sort((a, b) => {
      // 首先按标题匹配程度排序
      const aExactMatch = a.title.toLowerCase().includes(query.toLowerCase())
      const bExactMatch = b.title.toLowerCase().includes(query.toLowerCase())
      
      if (aExactMatch && !bExactMatch) return -1
      if (!aExactMatch && bExactMatch) return 1
      
      // 然后按更新时间排序
      if (a.updatedAt && b.updatedAt) {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
      
      return 0
    })

    // 限制总结果数量
    const limitedResults = results.slice(0, 20)

    return NextResponse.json({
      results: limitedResults,
      total: limitedResults.length,
      query
    })

  } catch (error) {
    console.error('Search failed:', error)
    return NextResponse.json(
      { 
        error: '搜索失败',
        results: [],
        total: 0
      }, 
      { status: 500 }
    )
  }
}