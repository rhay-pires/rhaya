import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { uid } from '../utils/format'
import { loadJSON, saveJSON } from '../utils/storage'

export type ThemeMode = 'light' | 'dark' | 'system'
export type VisualStyle = 'playful' | 'glass' | 'minimal'
export type WidgetSize = 'square' | 'card'

/** Widgets do dashboard = módulos do app (exceto o próprio dashboard) */
export type DashboardWidgetId =
  | 'financas'
  | 'agenda'
  | 'habitos'
  | 'trabalho'
  | 'metas'
  | 'estudos'
  | 'saude'
  | 'devpessoal'
  | 'estatisticas'
  | 'conteudo'

export interface WidgetModalityDef {
  id: string
  label: string
  description: string
}

/** Instância de widget: módulo + modalidade + tamanho */
export interface DashboardWidgetConfig {
  id: string
  moduleId: DashboardWidgetId
  size: WidgetSize
  modality: string
}

export interface AppSettings {
  displayName: string
  avatarInitials: string
  avatarUrl: string | null
  themeMode: ThemeMode
  visualStyle: VisualStyle
  waterGoalMl: number
  sleepGoalHours: number
  weekStartsOn: 0 | 1
  hideBalancesByDefault: boolean
  reduceMotion: boolean
  dashboardWidgets: DashboardWidgetConfig[]
  /** Bump para reaplicar o preset Padrão após mudanças de layout */
  dashboardLayoutRev: number
  /** Soft Essential visual migration */
  designLanguageRev: number
}

/** Rev: home só com poucos widgets enxutos */
export const DASHBOARD_LAYOUT_REV = 6
export const DESIGN_LANGUAGE_REV = 1

const STORAGE_KEY = 'lifehub-settings-v1'

export const ALL_DASHBOARD_WIDGETS: {
  id: DashboardWidgetId
  label: string
  description: string
}[] = [
  { id: 'financas', label: 'Finanças', description: 'Saldo, receitas e despesas do mês' },
  { id: 'agenda', label: 'Agenda', description: 'Próximos compromissos e semana' },
  { id: 'habitos', label: 'Hábitos', description: 'Rotina diária e streaks' },
  { id: 'trabalho', label: 'Trabalho', description: 'Tarefas a fazer / andando / feitas' },
  { id: 'metas', label: 'Metas & OKRs', description: 'Progresso das metas de vida' },
  { id: 'estudos', label: 'Estudos', description: 'Matérias e progresso acadêmico' },
  { id: 'saude', label: 'Saúde', description: 'Água, sono e treino do dia' },
  { id: 'devpessoal', label: 'Dev. Pessoal', description: 'Humor, gratidão e leituras' },
  { id: 'estatisticas', label: 'Estatísticas', description: 'Visão geral de desempenho' },
  { id: 'conteudo', label: 'Conteúdo', description: 'Pipeline de produção' },
]

