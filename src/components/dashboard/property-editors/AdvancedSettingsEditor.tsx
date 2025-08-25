'use client'

import React from 'react'

export function AdvancedSettingsEditor() {
  return (
    <div className="space-y-4">
      {/* 刷新设置 */}
      <div>
        <label className="block text-sm font-medium mb-2">自动刷新</label>
        <select className="w-full h-10 px-3 py-2 border border-slate-200 rounded-md text-sm">
          <option value="0">关闭</option>
          <option value="30">30秒</option>
          <option value="60">1分钟</option>
          <option value="300">5分钟</option>
          <option value="900">15分钟</option>
        </select>
      </div>

      {/* 缓存设置 */}
      <div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="enableCache"
            className="rounded"
            defaultChecked={true}
          />
          <label htmlFor="enableCache" className="text-sm">启用缓存</label>
        </div>
      </div>

      {/* 导出设置 */}
      <div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="allowExport"
            className="rounded"
            defaultChecked={true}
          />
          <label htmlFor="allowExport" className="text-sm">允许导出</label>
        </div>
      </div>
    </div>
  )
}