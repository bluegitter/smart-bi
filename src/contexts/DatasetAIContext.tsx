'use client'

import React, { createContext, useContext, useState } from 'react'
import type { Dataset } from '@/types/dataset'

interface DatasetAIContextType {
  currentDataset: Dataset | null
  setCurrentDataset: (dataset: Dataset | null) => void
  openAIChatWithDataset: (dataset?: Dataset) => void
  isAIChatOpen: boolean
  setIsAIChatOpen: (open: boolean) => void
}

const DatasetAIContext = createContext<DatasetAIContextType | undefined>(undefined)

interface DatasetAIProviderProps {
  children: React.ReactNode
}

export function DatasetAIProvider({ children }: DatasetAIProviderProps) {
  const [currentDataset, setCurrentDataset] = useState<Dataset | null>(null)
  const [isAIChatOpen, setIsAIChatOpen] = useState(false)

  const openAIChatWithDataset = (dataset?: Dataset) => {
    if (dataset) {
      setCurrentDataset(dataset)
    }
    setIsAIChatOpen(true)
  }

  return (
    <DatasetAIContext.Provider
      value={{
        currentDataset,
        setCurrentDataset,
        openAIChatWithDataset,
        isAIChatOpen,
        setIsAIChatOpen
      }}
    >
      {children}
    </DatasetAIContext.Provider>
  )
}

export function useDatasetAI() {
  const context = useContext(DatasetAIContext)
  if (context === undefined) {
    throw new Error('useDatasetAI must be used within a DatasetAIProvider')
  }
  return context
}

// Hook for dataset pages to register current dataset
export function useDatasetAIRegistration(dataset: Dataset | null) {
  const { setCurrentDataset } = useDatasetAI()

  React.useEffect(() => {
    setCurrentDataset(dataset)
    return () => setCurrentDataset(null) // Cleanup on unmount
  }, [dataset, setCurrentDataset])
}