import type { Metric, ComponentLayout, ParsedQuery } from '@/types'

export interface MetricRecommendation {
  metric: Metric
  relevanceScore: number
  reason: string
  confidence: number
}

export interface ComponentMetricBinding {
  componentType: ComponentLayout['type']
  suggestedMetrics: MetricRecommendation[]
  chartConfiguration?: {
    xAxis?: string
    yAxis?: string[]
    series?: string[]
  }
}

export class MetricRecommendationService {
  
  // 根据用户查询推荐指标
  async recommendMetricsForQuery(
    query: string, 
    availableMetrics: Metric[]
  ): Promise<MetricRecommendation[]> {
    const queryLower = query.toLowerCase()
    const recommendations: MetricRecommendation[] = []

    for (const metric of availableMetrics) {
      const relevanceScore = this.calculateRelevanceScore(queryLower, metric)
      
      if (relevanceScore > 0.3) { // 阈值过滤
        recommendations.push({
          metric,
          relevanceScore,
          reason: this.generateRecommendationReason(queryLower, metric),
          confidence: Math.min(relevanceScore * 100, 95) // 转换为百分比，最高95%
        })
      }
    }

    // 按相关度排序
    return recommendations
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10) // 只返回前10个推荐
  }

  // 根据组件类型推荐指标
  async recommendMetricsForComponent(
    componentType: ComponentLayout['type'],
    availableMetrics: Metric[],
    context?: { existingMetrics?: string[], category?: string }
  ): Promise<ComponentMetricBinding> {
    const suitableMetrics = this.filterMetricsForComponentType(componentType, availableMetrics)
    const recommendations: MetricRecommendation[] = []

    for (const metric of suitableMetrics) {
      const suitabilityScore = this.calculateComponentSuitability(componentType, metric)
      
      if (suitabilityScore > 0.4) {
        recommendations.push({
          metric,
          relevanceScore: suitabilityScore,
          reason: this.generateComponentRecommendationReason(componentType, metric),
          confidence: Math.min(suitabilityScore * 100, 90)
        })
      }
    }

    // 应用上下文过滤
    if (context?.category) {
      recommendations.forEach(rec => {
        if (rec.metric.category === context.category) {
          rec.relevanceScore += 0.2 // 同分类加分
        }
      })
    }

    const sortedRecommendations = recommendations
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 8)

    return {
      componentType,
      suggestedMetrics: sortedRecommendations,
      chartConfiguration: this.generateChartConfiguration(componentType, sortedRecommendations)
    }
  }

  // 智能指标匹配 - 根据业务场景推荐相关指标组合
  async recommendMetricCombinations(
    baseMetrics: Metric[],
    availableMetrics: Metric[]
  ): Promise<{ primary: Metric[], secondary: Metric[], related: Metric[] }> {
    const primary: Metric[] = []
    const secondary: Metric[] = []
    const related: Metric[] = []

    const baseCategories = [...new Set(baseMetrics.map(m => m.category))]
    const baseTags = [...new Set(baseMetrics.flatMap(m => m.tags))]

    for (const metric of availableMetrics) {
      if (baseMetrics.some(base => base._id === metric._id)) continue

      let relevanceScore = 0

      // 分类相关性
      if (baseCategories.includes(metric.category)) {
        relevanceScore += 0.4
      }

      // 标签相关性
      const commonTags = metric.tags.filter(tag => baseTags.includes(tag)).length
      relevanceScore += (commonTags / metric.tags.length) * 0.3

      // 业务逻辑相关性
      relevanceScore += this.calculateBusinessRelevance(baseMetrics, metric)

      if (relevanceScore > 0.7) {
        primary.push(metric)
      } else if (relevanceScore > 0.5) {
        secondary.push(metric)
      } else if (relevanceScore > 0.3) {
        related.push(metric)
      }
    }

    return {
      primary: primary.slice(0, 5),
      secondary: secondary.slice(0, 8),
      related: related.slice(0, 10)
    }
  }

  // 计算查询与指标的相关度
  private calculateRelevanceScore(query: string, metric: Metric): number {
    let score = 0

    // 名称匹配
    if (metric.name.toLowerCase().includes(query) || 
        query.includes(metric.name.toLowerCase())) {
      score += 0.5
    }

    // 显示名称匹配
    if (metric.displayName.toLowerCase().includes(query) || 
        query.includes(metric.displayName.toLowerCase())) {
      score += 0.4
    }

    // 描述匹配
    if (metric.description?.toLowerCase().includes(query)) {
      score += 0.3
    }

    // 分类匹配
    if (metric.category.toLowerCase().includes(query) || 
        query.includes(metric.category.toLowerCase())) {
      score += 0.3
    }

    // 标签匹配
    for (const tag of metric.tags) {
      if (tag.toLowerCase().includes(query) || 
          query.includes(tag.toLowerCase())) {
        score += 0.2
      }
    }

    // 语义相关性检查
    score += this.calculateSemanticRelevance(query, metric)

    return Math.min(score, 1.0) // 最大值为1
  }

  // 计算组件类型与指标的适配性
  private calculateComponentSuitability(
    componentType: ComponentLayout['type'], 
    metric: Metric
  ): number {
    let score = 0.5 // 基础分

    switch (componentType) {
      case 'line-chart':
        // 折线图适合时间序列和趋势数据
        if (metric.type === 'sum' || metric.type === 'avg' || metric.type === 'count') {
          score += 0.3
        }
        if (metric.tags.includes('趋势') || metric.tags.includes('时间')) {
          score += 0.2
        }
        break

      case 'bar-chart':
        // 柱状图适合分类对比
        if (metric.type === 'count' || metric.type === 'sum') {
          score += 0.3
        }
        if (metric.tags.includes('对比') || metric.tags.includes('分类')) {
          score += 0.2
        }
        break

      case 'pie-chart':
        // 饼图适合占比数据
        if (metric.type === 'ratio' || metric.type === 'count') {
          score += 0.3
        }
        if (metric.tags.includes('占比') || metric.tags.includes('分布')) {
          score += 0.2
        }
        break

      case 'kpi-card':
        // 指标卡片适合关键指标
        if (metric.tags.includes('核心指标') || metric.tags.includes('关键')) {
          score += 0.4
        }
        if (metric.type === 'sum' || metric.type === 'count' || metric.type === 'ratio') {
          score += 0.2
        }
        break

      case 'table':
        // 表格适合详细数据
        score += 0.3 // 表格基本适合所有类型
        break

      case 'gauge':
        // 仪表盘适合单一指标和进度
        if (metric.type === 'ratio' || metric.tags.includes('完成率')) {
          score += 0.4
        }
        break
    }

    return Math.min(score, 1.0)
  }

  // 过滤适合特定组件类型的指标
  private filterMetricsForComponentType(
    componentType: ComponentLayout['type'],
    metrics: Metric[]
  ): Metric[] {
    switch (componentType) {
      case 'pie-chart':
        // 饼图更适合计数和比率类型
        return metrics.filter(m => m.type === 'count' || m.type === 'ratio')
      
      case 'gauge':
        // 仪表盘更适合比率类型
        return metrics.filter(m => m.type === 'ratio')
      
      default:
        return metrics.filter(m => m.isActive)
    }
  }

  // 生成推荐理由
  private generateRecommendationReason(query: string, metric: Metric): string {
    const reasons: string[] = []

    if (metric.displayName.toLowerCase().includes(query)) {
      reasons.push('指标名称匹配')
    }
    
    if (metric.category.toLowerCase().includes(query)) {
      reasons.push('分类相关')
    }
    
    if (metric.tags.some(tag => tag.toLowerCase().includes(query))) {
      reasons.push('标签匹配')
    }

    if (metric.description?.toLowerCase().includes(query)) {
      reasons.push('描述相关')
    }

    return reasons.length > 0 ? reasons.join('、') : '相关性匹配'
  }

  // 生成组件推荐理由
  private generateComponentRecommendationReason(
    componentType: ComponentLayout['type'],
    metric: Metric
  ): string {
    const componentNames = {
      'line-chart': '折线图',
      'bar-chart': '柱状图',
      'pie-chart': '饼图',
      'table': '数据表',
      'kpi-card': '指标卡片',
      'gauge': '仪表盘'
    }

    const reasons: string[] = []

    if (componentType === 'kpi-card' && metric.tags.includes('核心指标')) {
      reasons.push('核心业务指标')
    }

    if (componentType === 'pie-chart' && metric.type === 'ratio') {
      reasons.push('适合占比展示')
    }

    if ((componentType === 'line-chart' || componentType === 'bar-chart') && 
        (metric.type === 'sum' || metric.type === 'count')) {
      reasons.push('适合趋势分析')
    }

    const componentName = componentNames[componentType] || componentType
    return reasons.length > 0 
      ? `${reasons.join('、')}，适合${componentName}展示` 
      : `适合${componentName}展示`
  }

  // 计算语义相关性
  private calculateSemanticRelevance(query: string, metric: Metric): number {
    // 简化的语义相关性计算，实际项目中可以集成更复杂的NLP算法
    const queryKeywords = this.extractKeywords(query)
    const metricKeywords = this.extractKeywords(
      `${metric.name} ${metric.displayName} ${metric.description || ''} ${metric.tags.join(' ')}`
    )

    const commonKeywords = queryKeywords.filter(keyword => 
      metricKeywords.includes(keyword)
    )

    return (commonKeywords.length / Math.max(queryKeywords.length, 1)) * 0.2
  }

  // 计算业务相关性
  private calculateBusinessRelevance(baseMetrics: Metric[], candidateMetric: Metric): number {
    let relevance = 0

    // 检查是否是常见的业务指标组合
    const businessCombinations = {
      '销售': ['订单', '收入', '客户', '转化'],
      '用户': ['活跃', '留存', '增长', '行为'],
      '营销': ['转化', '点击', '曝光', '成本'],
      '财务': ['利润', '成本', '收入', '现金流']
    }

    for (const [category, relatedTerms] of Object.entries(businessCombinations)) {
      if (baseMetrics.some(m => m.category === category)) {
        for (const term of relatedTerms) {
          if (candidateMetric.displayName.includes(term) || 
              candidateMetric.tags.some(tag => tag.includes(term))) {
            relevance += 0.1
          }
        }
      }
    }

    return Math.min(relevance, 0.3)
  }

  // 提取关键词
  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, '') // 保留中英文和数字
      .split(/\s+/)
      .filter(word => word.length > 1)
  }

  // 生成图表配置建议
  private generateChartConfiguration(
    componentType: ComponentLayout['type'],
    recommendations: MetricRecommendation[]
  ): ComponentMetricBinding['chartConfiguration'] {
    if (recommendations.length === 0) return undefined

    const topMetrics = recommendations.slice(0, 3)

    switch (componentType) {
      case 'line-chart':
      case 'bar-chart':
        return {
          xAxis: 'time', // 默认时间轴
          yAxis: topMetrics.map(r => r.metric.name),
          series: topMetrics.map(r => r.metric.displayName)
        }

      case 'pie-chart':
        return {
          series: [topMetrics[0]?.metric.name || '']
        }

      default:
        return undefined
    }
  }

  // 生成智能看板布局建议
  async generateDashboardLayout(
    query: string,
    availableMetrics: Metric[]
  ): Promise<{
    components: Array<{
      type: ComponentLayout['type']
      title: string
      metrics: string[]
      position: { x: number, y: number }
      size: { width: number, height: number }
    }>
    confidence: number
  }> {
    const recommendations = await this.recommendMetricsForQuery(query, availableMetrics)
    const components: any[] = []
    
    if (recommendations.length === 0) {
      return { components: [], confidence: 0 }
    }

    // 核心指标卡片
    const coreMetrics = recommendations.filter(r => 
      r.metric.tags.includes('核心指标') || r.confidence > 80
    ).slice(0, 2)

    coreMetrics.forEach((rec, index) => {
      components.push({
        type: 'kpi-card' as const,
        title: rec.metric.displayName,
        metrics: [rec.metric.name],
        position: { x: index * 6, y: 0 },
        size: { width: 6, height: 4 }
      })
    })

    // 趋势图表
    const trendMetrics = recommendations
      .filter(r => !coreMetrics.includes(r))
      .slice(0, 2)

    if (trendMetrics.length > 0) {
      components.push({
        type: 'line-chart' as const,
        title: '趋势分析',
        metrics: trendMetrics.map(r => r.metric.name),
        position: { x: 0, y: 4 },
        size: { width: 12, height: 6 }
      })
    }

    // 分布图表
    const ratioMetrics = recommendations.filter(r => r.metric.type === 'ratio').slice(0, 1)
    if (ratioMetrics.length > 0) {
      components.push({
        type: 'pie-chart' as const,
        title: '分布分析',
        metrics: ratioMetrics.map(r => r.metric.name),
        position: { x: 8, y: 10 },
        size: { width: 4, height: 6 }
      })
    }

    // 计算整体置信度
    const avgConfidence = recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length
    
    return {
      components,
      confidence: Math.round(avgConfidence)
    }
  }
}

// 单例实例
export const metricRecommendationService = new MetricRecommendationService()