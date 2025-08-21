'use client'

import React from 'react'
import { CheckCircle, XCircle, Clock, AlertCircle, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

interface ConnectionTesterProps {
  dataSource: {
    id: string
    name: string
    type: string
    config: Record<string, any>
  }
  onTestComplete?: (result: ConnectionTestResult) => void
}

interface ConnectionTestResult {
  success: boolean
  message: string
  details?: {
    responseTime?: number
    version?: string
    tablesCount?: number
    errorCode?: string
  }
}

interface TestStep {
  id: string
  name: string
  status: 'pending' | 'running' | 'success' | 'error'
  message?: string
  responseTime?: number
}

export function ConnectionTester({ dataSource, onTestComplete }: ConnectionTesterProps) {
  const [isTestRunning, setIsTestRunning] = React.useState(false)
  const [testSteps, setTestSteps] = React.useState<TestStep[]>([])
  const [testResult, setTestResult] = React.useState<ConnectionTestResult | null>(null)

  const initializeTestSteps = (type: string): TestStep[] => {
    const baseSteps = [
      { id: 'network', name: '网络连通性检查', status: 'pending' as const },
      { id: 'auth', name: '身份验证', status: 'pending' as const },
      { id: 'connection', name: '建立连接', status: 'pending' as const }
    ]

    if (type === 'mysql' || type === 'postgresql' || type === 'mongodb') {
      baseSteps.push(
        { id: 'database', name: '数据库访问', status: 'pending' as const },
        { id: 'schema', name: '结构信息获取', status: 'pending' as const }
      )
    } else if (type === 'api') {
      baseSteps.push(
        { id: 'endpoint', name: 'API 端点测试', status: 'pending' as const },
        { id: 'response', name: '响应格式验证', status: 'pending' as const }
      )
    }

    return baseSteps
  }

  const updateStepStatus = (stepId: string, status: TestStep['status'], message?: string, responseTime?: number) => {
    setTestSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, message, responseTime }
        : step
    ))
  }

  const simulateTestStep = async (stepId: string, duration: number = 800): Promise<boolean> => {
    updateStepStatus(stepId, 'running')
    await new Promise(resolve => setTimeout(resolve, duration))
    
    // 模拟测试结果（90% 成功率）
    const success = Math.random() > 0.1
    
    if (success) {
      updateStepStatus(stepId, 'success', '成功', duration)
      return true
    } else {
      updateStepStatus(stepId, 'error', '连接失败')
      return false
    }
  }

  const runConnectionTest = async () => {
    setIsTestRunning(true)
    setTestResult(null)
    
    const steps = initializeTestSteps(dataSource.type)
    setTestSteps(steps)

    const startTime = Date.now()
    let allPassed = true

    try {
      for (const step of steps) {
        const success = await simulateTestStep(step.id)
        if (!success) {
          allPassed = false
          break
        }
      }

      const totalTime = Date.now() - startTime
      
      const result: ConnectionTestResult = {
        success: allPassed,
        message: allPassed ? '连接测试成功' : '连接测试失败',
        details: {
          responseTime: totalTime,
          version: allPassed ? (dataSource.type === 'mysql' ? 'MySQL 8.0.32' : 
                               dataSource.type === 'postgresql' ? 'PostgreSQL 14.9' :
                               dataSource.type === 'mongodb' ? 'MongoDB 6.0.4' : 
                               'API v1.2.3') : undefined,
          tablesCount: allPassed && (dataSource.type === 'mysql' || dataSource.type === 'postgresql' || dataSource.type === 'mongodb') 
            ? Math.floor(Math.random() * 50) + 10 : undefined,
          errorCode: !allPassed ? 'CONN_TIMEOUT' : undefined
        }
      }

      setTestResult(result)
      onTestComplete?.(result)

    } catch (error) {
      const result: ConnectionTestResult = {
        success: false,
        message: '测试过程中发生错误',
        details: {
          errorCode: 'TEST_ERROR'
        }
      }
      setTestResult(result)
      onTestComplete?.(result)
    } finally {
      setIsTestRunning(false)
    }
  }

  const getStepIcon = (status: TestStep['status']) => {
    switch (status) {
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
    }
  }

  const getOverallStatus = () => {
    if (isTestRunning) return 'testing'
    if (testResult?.success) return 'success'
    if (testResult?.success === false) return 'error'
    return 'idle'
  }

  const overallStatus = getOverallStatus()

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              overallStatus === 'success' && "bg-green-100",
              overallStatus === 'error' && "bg-red-100",
              overallStatus === 'testing' && "bg-blue-100",
              overallStatus === 'idle' && "bg-slate-100"
            )}>
              {overallStatus === 'success' && <Wifi className="h-5 w-5 text-green-600" />}
              {overallStatus === 'error' && <WifiOff className="h-5 w-5 text-red-600" />}
              {overallStatus === 'testing' && <Clock className="h-5 w-5 text-blue-600 animate-spin" />}
              {overallStatus === 'idle' && <AlertCircle className="h-5 w-5 text-slate-400" />}
            </div>
            <div>
              <CardTitle className="text-lg">连接测试</CardTitle>
              <p className="text-sm text-slate-500">
                测试到 {dataSource.name} 的连接
              </p>
            </div>
          </div>
          <Button
            onClick={runConnectionTest}
            disabled={isTestRunning}
            className="flex items-center gap-2"
          >
            {isTestRunning ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                测试中...
              </>
            ) : (
              <>
                开始测试
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 测试步骤 */}
        {testSteps.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-slate-700">测试步骤</h4>
            {testSteps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="flex-shrink-0">
                  {getStepIcon(step.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-sm font-medium",
                      step.status === 'success' && "text-green-700",
                      step.status === 'error' && "text-red-700",
                      step.status === 'running' && "text-blue-700"
                    )}>
                      {step.name}
                    </span>
                    {step.responseTime && (
                      <span className="text-xs text-slate-500">
                        {step.responseTime}ms
                      </span>
                    )}
                  </div>
                  {step.message && (
                    <p className="text-xs text-slate-500 mt-1">{step.message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 测试结果 */}
        {testResult && (
          <div className={cn(
            "p-4 rounded-lg border",
            testResult.success 
              ? "bg-green-50 border-green-200" 
              : "bg-red-50 border-red-200"
          )}>
            <div className="flex items-center gap-2 mb-2">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={cn(
                "font-medium",
                testResult.success ? "text-green-700" : "text-red-700"
              )}>
                {testResult.message}
              </span>
            </div>

            {testResult.details && (
              <div className="text-sm space-y-1">
                {testResult.details.responseTime && (
                  <p className="text-slate-600">
                    响应时间: {testResult.details.responseTime}ms
                  </p>
                )}
                {testResult.details.version && (
                  <p className="text-slate-600">
                    数据库版本: {testResult.details.version}
                  </p>
                )}
                {testResult.details.tablesCount && (
                  <p className="text-slate-600">
                    数据表数量: {testResult.details.tablesCount}
                  </p>
                )}
                {testResult.details.errorCode && (
                  <p className="text-red-600">
                    错误代码: {testResult.details.errorCode}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* 连接信息 */}
        <div className="bg-slate-50 rounded-lg p-4">
          <h5 className="font-medium text-sm text-slate-700 mb-3">连接信息</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-slate-500">数据源类型:</span>
              <span className="ml-2 font-medium">{dataSource.type.toUpperCase()}</span>
            </div>
            {dataSource.config.host && (
              <div>
                <span className="text-slate-500">主机地址:</span>
                <span className="ml-2 font-medium">{dataSource.config.host}:{dataSource.config.port}</span>
              </div>
            )}
            {dataSource.config.database && (
              <div>
                <span className="text-slate-500">数据库:</span>
                <span className="ml-2 font-medium">{dataSource.config.database}</span>
              </div>
            )}
            {dataSource.config.apiUrl && (
              <div className="md:col-span-2">
                <span className="text-slate-500">API地址:</span>
                <span className="ml-2 font-medium break-all">{dataSource.config.apiUrl}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}