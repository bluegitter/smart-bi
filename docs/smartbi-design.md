# Smart BI 产品设计文档

**项目名称：Smart BI**  
**版本：v1.0**  
**创建日期：2025-08-21**

---

## 目录

1. [概述](#1-概述)
2. [系统架构设计](#2-系统架构设计)
3. [功能模块设计](#3-功能模块设计)
4. [用户界面设计](#4-用户界面设计)
5. [数据模型设计](#5-数据模型设计)
6. [API接口设计](#6-api接口设计)
7. [技术实现方案](#7-技术实现方案)
8. [安全性设计](#8-安全性设计)
9. [性能优化方案](#9-性能优化方案)
10. [部署架构](#10-部署架构)

---

## 1. 概述

### 1.1 项目目标
Smart BI是一个智能化的商业智能平台，核心目标是通过AI大模型能力结合可视化拖拽技术，让用户能够通过自然语言交互快速构建数据看板，实现数据的智能分析与可视化展示。

### 1.2 核心特性
- **AI驱动**：基于大模型的自然语言查询和智能洞察
- **拖拽式布局**：可视化组件拖拽构建看板
- **智能生成**：根据用户问题自动生成合理的看板布局
- **个性化配置**：支持用户个性化定制和全局配置覆盖
- **多角色协作**：支持权限管控和多人协作编辑

### 1.3 目标用户
- 业务分析师：快速数据分析和看板构建
- 部门经理：关键指标监控和业务洞察
- 高层管理者：决策支持和预测分析
- IT/数据工程师：数据源管理和权限配置

---

## 2. 系统架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Smart BI 系统架构                        │
├─────────────────────────────────────────────────────────────┤
│  前端展示层 (Next.js + React)                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ 看板编辑器  │ │ 指标拖拽面板│ │ 自然语言界面│           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
├─────────────────────────────────────────────────────────────┤
│  业务逻辑层 (Node.js/Express API)                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ 看板管理服务 │ │ AI智能服务   │ │ 用户权限服务 │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ 数据源服务   │ │ 图表渲染服务 │ │ 配置管理服务 │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
├─────────────────────────────────────────────────────────────┤
│  AI服务层                                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ 大模型接入   │ │ 语义解析     │ │ 智能推荐     │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
├─────────────────────────────────────────────────────────────┤
│  数据存储层                                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ MongoDB      │ │ Redis缓存    │ │ 文件存储     │        │
│  │ (主数据库)   │ │ (会话/缓存)  │ │ (配置/资源)  │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
├─────────────────────────────────────────────────────────────┤
│  外部数据源                                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ MySQL/PG     │ │ REST API     │ │ Excel/CSV    │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈选择

**前端技术栈**
- **框架**：Next.js 15 + React 19（SSR支持，性能优化）
- **状态管理**：Zustand（轻量级状态管理）
- **样式方案**：Tailwind CSS（快速样式开发）
- **拖拽库**：react-dnd（拖拽交互）
- **图表库**：echarts/recharts（数据可视化）
- **UI组件**：Radix UI + shadcn/ui（无障碍访问）

**后端技术栈**
- **运行时**：Node.js
- **框架**：Express.js（API服务）
- **数据库**：MongoDB（主数据库）+ Redis（缓存）
- **ODM**：Mongoose（MongoDB对象文档映射）
- **认证**：JWT + bcrypt（身份验证）
- **文件存储**：AWS S3 / 本地存储

**AI服务**
- **大模型接入**：自定义OpenAI兼容接口（Qwen-3-235B模型）
- **向量数据库**：Pinecone / Qdrant（语义搜索）
- **模型配置**：支持自定义API Base URL和模型名称

---

## 3. 功能模块设计

### 3.1 大模型智能服务模块

#### 3.1.1 自然语言查询处理
```typescript
interface NLQueryService {
  // 解析用户自然语言查询
  parseQuery(query: string): Promise<ParsedQuery>
  
  // 生成SQL查询
  generateSQL(parsedQuery: ParsedQuery): Promise<string>
  
  // 智能纠错和建议
  suggestCorrections(query: string): Promise<QuerySuggestion[]>
}

interface ParsedQuery {
  metrics: string[]      // 提取的指标
  dimensions: string[]   // 提取的维度
  timeRange: DateRange   // 时间范围
  filters: Filter[]      // 筛选条件
  chartType: ChartType   // 推荐图表类型
}
```

#### 3.1.2 智能看板生成器
```typescript
interface DashboardGenerator {
  // 根据查询自动生成看板布局
  generateDashboard(query: string): Promise<DashboardLayout>
  
  // 推荐相关指标和维度
  recommendMetrics(baseMetrics: string[]): Promise<MetricRecommendation[]>
  
  // 优化看板布局
  optimizeLayout(layout: DashboardLayout): Promise<DashboardLayout>
}
```

### 3.2 看板编辑器模块

#### 3.2.1 拖拽布局引擎
```typescript
interface DragDropEngine {
  // 组件拖拽处理
  handleComponentDrag(component: Component, position: Position): void
  
  // 指标拖拽到组件
  handleMetricDrag(metric: Metric, targetComponent: Component): void
  
  // 自动对齐和吸附
  autoAlign(components: Component[]): Component[]
  
  // 碰撞检测
  detectCollisions(component: Component, others: Component[]): boolean
}
```

#### 3.2.2 组件库系统
```typescript
interface ComponentLibrary {
  // 获取可用组件类型
  getAvailableComponents(): ComponentType[]
  
  // 创建组件实例
  createComponent(type: ComponentType, config: ComponentConfig): Component
  
  // 渲染组件
  renderComponent(component: Component, data: any[]): ReactNode
}

type ComponentType = 
  | 'line-chart'    // 折线图
  | 'bar-chart'     // 柱状图
  | 'pie-chart'     // 饼图
  | 'table'         // 表格
  | 'kpi-card'      // 指标卡片
  | 'gauge'         // 仪表盘
  | 'heatmap'       // 热力图
```

### 3.3 数据源管理模块

#### 3.3.1 数据连接器
```typescript
interface DataConnector {
  // 测试连接
  testConnection(config: DataSourceConfig): Promise<boolean>
  
  // 执行查询
  executeQuery(sql: string, dataSourceId: string): Promise<QueryResult>
  
  // 获取数据源元数据
  getMetadata(dataSourceId: string): Promise<DataSourceMetadata>
}

interface DataSourceConfig {
  type: 'mysql' | 'postgresql' | 'api' | 'csv'
  host?: string
  port?: number
  database?: string
  username?: string
  password?: string
  apiUrl?: string
  headers?: Record<string, string>
}
```

### 3.4 权限管理模块

#### 3.4.1 RBAC权限控制
```typescript
interface PermissionService {
  // 检查用户权限
  checkPermission(userId: string, resource: string, action: string): Promise<boolean>
  
  // 获取用户角色
  getUserRoles(userId: string): Promise<Role[]>
  
  // 分配权限
  assignPermission(userId: string, permission: Permission): Promise<void>
}

interface Permission {
  resource: 'dashboard' | 'metric' | 'datasource'
  actions: ('read' | 'write' | 'delete' | 'share')[]
}
```

---

## 4. 用户界面设计

### 4.1 整体布局结构

```
┌─────────────────────────────────────────────────────────────┐
│                     Smart BI 主界面                        │
├─────────────────────────────────────────────────────────────┤
│  Header: Logo | 搜索栏 | AI问答 | 用户菜单                  │
├─────────────────────────────────────────────────────────────┤
│ Sidebar │                 Main Content                      │
│ ┌─────┐ │ ┌─────────────────────────────────────────────┐   │
│ │看板 │ │ │            看板画布区域                   │   │
│ │列表 │ │ │  ┌─────────┐  ┌─────────┐  ┌─────────┐    │   │
│ │     │ │ │  │ 图表1   │  │ 图表2   │  │ 图表3   │    │   │
│ │指标 │ │ │  └─────────┘  └─────────┘  └─────────┘    │   │
│ │面板 │ │ │                                         │   │
│ │     │ │ │  ┌─────────┐  ┌─────────────────────────┐  │   │
│ │组件 │ │ │  │ 图表4   │  │        图表5           │  │   │
│ │库   │ │ │  └─────────┘  └─────────────────────────┘  │   │
│ └─────┘ │ └─────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│ Status Bar: 自动保存状态 | 版本信息 | 连接状态             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 核心交互流程

#### 4.2.1 自然语言查询流程
```
用户输入问题 → AI解析意图 → 提取指标维度 → 生成看板预览 → 用户确认/调整
```

#### 4.2.2 拖拽编辑流程
```
选择组件/指标 → 拖拽到目标位置 → 自动对齐 → 数据绑定 → 实时渲染
```

### 4.3 响应式设计

**桌面端 (≥1024px)**
- 三列布局：侧边栏 + 主内容区 + 属性面板
- 支持多个图表同屏显示
- 完整的工具栏和菜单

**平板端 (768px-1023px)**  
- 侧边栏可收缩
- 图表网格自适应调整
- 触摸友好的拖拽交互

**移动端 (<768px)**
- 堆叠布局
- 单图表全屏查看模式
- 简化的操作界面

---

## 5. 数据模型设计

### 5.1 核心实体关系图

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    User     │    │ Dashboard   │    │ Component   │
│─────────────│    │─────────────│    │─────────────│
│ id          │ 1──┤ id          │ 1──┤ id          │
│ email       │  n │ name        │  n │ type        │
│ name        │    │ description │    │ config      │
│ role        │    │ layout      │    │ position    │
│ created_at  │    │ user_id     │    │ size        │
└─────────────┘    │ created_at  │    │ dashboard_id│
                   └─────────────┘    └─────────────┘
                          │                   │
                          │                   │
                          │            ┌─────────────┐
                          │            │   Metric    │
                          │            │─────────────│
                          │            │ id          │
                          └────────────┤ name        │
                                     n │ type        │
                                       │ formula     │
                                       │ datasource_id│
                                       └─────────────┘
                                              │
                                              │
                                       ┌─────────────┐
                                       │ DataSource  │
                                       │─────────────│
                                       │ id          │
                                       │ name        │
                                       │ type        │
                                       │ config      │
                                       │ created_at  │
                                       └─────────────┘
```

### 5.2 数据库Schema设计

#### 5.2.1 用户表 (users)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  avatar_url VARCHAR(500),
  preferences JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 5.2.2 看板表 (dashboards)
```sql
CREATE TABLE dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  layout JSONB NOT NULL, -- 布局配置
  global_config JSONB,   -- 全局配置
  user_id UUID REFERENCES users(id),
  is_public BOOLEAN DEFAULT FALSE,
  share_token VARCHAR(100) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 5.2.3 组件表 (components)
```sql
CREATE TABLE components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID REFERENCES dashboards(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- chart type
  title VARCHAR(200),
  config JSONB NOT NULL,     -- 组件配置
  position JSONB NOT NULL,   -- 位置信息
  size JSONB NOT NULL,       -- 尺寸信息
```typescript
interface Metric {
  _id: ObjectId
  name: string               // 指标名称
  displayName: string        // 显示名称
  description?: string
  type: 'count' | 'sum' | 'avg' | 'max' | 'min' | 'ratio' | 'custom'
  formula?: string           // 计算公式
  datasourceId: ObjectId     // 关联数据源ID
  category: string           // 指标分类
  unit?: string             // 单位
  tags: string[]            // 标签
  isActive: boolean         // 是否激活
  createdAt: Date
  updatedAt: Date
}
```

#### 5.2.4 数据源集合 (datasources)
```typescript
interface DataSource {
  _id: ObjectId
  name: string
  type: 'mysql' | 'postgresql' | 'mongodb' | 'api' | 'csv'
  config: {
    // 数据库连接配置
    host?: string
    port?: number
    database?: string
    username?: string
    password?: string  // 加密存储
    // API配置
    apiUrl?: string
    headers?: Record<string, string>
    // 文件配置
    filePath?: string
  }
  schemaInfo: {
    tables: {
      name: string
      columns: {
        name: string
        type: string
        nullable: boolean
      }[]
    }[]
  }
  userId: ObjectId           // 创建者ID
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

#### 5.2.5 查询缓存集合 (query_cache)
```typescript
interface QueryCache {
  _id: ObjectId
  queryHash: string          // 查询哈希值
  datasourceId: ObjectId
  sql: string
  result: any[]             // 查询结果
  columns: ColumnInfo[]
  expireAt: Date            // TTL索引
  createdAt: Date
}

interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
}
```

### 5.3 MongoDB索引优化

```javascript
// 用户集合索引
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ role: 1 })

// 看板集合索引
db.dashboards.createIndex({ userId: 1 })
db.dashboards.createIndex({ shareToken: 1 }, { unique: true, sparse: true })
db.dashboards.createIndex({ isPublic: 1 })
db.dashboards.createIndex({ "permissions.userId": 1 })

// 指标集合索引
db.metrics.createIndex({ datasourceId: 1 })
db.metrics.createIndex({ category: 1 })
db.metrics.createIndex({ isActive: 1 })
db.metrics.createIndex({ tags: 1 })

// 数据源集合索引
db.datasources.createIndex({ userId: 1 })
db.datasources.createIndex({ type: 1 })
db.datasources.createIndex({ isActive: 1 })

// 查询缓存TTL索引
db.query_cache.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 })
db.query_cache.createIndex({ queryHash: 1 })
db.query_cache.createIndex({ datasourceId: 1 })
```

---

## 6. API接口设计

### 6.1 RESTful API设计

#### 6.1.1 看板管理API

```typescript
// GET /api/dashboards - 获取看板列表
interface GetDashboardsResponse {
  dashboards: Dashboard[]
  total: number
  page: number
  limit: number
}

// POST /api/dashboards - 创建看板
interface CreateDashboardRequest {
  name: string
  description?: string
  template?: string // 模板ID
}

// PUT /api/dashboards/:id - 更新看板
interface UpdateDashboardRequest {
  name?: string
  description?: string
  layout?: DashboardLayout
  components?: Component[]
}

// GET /api/dashboards/:id/share - 生成分享链接
interface ShareDashboardResponse {
  shareUrl: string
  token: string
  expireAt: Date
}
```

#### 6.1.2 AI智能服务API

```typescript
// POST /api/ai/query - 自然语言查询
interface NLQueryRequest {
  query: string
  context?: {
    dashboardId?: string
    availableMetrics?: string[]
  }
}

interface NLQueryResponse {
  parsedQuery: ParsedQuery
  sql: string
  suggestedCharts: ChartSuggestion[]
  data: any[]
}

// POST /api/ai/generate-dashboard - 自动生成看板
interface GenerateDashboardRequest {
  query: string
  preferences?: {
    chartTypes?: ChartType[]
    layout?: 'grid' | 'free'
  }
}

interface GenerateDashboardResponse {
  dashboard: Dashboard
  confidence: number
  alternatives?: Dashboard[]
}
```

#### 6.1.3 数据查询API

```typescript
// POST /api/data/query - 执行数据查询
interface DataQueryRequest {
  sql: string
  datasourceId: string  // MongoDB ObjectId字符串
  params?: Record<string, any>
}

interface DataQueryResponse {
  data: any[]
  columns: ColumnInfo[]
  total: number
  executionTime: number
}

// GET /api/datasources/:id/schema - 获取数据源结构
interface DataSourceSchemaResponse {
  tables: TableInfo[]
  views: ViewInfo[]
  columns: ColumnInfo[]
}
```

### 6.2 WebSocket实时通信

```typescript
// 实时协作编辑
interface CollaborationEvent {
  type: 'component_moved' | 'component_added' | 'component_deleted'
  userId: string
  dashboardId: string
  data: any
  timestamp: Date
}

// 实时数据更新
interface DataUpdateEvent {
  type: 'data_refresh'
  componentId: string
  data: any[]
  timestamp: Date
}
```

---

## 7. 技术实现方案

### 7.1 前端架构实现

#### 7.1.1 状态管理架构
```typescript
// 使用Zustand进行状态管理
interface AppState {
  // 用户状态
  user: User | null
  isAuthenticated: boolean
  
  // 看板状态
  currentDashboard: Dashboard | null
  dashboards: Dashboard[]
  
  // 编辑状态
  isEditing: boolean
  selectedComponent: Component | null
  draggedMetric: Metric | null
  
  // UI状态
  sidebarCollapsed: boolean
  loading: boolean
  error: string | null
}

const useAppStore = create<AppState>((set, get) => ({
  // 状态初始值
  user: null,
  isAuthenticated: false,
  currentDashboard: null,
  dashboards: [],
  
  // Actions
  actions: {
    login: async (credentials) => {
      // 登录逻辑
    },
    
    loadDashboard: async (id) => {
      // 加载看板
    },
    
    updateComponent: (component) => {
      // 更新组件
    }
  }
}))
```

#### 7.1.2 拖拽系统实现
```typescript
// 使用react-dnd实现拖拽
interface DragItem {
  type: 'component' | 'metric'
  id: string
  data: Component | Metric
}

const ComponentDragSource: FC<{component: Component}> = ({component}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'component',
    item: { type: 'component', id: component.id, data: component },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }))

  return (
    <div ref={drag} className={isDragging ? 'opacity-50' : ''}>
      {/* 组件内容 */}
    </div>
  )
}

const DropZone: FC = () => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ['component', 'metric'],
    drop: (item: DragItem, monitor) => {
      const offset = monitor.getSourceClientOffset()
      if (offset) {
        handleDrop(item, offset)
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }))

  return (
    <div ref={drop} className={`dashboard-canvas ${isOver ? 'drop-active' : ''}`}>
      {/* 看板画布 */}
    </div>
  )
}
```

### 7.2 后端服务实现

#### 7.2.1 AI服务集成
```typescript
// 大模型服务封装 - 适配自定义OpenAI接口
class AIService {
  private client: OpenAI
  
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_API_BASE_URL,  // 支持自定义基础URL
    })
  }
  
  async parseNaturalQuery(query: string): Promise<ParsedQuery> {
    const prompt = `
    解析用户的数据查询需求，提取以下信息：
    - 指标：用户想要查看的数据指标
    - 维度：数据的分组维度
    - 时间范围：查询的时间范围
    - 图表类型：推荐的可视化方式
    
    用户查询：${query}
    
    请以JSON格式返回结果。
    `
    
    const response = await this.client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',  // 支持自定义模型名称
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    })
    
    return JSON.parse(response.choices[0].message.content!)
  }
  
  async generateDashboardLayout(parsedQuery: ParsedQuery): Promise<DashboardLayout> {
    // 根据解析结果生成看板布局
    const layout = {
      components: [],
      grid: { columns: 12, rows: 8 }
    }
    
    // 根据指标数量和类型决定布局
    parsedQuery.metrics.forEach((metric, index) => {
      const component = this.createComponentForMetric(metric, parsedQuery.dimensions)
      layout.components.push(component)
    })
    
    return this.optimizeLayout(layout)
  }
}
```

#### 7.2.2 数据连接器实现
```typescript
// 数据源适配器工厂
class DataSourceFactory {
  static create(config: DataSourceConfig): DataConnector {
    switch (config.type) {
      case 'mysql':
        return new MySQLConnector(config)
      case 'postgresql':
        return new PostgreSQLConnector(config)
      case 'api':
        return new APIConnector(config)
      default:
        throw new Error(`Unsupported datasource type: ${config.type}`)
    }
  }
}

