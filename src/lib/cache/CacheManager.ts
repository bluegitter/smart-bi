interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time To Live in milliseconds
  key: string
  tags?: string[] // For group invalidation
}

interface CacheConfig {
  maxMemorySize: number // Max memory in MB
  defaultTTL: number // Default TTL in milliseconds
  cleanupInterval: number // Cleanup interval in milliseconds
  enableMetrics: boolean
}

interface CacheMetrics {
  hits: number
  misses: number
  evictions: number
  totalMemoryUsed: number
  totalEntries: number
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>()
  private sizeTracker = new Map<string, number>()
  private cleanupTimer: NodeJS.Timeout | null = null
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalMemoryUsed: 0,
    totalEntries: 0
  }

  private config: CacheConfig = {
    maxMemorySize: 100, // 100MB default
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    cleanupInterval: 60 * 1000, // 1 minute
    enableMetrics: true
  }

  constructor(config?: Partial<CacheConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
    
    this.startCleanupTimer()
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, options?: {
    ttl?: number
    tags?: string[]
  }): void {
    const ttl = options?.ttl || this.config.defaultTTL
    const tags = options?.tags
    
    // Calculate approximate size in bytes
    const size = this.calculateSize(data)
    
    // Check memory limit and evict if necessary
    this.ensureMemoryLimit(size)
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      key,
      tags
    }
    
    // Remove existing entry if exists
    if (this.cache.has(key)) {
      this.remove(key)
    }
    
    this.cache.set(key, entry)
    this.sizeTracker.set(key, size)
    
    this.updateMetrics(0, 0, 0, size, 1)
  }

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.updateMetrics(0, 1)
      return null
    }
    
    // Check if expired
    if (this.isExpired(entry)) {
      this.remove(key)
      this.updateMetrics(0, 1)
      return null
    }
    
    this.updateMetrics(1, 0)
    return entry.data as T
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    
    if (this.isExpired(entry)) {
      this.remove(key)
      return false
    }
    
    return true
  }

  /**
   * Remove specific key from cache
   */
  remove(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    
    const size = this.sizeTracker.get(key) || 0
    this.cache.delete(key)
    this.sizeTracker.delete(key)
    
    this.updateMetrics(0, 0, 0, -size, -1)
    return true
  }

  /**
   * Remove entries by tags
   */
  removeByTags(tags: string[]): number {
    let removedCount = 0
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags && entry.tags.some(tag => tags.includes(tag))) {
        this.remove(key)
        removedCount++
      }
    }
    
    return removedCount
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
    this.sizeTracker.clear()
    this.metrics.totalMemoryUsed = 0
    this.metrics.totalEntries = 0
  }

  /**
   * Get or set pattern - useful for computed values
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T> | T,
    options?: {
      ttl?: number
      tags?: string[]
    }
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }
    
    const data = await factory()
    this.set(key, data, options)
    return data
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    hitRate: number
    memoryUsagePercent: number
    entryCount: number
    averageEntrySize: number
  } {
    const totalRequests = this.metrics.hits + this.metrics.misses
    const hitRate = totalRequests > 0 ? (this.metrics.hits / totalRequests) * 100 : 0
    const memoryUsagePercent = (this.metrics.totalMemoryUsed / (this.config.maxMemorySize * 1024 * 1024)) * 100
    const averageEntrySize = this.metrics.totalEntries > 0 ? this.metrics.totalMemoryUsed / this.metrics.totalEntries : 0
    
    return {
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsagePercent: Math.round(memoryUsagePercent * 100) / 100,
      entryCount: this.metrics.totalEntries,
      averageEntrySize: Math.round(averageEntrySize)
    }
  }

  /**
   * Manually trigger cleanup of expired entries
   */
  cleanup(): number {
    let removedCount = 0
    const now = Date.now()
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry, now)) {
        this.remove(key)
        removedCount++
      }
    }
    
    return removedCount
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    // Restart cleanup timer if interval changed
    if (newConfig.cleanupInterval && this.cleanupTimer) {
      this.stopCleanupTimer()
      this.startCleanupTimer()
    }
  }

  /**
   * Destroy cache manager and cleanup resources
   */
  destroy(): void {
    this.stopCleanupTimer()
    this.clear()
  }

  // Private methods

  private isExpired(entry: CacheEntry<any>, now: number = Date.now()): boolean {
    return now - entry.timestamp > entry.ttl
  }

  private calculateSize(data: any): number {
    // Simple size estimation - can be improved with more sophisticated methods
    try {
      return new Blob([JSON.stringify(data)]).size
    } catch {
      // Fallback for circular references or non-serializable data
      return 1000 // Default estimate
    }
  }

  private ensureMemoryLimit(newSize: number): void {
    const maxSizeBytes = this.config.maxMemorySize * 1024 * 1024
    
    while (this.metrics.totalMemoryUsed + newSize > maxSizeBytes && this.cache.size > 0) {
      this.evictLRU()
    }
  }

  private evictLRU(): void {
    let oldestKey = ''
    let oldestTimestamp = Date.now()
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp
        oldestKey = key
      }
    }
    
    if (oldestKey) {
      this.remove(oldestKey)
      this.updateMetrics(0, 0, 1)
    }
  }

  private updateMetrics(
    hitsDelta: number = 0,
    missesDelta: number = 0,
    evictionsDelta: number = 0,
    memoryDelta: number = 0,
    entriesDelta: number = 0
  ): void {
    if (!this.config.enableMetrics) return
    
    this.metrics.hits += hitsDelta
    this.metrics.misses += missesDelta
    this.metrics.evictions += evictionsDelta
    this.metrics.totalMemoryUsed += memoryDelta
    this.metrics.totalEntries += entriesDelta
    
    // Prevent negative values
    this.metrics.totalMemoryUsed = Math.max(0, this.metrics.totalMemoryUsed)
    this.metrics.totalEntries = Math.max(0, this.metrics.totalEntries)
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }
}

// Cache key builders
export class CacheKeys {
  static dataset(id: string): string {
    return `dataset:${id}`
  }
  
  static datasetFields(id: string): string {
    return `dataset:fields:${id}`
  }
  
  static datasetQuery(id: string, queryHash: string): string {
    return `dataset:query:${id}:${queryHash}`
  }
  
  static datasetPreview(id: string, limit: number): string {
    return `dataset:preview:${id}:${limit}`
  }
  
  static metrics(userId: string, params: string): string {
    return `metrics:${userId}:${params}`
  }
  
  static metricData(id: string, params: string): string {
    return `metric:data:${id}:${params}`
  }
  
  static datasource(id: string): string {
    return `datasource:${id}`
  }
  
  static datasourceSchema(id: string): string {
    return `datasource:schema:${id}`
  }
}

// Create and export singleton instances
export const datasetCache = new CacheManager({
  maxMemorySize: 50, // 50MB for datasets
  defaultTTL: 10 * 60 * 1000, // 10 minutes
  cleanupInterval: 2 * 60 * 1000 // 2 minutes
})

export const metricsCache = new CacheManager({
  maxMemorySize: 30, // 30MB for metrics
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  cleanupInterval: 60 * 1000 // 1 minute
})

export const queryCache = new CacheManager({
  maxMemorySize: 100, // 100MB for query results
  defaultTTL: 3 * 60 * 1000, // 3 minutes
  cleanupInterval: 60 * 1000 // 1 minute
})

export { CacheManager }
export type { CacheConfig, CacheMetrics }