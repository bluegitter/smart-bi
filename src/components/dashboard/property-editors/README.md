# 属性编辑器组件

这个目录包含了重构后的属性编辑器组件，用于PropertyPanel的模块化开发。

## 组件列表

### BasicSettingsEditor
基础设置编辑器，包含：
- **组件类型选择** - 支持搜索过滤的下拉框，显示图标+文字
- **标题设置** - 组件标题输入
- **位置和尺寸** - X/Y坐标、宽度/高度设置

**新功能特性：**
- 🔍 支持实时搜索过滤组件类型
- ⌨️ 完整的键盘导航支持（上下箭头、回车、Esc）
- 🎨 图标+文字的直观显示
- 🎯 点击外部区域自动关闭
- ♿ 无障碍访问支持（ARIA属性）

**键盘快捷键：**
- `Enter` / `Space` / `ArrowDown` - 打开下拉框
- `ArrowUp` / `ArrowDown` - 在选项间导航
- `Enter` - 选择当前高亮选项
- `Escape` - 关闭下拉框

### GeneralStyleEditor
通用样式编辑器，包含：
- 配色方案选择
- 背景显示设置
- 透明度调节

### ChartStyleEditor
图表样式编辑器，支持：
- 折线图设置（网格、数据点、面积填充、平滑曲线）
- 柱状图设置（数值显示、柱子样式、方向）
- 饼图设置（标签、图例、百分比、内圆半径）

### TableStyleEditor
表格样式编辑器，包含：
- 表头显示
- 边框设置
- 斑马纹模式
- 紧凑模式
- 最大行数设置

### KPIStyleEditor
KPI卡片样式编辑器，支持：
- 卡片样式选择（现代/简约/彩色）
- 图标显示开关
- 趋势显示开关
- 描述显示开关

### GaugeStyleEditor
仪表盘样式编辑器，包含：
- 样式选择（现代/经典/简约）
- 刻度显示设置
- 阈值显示设置

### ContainerStyleEditor
容器样式编辑器，支持：
- 布局方式（弹性布局/网格布局/绝对定位）
- 内边距设置
- 间距设置
- 边框样式和颜色
- 背景颜色

### DataConfigEditor
数据配置编辑器，包含：
- 指标拖拽区域（支持度量字段）
- 维度拖拽区域（支持维度字段）
- 过滤器管理（添加/删除/编辑过滤条件）

### AdvancedSettingsEditor
高级设置编辑器，包含：
- 自动刷新间隔设置
- 缓存启用开关
- 导出允许开关

## 使用方法

```tsx
import {
  BasicSettingsEditor,
  GeneralStyleEditor,
  // ... 其他编辑器
} from './property-editors'

// 在PropertyPanel中使用
<BasicSettingsEditor
  selectedComponent={selectedComponent}
  onUpdate={handleUpdate}
/>
```

## 设计原则

1. **单一职责** - 每个编辑器专注于特定的配置功能
2. **松耦合** - 组件间通过props进行通信
3. **可扩展** - 新增组件类型时只需修改对应编辑器
4. **用户体验** - 支持键盘导航和无障碍访问
5. **类型安全** - 完整的TypeScript类型支持