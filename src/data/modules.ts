import type { ModuleConfig, ModuleIconKey, ViewMode } from '../types'

export const DEFAULT_MODULES: ModuleConfig[] = [
  { id: 'dashboard', label: 'Dashboard', color: '#D1C4FF', enabled: true, builtin: true, icon: 'dashboard', viewMode: 'default', order: 0 },
  { id: 'financas', label: 'Finanças', color: '#A5F387', enabled: true, builtin: true, icon: 'wallet', viewMode: 'default', order: 1 },
  { id: 'agenda', label: 'Agenda', color: '#70CFFF', enabled: true, builtin: true, icon: 'calendar', viewMode: 'mes', order: 2 },
  { id: 'habitos', label: 'Hábitos', color: '#FFEA5D', enabled: true, builtin: true, icon: 'zap', viewMode: 'rotina', order: 3 },
  { id: 'trabalho', label: 'Trabalho', color: '#FDBA74', enabled: true, builtin: true, icon: 'briefcase', viewMode: 'kanban', order: 4 },
  { id: 'metas', label: 'Metas & OKRs', color: '#F9A8D4', enabled: true, builtin: true, icon: 'target', viewMode: 'default', order: 5 },
  { id: 'estudos', label: 'Estudos', color: '#C4B5FD', enabled: true, builtin: true, icon: 'book', viewMode: 'default', order: 6 },
  { id: 'saude', label: 'Saúde', color: '#86EFAC', enabled: true, builtin: true, icon: 'heart', viewMode: 'default', order: 7 },
  { id: 'devpessoal', label: 'Dev. Pessoal', color: '#FDA4AF', enabled: true, builtin: true, icon: 'sparkles', viewMode: 'default', order: 8 },
  { id: 'estatisticas', label: 'Estatísticas', color: '#60A5FA', enabled: true, builtin: true, icon: 'chart', viewMode: 'default', order: 9 },
  { id: 'conteudo', label: 'Conteúdo', color: '#E5D3B3', enabled: true, builtin: true, icon: 'clapper', viewMode: 'kanban', order: 10 },
]

export const VIEW_OPTIONS: Record<string, { id: ViewMode; label: string }[]> = {
  trabalho: [
    { id: 'kanban', label: 'Kanban' },
    { id: 'lista', label: 'Lista' },
  ],
  agenda: [
    { id: 'mes', label: 'Mês' },
    { id: 'semana', label: 'Semana' },
  ],
  habitos: [
    { id: 'rotina', label: 'Rotina' },
    { id: 'insights', label: 'Insights' },
  ],
  conteudo: [
    { id: 'kanban', label: 'Pipeline' },
    { id: 'lista', label: 'Lista' },
  ],
  custom: [
    { id: 'checklist', label: 'Checklist' },
    { id: 'notas', label: 'Notas' },
    { id: 'kanban', label: 'Board simples' },
  ],
}

export const ICON_OPTIONS: { id: ModuleIconKey; label: string }[] = [
  { id: 'list', label: 'Lista' },
  { id: 'star', label: 'Estrela' },
  { id: 'coffee', label: 'Café' },
  { id: 'music', label: 'Música' },
  { id: 'camera', label: 'Câmera' },
  { id: 'sparkles', label: 'Sparkles' },
  { id: 'target', label: 'Alvo' },
  { id: 'heart', label: 'Coração' },
  { id: 'book', label: 'Livro' },
  { id: 'zap', label: 'Zap' },
]

export function contrastText(bg: string): string {
  const hex = bg.replace('#', '')
  if (hex.length < 6) return '#1F2937'
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luma > 0.62 ? '#1F2937' : '#FFFFFF'
}

export function softTint(hex: string, alpha = 0.35): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
