'use client'

import React from 'react'
import { Download, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'
import { Input } from './Input'
import { cn } from '@/lib/utils'

interface Column {
  name: string
  displayName?: string
  type?: string
}

interface DataTableProps {
  columns: Column[]
  rows: unknown[][]
  title?: string
  className?: string
  maxHeight?: string
  showPagination?: boolean
  showSearch?: boolean
  showExport?: boolean
}

export function DataTable({ 
  columns, 
  rows, 
  title,
  className = '',
  maxHeight = '400px',
  showPagination = true,
  showSearch = true,
  showExport = true
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize] = React.useState(10)

  // 过滤数据
  const filteredRows = React.useMemo(() => {
    if (!searchTerm) return rows
    
    return rows.filter(row => 
      row.some(cell => 
        String(cell || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }, [rows, searchTerm])

  // 分页数据
  const paginatedRows = React.useMemo(() => {
    if (!showPagination) return filteredRows
    
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return filteredRows.slice(start, end)
  }, [filteredRows, currentPage, pageSize, showPagination])

  const totalPages = Math.ceil(filteredRows.length / pageSize)

  // 导出CSV
  const handleExport = () => {
    const csvHeaders = columns.map(col => col.displayName || col.name).join(',')
    const csvData = filteredRows.map(row => 
      row.map(cell => {
        const cellStr = String(cell || '')
        // 如果包含逗号或引号，需要用引号包裹并转义内部引号
        return cellStr.includes(',') || cellStr.includes('"') 
          ? `"${cellStr.replace(/"/g, '""')}"` 
          : cellStr
      }).join(',')
    ).join('\n')
    
    const csv = `${csvHeaders}\n${csvData}`
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${title || 'data'}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 shadow-sm", className)}>
      {/* 表格头部 */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            {title && (
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            )}
            <p className="text-sm text-gray-500 mt-1">
              共 {filteredRows.length} 条数据
              {searchTerm && ` (从 ${rows.length} 条中筛选)`}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {showSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索数据..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1) // 重置到第一页
                  }}
                  className="pl-10 w-48"
                />
              </div>
            )}
            
            {showExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="text-gray-600 hover:text-gray-900"
              >
                <Download className="h-4 w-4 mr-2" />
                导出CSV
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 表格内容 */}
      <div 
        className="overflow-auto" 
        style={{ maxHeight }}
      >
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-r border-gray-200 last:border-r-0"
                >
                  <div className="flex flex-col gap-1">
                    <span>{column.displayName || column.name}</span>
                    {column.type && (
                      <span className="text-xs text-gray-500 font-normal">
                        {column.type}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length} 
                  className="px-4 py-8 text-center text-gray-500"
                >
                  {searchTerm ? '未找到匹配的数据' : '暂无数据'}
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-4 py-3 text-sm text-gray-700 border-r border-gray-100 last:border-r-0"
                    >
                      {cell === null || cell === undefined ? (
                        <span className="text-gray-400 italic">null</span>
                      ) : (
                        <div className="max-w-xs truncate" title={String(cell)}>
                          {String(cell)}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页控件 */}
      {showPagination && totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            显示第 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredRows.length)} 条，
            共 {filteredRows.length} 条数据
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              上一页
            </Button>
            
            <span className="text-sm text-gray-700">
              第 {currentPage} / {totalPages} 页
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              下一页
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}