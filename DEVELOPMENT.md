# Smart BI 开发指南

## 快速开始

### 1. 环境准备

确保您已安装以下软件：
- Node.js (v18+)
- MongoDB (v4.2+)
- npm 或 yarn

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

复制环境变量示例文件：
```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，配置您的环境变量：
```env
# MongoDB连接字符串
MONGODB_URI=mongodb://localhost:27017/smartbi

# JWT密钥
JWT_SECRET=your-dev-secret-key

# 环境
NODE_ENV=development
```

### 4. 启动MongoDB

确保MongoDB服务正在运行：
```bash
# macOS (使用Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 6. 使用开发工具

1. 访问 http://localhost:3000/dev-tools
2. 点击"生成开发Token"获取认证token
3. 点击"初始化种子数据"创建示例数据

## 开发工具说明

### 开发工具页面 (`/dev-tools`)

这个页面提供了以下功能：

- **生成开发Token**: 创建用于API访问的JWT token
- **初始化种子数据**: 创建示例数据源和指标
- **清除所有数据**: 删除所有测试数据

### API端点

#### 开发专用API

- `GET /api/dev/token` - 获取开发用JWT token
- `POST /api/dev/seed` - 初始化种子数据
- `DELETE /api/dev/seed` - 清除所有数据

#### 业务API

- `GET /api/datasources` - 获取数据源列表
- `POST /api/datasources` - 创建数据源
- `GET /api/metrics` - 获取指标列表
- `POST /api/metrics` - 创建指标

## 数据库结构

### 数据源 (DataSources)

```javascript
{
  _id: ObjectId,
  name: String,          // 数据源名称
  type: String,          // mysql, postgresql, mongodb, api, csv
  config: {
    host: String,
    port: Number,
    database: String,
    username: String,
    password: String,    // 存储时会被加密
    // ... 其他配置
  },
  userId: ObjectId,      // 所属用户
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 指标 (Metrics)

```javascript
{
  _id: ObjectId,
  name: String,          // 指标唯一标识
  displayName: String,   // 显示名称
  description: String,   // 描述
  type: String,          // count, sum, avg, max, min, ratio, custom
  formula: String,       // 计算公式
  datasourceId: ObjectId, // 关联数据源
  category: String,      // 分类
  unit: String,         // 单位
  tags: [String],       // 标签
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## 认证系统

系统使用JWT进行认证，在开发环境中提供以下便利功能：

1. **自动fallback**: 如果token验证失败，自动使用默认用户
2. **开发token**: 可以通过API生成测试用的token
3. **无token处理**: 开发环境下即使没有token也能正常工作

## 错误处理

系统对MongoDB连接问题进行了优雅处理：

- 连接超时时返回空数据而不是错误
- 提供警告信息指导用户检查连接
- 在开发环境下提供更详细的错误信息

## 故障排除

### MongoDB连接问题

如果遇到"buffering timed out"错误：

1. 检查MongoDB是否正在运行
2. 检查连接字符串是否正确
3. 使用开发工具页面查看详细错误信息

### 认证问题

如果遇到JWT认证错误：

1. 访问 `/dev-tools` 页面生成新token
2. 检查localStorage中是否保存了token
3. 确认环境变量中的JWT_SECRET设置正确

### 权限错误

如果遇到权限相关错误：

1. 当前权限系统在开发环境下允许所有操作
2. 如果仍有问题，检查组件中是否正确导入权限服务

## 部署注意事项

在生产环境部署时：

1. 设置强JWT密钥
2. 配置正确的MongoDB连接
3. 开发工具页面将自动禁用
4. 移除或保护开发专用API端点