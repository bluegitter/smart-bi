'use client'

import React from 'react'
import { useSearchParams } from 'next/navigation'
import { DatasetEditor } from '@/components/dataset/DatasetEditor'

export default function DatasetEditorPage() {
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