/**
 * 测试意图提取和兜底机制
 */

// 模拟数据集架构
const mockDatasetSchema = {
  name: 'finance_data',
  displayName: '财务数据表',
  fields: [
    { name: 'department', displayName: '部门', type: 'string', isDimension: true },
    { name: 'revenue_amount', displayName: '营收金额', type: 'number', isMetric: true },
    { name: 'cost_amount', displayName: '成本金额', type: 'number', isMetric: true },
    { name: 'date_field', displayName: '日期', type: 'date', isTimeField: true },
    { name: 'employee_count', displayName: '员工数量', type: 'number', isMetric: true }
  ]
}

// 模拟LLM配置
const mockLLMConfig = {
  provider: 'openai',
  config: {
    apiKey: 'test-key',
    apiUrl: 'https://invalid-url.com/v1/chat/completions', // 故意使用无效URL来测试兜底
    model: 'gpt-3.5-turbo'
  }
}

// 测试查询
const testQueries = [
  '2024年1月财务收支情况',
  '显示前10条数据',
  '查看各部门营收情况',
  '2024年的成本统计'
]

async function testIntentExtraction() {
  console.log('🧪 开始测试意图提取兜底机制...\n')
  
  // 动态导入模块（因为使用了ES6 import语法）
  const { extractQueryIntent, validateQueryIntent } = await import('./src/lib/intent-extraction.js')
  const { intentToSQL } = await import('./src/lib/dsl-to-sql.js')
  
  for (const query of testQueries) {
    console.log(`📝 测试查询: "${query}"`)
    console.log('=' .repeat(50))
    
    try {
      // 测试意图提取（应该会失败并使用兜底机制）
      const intentResult = await extractQueryIntent({
        query,
        datasetSchema: mockDatasetSchema
      }, mockLLMConfig)
      
      console.log('🎯 意图提取结果:')
      console.log(`   置信度: ${intentResult.confidence}`)
      console.log(`   指标数: ${intentResult.intent.metrics.length}`)
      console.log(`   维度数: ${intentResult.intent.dimensions.length}`)
      console.log(`   过滤条件: ${intentResult.intent.filters.length}`)
      console.log(`   限制: ${intentResult.intent.limit || '无'}`)
      
      // 验证意图
      const validation = validateQueryIntent(intentResult.intent)
      console.log(`✅ 验证结果: ${validation.valid ? '通过' : '失败'}`)
      if (!validation.valid) {
        console.log(`   错误: ${validation.errors.join(', ')}`)
      }
      
      // 测试SQL生成
      if (validation.valid) {
        const { sql } = intentToSQL(intentResult.intent, mockDatasetSchema)
        console.log(`🔨 生成SQL: ${sql}`)
      }
      
      console.log(`💬 解释: ${intentResult.explanation}`)
      if (intentResult.suggestions) {
        console.log(`💡 建议: ${intentResult.suggestions.join(' | ')}`)
      }
      
    } catch (error) {
      console.error(`❌ 测试失败: ${error.message}`)
    }
    
    console.log('\n')
  }
}

// 运行测试
testIntentExtraction().then(() => {
  console.log('🎉 测试完成!')
}).catch(error => {
  console.error('❌ 测试脚本执行失败:', error)
})