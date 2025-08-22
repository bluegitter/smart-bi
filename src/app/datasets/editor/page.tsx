'use client'

import React from 'react'
import { useSearchParams } from 'next/navigation'
import { DatasetEditor } from '@/components/dataset/DatasetEditor'

export default function DatasetEditorPage() {
  const searchParams = useSearchParams()
  const datasetId = searchParams.get('id')
  const mode = searchParams.get('mode') || 'create' // create | edit | view

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <DatasetEditor 
        datasetId={datasetId || undefined}
        mode={mode as 'create' | 'edit' | 'view'}
      />
    </div>
  )
}