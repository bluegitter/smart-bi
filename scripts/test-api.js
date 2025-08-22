// 测试API端点的脚本
const BASE_URL = 'http://localhost:3000'

async function testAPI(endpoint, description) {
  try {
    console.log(`\n🧪 测试: ${description}`)
    console.log(`📡 请求: GET ${endpoint}`)
    
    const response = await fetch(`${BASE_URL}${endpoint}`)
    const data = await response.json()
    
    if (response.ok) {
      console.log(`✅ 成功: ${response.status}`)
      console.log(`📊 数据条数: ${data.data ? data.data.length : '未知'}`)
      console.log(`📋 响应示例:`, JSON.stringify(data, null, 2).substring(0, 200) + '...')
    } else {
      console.log(`❌ 失败: ${response.status}`)
      console.log(`🚨 错误:`, data.error)
    }
  } catch (error) {
    console.log(`💥 网络错误:`, error.message)
  }
}

async function testMetricData(metricId, description) {
  try {
    console.log(`\n🎯 测试指标数据: ${description}`)
    console.log(`📡 请求: GET /api/metrics/${metricId}/data`)
    
    const response = await fetch(`${BASE_URL}/api/metrics/${metricId}/data`)
    const data = await response.json()
    
    if (response.ok) {
      console.log(`✅ 成功: ${response.status}`)
      console.log(`📊 数据条数: ${data.count}`)
      if (data.data && data.data.length > 0) {
        console.log(`📋 数据示例:`, data.data[0])
      }
    } else {
      console.log(`❌ 失败: ${response.status}`)
      console.log(`🚨 错误:`, data.error)
    }
  } catch (error) {
    console.log(`💥 网络错误:`, error.message)
  }
}

async function runTests() {
  console.log('🚀 开始测试 Smart BI API...')
  console.log(`🌐 服务器地址: ${BASE_URL}`)
  
  // 测试基础数据查询
  await testAPI('/api/data/query?metric=daily_sales', '日销售额查询')
  await testAPI('/api/data/query?metric=category_sales', '分类销售额查询')
  await testAPI('/api/data/query?metric=region_sales', '地区销售查询')
  await testAPI('/api/data/query?metric=financial_overview', '财务概览查询')
  
  // 测试表信息
  await testAPI('/api/data/tables', '获取所有表信息')
  await testAPI('/api/data/tables?table=sales_data', '获取销售表结构')
  
  // 测试指标接口
  await testAPI('/api/metrics', '获取指标列表')
  
  // 测试特定指标数据
  await testMetricData('sales_001', '日销售额指标')
  await testMetricData('sales_002', '分类销售额指标')
  await testMetricData('finance_001', '利润率指标')
  await testMetricData('user_001', '用户设备分布指标')
  
  console.log('\n🎉 测试完成!')
}

// 运行测试
runTests().catch(console.error)