/** Modalidades (= seções / métricas) de cada módulo */
export const MODULE_MODALITIES: Record<DashboardWidgetId, WidgetModalityDef[]> = {
  financas: [
    { id: 'overview', label: 'Visão geral', description: 'Saldo, receitas e despesas' },
    { id: 'saldo', label: 'Saldo', description: 'Saldo total das contas' },
    { id: 'receitas', label: 'Receitas', description: 'Receitas do mês' },
    { id: 'despesas', label: 'Despesas', description: 'Despesas do mês' },
    { id: 'faturas', label: 'Faturas', description: 'Total em aberto nos cartões' },
    { id: 'metas', label: 'Metas financeiras', description: 'Quanto já guardou' },
    { id: 'assinaturas', label: 'Assinaturas', description: 'Gasto mensal recorrente' },
  ],
  agenda: [
    { id: 'proximo', label: 'Próximo', description: 'Só o próximo compromisso' },
    { id: 'overview', label: 'Visão geral', description: 'Semana + próximos' },
    { id: 'proximos', label: 'Próximos', description: 'Lista de compromissos' },
    { id: 'semana', label: 'Semana', description: 'Mini calendário' },
    { id: 'hoje', label: 'Hoje', description: 'Compromissos de hoje' },
  ],
  habitos: [
    { id: 'overview', label: 'Visão geral', description: 'Lista + progresso' },
    { id: 'progresso', label: 'Progresso', description: '% concluído hoje' },
    { id: 'streak', label: 'Streak', description: 'Melhor sequência' },
    { id: 'pendentes', label: 'Pendentes', description: 'Hábitos de hoje' },
  ],
  trabalho: [
    { id: 'overview', label: 'Visão geral', description: 'Kanban resumido' },
    { id: 'todo', label: 'A fazer', description: 'Tarefas na fila' },
    { id: 'doing', label: 'Andando', description: 'Em progresso' },
    { id: 'done', label: 'Feito', description: 'Concluídas' },
    { id: 'pendentes', label: 'Pendentes', description: 'Total não concluído' },
  ],
  metas: [
    { id: 'overview', label: 'Visão geral', description: 'Lista de metas' },
    { id: 'media', label: 'Média', description: 'Progresso médio' },
  ],
  estudos: [
    { id: 'overview', label: 'Visão geral', description: 'Matérias' },
    { id: 'media', label: 'Média', description: 'Progresso médio' },
  ],
  saude: [
    { id: 'overview', label: 'Visão geral', description: 'Água, sono e treino' },
    { id: 'agua', label: 'Água', description: 'Consumo do dia' },
    { id: 'sono', label: 'Sono', description: 'Horas dormidas' },
    { id: 'treino', label: 'Treino', description: 'Atividade do dia' },
  ],
  devpessoal: [
    { id: 'overview', label: 'Visão geral', description: 'Citação, humor e leitura' },
    { id: 'humor', label: 'Humor', description: 'Humor de hoje' },
    { id: 'citacao', label: 'Citação', description: 'Frase do dia' },
    { id: 'leitura', label: 'Leitura', description: 'Livro atual' },
  ],
  estatisticas: [
    { id: 'overview', label: 'Visão geral', description: 'Hábitos, metas e estudos' },
    { id: 'habitos', label: 'Hábitos', description: '% de hoje' },
    { id: 'metas', label: 'Metas', description: 'Média de progresso' },
    { id: 'estudos', label: 'Estudos', description: 'Média de progresso' },
  ],
  conteudo: [
    { id: 'overview', label: 'Visão geral', description: 'Pipeline' },
    { id: 'producao', label: 'Em produção', description: 'Itens não publicados' },
  ],
}

export function modalitiesFor(moduleId: DashboardWidgetId): WidgetModalityDef[] {
  return MODULE_MODALITIES[moduleId] ?? []
}

export function modalityLabel(moduleId: DashboardWidgetId, modality: string): string {
  return modalitiesFor(moduleId).find((m) => m.id === modality)?.label ?? modality
}

function makeWidget(
  moduleId: DashboardWidgetId,
  modality = 'overview',
  size: WidgetSize = 'card',
): DashboardWidgetConfig {
  const mods = modalitiesFor(moduleId)
  const safeMod = mods.some((m) => m.id === modality) ? modality : mods[0]?.id ?? 'overview'
  return { id: uid('w'), moduleId, size, modality: safeMod }
}

/** Clona templates com ids novos (para aplicar preset) */
export function freshWidgets(
  templates: Array<Pick<DashboardWidgetConfig, 'moduleId' | 'modality' | 'size'>>,
): DashboardWidgetConfig[] {
  return templates.map((t) => makeWidget(t.moduleId, t.modality, t.size))
}

export const DEFAULT_WIDGET_TEMPLATES: Array<
  Pick<DashboardWidgetConfig, 'moduleId' | 'modality' | 'size'>
> = [
  { moduleId: 'habitos', modality: 'progresso', size: 'square' },
  { moduleId: 'saude', modality: 'agua', size: 'square' },
  { moduleId: 'financas', modality: 'saldo', size: 'square' },
  { moduleId: 'trabalho', modality: 'pendentes', size: 'square' },
]

