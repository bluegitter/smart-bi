'use client'

import React, { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { Metric } from '@/types'

interface CreateMetricModalProps {
  onClose: () => void
  onSubmit: (metric: Partial<Metric>) => void
  categories: string[]
  allTags: string[]
}

const metricTypes = [
  { value: 'count', label: '计数 (COUNT)' },
  { value: 'sum', label: '求和 (SUM)' },
  { value: 'avg', label: '平均值 (AVG)' },
  { value: 'max', label: '最大值 (MAX)' },
  { value: 'min', label: '最小值 (MIN)' },
  { value: 'ratio', label: '比率 (RATIO)' },
  { value: 'custom', label: '自定义' }
]

export function CreateMetricModal({ onClose, onSubmit, categories, allTags }: CreateMetricModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    type: 'count' as Metric['type'],
    formula: '',
    datasourceId: 'ds1', // 默认数据源
    category: '',
    unit: '',
    tags: [] as string[],
    isActive: true
  })
  
  const [newCategory, setNewCategory] = useState('')
  const [newTag, setNewTag] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setFormData(prev => ({ ...prev, category: newCategory.trim() }))
      setNewCategory('')
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = '指标名称不能为空'
    } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(formData.name)) {
      newErrors.name = '指标名称只能包含字母、数字和下划线，且必须以字母或下划线开头'
    }

    if (!formData.displayName.trim()) {
      newErrors.displayName = '显示名称不能为空'
    }

    if (!formData.category.trim()) {
      newErrors.category = '请选择或创建分类'
    }

    if (formData.type === 'custom' && !formData.formula.trim()) {
      newErrors.formula = '自定义类型必须提供计算公式'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>创建新指标</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  指标名称 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="例如：sales_amount"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  显示名称 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  placeholder="例如：销售额"
                  className={errors.displayName ? 'border-red-500' : ''}
                />
                {errors.displayName && (
                  <p className="text-red-500 text-xs mt-1">{errors.displayName}</p>
                )}
              </div>
            </div>

            {/* 描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="指标的详细描述..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            {/* 类型和单位 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  指标类型 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value as Metric['type'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {metricTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  单位
                </label>
                <Input
                  value={formData.unit}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  placeholder="例如：元、个、%"
                />
              </div>
            </div>

            {/* 计算公式 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                计算公式 {formData.type === 'custom' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={formData.formula}
                onChange={(e) => handleInputChange('formula', e.target.value)}
                placeholder="例如：SUM(orders.amount) 或自定义SQL表达式"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                  errors.formula ? 'border-red-500' : 'border-gray-300'
                }`}
                rows={2}
              />
              {errors.formula && (
                <p className="text-red-500 text-xs mt-1">{errors.formula}</p>
              )}
            </div>

            {/* 分类 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                分类 <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-2">
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">选择分类</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="新分类"
                  className="w-32"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addCategory()
                    }
                  }}
                />
                <Button type="button" onClick={addCategory} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {errors.category && (
                <p className="text-red-500 text-xs mt-1">{errors.category}</p>
              )}
            </div>

            {/* 标签 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标签
              </label>
              <div className="flex space-x-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="添加标签"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {/* 常用标签 */}
              {allTags.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-gray-500 mb-1">常用标签:</p>
                  <div className="flex flex-wrap gap-1">
                    {allTags.slice(0, 10).map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (!formData.tags.includes(tag)) {
                            setFormData(prev => ({
                              ...prev,
                              tags: [...prev.tags, tag]
                            }))
                          }
                        }}
                        className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 已添加的标签 */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-blue-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 提交按钮 */}
            <div className="flex space-x-4 pt-4">
              <Button type="submit" className="flex-1">
                创建指标
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                取消
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}