class MySQLConnector implements DataConnector {
  private pool: mysql.Pool
  
  constructor(config: DataSourceConfig) {
    this.pool = mysql.createPool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      connectionLimit: 10,
    })
  }
  
  async executeQuery(sql: string): Promise<QueryResult> {
    const [rows] = await this.pool.execute(sql)
    return {
      data: rows as any[],
      columns: this.extractColumns(rows),
      total: (rows as any[]).length
    }
  }
  
  async getMetadata(): Promise<DataSourceMetadata> {
    const tablesQuery = `
      SELECT TABLE_NAME, TABLE_COMMENT 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ?
    `
    const [tables] = await this.pool.execute(tablesQuery, [this.database])
    
    const columnsQuery = `
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ?
    `
    const [columns] = await this.pool.execute(columnsQuery, [this.database])
    
    return { tables: tables as any[], columns: columns as any[] }
  }
}
```

### 7.3 性能优化实现

#### 7.3.1 前端优化
```typescript
// 组件懒加载
const ChartRenderer = lazy(() => import('./ChartRenderer'))

// 虚拟化长列表
import { FixedSizeList as List } from 'react-window'

const MetricsList: FC<{metrics: Metric[]}> = ({ metrics }) => {
  const Row = ({ index, style }: { index: number, style: CSSProperties }) => (
    <div style={style}>
      <MetricItem metric={metrics[index]} />
    </div>
  )
  
  return (
    <List
      height={400}
      itemCount={metrics.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </List>
  )
}

// 数据查询防抖
const useDebounceQuery = (query: string, delay: number = 500) => {
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, delay)
    
    return () => clearTimeout(timer)
  }, [query, delay])
  
  return debouncedQuery
}
```

#### 7.3.2 后端优化
```typescript
// Redis缓存层
class CacheService {
  private redis: Redis
  
  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key)
    return value ? JSON.parse(value) : null
  }
  
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value))
  }
  
  // 查询结果缓存
  async cachedQuery(sql: string, datasourceId: string): Promise<QueryResult> {
    const cacheKey = `query:${datasourceId}:${hashString(sql)}`
    
    let result = await this.get<QueryResult>(cacheKey)
    if (!result) {
      result = await this.executeQuery(sql, datasourceId)
      await this.set(cacheKey, result, 1800) // 30分钟缓存
    }
    
    return result
  }
}

