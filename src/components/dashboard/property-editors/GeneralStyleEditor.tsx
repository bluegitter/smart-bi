'use client'

import React from 'react'
import type { ComponentLayout } from '@/types'

interface GeneralStyleEditorProps {
  selectedComponent: ComponentLayout
  onStyleUpdate: (styleUpdates: any) => void
}

const colorSchemes = [
  { name: '默认', colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'] },
  { name: '蓝色系', colors: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'] },
  { name: '绿色系', colors: ['#166534', '#16a34a', '#22c55e', '#4ade80', '#bbf7d0'] },
  { name: '紫色系', colors: ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#e9d5ff'] },
  { name: '暖色系', colors: ['#dc2626', '#ea580c', '#f59e0b', '#eab308', '#84cc16'] }
]

export function GeneralStyleEditor({ selectedComponent, onStyleUpdate }: GeneralStyleEditorProps) {
  return (
    <div className="space-y-4">
      {/* 配色方案 */}
      <div>
        <label className="block text-sm font-medium mb-2">配色方案</label>
        <div className="space-y-2">
          {colorSchemes.map((scheme) => (
            <div
              key={scheme.name}
              className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer"
              onClick={() => onStyleUpdate({ colorScheme: scheme.colors })}
            >
              <div className="flex gap-1">
                {scheme.colors.map((color, index) => (
                  <div
                    key={index}
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span className="text-sm">{scheme.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 通用背景设置 */}
      <div>
        <label className="block text-sm font-medium mb-2">背景</label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showBackground"
              className="rounded"
              defaultChecked={true}
              onChange={(e) => onStyleUpdate({ showBackground: e.target.checked })}
            />
            <label htmlFor="showBackground" className="text-sm">显示背景</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showBorder"
              className="rounded"
              defaultChecked={true}
              onChange={(e) => onStyleUpdate({ showBorder: e.target.checked })}
            />
            <label htmlFor="showBorder" className="text-sm">显示边框</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showShadow"
              className="rounded"
              defaultChecked={false}
              onChange={(e) => onStyleUpdate({ showShadow: e.target.checked })}
            />
            <label htmlFor="showShadow" className="text-sm">显示阴影</label>
          </div>
        </div>
      </div>

      {/* 透明度 */}
      <div>
        <label className="block text-sm font-medium mb-2">透明度</label>
        <input
          type="range"
          min="0"
          max="100"
          defaultValue="100"
          className="w-full"
          onChange={(e) => onStyleUpdate({ opacity: Number(e.target.value) / 100 })}
        />
      </div>
    </div>
  )
}