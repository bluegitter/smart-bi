'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Shield, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            访问被拒绝
          </h1>
          
          <p className="text-gray-600 mb-6">
            抱歉，您没有权限访问此页面。请联系管理员获取相应权限。
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={() => router.back()}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回上一页
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => router.push('/dashboards')}
              className="w-full"
            >
              回到首页
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}