// 数据库连接池管理
class ConnectionPoolManager {
  private pools: Map<string, any> = new Map()
  
  getPool(datasourceId: string, config: DataSourceConfig) {
    if (!this.pools.has(datasourceId)) {
      const pool = this.createPool(config)
      this.pools.set(datasourceId, pool)
    }
    return this.pools.get(datasourceId)
  }
  
  private createPool(config: DataSourceConfig) {
    // 根据配置创建连接池
    return mysql.createPool({
      ...config,
      connectionLimit: 20,
      acquireTimeout: 60000,
      timeout: 60000,
    })
  }
}
```

---

## 8. 安全性设计

### 8.1 身份认证与授权

```typescript
// JWT Token管理
class AuthService {
  generateTokens(user: User) {
    const accessToken = jwt.sign(
      { userId: user._id.toString(), role: user.role },  // MongoDB ObjectId转字符串
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    )
    
    const refreshToken = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    )
    
    return { accessToken, refreshToken }
  }
  
  // 权限检查中间件
  requirePermission(resource: string, action: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user
      const hasPermission = await this.checkPermission(user._id, resource, action)
      
      if (!hasPermission) {
        return res.status(403).json({ error: 'Insufficient permissions' })
      }
      
      next()
    }
  }
}
```

### 8.2 数据安全

```typescript
// SQL注入防护
class QueryValidator {
  static validateSQL(sql: string): boolean {
    // 禁止危险操作
    const dangerousKeywords = [
      'DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE'
    ]
    
    const upperSQL = sql.toUpperCase()
    return !dangerousKeywords.some(keyword => upperSQL.includes(keyword))
  }
  
