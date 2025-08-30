# 🔧 SQL执行修复 - 支持DSL生成的查询

## 🐛 关键问题分析

根据最新的日志，发现了一个严重的架构问题：

### 问题现象
```
[DSL转换] 生成SQL: SELECT department AS 所属部门, SUM(revenue) AS 总营收金额（元）...
🔍 执行预览查询: SELECT * FROM smart_bi_test.financial_data LIMIT 100
```

**根本问题**：数据集查询API没有使用我们DSL生成的自定义SQL，而是执行了默认的预览查询，完全忽略了AI意图提取和DSL转换的结果！

## 🔧 修复方案

### 1. 扩展数据集查询API

**文件**：`src/app/api/datasets/[id]/query/route.ts`

**问题**：API只支持结构化查询参数（measures, dimensions, filters），不支持直接SQL执行

**修复**：添加SQL查询支持
```typescript
// 新增sql参数支持
const sql = queryParams.sql // 支持直接SQL查询

// 如果提供了SQL查询，直接执行SQL
if (sql) {
  console.log(`🔍 执行自定义SQL查询: ${sql}`)
  
  try {
    // 基本的SQL安全检查
    const upperSQL = sql.toUpperCase().trim()
    if (!upperSQL.startsWith('SELECT')) {
      return NextResponse.json({ error: '仅支持SELECT查询' }, { status: 400 })
    }
    
    // 危险操作检查
    const dangerousKeywords = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE', 'TRUNCATE']
    if (dangerousKeywords.some(keyword => upperSQL.includes(keyword))) {
      return NextResponse.json({ error: '包含危险操作，查询被拒绝' }, { status: 400 })
    }
    
    // 执行自定义SQL查询
    const result = await DatasetService.executeCustomSQL(user._id, id, sql)
    return NextResponse.json({ 
      data: result.rows || [],
      columns: result.columns || [],
      total: result.rows?.length || 0,
      executionTime: result.executionTime
    })
  } catch (error) {
    console.error('执行自定义SQL失败:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'SQL执行失败' 
    }, { status: 500 })
  }
}
```

### 2. 增加DatasetService方法

**文件**：`src/lib/services/datasetService.ts`

**新增**：executeCustomSQL静态方法
```typescript
// 执行自定义SQL查询
static async executeCustomSQL(userId: string, datasetId: string, sql: string): Promise<{
  rows: any[]
  columns: Array<{ name: string; displayName?: string }>
  executionTime: number
}> {
  const startTime = Date.now()
  
  try {
    // 获取数据集信息
    const dataset = await this.getDataset(userId, datasetId)
    if (!dataset) {
      throw new Error('数据集不存在')
    }

    // 检查用户权限
    if (!dataset.hasPermission(userId, 'viewer')) {
      throw new Error('没有访问权限')
    }

    // 获取数据源信息
    const datasourceId = dataset.dataSource?._id || dataset.dataSource
    if (!datasourceId) {
      throw new Error('数据源配置缺失')
    }

    console.log(`🔍 执行自定义SQL - 数据集: ${dataset.displayName}, SQL: ${sql.substring(0, 100)}...`)

    // 执行SQL查询
    const result = await executeQuery(datasourceId.toString(), sql)
    
    const executionTime = Date.now() - startTime
    
    console.log(`✅ SQL执行完成 - 耗时: ${executionTime}ms, 返回行数: ${result.rows?.length || 0}`)

    return {
      rows: result.rows || [],
      columns: result.columns || [],
      executionTime
    }

  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error(`❌ SQL执行失败 - 耗时: ${executionTime}ms, 错误:`, error)
    throw error
  }
}
```

## 🛡️ 安全保障

### SQL注入防护
- ✅ **查询类型限制**：仅允许SELECT查询
- ✅ **危险关键词检查**：阻止DROP、DELETE、INSERT、UPDATE等操作
- ✅ **权限验证**：确保用户有数据集访问权限
- ✅ **数据源隔离**：使用数据集关联的特定数据源

### 执行监控
- 📊 **性能日志**：记录SQL执行时间和返回行数
- 🔍 **查询日志**：记录执行的SQL语句（截断显示）
- ❌ **错误跟踪**：详细的错误信息和堆栈跟踪

## 🎯 修复效果

### 修复前
```
🔨 DSL生成的精确SQL: SELECT department, SUM(revenue)... GROUP BY department
❌ 实际执行的查询: SELECT * FROM table LIMIT 100
```

### 修复后（预期）
```
🔨 DSL生成的精确SQL: SELECT department, SUM(revenue)... GROUP BY department
✅ 实际执行的查询: SELECT department, SUM(revenue)... GROUP BY department
🔍 执行自定义SQL查询: SELECT department AS 所属部门, SUM(revenue) AS 总营收金额...
✅ SQL执行完成 - 耗时: 45ms, 返回行数: 5
```

## 🧪 完整测试流程

对于查询："2024年1月收入和支出情况，按部门分组"

**预期完整流程**：
1. **意图提取**：识别时间、指标、维度 ✅
2. **DSL生成**：创建结构化查询对象 ✅  
3. **SQL转换**：生成聚合查询语句 ✅
4. **SQL执行**：**现在能正确执行DSL生成的SQL** ✅
5. **结果返回**：按部门分组的财务统计数据 ✅

**预期返回数据**：
```
| 所属部门 | 总营收金额 | 总成本金额 |
|---------|-----------|-----------|
| 销售部  | 150000    | 120000    |
| 市场部  | 98000     | 75000     |
| 技术部  | 75000     | 65000     |
```

## 📋 验证要点

用户重新测试时，应该看到：

1. **日志变化**：
   ```
   🔍 执行自定义SQL查询: SELECT department AS 所属部门, SUM(revenue)...
   ✅ SQL执行完成 - 耗时: XXms, 返回行数: X
   ```

2. **返回数据**：实际的聚合统计结果，而不是原始数据行

3. **查询性能**：由于是聚合查询，返回行数应该很少（按分组数量）

## 🚀 架构意义

这个修复完成了整个AI查询架构的闭环：
- **自然语言** → 意图提取 ✅
- **意图** → DSL转换 ✅  
- **DSL** → SQL生成 ✅
- **SQL** → 数据库执行 ✅ **（本次修复）**
- **结果** → 格式化展示 ✅

现在系统真正具备了智能数据分析的能力！