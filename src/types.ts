export const FUN_COLORS = [
  { id: 'lilac', hex: '#D1C4FF', name: 'Lilás' },
  { id: 'violet', hex: '#6C4BFF', name: 'Roxo Neon' },
  { id: 'lavender', hex: '#C4B5FD', name: 'Lavanda' },
  { id: 'sky', hex: '#70CFFF', name: 'Céu' },
  { id: 'blue', hex: '#60A5FA', name: 'Azul' },
  { id: 'mint', hex: '#A5F387', name: 'Limão' },
  { id: 'green', hex: '#86EFAC', name: 'Menta' },
  { id: 'yellow', hex: '#FFEA5D', name: 'Amarelo' },
  { id: 'peach', hex: '#E5D3B3', name: 'Pêssego' },
  { id: 'coral', hex: '#FDA4AF', name: 'Coral' },
  { id: 'pink', hex: '#F9A8D4', name: 'Rosa' },
  { id: 'orange', hex: '#FDBA74', name: 'Laranja' },
  { id: 'cream', hex: '#FEF3C7', name: 'Creme' },
  { id: 'slate', hex: '#E2E8F0', name: 'Cinza' },
  { id: 'white', hex: '#FFFFFF', name: 'Branco' },
  { id: 'ink', hex: '#1F2937', name: 'Ink' },
] as const

export type BuiltinModuleId =
  | 'dashboard'
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

/** Builtin or custom module id (custom_* ) */
export type ModuleId = BuiltinModuleId | string

export type ModuleIconKey =
  | 'dashboard'
  | 'wallet'
  | 'calendar'
  | 'zap'
  | 'briefcase'
  | 'target'
  | 'book'
  | 'heart'
  | 'sparkles'
  | 'chart'
  | 'clapper'
  | 'list'
  | 'star'
  | 'coffee'
  | 'music'
  | 'camera'

export type ViewMode =
  | 'default'
  | 'kanban'
  | 'lista'
  | 'mes'
  | 'semana'
  | 'rotina'
  | 'insights'
  | 'notas'
  | 'checklist'

export interface ModuleConfig {
  id: ModuleId
  label: string
  color: string
  enabled: boolean
  builtin: boolean
  icon: ModuleIconKey
  viewMode: ViewMode
  order: number
}

export interface CustomListItem {
  id: string
  text: string
  done: boolean
}

export interface CustomModuleData {
  id: string
  notes: string
  items: CustomListItem[]
}

export type TransactionType = 'receita' | 'despesa'
export type TransactionCategory =
  | 'Salário'
  | 'Educação'
  | 'Lazer'
  | 'Alimentação'
  | 'Transporte'
  | 'Investimentos'
  | 'Fatura'
  | 'Outros'
  | 'Moradia'
  | 'Saúde'

/** Identificador simples do banco, e.g. nubank, itau, c6 */
export type BankName = string

export interface BankAccount {
  id: string
  bank: BankName
  name: string
  balance: number
  color: string
  emoji: string
}

export interface CreditCard {
  id: string
  name: string
  brand: string
  limit: number
  used: number
  invoiceAmount: number
  closingDay: number
  dueDay: number
  linkedAccountId: string
  gradient: string
}

export interface Transaction {
  id: string
  type: TransactionType
  category: TransactionCategory
  description: string
  amount: number
  date: string
  accountId: string
  cardId?: string
  recurring?: boolean
}

export interface FinancialGoal {
  id: string
  title: string
  targetAmount: number
  currentAmount: number
  deadline: string
  imageUrl: string
  category: string
}

export interface CategoryLimit {
  id: string
  category: TransactionCategory
  limit: number
}

export interface Subscription {
  id: string
  name: string
  amount: number
  dueDay: number
  category: string
  paused: boolean
  color: string
}

export interface PurchaseDecision {
  id: string
  item: string
  price: number
  urgency: boolean
  importance: boolean
  hasBalance: boolean
  researched: boolean
  score: number
  advice: string
  createdAt: string
}

export type Priority = 'baixa' | 'media' | 'alta'

export interface Appointment {
  id: string
  title: string
  date: string
  time: string
  priority: Priority
  reminder: boolean
  location?: string
  recurrence?: 'none' | 'weekly'
  done?: boolean
}

export interface Habit {
  id: string
  name: string
  period: 'manha' | 'tarde' | 'noite'
  streak: number
  completedDates: string[]
  color: string
  /** 0=Dom..6=Sáb; empty/undefined = todo dia */
  weekdays?: number[]
  iconKey?: string
}

export interface WorkTask {
  id: string
  title: string
  client: string
  status: 'todo' | 'doing' | 'done'
  priority: Priority
  dueDate: string
}

export interface LifeGoal {
  id: string
  title: string
  horizon: 'curto' | 'medio' | 'longo'
  area: 'Carreira' | 'Saúde' | 'Finanças' | 'Pessoal'
  progress: number
  steps: { id: string; title: string; done: boolean }[]
  deadline?: string
  archived?: boolean
}

export interface Subject {
  id: string
  name: string
  progress: number
  nextExam?: string
  notes: string
  school?: 'immes' | 'univesp' | 'outro'
}

export interface Flashcard {
  id: string
  front: string
  back: string
  subjectId: string
}

export interface HealthLog {
  date: string
  waterMl: number
  sleepHours: number
  workout: string
  meals: string
  weightKg?: number
}

export interface WheelScore {
  area: string
  score: number
}

export interface GratitudeEntry {
  id: string
  text: string
  date: string
}

export interface Book {
  id: string
  title: string
  author: string
  status: 'lido' | 'lendo' | 'desejado'
  pagesRead: number
  totalPages: number
  rating: number
}

export interface ContentItem {
  id: string
  title: string
  platform: 'Instagram' | 'YouTube' | 'TikTok' | 'Blog'
  status: 'ideia' | 'roteiro' | 'gravando' | 'editado' | 'publicado'
  publishDate: string
  brief?: string
  link?: string
  views?: number
  likes?: number
}

export interface MoodEntry {
  id: string
  date: string
  mood: number
  note: string
}

export interface JournalEntry {
  id: string
  date: string
  title: string
  content: string
}