  static sanitizeQuery(sql: string): string {
    // 移除注释和额外的分号
    return sql
      .replace(/--.*$/gm, '')  // 移除单行注释
      .replace(/\/\*[\s\S]*?\*\//g, '') // 移除多行注释
      .replace(/;+$/, '')      // 移除末尾分号
      .trim()
  }
}

// 数据脱敏
class DataMaskingService {
  maskSensitiveData(data: any[], rules: MaskingRule[]): any[] {
    return data.map(row => {
      const maskedRow = { ...row }
      
      rules.forEach(rule => {
        if (maskedRow[rule.column]) {
          maskedRow[rule.column] = this.applyMask(maskedRow[rule.column], rule.type)
        }
      })
      
      return maskedRow
    })
  }
  
  private applyMask(value: string, type: 'phone' | 'email' | 'idcard'): string {
    switch (type) {
      case 'phone':
        return value.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
      case 'email':
        return value.replace(/(.{2}).*(@.*)/, '$1***$2')
      case 'idcard':
        return value.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')
      default:
        return value
    }
  }
}
```

---

## 9. 性能优化方案

### 9.1 前端性能优化

#### 9.1.1 代码分割与懒加载
```typescript
// 路由级别代码分割
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))

// 组件级别懒加载
const ChartComponents = {
  'line-chart': lazy(() => import('./charts/LineChart')),
  'bar-chart': lazy(() => import('./charts/BarChart')),
  'pie-chart': lazy(() => import('./charts/PieChart')),
}
```

#### 9.1.2 数据缓存策略
```typescript
// SWR数据缓存
const useDashboardData = (dashboardId: string) => {
  const { data, error, mutate } = useSWR(
    `/api/dashboards/${dashboardId}`,
    fetcher,
    {
      refreshInterval: 30000, // 30秒自动刷新
      dedupingInterval: 5000, // 5秒内去重请求
    }
  )
  
  return { dashboard: data, isLoading: !error && !data, error, refresh: mutate }
}

