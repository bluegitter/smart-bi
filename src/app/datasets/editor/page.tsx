'use client'

import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { DatasetEditor } from '@/components/dataset/DatasetEditor'

function DatasetEditorContent() {
  const searchParams = useSearchParams()
  const datasetId = searchParams.get('id')
  const mode = searchParams.get('mode') || 'create' // create | edit | view
  const initialName = searchParams.get('name') || ''
  const initialDisplayName = searchParams.get('displayName') || ''
  const initialType = searchParams.get('type') as 'table' | 'sql' | 'view' || 'table'
  const initialDataSource = searchParams.get('dataSource') || ''
  const initialSchema = searchParams.get('schema') || ''
  const initialTable = searchParams.get('table') || ''

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <DatasetEditor 
        datasetId={datasetId || undefined}
        mode={mode as 'create' | 'edit' | 'view'}
        initialName={initialName}
        initialDisplayName={initialDisplayName}
        initialType={initialType}
        initialDataSource={initialDataSource}
        initialSchema={initialSchema}
        initialTable={initialTable}
      />
    </div>
  )
}

export default function DatasetEditorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2 text-gray-500">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          <span>加载数据集编辑器...</span>
        </div>
      </div>
    }>
      <DatasetEditorContent />
    </Suspense>
  )
}