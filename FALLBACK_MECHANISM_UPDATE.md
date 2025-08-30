# 🔧 兜底机制改进更新

## 📋 问题现状

用户测试查询："2024年1月收入和支出情况，按部门分组"
- **LLM仍然失败**：404错误，API配置问题
- **兜底机制未生效**：提取的指标数和维度数仍为0
- **需要改进**：关键词匹配逻辑不够智能

## ✅ 改进内容

### 1. 扩展关键词匹配

**改进前：** 只匹配基础财务词汇
```typescript
const metricKeywords = ['营收', '收入', '成本', '支出', '利润', '金额', '数量', '总额']
```

**改进后：** 扩展词汇库并改进匹配逻辑
```typescript
const metricKeywords = ['营收', '收入', '成本', '支出', '利润', '金额', '数量', '总额', '费用']

// 更智能的匹配条件
if (queryLower.includes('收支') || queryLower.includes('财务') || 
    queryLower.includes('收入') || queryLower.includes('支出') ||
    queryLower.includes('营收') || queryLower.includes('成本')) {
  // 添加相关指标
}
```

### 2. 新增分组维度识别

**新功能：** 识别"按X分组"的查询模式
```typescript
// 识别维度关键词（分组）
if (queryLower.includes('按') && queryLower.includes('分组')) {
  const dimensionKeywords = ['部门', '地区', '类型', '级别', '分类']
  const foundDimensions = datasetSchema.fields.filter((field: any) => 
    field.isDimension && dimensionKeywords.some(keyword => 
      field.displayName.includes(keyword) || queryLower.includes(keyword)
    )
  )
  
  foundDimensions.forEach((field: any) => {
    intent.dimensions.push({
      field: field.name,
      displayName: field.displayName,
      groupBy: true,
      orderBy: 'desc' // 默认降序排列
    })
  })
}
```

### 3. 智能默认字段选择

**改进场景：** 当没有找到指标和维度时的处理
```typescript
if (intent.metrics.length === 0 && intent.dimensions.length === 0) {
  // 对于财务查询，尝试添加数值字段作为指标
  if (queryLower.includes('财务') || queryLower.includes('收支') || queryLower.includes('金额')) {
    const numericFields = datasetSchema.fields.filter((field: any) => 
      field.type === 'number' || field.isMetric
    )
    numericFields.slice(0, 2).forEach((field: any) => {
      intent.metrics.push({
        field: field.name,
        displayName: field.displayName,
        aggregation: 'sum',
        alias: `总${field.displayName}`
      })
    })
    
    // 添加第一个维度字段用于分组
    const dimensionField = datasetSchema.fields.find((field: any) => 
      field.isDimension || field.type === 'string'
    )
    if (dimensionField) {
      intent.dimensions.push({
        field: dimensionField.name,
        displayName: dimensionField.displayName,
        groupBy: true
      })
    }
  }
}
```

### 4. 增强调试信息

**新增日志：** 帮助诊断兜底机制是否正常工作
```typescript
console.log('[意图提取] 兜底机制结果:', {
  原始查询: query,
  提取的指标数: fallbackIntent.metrics.length,
  提取的维度数: fallbackIntent.dimensions.length,
  过滤条件数: fallbackIntent.filters.length,
  限制: fallbackIntent.limit
})
```

## 🎯 预期改进效果

### 对于查询："2024年1月收入和支出情况，按部门分组"

**改进前：**
```
🎯 [Dataset Chat] 意图提取完成:
   🔍 置信度: 0.3
   📊 指标数: 0
   📈 维度数: 0
   🔧 过滤条件: 0
```

**改进后（预期）：**
```
[意图提取] 兜底机制结果: {
  原始查询: '2024年1月收入和支出情况，按部门分组',
  提取的指标数: 2,
  提取的维度数: 1,
  过滤条件数: 1,
  限制: 20
}
🎯 [Dataset Chat] 意图提取完成:
   🔍 置信度: 0.3
   📊 指标数: 2 (revenue_amount, cost_amount)
   📈 维度数: 1 (department)
   🔧 过滤条件: 1 (date_field='202401')
✅ [Dataset Chat] 意图验证通过
```

**生成的SQL（预期）：**
```sql
SELECT department, 
       SUM(revenue_amount) AS 总营收金额, 
       SUM(cost_amount) AS 总成本金额 
FROM finance_data 
WHERE date_field = '202401' 
GROUP BY department 
ORDER BY 总营收金额 DESC 
LIMIT 20
```

## 🧪 测试建议

为验证改进效果，建议测试以下查询：

1. **财务分析查询**：
   - "2024年1月收入和支出情况，按部门分组" ✓
   - "各部门成本统计"
   - "财务数据汇总"

2. **时间范围查询**：
   - "2024年财务情况"
   - "2024年3月数据"

3. **基本数据浏览**：
   - "显示前10条数据"
   - "查看最新数据"

每个查询应该能通过兜底机制生成合理的意图和SQL语句。

## 🔧 故障排查

如果兜底机制仍未生效：

1. **检查数据集字段配置**：
   - 确保字段有正确的 `isMetric` 和 `isDimension` 标记
   - 验证字段的 `type` 属性设置正确

2. **检查控制台日志**：
   - 查找 `[意图提取] 兜底机制结果:` 日志
   - 确认关键词匹配是否触发

3. **API配置修复**：
   - 修复LLM API URL配置，避免依赖兜底机制
   - 测试API连接是否正常

通过这些改进，系统应该能更好地处理LLM调用失败的情况，确保用户查询能得到合理的响应。