// 图表数据缓存
const ChartDataCache = new Map<string, { data: any[], timestamp: number }>()

const getCachedChartData = (chartId: string, maxAge: number = 60000) => {
  const cached = ChartDataCache.get(chartId)
  if (cached && Date.now() - cached.timestamp < maxAge) {
    return cached.data
  }
  return null
}
```

### 9.2 后端性能优化

#### 9.2.1 数据库优化
```sql
-- 创建适当的索引
CREATE INDEX idx_dashboards_user_id ON dashboards(user_id);
CREATE INDEX idx_components_dashboard_id ON components(dashboard_id);
CREATE INDEX idx_metrics_datasource_id ON metrics(datasource_id);

-- 分区表（大数据量场景）
CREATE TABLE query_logs (
    id UUID PRIMARY KEY,
    user_id UUID,
    query_text TEXT,
    execution_time INTEGER,
    created_at TIMESTAMP
) PARTITION BY RANGE (created_at);

-- 查询优化
EXPLAIN ANALYZE SELECT * FROM dashboards WHERE user_id = ? AND created_at > ?;
```

#### 9.2.2 API性能优化
```typescript
// 批量查询接口
app.post('/api/batch-query', async (req, res) => {
  const queries = req.body.queries
  
  // 并行执行多个查询
  const results = await Promise.all(
    queries.map(async (query: any) => {
      try {
        return await executeQuery(query.sql, query.datasourceId)
      } catch (error) {
        return { error: error.message }
      }
    })
  )
  
  res.json({ results })
})

