# 数据集智能问答功能

基于数据集的AI智能问答系统，让用户能够通过自然语言与数据集进行交互，获取数据洞察和分析建议。

## ✨ 功能特色

### 🎯 核心功能
- **数据集上下文感知**：AI助手了解数据集结构、字段含义和数据特征
- **智能数据分析**：基于实际数据提供专业的分析建议和洞察
- **SQL查询生成**：根据用户需求自动生成相应的SQL查询语句
- **数据可视化建议**：推荐适合的图表类型和可视化方案
- **多模式对话**：支持基础问答和深度分析两种模式

### 🛡️ 技术特点
- **多LLM支持**：兼容OpenAI、Anthropic、智谱AI、DeepSeek等多种提供商
- **上下文优化**：智能管理对话历史，保持高效的上下文传递
- **类型安全**：完整的TypeScript类型定义
- **响应式UI**：现代化的用户界面设计
- **安全认证**：基于用户权限的安全访问控制

## 📦 组件架构

### 1. API接口
- `POST /api/ai/dataset-chat` - 数据集AI问答接口
- 支持数据集架构包含、数据预览、自定义预览限制

### 2. React组件
- `DatasetAIChatDialog` - 完整的对话界面组件
- `DatasetChatButton` - 可嵌入的问答按钮
- `FloatingDatasetChatButton` - 浮动AI助手按钮

### 3. Hooks
- `useDatasetChat` - 数据集对话状态管理
- `useDatasets` - 扩展了AI问答相关功能

## 🚀 快速开始

### 基础使用

```tsx
import { DatasetChatButton } from '@/components/ai/DatasetChatButton'
import type { Dataset } from '@/types/dataset'

function DatasetPage({ dataset }: { dataset: Dataset }) {
  return (
    <div>
      <h1>{dataset.displayName}</h1>
      
      {/* 基础AI问答按钮 */}
      <DatasetChatButton
        dataset={dataset}
        includeSchema={true}
        includePreview={false}
      />
    </div>
  )
}
```

### 高级配置

```tsx
import { DatasetAIChatDialog } from '@/components/ai/DatasetAIChatDialog'

function AdvancedDatasetChat({ dataset }: { dataset: Dataset }) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        开启深度数据分析
      </button>
      
      <DatasetAIChatDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        dataset={dataset}
        includeSchema={true}
        includePreview={true}
        previewLimit={20}
      />
    </>
  )
}
```

### 使用Hook

```tsx
import { useDatasetChat } from '@/hooks/useDatasetChat'

function CustomDatasetChat({ dataset }: { dataset: Dataset }) {
  const { messages, isLoading, sendMessage, clearMessages } = useDatasetChat(dataset)
  
  const handleSend = async (message: string) => {
    const response = await sendMessage(message, {
      includeSchema: true,
      includePreview: true,
      previewLimit: 10
    })
    
    if (response) {
      console.log('AI响应:', response.message)
      console.log('使用模型:', response.model)
      console.log('响应时间:', response.responseTime)
    }
  }
  
  return (
    <div>
      {/* 自定义聊天界面 */}
    </div>
  )
}
```

## ⚙️ 配置选项

### DatasetChatButton Props
```typescript
interface DatasetChatButtonProps {
  dataset: Dataset                    // 必需：数据集对象
  variant?: 'default' | 'ghost' | 'outline'  // 按钮样式
  size?: 'sm' | 'default' | 'lg'      // 按钮尺寸
  className?: string                  // 自定义CSS类
  children?: React.ReactNode          // 自定义按钮内容
  includeSchema?: boolean             // 是否包含数据集架构（默认true）
  includePreview?: boolean            // 是否包含数据预览（默认false）
  previewLimit?: number               // 预览数据行数（默认10）
}
```

### API请求参数
```typescript
interface DatasetChatRequest {
  datasetId: string                   // 数据集ID
  message: string                     // 用户消息（1-2000字符）
  history?: Message[]                 // 对话历史
  includeSchema?: boolean             // 包含架构信息
  includePreview?: boolean            // 包含数据预览
  previewLimit?: number               // 预览限制（1-100行）
}
```

## 🔧 最佳实践

### 1. 上下文配置建议

**基础问答模式**（推荐用于一般查询）：
```tsx
<DatasetChatButton
  dataset={dataset}
  includeSchema={true}      // ✅ 包含架构
  includePreview={false}    // ❌ 不包含预览（节省token）
/>
```

**深度分析模式**（推荐用于复杂分析）：
```tsx
<DatasetChatButton
  dataset={dataset}
  includeSchema={true}      // ✅ 包含架构
  includePreview={true}     // ✅ 包含预览
  previewLimit={15}         // ⚡ 适中的预览量
/>
```

### 2. 性能优化

- **控制预览数据量**：大数据集建议设置较小的`previewLimit`
- **合理使用架构信息**：对于字段很多的数据集，可以考虑不包含架构
- **管理对话历史**：系统自动管理最近8-10条对话历史

### 3. 用户体验

- **提供引导问题**：在空状态时显示建议问题
- **浮动按钮**：在数据集详情页使用浮动AI助手
- **上下文切换**：允许用户动态调整上下文设置

## 🎨 UI定制

### 主题颜色
组件使用emerald-blue渐变主题，可通过CSS自定义：

```css
/* 自定义AI对话框主题 */
.dataset-ai-chat {
  --primary-gradient: linear-gradient(135deg, #10b981, #3b82f6);
  --accent-color: #059669;
}
```

### 响应式设计
- 移动端优化的对话界面
- 自适应的按钮和输入框尺寸
- 智能的内容滚动和定位

## 🔒 安全考虑

### 权限控制
- 只有对数据集有访问权限的用户才能发起AI问答
- API自动验证用户身份和数据集权限

### 数据隐私
- 敏感数据不会在日志中记录
- 支持配置是否包含实际数据预览
- LLM API调用采用安全的认证方式

### 错误处理
- 完整的错误边界和重试机制
- 友好的错误提示和处理建议
- 自动的请求超时和取消机制

## 📊 示例对话

### 用户提问示例：
1. **数据结构查询**："这个数据集包含哪些主要字段？"
2. **分析建议**："基于销售数据，你有什么分析建议？"
3. **SQL查询**："如何查询过去30天的销售趋势？"
4. **可视化建议**："这些数据适合用什么图表展示？"
5. **数据质量**："数据质量如何？有什么改进建议？"

### AI回答特点：
- 基于实际数据集结构的准确回答
- 提供具体的SQL查询示例
- 推荐适合的可视化方案
- 给出数据质量改进建议
- 解释字段含义和业务意义

## 🚀 部署说明

1. **环境要求**：
   - Node.js 18+
   - 已配置的LLM服务（OpenAI/Anthropic等）
   - 数据集管理系统

2. **依赖安装**：
   ```bash
   npm install
   ```

3. **配置LLM**：
   - 在系统设置中配置至少一个LLM服务
   - 设置默认的LLM配置

4. **权限配置**：
   - 确保用户有数据集访问权限
   - 配置适当的API认证

## 🔮 未来规划

- [ ] 支持多数据集联合问答
- [ ] 集成数据可视化生成
- [ ] 添加问答历史记录
- [ ] 支持语音输入和输出
- [ ] 智能问题推荐系统
- [ ] 数据血缘关系分析

---

通过这个智能问答系统，用户可以更直观、高效地探索和分析数据集，让数据分析变得更加智能化和人性化。