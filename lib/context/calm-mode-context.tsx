'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface CalmModeContextType {
  calmMode: boolean
  toggleCalmMode: () => void
}

const CalmModeContext = createContext<CalmModeContextType | undefined>(undefined)

export function CalmModeProvider({ children }: { children: React.ReactNode }) {
  // Enabled by default (true) for immediate relief and calming visual experience
  const [calmMode, setCalmMode] = useState<boolean>(true)
  const [mounted, setMounted] = useState<boolean>(false)

  useEffect(() => {
    const saved = localStorage.getItem('calmMode')
    if (saved !== null) {
      setCalmMode(saved === 'true')
    } else {
      // If no saved preference, enforce true by default
      setCalmMode(true)
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    const root = window.document.documentElement
    if (calmMode) {
      root.classList.add('calm-mode')
    } else {
      root.classList.remove('calm-mode')
    }
    localStorage.setItem('calmMode', String(calmMode))
  }, [calmMode, mounted])

  const toggleCalmMode = () => {
    setCalmMode((prev) => !prev)
  }

  // Prevent hydration flickers by returning children directly before mount, with calmMode assumed active
  return (
    <CalmModeContext.Provider value={{ calmMode, toggleCalmMode }}>
      {children}
    </CalmModeContext.Provider>
  )
}

export function useCalmMode() {
  const context = useContext(CalmModeContext)
  if (context === undefined) {
    throw new Error('useCalmMode must be used within a CalmModeProvider')
  }
  return context
}
