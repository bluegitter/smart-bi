'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'

interface Option {
  value: string
  label: string
  description?: string
}

interface SearchableSelectProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  disabled?: boolean
  allowCustomValue?: boolean
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = '请选择...',
  disabled = false,
  allowCustomValue = true
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [inputValue, setInputValue] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (option.description && option.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const selectedOption = options.find(opt => opt.value === value)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setSearchTerm(newValue)
    
    if (allowCustomValue) {
      onChange(newValue)
    }
    
    if (!isOpen && newValue) {
      setIsOpen(true)
    }
  }

  const handleOptionSelect = (option: Option) => {
    setInputValue(option.value)
    onChange(option.value)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleInputFocus = () => {
    setIsOpen(true)
    setSearchTerm(inputValue)
  }

  const handleClear = () => {
    setInputValue('')
    onChange('')
    setSearchTerm('')
    inputRef.current?.focus()
  }

  const displayValue = isOpen ? searchTerm : (selectedOption?.label || inputValue)

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center">
          {inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 mr-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className="p-1 text-gray-400 hover:text-gray-600 mr-1"
            disabled={disabled}
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <button
                key={`${option.value}-${index}`}
                type="button"
                onClick={() => handleOptionSelect(option)}
                className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{option.label}</span>
                  {option.value !== option.label && (
                    <span className="text-sm text-gray-500">{option.value}</span>
                  )}
                </div>
                {option.description && (
                  <div className="text-sm text-gray-600 mt-1">
                    {option.description}
                  </div>
                )}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-500 text-center">
              {searchTerm ? '无匹配结果' : '无可选项'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}