/** Layout cheio — agenda + métricas extras */
const COMPLETE_WIDGET_TEMPLATES: Array<
  Pick<DashboardWidgetConfig, 'moduleId' | 'modality' | 'size'>
> = [
  { moduleId: 'financas', modality: 'saldo', size: 'square' },
  { moduleId: 'habitos', modality: 'progresso', size: 'square' },
  { moduleId: 'trabalho', modality: 'pendentes', size: 'square' },
  { moduleId: 'agenda', modality: 'proximo', size: 'card' },
  { moduleId: 'saude', modality: 'agua', size: 'square' },
  { moduleId: 'habitos', modality: 'streak', size: 'square' },
]

export const DEFAULT_DASHBOARD_WIDGETS: DashboardWidgetConfig[] =
  freshWidgets(DEFAULT_WIDGET_TEMPLATES)

export type DashboardPresetId = 'padrao' | 'compacto' | 'completo'

export const DASHBOARD_PRESETS: {
  id: DashboardPresetId
  label: string
  description: string
  widgets: Array<Pick<DashboardWidgetConfig, 'moduleId' | 'modality' | 'size'>>
}[] = [
  {
    id: 'padrao',
    label: 'Padrão',
    description: '4 métricas — hábitos, água, saldo e tarefas',
    widgets: DEFAULT_WIDGET_TEMPLATES,
  },
  {
    id: 'compacto',
    label: 'Compacto',
    description: '6 ícones em fileiras',
    widgets: [
      { moduleId: 'financas', modality: 'saldo', size: 'square' },
      { moduleId: 'agenda', modality: 'hoje', size: 'square' },
      { moduleId: 'habitos', modality: 'progresso', size: 'square' },
      { moduleId: 'saude', modality: 'agua', size: 'square' },
      { moduleId: 'trabalho', modality: 'pendentes', size: 'square' },
      { moduleId: 'metas', modality: 'media', size: 'square' },
    ],
  },
  {
    id: 'completo',
    label: 'Completo',
    description: 'Métricas + card de agenda',
    widgets: COMPLETE_WIDGET_TEMPLATES,
  },
]

/** Aplica preset só com módulos ativos na sidebar */
export function widgetsFromPreset(
  presetId: DashboardPresetId,
  enabledModuleIds: string[],
): DashboardWidgetConfig[] {
  const preset = DASHBOARD_PRESETS.find((p) => p.id === presetId) ?? DASHBOARD_PRESETS[0]
  const enabled = new Set(enabledModuleIds)
  const filtered = preset.widgets.filter((w) => enabled.has(w.moduleId))
  const list = filtered.length ? filtered : preset.widgets.slice(0, 3)
  return freshWidgets(list)
}

const LEGACY_WIDGET_MAP: Record<string, DashboardWidgetId | null> = {
  week: 'agenda',
  quote: 'devpessoal',
  metrics: 'financas',
  habits: 'habitos',
  agenda: 'agenda',
  work: 'trabalho',
  shortcuts: null,
  financas: 'financas',
  habitos: 'habitos',
  trabalho: 'trabalho',
  metas: 'metas',
  estudos: 'estudos',
  saude: 'saude',
  devpessoal: 'devpessoal',
  estatisticas: 'estatisticas',
  conteudo: 'conteudo',
}

const VALID_MODULES = new Set(ALL_DASHBOARD_WIDGETS.map((w) => w.id))

function isConfig(item: unknown): item is DashboardWidgetConfig {
  return (
    !!item &&
    typeof item === 'object' &&
    'moduleId' in item &&
    typeof (item as DashboardWidgetConfig).moduleId === 'string'
  )
}

