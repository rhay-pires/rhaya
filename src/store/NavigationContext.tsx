import { createContext, useContext, type ReactNode } from 'react'
import type { ModuleId } from '../types'

interface NavigationContextValue {
  navigate: (id: ModuleId) => void
}

const NavigationContext = createContext<NavigationContextValue | null>(null)

export function NavigationProvider({
  children,
  navigate,
}: {
  children: ReactNode
  navigate: (id: ModuleId) => void
}) {
  return (
    <NavigationContext.Provider value={{ navigate }}>{children}</NavigationContext.Provider>
  )
}

export function useNavigation() {
  const ctx = useContext(NavigationContext)
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider')
  return ctx
}
