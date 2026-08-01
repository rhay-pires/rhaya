import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DEFAULT_MODULES } from '../data/modules'
import type {
  CustomModuleData,
  ModuleConfig,
  ModuleIconKey,
  ModuleId,
  ViewMode,
} from '../types'
import { uid } from '../utils/format'

const STORAGE_KEY = 'lifehub-customization-v1'

interface StoredState {
  modules: ModuleConfig[]
  customData: Record<string, CustomModuleData>
}

interface CustomizationStore {
  modules: ModuleConfig[]
  enabledModules: ModuleConfig[]
  customData: Record<string, CustomModuleData>
  getModule: (id: ModuleId) => ModuleConfig | undefined
  updateModule: (id: ModuleId, patch: Partial<ModuleConfig>) => void
  setModuleColor: (id: ModuleId, color: string) => void
  setModuleView: (id: ModuleId, viewMode: ViewMode) => void
  setModuleEnabled: (id: ModuleId, enabled: boolean) => void
  renameModule: (id: ModuleId, label: string) => void
  moveModule: (id: ModuleId, direction: -1 | 1) => void
  addCustomModule: (input: { label: string; color: string; icon: ModuleIconKey; viewMode: ViewMode }) => string
  removeModule: (id: ModuleId) => void
  updateCustomData: (id: string, data: Partial<CustomModuleData>) => void
  resetCustomization: () => void
}

const CustomizationContext = createContext<CustomizationStore | null>(null)

function loadState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { modules: DEFAULT_MODULES, customData: {} }
    const parsed = JSON.parse(raw) as StoredState
    // merge new defaults if app gained modules
    const byId = new Map(parsed.modules.map((m) => [m.id, m]))
    const merged = DEFAULT_MODULES.map((def) => {
      const existing = byId.get(def.id)
      return existing ? { ...def, ...existing, builtin: true } : def
    })
    const customs = parsed.modules.filter((m) => !m.builtin && String(m.id).startsWith('custom_'))
    return {
      modules: [...merged, ...customs].sort((a, b) => a.order - b.order),
      customData: parsed.customData ?? {},
    }
  } catch {
    return { modules: DEFAULT_MODULES, customData: {} }
  }
}

export function CustomizationProvider({ children }: { children: ReactNode }) {
  const initial = loadState()
  const [modules, setModules] = useState<ModuleConfig[]>(initial.modules)
  const [customData, setCustomData] = useState<Record<string, CustomModuleData>>(initial.customData)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ modules, customData }))
  }, [modules, customData])

  const enabledModules = useMemo(
    () => [...modules].filter((m) => m.enabled).sort((a, b) => a.order - b.order),
    [modules],
  )

  const getModule = useCallback((id: ModuleId) => modules.find((m) => m.id === id), [modules])

  const updateModule = useCallback((id: ModuleId, patch: Partial<ModuleConfig>) => {
    setModules((list) => list.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }, [])

  const setModuleColor = (id: ModuleId, color: string) => updateModule(id, { color })
  const setModuleView = (id: ModuleId, viewMode: ViewMode) => updateModule(id, { viewMode })
  const setModuleEnabled = (id: ModuleId, enabled: boolean) => updateModule(id, { enabled })
  const renameModule = (id: ModuleId, label: string) => updateModule(id, { label })

  const moveModule = (id: ModuleId, direction: -1 | 1) => {
    setModules((list) => {
      const sorted = [...list].sort((a, b) => a.order - b.order)
      const idx = sorted.findIndex((m) => m.id === id)
      const swap = idx + direction
      if (idx < 0 || swap < 0 || swap >= sorted.length) return list
      const a = sorted[idx]
      const b = sorted[swap]
      return list.map((m) => {
        if (m.id === a.id) return { ...m, order: b.order }
        if (m.id === b.id) return { ...m, order: a.order }
        return m
      })
    })
  }

  const addCustomModule = (input: {
    label: string
    color: string
    icon: ModuleIconKey
    viewMode: ViewMode
  }) => {
    const id = uid('custom')
    const maxOrder = modules.reduce((max, m) => Math.max(max, m.order), 0)
    setModules((list) => [
      ...list,
      {
        id,
        label: input.label || 'Nova aba',
        color: input.color,
        enabled: true,
        builtin: false,
        icon: input.icon,
        viewMode: input.viewMode,
        order: maxOrder + 1,
      },
    ])
    setCustomData((data) => ({
      ...data,
      [id]: { id, notes: '', items: [] },
    }))
    return id
  }

  const removeModule = (id: ModuleId) => {
    const mod = modules.find((m) => m.id === id)
    if (!mod || mod.builtin) {
      // builtins can only be disabled
      updateModule(id, { enabled: false })
      return
    }
    setModules((list) => list.filter((m) => m.id !== id))
    setCustomData((data) => {
      const next = { ...data }
      delete next[id]
      return next
    })
  }

  const updateCustomData = (id: string, patch: Partial<CustomModuleData>) => {
    setCustomData((data) => ({
      ...data,
      [id]: { ...(data[id] ?? { id, notes: '', items: [] }), ...patch, id },
    }))
  }

  const resetCustomization = () => {
    setModules(DEFAULT_MODULES)
    setCustomData({})
  }

  const value = useMemo(
    () => ({
      modules,
      enabledModules,
      customData,
      getModule,
      updateModule,
      setModuleColor,
      setModuleView,
      setModuleEnabled,
      renameModule,
      moveModule,
      addCustomModule,
      removeModule,
      updateCustomData,
      resetCustomization,
    }),
    [modules, enabledModules, customData, getModule, updateModule],
  )

  return (
    <CustomizationContext.Provider value={value}>{children}</CustomizationContext.Provider>
  )
}

export function useCustomization() {
  const ctx = useContext(CustomizationContext)
  if (!ctx) throw new Error('useCustomization must be used within CustomizationProvider')
  return ctx
}
