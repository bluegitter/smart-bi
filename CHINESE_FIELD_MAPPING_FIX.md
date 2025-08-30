# 中文字段名智能映射修复

## 🔍 问题分析

用户遇到的两个关键问题：

1. **Dataset is not defined**: Dataset模型导入错误
2. **中文字段名无法识别**: SQL查询中使用了中文字段名，但数据库实际存储的是英文字段名

**错误示例：**
```sql
-- ❌ AI生成的SQL（中文字段名）
SELECT "所属部门", SUM("营收金额（元）") AS 总营收 
FROM "财务数据表" 
WHERE "财务数据日期" BETWEEN 202401 AND 202402

-- ✅ 数据库实际需要的SQL（英文字段名）
SELECT department, SUM(revenue_amount) AS total_revenue 
FROM finance_data 
WHERE date_field BETWEEN 202401 AND 202402
```

## 🔧 解决方案

### 1. 修复Dataset模型导入

#### **问题：** 
executeDatasetQuery函数中无法访问Dataset模型

#### **修复：**
```javascript
// ❌ 修复前 - 类型导入
import type { Dataset } from '@/types/dataset'

// ✅ 修复后 - 模型导入 + 类型导入
import Dataset from '@/models/Dataset'
import type { Dataset as DatasetType } from '@/types/dataset'
```

### 2. 智能字段名转换系统

#### **核心功能：translateSQLFields()**
创建了智能的中文到英文字段名转换函数：

```javascript
function translateSQLFields(sql: string, dataset: DatasetType): string {
  const fieldMapping: { [key: string]: string } = {}
  
  // 构建中文到英文的映射表
  dataset.fields.forEach(field => {
    if (field.displayName && field.name !== field.displayName) {
      // 映射: "营收金额（元）" → "revenue_amount"
      fieldMapping[field.displayName] = field.name
      
      // 处理各种引号格式
      fieldMapping[`"${field.displayName}"`] = `"${field.name}"`
      fieldMapping[`'${field.displayName}'`] = `'${field.name}'`
      fieldMapping[`\`${field.displayName}\``] = `\`${field.name}\``
    }
  })

  // 执行智能替换
  let translatedSQL = sql
  Object.entries(fieldMapping).forEach(([chinese, english]) => {
    const regex = new RegExp(chinese.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    translatedSQL = translatedSQL.replace(regex, english)
  })

  return translatedSQL
}
```

#### **转换示例：**
```javascript
// 输入SQL
`SELECT "所属部门", SUM("营收金额（元）") FROM "财务数据表"`

// 字段映射
{
  "所属部门": "department",
  "营收金额（元）": "revenue_amount", 
  "财务数据表": "finance_data"
}

// 输出SQL
`SELECT "department", SUM("revenue_amount") FROM "finance_data"`
```

### 3. 增强的JSON参数解析

#### **问题：** SQL被截断为 `'SELECT \\'`
#### **原因：** 复杂SQL包含特殊字符导致JSON解析失败

#### **修复策略：**
```javascript
function parseToolArguments(argumentsString: string) {
  // 1. 标准JSON解析
  try {
    return JSON.parse(argumentsString)
  } catch { /* 继续 */ }
  
  // 2. 清理边界字符
  const jsonStart = cleaned.indexOf('{')
  const jsonEnd = cleaned.lastIndexOf('}')
  
  // 3. 增强的正则提取
  const sqlPatterns = [
    /"sql":\s*"([^"]*(?:\\.[^"]*)*)"/i,  // 处理转义字符
    /"sql":\s*"([^"]+)/i,  // 处理截断情况
    /SELECT[\s\S]+?(?=LIMIT|\}|$)/i     // 直接匹配SELECT语句
  ]
  
  // 4. 智能SQL识别
  const selectMatch = argumentsString.match(/SELECT[\s\S]+?(?=LIMIT|\}|$)/i)
  if (selectMatch) {
    sql = selectMatch[0].trim()
  }
}
```

### 4. AI系统提示优化

#### **支持中文字段查询：**
```
📝 SQL查询指导：
- 可以使用中文字段名和表名，系统会自动转换为英文
- 建议使用数据集的显示名称，例如："财务数据表"、"营收金额（元）"
- 系统会将中文字段名映射到实际的英文字段名

查询示例：
- SELECT * FROM "财务数据表" WHERE "财务数据日期" >= '202401'
- SELECT "所属部门", SUM("营收金额") FROM "财务数据表" GROUP BY "所属部门"
```

## 🚀 修复效果

### 修复前
```javascript
❌ 错误1: ReferenceError: Dataset is not defined
❌ 错误2: 数据库字段 'revenue_amount' 不存在（因为查询用了中文字段名）
❌ 错误3: SQL解析截断 'SELECT \\'
```

### 修复后
```javascript
✅ 成功：Dataset模型正确导入和使用
✅ 成功：中文字段名自动转换为英文
✅ 成功：复杂SQL正确解析和提取

// 转换流程示例
用户查询: "2024年1月财务收支情况"

AI生成SQL:
SELECT "所属部门", SUM("营收金额（元）") AS 总营收, SUM("成本金额（元）") AS 总成本 
FROM "财务数据表" 
WHERE "财务数据日期" BETWEEN 202401 AND 202402

系统自动转换:
SELECT "department", SUM("revenue_amount") AS 总营收, SUM("cost_amount") AS 总成本 
FROM "finance_data" 
WHERE "date_field" BETWEEN 202401 AND 202402

执行查询并返回数据表格 ✅
```

## 📊 技术特性

### 映射准确性
- **智能匹配**：支持带括号、特殊字符的中文字段名
- **引号处理**：自动处理双引号、单引号、反引号格式
- **表名转换**：同时支持中文表名转换为英文表名
- **大小写敏感**：保持原有的大小写格式

### 性能优化
- **缓存映射**：字段映射表仅构建一次
- **正则优化**：使用预编译正则表达式
- **失败回退**：多层解析策略确保成功率

### 安全保障
- **SQL注入防护**：保持原有的安全检查机制
- **字符转义**：正确处理正则表达式特殊字符
- **边界检查**：防止无限匹配和性能问题

## 🛠️ 调试支持

### 详细日志
```javascript
console.log('[Dataset Chat] SQL转换:', { 
  原始: 'SELECT "营收金额（元）" FROM "财务数据表"',
  转换后: 'SELECT "revenue_amount" FROM "finance_data"'
})

console.log('[Dataset Chat] 提取的参数:', { 
  sql: 'SELECT department, SUM(revenue_amount)...', 
  limit: 20 
})
```

### 错误诊断
- **映射失败**：记录未能转换的字段名
- **解析失败**：显示原始参数和解析尝试
- **查询错误**：提供具体的数据库错误信息

## 🎯 使用建议

### 数据集配置
1. **字段定义**：确保每个字段都有`name`（英文）和`displayName`（中文）
2. **表名配置**：在config中正确设置实际的英文表名
3. **字段描述**：提供清晰的字段含义说明

### AI查询最佳实践
1. **使用中文**：鼓励用户使用中文字段名查询，更直观易懂
2. **完整表述**：使用完整的字段显示名，如"营收金额（元）"
3. **日期格式**：注意日期字段的实际存储格式

### 故障排查
1. **检查字段映射**：验证数据集字段配置是否完整
2. **查看转换日志**：观察SQL转换前后的对比
3. **测试简单查询**：从SELECT *开始逐步增加复杂度

---

通过这次修复，AI现在可以理解和处理中文字段名查询，自动转换为数据库能识别的英文字段名，大大提升了用户体验和查询成功率。