// MongoDB分页优化
app.get('/api/dashboards', async (req, res) => {
  const { page = 1, limit = 20, cursor } = req.query
  const pageSize = Number(limit)
  
  // 使用游标分页提升性能
  let query = Dashboard.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(pageSize)
  
  if (cursor) {
    query = query.where('_id').lt(cursor)
  }
  
  const dashboards = await query.select({
    _id: 1,
    name: 1,
    description: 1,
    createdAt: 1,
    'layout.components': { $size: '$layout.components' }
  }).lean()
  
  res.json({ 
    dashboards,
    nextCursor: dashboards.length === pageSize ? dashboards[dashboards.length - 1]._id : null
  })
})
```

---

## 10. 部署架构

### 10.1 容器化部署

#### 10.1.1 Docker配置
```dockerfile
# Frontend Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

#### 10.1.2 Docker Compose
```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    environment:
      - REACT_APP_API_URL=http://backend:3001

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    depends_on:
      - mongodb
      - redis
    environment:
      - MONGODB_URI=mongodb://admin:adminpassword@mongodb:27017/smartbi?authSource=admin
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - OPENAI_API_BASE_URL=${OPENAI_API_BASE_URL}
      - OPENAI_MODEL=${OPENAI_MODEL}

  mongodb:
    image: mongo:7-jammy
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=adminpassword
      - MONGO_INITDB_DATABASE=smartbi
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    ports:
      - "27017:27017"

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  mongodb_data:
  redis_data:
```

