'use client'

import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { FactorySession } from '../lib/factory-api'
import { getDefaultApiBase } from '../lib/factory-api'

interface FactoryState {
  apiBase: string
  setApiBase: (value: string) => void
  session: FactorySession | null
  setSession: (value: FactorySession | null) => void
}

const FactoryContext = createContext<FactoryState | null>(null)

const API_BASE_KEY = 'factory.apiBase'
const SESSION_KEY = 'factory.session'

export function FactoryProvider({ children }: { children: ReactNode }) {
  const [apiBase, setApiBaseState] = useState(getDefaultApiBase())
  const [session, setSessionState] = useState<FactorySession | null>(null)

  useEffect(() => {
    const savedApiBase = window.localStorage.getItem(API_BASE_KEY)
    const savedSession = window.localStorage.getItem(SESSION_KEY)
    if (savedApiBase) {
      setApiBaseState(savedApiBase)
    }
    if (savedSession) {
      setSessionState(JSON.parse(savedSession))
    }
  }, [])

  const value = useMemo<FactoryState>(() => ({
    apiBase,
    setApiBase: (nextValue) => {
      setApiBaseState(nextValue)
      window.localStorage.setItem(API_BASE_KEY, nextValue)
    },
    session,
    setSession: (nextValue) => {
      setSessionState(nextValue)
      if (nextValue) {
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextValue))
      }
      else {
        window.localStorage.removeItem(SESSION_KEY)
      }
    },
  }), [apiBase, session])

  return (
    <FactoryContext.Provider value={value}>
      {children}
    </FactoryContext.Provider>
  )
}

export function useFactory() {
  const value = useContext(FactoryContext)
  if (!value) {
    throw new Error('FactoryProvider is missing')
  }
  return value
}
