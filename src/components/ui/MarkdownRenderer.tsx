'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { Copy, Check } from 'lucide-react'
import { Button } from './Button'
import 'katex/dist/katex.min.css'

interface MarkdownRendererProps {
  content: string
  className?: string
}

interface CodeBlockProps {
  language?: string
  value: string
}

function CodeBlock({ language, value }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="relative group">
      <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 w-8 p-0 bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 hover:text-white"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          lineHeight: '1.5',
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  )
}

interface TableProps {
  children: React.ReactNode
}

function Table({ children }: TableProps) {
  return (
    <div className="overflow-x-auto my-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <table className="w-full border-collapse">
        {children}
      </table>
    </div>
  )
}

function TableHeader({ children }: TableProps) {
  return (
    <thead className="bg-gray-50">
      {children}
    </thead>
  )
}

function TableBody({ children }: TableProps) {
  return (
    <tbody>
      {children}
    </tbody>
  )
}

function TableRow({ children }: TableProps) {
  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50/50 transition-colors">
      {children}
    </tr>
  )
}

interface TableCellProps {
  children: React.ReactNode
  isHeader?: boolean
}

function TableCell({ children, isHeader }: TableCellProps) {
  const Tag = isHeader ? 'th' : 'td'
  return (
    <Tag className={`
      px-4 py-3 text-left border-b border-gray-100 last:border-b-0
      ${isHeader 
        ? 'bg-gray-50 font-semibold text-gray-900 text-sm border-b border-gray-200' 
        : 'text-gray-700 text-sm hover:bg-gray-50/50'
      }
    `}>
      <div className="min-w-0">
        {children}
      </div>
    </Tag>
  )
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={{
          code({ inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : undefined
            
            if (!inline && language) {
              return (
                <CodeBlock
                  language={language}
                  value={String(children).replace(/\n$/, '')}
                />
              )
            }
            
            return (
              <code 
                className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono" 
                {...props}
              >
                {children}
              </code>
            )
          },
          table: Table,
          thead: TableHeader,
          tbody: TableBody,
          tr: TableRow,
          th: ({ children }) => <TableCell isHeader>{children}</TableCell>,
          td: ({ children }) => <TableCell>{children}</TableCell>,
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-6 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-gray-900 mb-3 mt-5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium text-gray-900 mb-2 mt-4">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-gray-700 mb-3 leading-relaxed">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 mb-3 text-gray-700">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 mb-3 text-gray-700">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 bg-blue-50 pl-4 py-2 mb-3 italic text-gray-700">
              {children}
            </blockquote>
          ),
          // 增强查询结果显示
          div: ({ children, className }) => {
            // 检查是否是查询结果块
            if (typeof children === 'string' && children.includes('查询结果：')) {
              return (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 my-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-blue-800 font-medium text-sm">数据查询结果</span>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    {children}
                  </div>
                </div>
              )
            }
            return <div className={className}>{children}</div>
          },
          a: ({ href, children }) => (
            <a 
              href={href} 
              className="text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-800">
              {children}
            </em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}