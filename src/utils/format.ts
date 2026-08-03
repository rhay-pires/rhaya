export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatBRLHidden(value: number, visible: boolean): string {
  return visible ? formatBRL(value) : 'R$ ••••••'
}

/** Data local YYYY-MM-DD (evita bug de UTC à noite no Brasil) */
export function toLocalISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayISO(): string {
  return toLocalISO(new Date())
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

export function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function monthLabel(year: number, month: number): string {
  const d = new Date(year, month, 1)
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export function todayLongLabel(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

/** Compacto p/ mobile: "dom., 2 de ago." */
export function todayShortLabel(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function isSameMonth(dateStr: string, year: number, month: number): boolean {
  const d = new Date(dateStr + 'T12:00:00')
  return d.getFullYear() === year && d.getMonth() === month
}

export function percent(current: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(100, Math.round((current / total) * 100))
}

export const DAILY_QUOTES = [
  'Pequenos hábitos diários constroem grandes transformações.',
  'Sua disciplina de hoje é a liberdade de amanhã.',
  'Organize sua mente, organize sua vida.',
  'Progresso > Perfeição. Continue avançando.',
  'Você não precisa fazer tudo hoje — só o que importa.',
  'Cada real guardado é um passo em direção aos seus sonhos.',
  'Foque no processo e os resultados virão.',
] as const

export function quoteOfDay(): string {
  const day = Math.floor(Date.now() / 86400000)
  return DAILY_QUOTES[day % DAILY_QUOTES.length]
}
