'use client'

import React from 'react'
import { X, Calculator, Hash, Type, Calendar, HelpCircle, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { DatasetField } from '@/types/dataset'

interface FieldEditorDialogProps {
  isOpen: boolean
  field?: DatasetField
  onClose: () => void
  onSave: (field: Partial<DatasetField>) => void
  availableFields?: DatasetField[]
}

export function FieldEditorDialog({ 
  isOpen, 
  field, 
  onClose, 
  onSave,
  availableFields = []
}: FieldEditorDialogProps) {
  const [formData, setFormData] = React.useState<Partial<DatasetField>>({
    name: '',
    displayName: '',
    description: '',
    fieldType: 'dimension',
    type: 'string',
    expression: '',
    ...field
  })

  const [expressionError, setExpressionError] = React.useState<string>('')
  const [isValidating, setIsValidating] = React.useState(false)

  React.useEffect(() => {
    if (field) {
      setFormData({ ...field })
    } else {
      setFormData({
        name: '',
        displayName: '',
        description: '',
        fieldType: 'dimension',
        type: 'string',
        expression: ''
      })
    }
    setExpressionError('')
  }, [field, isOpen])

  const validateExpression = async (expression: string) => {
    if (!expression || formData.fieldType !== 'calculated') {
      setExpressionError('')
      return true
    }

    setIsValidating(true)
    
    try {
      // 简单的表达式验证
      const validFunctions = ['SUM', 'AVG', 'COUNT', 'MAX', 'MIN', 'CASE', 'IF', 'ROUND', 'ABS', 'COALESCE']
      const fieldNames = availableFields.map(f => f.name)
      
      // 检查是否包含有效的字段名或函数
      const containsValidField = fieldNames.some(name => expression.includes(`[${name}]`))
      const containsValidFunction = validFunctions.some(func => 
        expression.toUpperCase().includes(func)
      )
      
      if (!containsValidField && !containsValidFunction && !(/[\d\+\-\*\/\(\)]/.test(expression))) {
        setExpressionError('表达式必须包含有效的字段引用或计算函数')
        return false
      }

      setExpressionError('')
      return true
    } catch (error) {
      setExpressionError('表达式格式有误')
      return false
    } finally {
      setIsValidating(false)
    }
  }

  const handleSave = async () => {
    if (!formData.name?.trim() || !formData.displayName?.trim()) {
      return
    }

    if (formData.fieldType === 'calculated' && !await validateExpression(formData.expression || '')) {
      return
    }

    const saveData = { ...formData }
    
    // 根据字段类型设置默认值
    if (formData.fieldType === 'measure' && !formData.aggregationType) {
      saveData.aggregationType = 'SUM'
    } else if (formData.fieldType === 'dimension' && !formData.dimensionLevel) {
      saveData.dimensionLevel = formData.type === 'date' ? 'temporal' : 'categorical'
    }

    onSave(saveData)
    onClose()
  }

  const insertFieldReference = (fieldName: string) => {
    const newExpression = (formData.expression || '') + `[${fieldName}]`
    setFormData(prev => ({ ...prev, expression: newExpression }))
  }

  const insertFunction = (func: string) => {
    const newExpression = (formData.expression || '') + `${func}()`
    setFormData(prev => ({ ...prev, expression: newExpression }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* 对话框 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {formData.fieldType === 'calculated' ? (
                <Calculator className="h-6 w-6 text-blue-600" />
              ) : formData.fieldType === 'measure' ? (
                <Hash className="h-6 w-6 text-green-600" />
              ) : (
                <Type className="h-6 w-6 text-purple-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {field ? '编辑字段' : '新建字段'}
              </h2>
              <p className="text-sm text-gray-600">
                配置字段属性和计算表达式
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose} size="icon">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧：基本配置 */}
          <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                基本信息
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  字段名称 *
                </label>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="field_name"
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  显示名称 *
                </label>
                <Input
                  value={formData.displayName || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="字段显示名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="字段描述说明..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none h-20 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  字段类型
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'dimension', label: '维度', icon: Type, color: 'purple' },
                    { key: 'measure', label: '度量', icon: Hash, color: 'green' },
                    { key: 'calculated', label: '计算', icon: Calculator, color: 'orange' }
                  ].map((type) => (
                    <button
                      key={type.key}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.fieldType === type.key 
                          ? `border-${type.color}-500 bg-${type.color}-50` 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, fieldType: type.key as any }))}
                    >
                      <type.icon className={`h-5 w-5 mx-auto mb-1 ${
                        formData.fieldType === type.key 
                          ? `text-${type.color}-600` 
                          : 'text-gray-400'
                      }`} />
                      <div className="text-xs font-medium">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  数据类型
                </label>
                <select
                  value={formData.type || 'string'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="string">文本</option>
                  <option value="number">数字</option>
                  <option value="date">日期</option>
                  <option value="boolean">布尔值</option>
                </select>
              </div>

              {/* 聚合类型 */}
              {formData.fieldType === 'measure' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    聚合方式
                  </label>
                  <select
                    value={formData.aggregationType || 'SUM'}
                    onChange={(e) => setFormData(prev => ({ ...prev, aggregationType: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="SUM">求和</option>
                    <option value="AVG">平均值</option>
                    <option value="COUNT">计数</option>
                    <option value="MAX">最大值</option>
                    <option value="MIN">最小值</option>
                    <option value="DISTINCT">去重计数</option>
                  </select>
                </div>
              )}

              {/* 维度级别 */}
              {formData.fieldType === 'dimension' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    维度类型
                  </label>
                  <select
                    value={formData.dimensionLevel || 'categorical'}
                    onChange={(e) => setFormData(prev => ({ ...prev, dimensionLevel: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="categorical">分类型</option>
                    <option value="ordinal">有序型</option>
                    <option value="temporal">时间型</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* 右侧：计算表达式 */}
          {formData.fieldType === 'calculated' && (
            <div className="w-1/2 p-6 overflow-y-auto">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  计算表达式
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    表达式 *
                  </label>
                  <div className="relative">
                    <textarea
                      value={formData.expression || ''}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, expression: e.target.value }))
                        validateExpression(e.target.value)
                      }}
                      placeholder="输入计算表达式，例如：[sales_amount] * [quantity]"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none h-24 font-mono text-sm"
                    />
                    {isValidating && (
                      <div className="absolute right-2 top-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                  {expressionError && (
                    <div className="flex items-center gap-1 mt-1 text-red-600 text-xs">
                      <AlertCircle className="h-3 w-3" />
                      {expressionError}
                    </div>
                  )}
                </div>

                {/* 可用字段 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    可用字段
                    <HelpCircle className="h-3 w-3 text-gray-400" />
                  </h4>
                  <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto border rounded-md p-2">
                    {availableFields.map((field) => (
                      <button
                        key={field.name}
                        onClick={() => insertFieldReference(field.name)}
                        className="text-left px-2 py-1 text-xs hover:bg-gray-100 rounded flex items-center gap-2"
                      >
                        {field.fieldType === 'measure' ? (
                          <Hash className="h-3 w-3 text-green-600" />
                        ) : (
                          <Type className="h-3 w-3 text-purple-600" />
                        )}
                        <span className="font-mono">[{field.name}]</span>
                        <span className="text-gray-500 truncate">{field.displayName}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 函数库 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">常用函数</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: 'SUM', desc: '求和' },
                      { name: 'AVG', desc: '平均' },
                      { name: 'COUNT', desc: '计数' },
                      { name: 'MAX', desc: '最大' },
                      { name: 'MIN', desc: '最小' },
                      { name: 'ROUND', desc: '四舍五入' },
                      { name: 'ABS', desc: '绝对值' },
                      { name: 'COALESCE', desc: '合并' }
                    ].map((func) => (
                      <button
                        key={func.name}
                        onClick={() => insertFunction(func.name)}
                        className="text-left px-2 py-1 text-xs hover:bg-blue-50 rounded border"
                      >
                        <div className="font-mono text-blue-600">{func.name}()</div>
                        <div className="text-gray-500">{func.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 表达式示例 */}
                <div className="bg-gray-50 rounded-md p-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">表达式示例</h4>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div><code className="bg-white px-1 rounded">[price] * [quantity]</code> - 计算总金额</div>
                    <div><code className="bg-white px-1 rounded">ROUND([amount], 2)</code> - 保留两位小数</div>
                    <div><code className="bg-white px-1 rounded">CASE WHEN [status] = 'active' THEN 1 ELSE 0 END</code> - 条件计算</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {!expressionError && formData.fieldType === 'calculated' && formData.expression && (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                表达式格式正确
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button 
              onClick={handleSave}
              disabled={
                !formData.name?.trim() || 
                !formData.displayName?.trim() ||
                (formData.fieldType === 'calculated' && (!formData.expression?.trim() || !!expressionError))
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              保存字段
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}