import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { datasetCache, metricsCache, queryCache, CacheManager } from '@/lib/cache/CacheManager'

// POST /api/cache/test - 缓存性能测试
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request)
    if (error) {
      return NextResponse.json(error, { status: error.status })
    }

    // 只有管理员可以运行缓存测试
    if (!user.isAdmin) {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { testType = 'basic', iterations = 1000 } = body

    let results: any = {}

    switch (testType) {
      case 'basic':
        results = await runBasicPerformanceTest(iterations)
        break
      case 'memory':
        results = await runMemoryTest(iterations)
        break
      case 'concurrent':
        results = await runConcurrentTest(iterations)
        break
      case 'ttl':
        results = await runTTLTest()
        break
      default:
        return NextResponse.json(
          { error: '不支持的测试类型' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      testType,
      iterations,
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Cache test failed:', error)
    return NextResponse.json(
      { 
        error: '缓存测试失败',
        details: error instanceof Error ? error.message : '未知错误'
      }, 
      { status: 500 }
    )
  }
}

// 基础性能测试
async function runBasicPerformanceTest(iterations: number) {
  const testCache = new CacheManager({
    maxMemorySize: 10, // 10MB
    defaultTTL: 60000, // 1 minute
    cleanupInterval: 30000,
    enableMetrics: true
  })

  const testData = generateTestData()
  
  // 测试写入性能
  const writeStart = Date.now()
  for (let i = 0; i < iterations; i++) {
    testCache.set(`test-key-${i}`, { ...testData, id: i })
  }
  const writeTime = Date.now() - writeStart

  // 测试读取性能（缓存命中）
  const readStart = Date.now()
  let hits = 0
  for (let i = 0; i < iterations; i++) {
    const result = testCache.get(`test-key-${i}`)
    if (result) hits++
  }
  const readTime = Date.now() - readStart

  // 测试读取性能（缓存未命中）
  const missStart = Date.now()
  let misses = 0
  for (let i = 0; i < iterations; i++) {
    const result = testCache.get(`miss-key-${i}`)
    if (!result) misses++
  }
  const missTime = Date.now() - missStart

  const stats = testCache.getStats()

  // 清理测试缓存
  testCache.destroy()

  return {
    write: {
      totalTime: writeTime,
      averageTime: writeTime / iterations,
      operationsPerSecond: Math.round((iterations / writeTime) * 1000)
    },
    read: {
      totalTime: readTime,
      averageTime: readTime / iterations,
      operationsPerSecond: Math.round((iterations / readTime) * 1000),
      hits
    },
    miss: {
      totalTime: missTime,
      averageTime: missTime / iterations,
      operationsPerSecond: Math.round((iterations / missTime) * 1000),
      misses
    },
    stats
  }
}

// 内存测试
async function runMemoryTest(iterations: number) {
  const testCache = new CacheManager({
    maxMemorySize: 5, // 5MB
    defaultTTL: 60000,
    cleanupInterval: 30000,
    enableMetrics: true
  })

  const results = {
    phases: [] as any[],
    memoryEvictions: 0,
    finalStats: null as any
  }

  // 阶段性填充缓存直到触发内存清理
  const phaseSize = Math.min(iterations / 10, 100)
  
  for (let phase = 0; phase < 10; phase++) {
    const phaseStart = Date.now()
    const startStats = testCache.getStats()
    
    for (let i = 0; i < phaseSize; i++) {
      const key = `memory-test-${phase}-${i}`
      const data = generateLargeTestData(1000) // 1KB data
      testCache.set(key, data)
    }
    
    const endStats = testCache.getStats()
    const phaseTime = Date.now() - phaseStart
    
    results.phases.push({
      phase,
      time: phaseTime,
      entriesAdded: phaseSize,
      memoryBefore: Math.round(startStats.memoryUsagePercent * 100) / 100,
      memoryAfter: Math.round(endStats.memoryUsagePercent * 100) / 100,
      evictions: endStats.evictions - startStats.evictions
    })
    
    results.memoryEvictions += (endStats.evictions - startStats.evictions)
  }

  results.finalStats = testCache.getStats()
  
  // 清理测试缓存
  testCache.destroy()

  return results
}

// 并发测试
async function runConcurrentTest(iterations: number) {
  const testCache = new CacheManager({
    maxMemorySize: 10,
    defaultTTL: 60000,
    cleanupInterval: 30000,
    enableMetrics: true
  })

  const concurrency = 10
  const operationsPerWorker = Math.floor(iterations / concurrency)
  
  // 准备测试数据
  for (let i = 0; i < iterations; i++) {
    testCache.set(`concurrent-${i}`, generateTestData())
  }

  const startStats = testCache.getStats()
  const startTime = Date.now()

  // 创建并发读取任务
  const workers = Array.from({ length: concurrency }, async (_, workerIndex) => {
    const workerStart = Date.now()
    let hits = 0
    let misses = 0
    
    for (let i = 0; i < operationsPerWorker; i++) {
      const key = `concurrent-${workerIndex * operationsPerWorker + i}`
      const result = testCache.get(key)
      if (result) hits++
      else misses++
      
      // 混合读写操作
      if (i % 10 === 0) {
        testCache.set(`worker-${workerIndex}-${i}`, generateTestData())
      }
    }
    
    return {
      workerIndex,
      time: Date.now() - workerStart,
      hits,
      misses
    }
  })

  const workerResults = await Promise.all(workers)
  const totalTime = Date.now() - startTime
  const endStats = testCache.getStats()

  // 清理测试缓存
  testCache.destroy()

  return {
    concurrency,
    totalTime,
    operationsPerSecond: Math.round((iterations / totalTime) * 1000),
    workers: workerResults,
    statsComparison: {
      before: startStats,
      after: endStats
    }
  }
}

// TTL过期测试
async function runTTLTest() {
  const testCache = new CacheManager({
    maxMemorySize: 10,
    defaultTTL: 1000, // 1 second
    cleanupInterval: 500, // 0.5 seconds
    enableMetrics: true
  })

  const results = {
    phases: [] as any[]
  }

  // 阶段1：写入数据
  const writeStart = Date.now()
  for (let i = 0; i < 100; i++) {
    testCache.set(`ttl-test-${i}`, generateTestData(), { ttl: 2000 }) // 2 seconds
  }
  const writeTime = Date.now() - writeStart
  const afterWrite = testCache.getStats()
  
  results.phases.push({
    phase: 'write',
    time: writeTime,
    entries: afterWrite.entryCount,
    description: '写入100个条目，TTL为2秒'
  })

  // 阶段2：立即读取（应该全部命中）
  const immediateReadStart = Date.now()
  let immediateHits = 0
  for (let i = 0; i < 100; i++) {
    if (testCache.get(`ttl-test-${i}`)) immediateHits++
  }
  const immediateReadTime = Date.now() - immediateReadStart
  
  results.phases.push({
    phase: 'immediate_read',
    time: immediateReadTime,
    hits: immediateHits,
    description: '立即读取，应该全部命中'
  })

  // 阶段3：等待1秒后读取
  await new Promise(resolve => setTimeout(resolve, 1000))
  const delayedRead1Start = Date.now()
  let delayed1Hits = 0
  for (let i = 0; i < 100; i++) {
    if (testCache.get(`ttl-test-${i}`)) delayed1Hits++
  }
  const delayedRead1Time = Date.now() - delayedRead1Start
  
  results.phases.push({
    phase: 'delayed_read_1s',
    time: delayedRead1Time,
    hits: delayed1Hits,
    description: '1秒后读取，部分可能仍有效'
  })

  // 阶段4：等待3秒后读取（应该全部过期）
  await new Promise(resolve => setTimeout(resolve, 2000))
  const delayedRead2Start = Date.now()
  let delayed2Hits = 0
  for (let i = 0; i < 100; i++) {
    if (testCache.get(`ttl-test-${i}`)) delayed2Hits++
  }
  const delayedRead2Time = Date.now() - delayedRead2Start
  const finalStats = testCache.getStats()
  
  results.phases.push({
    phase: 'delayed_read_3s',
    time: delayedRead2Time,
    hits: delayed2Hits,
    description: '3秒后读取，应该全部过期',
    finalEntries: finalStats.entryCount
  })

  // 清理测试缓存
  testCache.destroy()

  return results
}

// 生成测试数据
function generateTestData() {
  return {
    id: Math.random().toString(36).substr(2, 9),
    name: `Test Data ${Math.random()}`,
    timestamp: Date.now(),
    data: Array.from({ length: 10 }, (_, i) => ({
      field: `field_${i}`,
      value: Math.random() * 1000
    }))
  }
}

// 生成大量测试数据
function generateLargeTestData(size: number) {
  const data: any = {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: Date.now()
  }
  
  // 填充到指定大小（近似）
  const targetSize = size
  let currentSize = JSON.stringify(data).length
  
  data.padding = 'x'.repeat(Math.max(0, targetSize - currentSize - 20))
  
  return data
}