export function normalizeWidgets(raw?: unknown): DashboardWidgetConfig[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_DASHBOARD_WIDGETS.map((w) => ({ ...w, id: uid('w') }))

  const result: DashboardWidgetConfig[] = []

  for (const item of raw) {
    if (isConfig(item)) {
      const moduleId = VALID_MODULES.has(item.moduleId)
        ? item.moduleId
        : LEGACY_WIDGET_MAP[item.moduleId]
      if (!moduleId || !VALID_MODULES.has(moduleId)) continue
      const mods = modalitiesFor(moduleId)
      const modality = mods.some((m) => m.id === item.modality)
        ? item.modality
        : mods[0]?.id ?? 'overview'
      const size: WidgetSize = item.size === 'square' ? 'square' : 'card'
      result.push({
        id: typeof item.id === 'string' ? item.id : uid('w'),
        moduleId,
        size,
        modality,
      })
      continue
    }

    if (typeof item === 'string') {
      const moduleId =
        (VALID_MODULES.has(item as DashboardWidgetId) ? (item as DashboardWidgetId) : null) ??
        LEGACY_WIDGET_MAP[item]
      if (!moduleId) continue
      result.push(makeWidget(moduleId, 'overview', 'card'))
    }
  }

  return result.length ? result : DEFAULT_DASHBOARD_WIDGETS.map((w) => ({ ...w, id: uid('w') }))
}

export const DEFAULT_SETTINGS: AppSettings = {
  displayName: 'Rhayanne',
  avatarInitials: 'Rh',
  avatarUrl: null,
  themeMode: 'system',
  visualStyle: 'minimal',
  waterGoalMl: 2000,
  sleepGoalHours: 8,
  weekStartsOn: 0,
  hideBalancesByDefault: false,
  reduceMotion: false,
  dashboardWidgets: DEFAULT_DASHBOARD_WIDGETS,
  dashboardLayoutRev: DASHBOARD_LAYOUT_REV,
  designLanguageRev: DESIGN_LANGUAGE_REV,
}

export const VISUAL_STYLES: {
  id: VisualStyle
  label: string
  description: string
  preview: string[]
}[] = [
  {
    id: 'playful',
    label: 'Colorido',
    description: 'Pastéis fortes e visual mais marcante',
    preview: ['#D1C4FF', '#FFEA5D', '#70CFFF', '#A5F387'],
  },
  {
    id: 'glass',
    label: 'Liquid Glass',
    description: 'Vidro fosco, mesh pastel e vibe tech suave',
    preview: ['#F9A8D4', '#A7F3D0', '#BAE6FD', '#C4B5FD'],
  },
  {
    id: 'minimal',
    label: 'Essential',
    description: 'Calmo e premium — limão suave, muito respiro',
    preview: ['#F6F4F1', '#C8F560', '#FFFFFF', '#1C1917'],
  },
]

interface SettingsStore {
  settings: AppSettings
  resolvedTheme: 'light' | 'dark'
  updateSettings: (patch: Partial<AppSettings>) => void
  setThemeMode: (mode: ThemeMode) => void
  setVisualStyle: (style: VisualStyle) => void
  addDashboardWidget: (
    moduleId: DashboardWidgetId,
    modality?: string,
    size?: WidgetSize,
  ) => void
  removeDashboardWidget: (id: string) => void
  updateDashboardWidget: (id: string, patch: Partial<Pick<DashboardWidgetConfig, 'size' | 'modality'>>) => void
  moveDashboardWidget: (id: string, direction: 'up' | 'down') => void
  applyDashboardPreset: (presetId: DashboardPresetId, enabledModuleIds: string[]) => void
  resetSettings: () => void
  importSettings: (data: Partial<AppSettings>) => void
}