### 10.2 生产环境架构

```
                    ┌─────────────────┐
                    │   Load Balancer │
                    │    (Nginx)      │
                    └─────────┬───────┘
                              │
                    ┌─────────▼───────┐
                    │   API Gateway   │
                    │   (Kong/Envoy)  │
                    └─────────┬───────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
    ┌─────▼─────┐    ┌────────▼────────┐    ┌────▼─────┐
    │Frontend   │    │  Backend API    │    │AI Service│
    │(Next.js)  │    │  (Node.js)      │    │(Python)  │
    └───────────┘    └────────┬────────┘    └──────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
    ┌─────▼─────┐    ┌────────▼────────┐    ┌────▼─────┐
    │ MongoDB   │    │     Redis       │    │   File   │
    │(Primary)  │    │    (Cache)      │    │ Storage  │
    └───────────┘    └─────────────────┘    └──────────┘
          │
    ┌─────▼─────┐
    │ MongoDB   │
    │(Replica)  │
    └───────────┘
```

### 10.3 监控和日志

#### 10.3.1 监控配置
```yaml
# Prometheus配置
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      
  grafana:
    image: grafana/grafana
    ports:
      - "3030:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  grafana_data:
```

#### 10.3.2 日志聚合
```typescript
// 结构化日志
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
})

// 业务日志记录
const logDashboardAccess = (userId: string, dashboardId: string) => {
  logger.info('Dashboard accessed', {
    userId,
    dashboardId,
    timestamp: new Date().toISOString(),
    action: 'view_dashboard'
  })
}
```

---

## 结语

Smart BI产品设计文档涵盖了从系统架构到具体实现的各个层面，为开发团队提供了完整的技术指导。通过AI驱动的智能化能力结合现代化的前端技术栈，我们将构建一个用户友好、功能强大的商业智能平台。

在实际开发过程中，建议采用敏捷开发模式，按模块逐步实现各项功能，并持续优化用户体验和系统性能。