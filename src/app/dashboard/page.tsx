'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const DashboardCanvas = dynamic(
  () => import('@/components/dashboard/DashboardCanvas').then(mod => ({ default: mod.DashboardCanvas })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>加载看板编辑器...</span>
        </div>
      </div>
    )
  }
)

export default function DashboardPage() {
  return <DashboardCanvas />
}