const SettingsContext = createContext<SettingsStore | null>(null)

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'light') return 'light'
  if (mode === 'dark') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = loadJSON<Partial<AppSettings>>(STORAGE_KEY, {})
    const savedRev = saved.dashboardLayoutRev ?? 0
    const needsLayoutRefresh = savedRev < DASHBOARD_LAYOUT_REV
    const needsDesignRefresh = (saved.designLanguageRev ?? 0) < DESIGN_LANGUAGE_REV
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      visualStyle: needsDesignRefresh ? 'minimal' : (saved.visualStyle ?? 'minimal'),
      dashboardWidgets: needsLayoutRefresh
        ? freshWidgets(DEFAULT_WIDGET_TEMPLATES)
        : normalizeWidgets(saved.dashboardWidgets),
      dashboardLayoutRev: DASHBOARD_LAYOUT_REV,
      designLanguageRev: DESIGN_LANGUAGE_REV,
    }
  })
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
    resolveTheme(settings.themeMode),
  )

  useEffect(() => {
    saveJSON(STORAGE_KEY, settings)
  }, [settings])

  useEffect(() => {
    if (settings.dashboardLayoutRev >= DASHBOARD_LAYOUT_REV && settings.designLanguageRev >= DESIGN_LANGUAGE_REV)
      return
    setSettings((s) => {
      const next = { ...s }
      if (s.dashboardLayoutRev < DASHBOARD_LAYOUT_REV) {
        next.dashboardWidgets = freshWidgets(DEFAULT_WIDGET_TEMPLATES)
        next.dashboardLayoutRev = DASHBOARD_LAYOUT_REV
      }
      if (s.designLanguageRev < DESIGN_LANGUAGE_REV) {
        next.visualStyle = 'minimal'
        next.designLanguageRev = DESIGN_LANGUAGE_REV
      }
      return next
    })
  }, [settings.dashboardLayoutRev, settings.designLanguageRev])

  useEffect(() => {
    const apply = () => setResolvedTheme(resolveTheme(settings.themeMode))
    apply()
    if (settings.themeMode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => apply()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [settings.themeMode])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolvedTheme === 'dark')
    root.dataset.theme = resolvedTheme
    root.dataset.style = settings.visualStyle
    root.style.colorScheme = resolvedTheme
  }, [resolvedTheme, settings.visualStyle])

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', settings.reduceMotion)
  }, [settings.reduceMotion])

  const updateSettings = (patch: Partial<AppSettings>) => {
    setSettings((s) => ({ ...s, ...patch }))
  }

  const addDashboardWidget = (
    moduleId: DashboardWidgetId,
    modality = 'overview',
    size: WidgetSize = 'square',
  ) => {
    setSettings((s) => ({
      ...s,
      dashboardWidgets: [...s.dashboardWidgets, makeWidget(moduleId, modality, size)],
    }))
  }

  const removeDashboardWidget = (id: string) => {
    setSettings((s) => {
      if (s.dashboardWidgets.length <= 1) return s
      return { ...s, dashboardWidgets: s.dashboardWidgets.filter((w) => w.id !== id) }
    })
  }

  const updateDashboardWidget = (
    id: string,
    patch: Partial<Pick<DashboardWidgetConfig, 'size' | 'modality'>>,
  ) => {
    setSettings((s) => ({
      ...s,
      dashboardWidgets: s.dashboardWidgets.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    }))
  }

  const moveDashboardWidget = (id: string, direction: 'up' | 'down') => {
    setSettings((s) => {
      const list = [...s.dashboardWidgets]
      const index = list.findIndex((w) => w.id === id)
      if (index < 0) return s
      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= list.length) return s
      ;[list[index], list[target]] = [list[target], list[index]]
      return { ...s, dashboardWidgets: list }
    })
  }

  const applyDashboardPreset = (presetId: DashboardPresetId, enabledModuleIds: string[]) => {
    setSettings((s) => ({
      ...s,
      dashboardWidgets: widgetsFromPreset(presetId, enabledModuleIds),
    }))
  }

  const value = useMemo(
    () => ({
      settings,
      resolvedTheme,
      updateSettings,
      setThemeMode: (themeMode: ThemeMode) => updateSettings({ themeMode }),
      setVisualStyle: (visualStyle: VisualStyle) => updateSettings({ visualStyle }),
      addDashboardWidget,
      removeDashboardWidget,
      updateDashboardWidget,
      moveDashboardWidget,
      applyDashboardPreset,
      resetSettings: () =>
        setSettings({
          ...DEFAULT_SETTINGS,
          dashboardWidgets: freshWidgets(DEFAULT_WIDGET_TEMPLATES),
        }),
      importSettings: (data: Partial<AppSettings>) =>
        setSettings((s) => ({
          ...s,
          ...data,
          dashboardWidgets: data.dashboardWidgets
            ? normalizeWidgets(data.dashboardWidgets)
            : s.dashboardWidgets,
        })),
    }),
    [settings, resolvedTheme],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
