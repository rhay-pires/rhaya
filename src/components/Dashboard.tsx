import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BookOpen,
  Briefcase,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clapperboard,
  BarChart3,
  CreditCard,
  Droplets,
  Flame,
  HeartPulse,
  LayoutGrid,
  Moon,
  Plus,
  Repeat,
  Smile,
  Sparkles,
  Square,
  Target,
  Trash2,
  Wallet,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { useApp } from '../store/AppStore'
import { useCustomization } from '../store/CustomizationStore'
import { useNavigation } from '../store/NavigationContext'
import {
  ALL_DASHBOARD_WIDGETS,
  DASHBOARD_PRESETS,
  modalitiesFor,
  modalityLabel,
  useSettings,
  type DashboardPresetId,
  type DashboardWidgetConfig,
  type DashboardWidgetId,
  type WidgetSize,
} from '../store/SettingsStore'
import type { ModuleId } from '../types'
import { formatBRLHidden, isSameMonth, quoteOfDay, toLocalISO, todayISO, uid } from '../utils/format'
import { Modal } from './ui'

function weekAround(center: string) {
  const base = new Date(center + 'T12:00:00')
  const start = new Date(base)
  start.setDate(base.getDate() - base.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return toLocalISO(d)
  })
}

type LayoutGroup =
  | { type: 'squares'; items: DashboardWidgetConfig[] }
  | { type: 'card'; item: DashboardWidgetConfig }

const MAX_SQUARES_PER_ROW = 2

/** Strong ease-out — Emil design-eng (never ease-in on enter) */
const EASE_OUT = [0.23, 1, 0.32, 1] as const

function widgetEnter(reduceMotion: boolean, delay = 0) {
  if (reduceMotion) {
    return {
      initial: false as const,
      animate: { opacity: 1, transform: 'translateY(0px) scale(1)' },
      transition: { duration: 0 },
    }
  }
  return {
    initial: { opacity: 0, transform: 'translateY(10px) scale(0.96)' },
    animate: { opacity: 1, transform: 'translateY(0px) scale(1)' },
    transition: { duration: 0.22, ease: EASE_OUT, delay },
  }
}

function flushSquares(groups: LayoutGroup[], squares: DashboardWidgetConfig[]) {
  for (let i = 0; i < squares.length; i += MAX_SQUARES_PER_ROW) {
    groups.push({ type: 'squares', items: squares.slice(i, i + MAX_SQUARES_PER_ROW) })
  }
}

function groupWidgets(widgets: DashboardWidgetConfig[]): LayoutGroup[] {
  const groups: LayoutGroup[] = []
  let squares: DashboardWidgetConfig[] = []
  for (const w of widgets) {
    if (w.size === 'square') {
      squares.push(w)
    } else {
      if (squares.length) {
        flushSquares(groups, squares)
        squares = []
      }
      groups.push({ type: 'card', item: w })
    }
  }
  if (squares.length) flushSquares(groups, squares)
  return groups
}

const MODULE_ICONS: Record<DashboardWidgetId, LucideIcon> = {
  financas: Wallet,
  agenda: CalendarDays,
  habitos: Zap,
  trabalho: Briefcase,
  metas: Target,
  estudos: BookOpen,
  saude: HeartPulse,
  devpessoal: Sparkles,
  estatisticas: BarChart3,
  conteudo: Clapperboard,
}

export function Dashboard() {
  const {
    accounts,
    cards,
    transactions,
    habits,
    tasks,
    appointments,
    balanceVisible,
    year,
    month,
    toggleHabit,
    health,
    lifeGoals,
    subjects,
    books,
    moods,
    content,
    financialGoals,
    subscriptions,
    setTransactions,
    setAccounts,
    setAppointments,
    setTasks,
    addNotification,
  } = useApp()
  const { enabledModules, getModule } = useCustomization()
  const {
    settings,
    addDashboardWidget,
    removeDashboardWidget,
    updateDashboardWidget,
    moveDashboardWidget,
    applyDashboardPreset,
  } = useSettings()
  const isGlass = settings.visualStyle === 'glass'
  const { navigate } = useNavigation()
  const [editOpen, setEditOpen] = useState(false)
  const [widgetTab, setWidgetTab] = useState<'padrao' | 'personalizar'>('padrao')
  const [activePreset, setActivePreset] = useState<DashboardPresetId | null>('padrao')
  const [addModule, setAddModule] = useState<DashboardWidgetId | ''>('')
  const [addModality, setAddModality] = useState('overview')
  const [addSize, setAddSize] = useState<WidgetSize>('square')
  const [quickModal, setQuickModal] = useState<'despesa' | 'compromisso' | 'tarefa' | null>(null)
  const [fabOpen, setFabOpen] = useState(false)

  const today = todayISO()
  const week = useMemo(() => weekAround(today), [today])

  /** Essential-style pastel surface — only used on Dashboard widgets */
  const dashSurface = (color: string): CSSProperties =>
    isGlass
      ? {
          background: `linear-gradient(165deg, color-mix(in srgb, ${color} 42%, white) 0%, color-mix(in srgb, ${color} 18%, white) 100%)`,
          ['--accent' as string]: color,
        }
      : {
          background: `color-mix(in srgb, ${color} 24%, white)`,
          ['--accent' as string]: color,
        }

  const iconBadgeStyle = (color: string): CSSProperties => ({
    background: `color-mix(in srgb, ${color} 55%, white)`,
  })

  const dashCardClass =
    'dash-hero w-full overflow-hidden rounded-[28px] text-left pressable'

  const activeWidgets = useMemo(() => {
    const enabledIds = new Set(enabledModules.map((m) => m.id))
    return settings.dashboardWidgets.filter((w) => enabledIds.has(w.moduleId))
  }, [settings.dashboardWidgets, enabledModules])

  const layout = useMemo(() => groupWidgets(activeWidgets), [activeWidgets])

  const availableModules = useMemo(
    () => ALL_DASHBOARD_WIDGETS.filter((w) => enabledModules.some((m) => m.id === w.id)),
    [enabledModules],
  )

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)
  const monthTx = transactions.filter((t) => isSameMonth(t.date, year, month))
  const receitas = monthTx.filter((t) => t.type === 'receita').reduce((s, t) => s + t.amount, 0)
  const despesas = monthTx.filter((t) => t.type === 'despesa').reduce((s, t) => s + t.amount, 0)
  const invoiceTotal = cards.reduce((s, c) => s + c.invoiceAmount, 0)
  const subMonthly = subscriptions
    .filter((s) => !s.paused)
    .reduce((s, x) => s + x.amount, 0)
  const habitsDone = habits.filter((h) => h.completedDates.includes(today)).length
  const habitPct = habits.length ? Math.round((habitsDone / habits.length) * 100) : 0
  const bestStreak = Math.max(0, ...habits.map((h) => h.streak), 0)
  const pendingHabits = habits.filter((h) => !h.completedDates.includes(today))
  const pendingTasks = tasks.filter((t) => t.status !== 'done').length
  const todo = tasks.filter((t) => t.status === 'todo').length
  const doing = tasks.filter((t) => t.status === 'doing').length
  const done = tasks.filter((t) => t.status === 'done').length
  const upcoming = appointments
    .filter((a) => a.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 3)
  const todayAppts = appointments.filter((a) => a.date === today)
  const avgLifeGoal = lifeGoals.length
    ? Math.round(lifeGoals.reduce((s, g) => s + g.progress, 0) / lifeGoals.length)
    : 0
  const avgSubject = subjects.length
    ? Math.round(subjects.reduce((s, x) => s + x.progress, 0) / subjects.length)
    : 0
  const waterPct = Math.min(100, Math.round((health.waterMl / settings.waterGoalMl) * 100))
  const reading = books.filter((b) => b.status === 'lendo')[0]
  const moodToday = moods.find((m) => m.date === today)
  const contentOpen = content.filter((c) => c.status !== 'publicado')
  const savedGoals = financialGoals.reduce((s, g) => s + g.currentAmount, 0)
  const moodEmoji = moodToday ? ['😞', '😕', '😐', '🙂', '😄'][moodToday.mood - 1] : '—'

  const moduleColor = (id: DashboardWidgetId) => getModule(id)?.color ?? '#D1C4FF'
  const moduleLabel = (id: DashboardWidgetId) => getModule(id)?.label ?? id
  const openModule = (id: ModuleId) => navigate(id)

  function squareData(w: DashboardWidgetConfig): {
    Icon: LucideIcon
    label: string
    value: string
  } {
    const { moduleId, modality } = w
    const Icon = MODULE_ICONS[moduleId]
    const label = modalityLabel(moduleId, modality)

    if (moduleId === 'financas') {
      if (modality === 'saldo')
        return { Icon: Wallet, label, value: formatBRLHidden(totalBalance, balanceVisible) }
      if (modality === 'receitas')
        return { Icon: ArrowUpCircle, label, value: formatBRLHidden(receitas, balanceVisible) }
      if (modality === 'despesas')
        return { Icon: ArrowDownCircle, label, value: formatBRLHidden(despesas, balanceVisible) }
      if (modality === 'faturas')
        return { Icon: CreditCard, label, value: formatBRLHidden(invoiceTotal, balanceVisible) }
      if (modality === 'metas')
        return { Icon: Target, label, value: formatBRLHidden(savedGoals, balanceVisible) }
      if (modality === 'assinaturas')
        return { Icon: Repeat, label, value: formatBRLHidden(subMonthly, balanceVisible) }
      return { Icon, label: 'Finanças', value: formatBRLHidden(totalBalance, balanceVisible) }
    }
    if (moduleId === 'agenda') {
      if (modality === 'proximo')
        return { Icon, label, value: upcoming[0]?.time ?? '—' }
      if (modality === 'hoje') return { Icon, label, value: String(todayAppts.length) }
      if (modality === 'semana')
        return {
          Icon,
          label,
          value: String(appointments.filter((a) => week.includes(a.date)).length),
        }
      return { Icon, label, value: String(upcoming.length) }
    }
    if (moduleId === 'habitos') {
      if (modality === 'streak') return { Icon: Flame, label, value: `${bestStreak}d` }
      if (modality === 'pendentes') return { Icon, label, value: String(pendingHabits.length) }
      return { Icon, label, value: `${habitPct}%` }
    }
    if (moduleId === 'trabalho') {
      if (modality === 'todo') return { Icon, label, value: String(todo) }
      if (modality === 'doing') return { Icon, label, value: String(doing) }
      if (modality === 'done') return { Icon, label, value: String(done) }
      if (modality === 'pendentes') return { Icon, label, value: String(pendingTasks) }
      return { Icon, label, value: String(pendingTasks) }
    }
    if (moduleId === 'metas') return { Icon, label, value: `${avgLifeGoal}%` }
    if (moduleId === 'estudos') return { Icon, label, value: `${avgSubject}%` }
    if (moduleId === 'saude') {
      if (modality === 'agua') return { Icon: Droplets, label, value: `${health.waterMl}ml` }
      if (modality === 'sono') return { Icon: Moon, label, value: `${health.sleepHours}h` }
      if (modality === 'treino') return { Icon, label, value: health.workout || '—' }
      return { Icon, label, value: `${waterPct}%` }
    }
    if (moduleId === 'devpessoal') {
      if (modality === 'humor')
        return {
          Icon: Smile,
          label,
          value: moodToday ? `${moodToday.mood}/5` : '—',
        }
      if (modality === 'citacao') return { Icon: Sparkles, label, value: 'Hoje' }
      if (modality === 'leitura')
        return {
          Icon: BookOpen,
          label,
          value: reading ? reading.title.split(' ')[0].slice(0, 8) : '—',
        }
      return {
        Icon: Smile,
        label: 'Humor',
        value: moodToday ? `${moodToday.mood}/5` : '—',
      }
    }
    if (moduleId === 'estatisticas') {
      if (modality === 'habitos') return { Icon: Zap, label, value: `${habitPct}%` }
      if (modality === 'metas') return { Icon: Target, label, value: `${avgLifeGoal}%` }
      if (modality === 'estudos') return { Icon: BookOpen, label, value: `${avgSubject}%` }
      return { Icon, label, value: `${habitPct}%` }
    }
    if (moduleId === 'conteudo') return { Icon, label, value: String(contentOpen.length) }
    return { Icon, label, value: '—' }
  }

  function renderCard(w: DashboardWidgetConfig) {
    const color = moduleColor(w.moduleId)
    const label = moduleLabel(w.moduleId)
    const mod = w.modality
    const Icon = MODULE_ICONS[w.moduleId]
    const modTitle = modalityLabel(w.moduleId, mod)

    // Specific modality cards that aren't full overview
    if (w.moduleId === 'financas' && mod !== 'overview') {
      const data = squareData(w)
      return (
        <button
          type="button"
          onClick={() => openModule('financas')}
          className={dashCardClass}
          style={dashSurface(color)}
        >
          <WidgetHeader Icon={data.Icon} page={label} label={modTitle} color={color} />
          <p className="px-4 pb-5 text-3xl font-bold text-[#1F2937]">{data.value}</p>
        </button>
      )
    }

    if (w.moduleId === 'financas') {
      return (
        <button
          type="button"
          onClick={() => openModule('financas')}
          className={dashCardClass}
          style={dashSurface(color)}
        >
          <WidgetHeader Icon={Wallet} label={label} subtitle="Saldo e fluxo do mês" />
          <div className="grid grid-cols-2 gap-2 p-4 pt-0 sm:grid-cols-3">
            <StatPill title="Saldo" value={formatBRLHidden(totalBalance, balanceVisible)} />
            <StatPill title="Receitas" value={formatBRLHidden(receitas, balanceVisible)} />
            <StatPill title="Despesas" value={formatBRLHidden(despesas, balanceVisible)} />
          </div>
          <p className="px-4 pb-4 text-xs font-medium text-[#1F2937]/65">
            Metas: {formatBRLHidden(savedGoals, balanceVisible)} guardados
          </p>
        </button>
      )
    }

    if (w.moduleId === 'agenda') {
      // Card médio: módulo Agenda + próximos compromissos
      if (mod === 'proximo') {
        const next = upcoming[0]
        return (
          <button
            type="button"
            onClick={() => openModule('agenda')}
            className="dash-tile pressable flex w-full items-center gap-3 bg-white px-4 py-4 text-left"
            style={dashSurface(color)}
          >
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
              style={iconBadgeStyle(color)}
            >
              <CalendarDays size={18} className="text-[#1F2937]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-[#1F2937]/45">Agenda</p>
              {next ? (
                <p className="truncate text-base font-bold text-[#1F2937]">
                  <span className="tabular-nums">{next.time}</span>
                  <span className="text-[#1F2937]/35"> · </span>
                  {next.title}
                </p>
              ) : (
                <p className="text-base font-bold text-[#1F2937]/40">Livre</p>
              )}
            </div>
            <ChevronRight size={18} className="shrink-0 text-[#1F2937]/30" />
          </button>
        )
      }

      const showWeek = mod === 'overview' || mod === 'semana'
      const showList = mod === 'overview' || mod === 'proximos' || mod === 'hoje'
      const list = mod === 'hoje' ? todayAppts.slice(0, 3) : upcoming
      const title = mod === 'overview' ? label : modTitle
      const subtitle =
        mod === 'hoje'
          ? `${todayAppts.length} compromisso${todayAppts.length === 1 ? '' : 's'} hoje`
          : `${upcoming.length} próximo${upcoming.length === 1 ? '' : 's'}`

      return (
        <div
          className="dash-hero overflow-hidden rounded-[28px]"
          style={dashSurface(color)}
        >
          <button type="button" onClick={() => openModule('agenda')} className="w-full text-left">
            <WidgetHeader
              Icon={CalendarDays}
              page={mod === 'overview' ? undefined : label}
              label={title}
              subtitle={subtitle}
              color={color}
            />
          </button>

          {showWeek && (
            <button
              type="button"
              onClick={() => openModule('agenda')}
              className="w-full px-3 pb-3"
            >
              <div className="flex justify-between gap-1 rounded-[22px] bg-white/70 p-2">
                {week.map((date) => {
                  const d = new Date(date + 'T12:00:00')
                  const active = date === today
                  const has = appointments.some((a) => a.date === date)
                  const weekday = d
                    .toLocaleDateString('pt-BR', { weekday: 'short' })
                    .replace('.', '')
                    .slice(0, 3)
                  return (
                    <div
                      key={date}
                      className={`flex flex-1 flex-col items-center gap-1 rounded-[16px] px-0.5 py-2 transition ${
                        active ? 'shadow-[0_4px_12px_rgba(15,23,42,0.08)]' : 'bg-transparent'
                      }`}
                      style={active ? { background: `color-mix(in srgb, ${color} 55%, white)` } : undefined}
                    >
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wide ${
                          active ? 'text-[#1F2937]/70' : 'text-slate-400'
                        }`}
                      >
                        {weekday}
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          active ? 'text-[#1F2937]' : 'text-slate-700'
                        }`}
                      >
                        {d.getDate()}
                      </span>
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          has ? (active ? 'bg-[#1F2937]' : 'bg-[#3B82F6]') : 'bg-transparent'
                        }`}
                      />
                    </div>
                  )
                })}
              </div>
            </button>
          )}

          {showList && (
            <div className="space-y-2 px-3 pb-4">
              {list.length === 0 ? (
                <p className="rounded-[18px] border-2 border-dashed border-[#1F2937]/20 bg-white/50 py-4 text-center text-sm text-[#1F2937]/50">
                  Agenda livre por agora
                </p>
              ) : (
                list.map((a) => {
                  const when = new Date(a.date + 'T12:00:00')
                  const dayLabel =
                    a.date === today
                      ? 'Hoje'
                      : when.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })
                  const priorityTone =
                    a.priority === 'alta'
                      ? 'bg-[#FDA4AF]'
                      : a.priority === 'media'
                        ? 'bg-[#FFEA5D]'
                        : 'bg-[#A5F387]'
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => openModule('agenda')}
                      className="flex w-full items-center gap-3 rounded-[18px] border-2 border-[#1F2937]/15 bg-white/75 px-2.5 py-2 text-left transition hover:bg-white"
                    >
                      <span className="flex min-w-[3.25rem] flex-col items-center justify-center rounded-[14px] border-2 border-[#1F2937]/10 bg-white px-2 py-1.5">
                        <span className="text-[9px] font-bold uppercase text-[#1F2937]/55">
                          {dayLabel}
                        </span>
                        <span className="text-sm font-bold tabular-nums text-[#1F2937]">
                          {a.time}
                        </span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[#1F2937]">{a.title}</p>
                        <span
                          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold capitalize text-[#1F2937] ${priorityTone}`}
                        >
                          {a.priority}
                        </span>
                      </div>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#1F2937]/15 bg-white text-[#1F2937]">
                        <ChevronRight size={14} strokeWidth={2.5} />
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>
      )
    }

    if (w.moduleId === 'habitos') {
      if (mod !== 'overview' && mod !== 'pendentes') {
        const data = squareData(w)
        return (
          <button
            type="button"
            onClick={() => openModule('habitos')}
            className={dashCardClass}
            style={dashSurface(color)}
          >
            <WidgetHeader Icon={data.Icon} page={label} label={modTitle} color={color} />
            <p className="px-4 pb-5 text-3xl font-bold text-[#1F2937]">{data.value}</p>
          </button>
        )
      }

      const list = mod === 'pendentes' ? pendingHabits.slice(0, 4) : habits.slice(0, 4)
      return (
        <div
          className="dash-hero overflow-hidden rounded-[28px]"
          style={dashSurface(color)}
        >
          <button type="button" onClick={() => openModule('habitos')} className="w-full text-left">
            <WidgetHeader
              Icon={Zap}
              page={mod === 'overview' ? undefined : label}
              label={mod === 'overview' ? label : modTitle}
              subtitle={`${habitsDone}/${habits.length} hoje · ${habitPct}%`}
              color={color}
              trailing={
                <span className="flex items-center gap-1 rounded-full border-2 border-[#1F2937] bg-[#FFF7ED] px-2 py-1 text-xs font-bold text-orange-600">
                  <Flame size={12} /> {bestStreak}
                </span>
              }
            />
          </button>
          <div className="space-y-2 px-3 pb-4">
            {list.map((h) => {
              const doneHabit = h.completedDates.includes(today)
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => toggleHabit(h.id)}
                  className={`flex w-full items-center gap-3 rounded-[18px] border-2 border-[#1F2937]/15 bg-white/75 px-3 py-2.5 text-left ${
                    doneHabit ? 'opacity-70' : ''
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#1F2937] ${
                      doneHabit ? 'bg-[#A5F387]' : 'bg-white'
                    }`}
                  >
                    {doneHabit && <Check size={14} strokeWidth={3} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-bold text-[#1F2937] ${
                        doneHabit ? 'line-through' : ''
                      }`}
                    >
                      {h.name}
                    </p>
                    <p className="text-[11px] capitalize text-[#1F2937]/60">
                      {h.period} · streak {h.streak}d
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )
    }

    if (w.moduleId === 'trabalho') {
      if (mod !== 'overview') {
        const data = squareData(w)
        return (
          <button
            type="button"
            onClick={() => openModule('trabalho')}
            className={`${dashCardClass} p-4`}
            style={dashSurface(color)}
          >
            <WidgetHeader Icon={data.Icon} page={label} label={modTitle} color={color} />
            <p className="mt-2 text-3xl font-bold text-[#1F2937]">{data.value}</p>
          </button>
        )
      }
      return (
        <button
          type="button"
          onClick={() => openModule('trabalho')}
          className={`${dashCardClass} p-4`}
          style={dashSurface(color)}
        >
          <WidgetHeader Icon={Briefcase} label={label} />
          <div className="mt-3 grid grid-cols-3 gap-2">
            <StatPill title="A fazer" value={String(todo)} bg="#FDA4AF" />
            <StatPill title="Andando" value={String(doing)} bg="#FFEA5D" />
            <StatPill title="Feito" value={String(done)} bg="#A5F387" />
          </div>
          <p className="mt-3 text-xs font-medium text-[#1F2937]/65">{pendingTasks} pendente(s)</p>
        </button>
      )
    }

    if (w.moduleId === 'metas') {
      if (mod === 'media') {
        return (
          <button
            type="button"
            onClick={() => openModule('metas')}
            className={dashCardClass}
            style={dashSurface(color)}
          >
            <WidgetHeader Icon={Target} page={label} label={modTitle} color={color} />
            <p className="px-4 pb-5 text-3xl font-bold text-[#1F2937]">{avgLifeGoal}%</p>
          </button>
        )
      }
      return (
        <button
          type="button"
          onClick={() => openModule('metas')}
          className={dashCardClass}
          style={dashSurface(color)}
        >
          <WidgetHeader Icon={Target} label={label} />
          <div className="space-y-2 px-4 pb-4">
            {lifeGoals.slice(0, 3).map((g) => (
              <div
                key={g.id}
                className="rounded-[16px] border-2 border-[#1F2937] bg-white/70 px-3 py-2"
              >
                <div className="flex justify-between text-sm font-bold text-[#1F2937]">
                  <span className="truncate">{g.title}</span>
                  <span>{g.progress}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/10">
                  <div className="h-full rounded-full bg-[#1F2937]" style={{ width: `${g.progress}%` }} />
                </div>
              </div>
            ))}
            <p className="text-xs font-medium text-[#1F2937]/65">Média geral: {avgLifeGoal}%</p>
          </div>
        </button>
      )
    }

    if (w.moduleId === 'estudos') {
      if (mod === 'media') {
        return (
          <button
            type="button"
            onClick={() => openModule('estudos')}
            className={dashCardClass}
            style={dashSurface(color)}
          >
            <WidgetHeader Icon={BookOpen} page={label} label={modTitle} color={color} />
            <p className="px-4 pb-5 text-3xl font-bold text-[#1F2937]">{avgSubject}%</p>
          </button>
        )
      }
      return (
        <button
          type="button"
          onClick={() => openModule('estudos')}
          className={dashCardClass}
          style={dashSurface(color)}
        >
          <WidgetHeader Icon={BookOpen} label={label} />
          <div className="space-y-2 px-4 pb-4">
            {subjects.slice(0, 3).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-[16px] border-2 border-[#1F2937] bg-white/70 px-3 py-2"
              >
                <span className="truncate text-sm font-bold text-[#1F2937]">{s.name}</span>
                <span className="text-sm font-bold text-[#1F2937]">{s.progress}%</span>
              </div>
            ))}
            <p className="text-xs font-medium text-[#1F2937]/65">Progresso médio: {avgSubject}%</p>
          </div>
        </button>
      )
    }

    if (w.moduleId === 'saude') {
      if (mod !== 'overview') {
        const data = squareData(w)
        return (
          <button
            type="button"
            onClick={() => openModule('saude')}
            className={dashCardClass}
            style={dashSurface(color)}
          >
            <WidgetHeader Icon={data.Icon} page={label} label={modTitle} color={color} />
            <p className="px-4 pb-5 text-3xl font-bold text-[#1F2937]">{data.value}</p>
          </button>
        )
      }
      return (
        <button
          type="button"
          onClick={() => openModule('saude')}
          className={dashCardClass}
          style={dashSurface(color)}
        >
          <WidgetHeader Icon={HeartPulse} label={label} />
          <div className="grid grid-cols-3 gap-2 px-4 pb-4">
            <StatPill title="Água" value={`${health.waterMl}ml`} icon={<Droplets size={12} />} />
            <StatPill title="Sono" value={`${health.sleepHours}h`} icon={<Moon size={12} />} />
            <StatPill title="Meta H2O" value={`${waterPct}%`} />
          </div>
          <p className="px-4 pb-4 text-xs font-medium text-[#1F2937]/65">
            Treino: {health.workout || 'não registrado'}
          </p>
        </button>
      )
    }

    if (w.moduleId === 'devpessoal') {
      if (mod === 'citacao') {
        return (
          <button
            type="button"
            onClick={() => openModule('devpessoal')}
            className={dashCardClass}
            style={dashSurface(color)}
          >
            <WidgetHeader Icon={Sparkles} page={label} label={modTitle} color={color} />
            <p className="px-4 pb-5 text-sm font-medium text-[#1F2937]">“{quoteOfDay()}”</p>
          </button>
        )
      }
      if (mod !== 'overview') {
        const data = squareData(w)
        return (
          <button
            type="button"
            onClick={() => openModule('devpessoal')}
            className={dashCardClass}
            style={dashSurface(color)}
          >
            <WidgetHeader Icon={data.Icon} page={label} label={modTitle} color={color} />
            <p className="px-4 pb-5 text-3xl font-bold text-[#1F2937]">{data.value}</p>
          </button>
        )
      }
      return (
        <button
          type="button"
          onClick={() => openModule('devpessoal')}
          className={dashCardClass}
          style={dashSurface(color)}
        >
          <WidgetHeader Icon={Sparkles} label={label} />
          <div className="space-y-2 px-4 pb-4">
            <p className="rounded-[16px] border-2 border-[#1F2937] bg-white/70 px-3 py-2 text-sm font-medium text-[#1F2937]">
              “{quoteOfDay()}”
            </p>
            <div className="grid grid-cols-2 gap-2">
              <StatPill title="Humor" value={moodEmoji} />
              <StatPill title="Lendo" value={reading ? reading.title.split(' ')[0] : '—'} />
            </div>
          </div>
        </button>
      )
    }

    if (w.moduleId === 'estatisticas') {
      if (mod !== 'overview') {
        const data = squareData(w)
        return (
          <button
            type="button"
            onClick={() => openModule('estatisticas')}
            className={dashCardClass}
            style={dashSurface(color)}
          >
            <WidgetHeader Icon={data.Icon} page={label} label={modTitle} color={color} />
            <p className="px-4 pb-5 text-3xl font-bold text-[#1F2937]">{data.value}</p>
          </button>
        )
      }
      return (
        <button
          type="button"
          onClick={() => openModule('estatisticas')}
          className={dashCardClass}
          style={dashSurface(color)}
        >
          <WidgetHeader Icon={BarChart3} label={label} />
          <div className="grid grid-cols-3 gap-2 px-4 pb-4">
            <StatPill title="Hábitos" value={`${habitPct}%`} />
            <StatPill title="Metas" value={`${avgLifeGoal}%`} />
            <StatPill title="Estudos" value={`${avgSubject}%`} />
          </div>
        </button>
      )
    }

    if (w.moduleId === 'conteudo') {
      if (mod === 'producao') {
        return (
          <button
            type="button"
            onClick={() => openModule('conteudo')}
            className={dashCardClass}
            style={dashSurface(color)}
          >
            <WidgetHeader Icon={Clapperboard} page={label} label={modTitle} color={color} />
            <p className="px-4 pb-5 text-3xl font-bold text-[#1F2937]">{contentOpen.length}</p>
          </button>
        )
      }
      return (
        <button
          type="button"
          onClick={() => openModule('conteudo')}
          className={dashCardClass}
          style={dashSurface(color)}
        >
          <WidgetHeader Icon={Clapperboard} label={label} />
          <div className="space-y-2 px-4 pb-4">
            {contentOpen.slice(0, 3).map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-[16px] border-2 border-[#1F2937] bg-white/70 px-3 py-2"
              >
                <span className="truncate text-sm font-bold text-[#1F2937]">{c.title}</span>
                <span className="text-[10px] font-bold uppercase text-[#1F2937]/70">{c.status}</span>
              </div>
            ))}
            <p className="text-xs font-medium text-[#1F2937]/65">{contentOpen.length} em produção</p>
          </div>
        </button>
      )
    }

    return (
      <button
        type="button"
        onClick={() => openModule(w.moduleId)}
        className={`${dashCardClass} p-4`}
        style={dashSurface(color)}
      >
        <WidgetHeader Icon={Icon} label={label} />
      </button>
    )
  }

  function renderSquare(w: DashboardWidgetConfig) {
    const color = moduleColor(w.moduleId)
    const pageName = moduleLabel(w.moduleId)
    const data = squareData(w)
    return (
      <button
        type="button"
        onClick={() => openModule(w.moduleId)}
        className="dash-tile pressable flex aspect-[1.05] w-full flex-col items-start justify-between bg-white p-4 text-left"
        style={dashSurface(color)}
      >
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={iconBadgeStyle(color)}
        >
          <data.Icon size={16} className="text-[#1F2937]" />
        </span>
        <div className="w-full min-w-0">
          <p className="truncate text-2xl font-bold leading-none tracking-tight text-[#1F2937] sm:text-3xl">
            {data.value}
          </p>
          <p className="mt-1 truncate text-xs font-medium text-[#1F2937]/50">{pageName}</p>
        </div>
      </button>
    )
  }

  const addModalities = addModule ? modalitiesFor(addModule) : []
  const reduceMotion = settings.reduceMotion
  const [selectedDay, setSelectedDay] = useState(today)

  const weekDaysDone = useMemo(
    () => week.filter((d) => habits.some((h) => h.completedDates.includes(d))).length,
    [week, habits],
  )
  const weekRingPct = Math.round((weekDaysDone / 7) * 100)
  const dayAppts = appointments
    .filter((a) => a.date === selectedDay)
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 1)

  const monthTitle = new Date(today + 'T12:00:00').toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  const enter = (delay: number) => widgetEnter(reduceMotion, delay)

  const openWidgetEditor = (tab: 'padrao' | 'personalizar' = 'personalizar') => {
    setWidgetTab(tab)
    setEditOpen(true)
  }

  // Renderers do grid custom — usados só se reativarmos a seção na home
  void layout
  void renderCard
  void renderSquare

  return (
    <div className="space-y-3.5 pb-6 md:space-y-5 md:pb-10">
      {/* 1. Hero */}
      <motion.button
        type="button"
        onClick={() => openModule('habitos')}
        {...enter(0)}
        className="pressable flex w-full items-center justify-between gap-3 rounded-[28px] bg-[#C8F560] px-5 py-6 text-left md:gap-4 md:rounded-[32px] md:px-6 md:py-7"
      >
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs text-[#1F2937]/65 md:text-sm">
            <Zap size={13} /> Rotina
          </p>
          <h2 className="mt-1 text-[1.45rem] font-bold leading-[1.15] tracking-tight text-[#1F2937] md:text-[1.65rem]">
            Seu progresso
            <br />
            da semana
          </h2>
        </div>
        <ProgressRing pct={weekRingPct} label={`${weekDaysDone} dias`} />
      </motion.button>

      {/* 2. Dois cards */}
      <motion.div {...enter(0.05)} className="grid grid-cols-2 gap-2.5 md:gap-3">
        <button
          type="button"
          onClick={() => openModule('habitos')}
          className="dash-tile pressable flex flex-col gap-4 bg-white p-3.5 text-left md:gap-5 md:p-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#1F2937]/50 md:text-sm">Hábitos</p>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFEDD5] md:h-8 md:w-8">
              <Zap size={14} className="text-orange-600" />
            </span>
          </div>
          <p className="text-[1.55rem] font-bold leading-none tracking-tight text-[#1F2937] md:text-[1.75rem]">
            {habitPct}
            <span className="text-base font-semibold text-[#1F2937]/40">%</span>
          </p>
        </button>
        <button
          type="button"
          onClick={() => openModule('saude')}
          className="dash-tile pressable flex flex-col gap-4 bg-white p-3.5 text-left md:gap-5 md:p-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#1F2937]/50 md:text-sm">Água</p>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#DBEAFE] md:h-8 md:w-8">
              <Droplets size={14} className="text-sky-600" />
            </span>
          </div>
          <p className="text-[1.55rem] font-bold leading-none tracking-tight text-[#1F2937] md:text-[1.75rem]">
            {Math.round(health.waterMl / 250)}
            <span className="ml-1 text-sm font-semibold text-[#1F2937]/40">copos</span>
          </p>
        </button>
      </motion.div>

      {/* 3. Semana */}
      <motion.div {...enter(0.08)}>
        <p className="mb-2 px-0.5 text-sm font-bold capitalize text-[var(--app-fg)] md:text-base">
          {monthTitle}
        </p>
        <div className="dash-tile flex gap-0.5 bg-white p-1.5 md:gap-1 md:p-2">
          {week.map((date) => {
            const d = new Date(date + 'T12:00:00')
            const active = date === selectedDay
            const weekday = d.toLocaleDateString('pt-BR', { weekday: 'narrow' })
            return (
              <button
                key={date}
                type="button"
                onClick={() => setSelectedDay(date)}
                className={`pressable flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 md:gap-1 md:py-2.5 ${
                  active ? 'bg-[#C8F560] text-[#1F2937]' : 'text-[#1F2937]/45'
                }`}
              >
                <span className="text-[9px] font-medium md:text-[10px]">{weekday}</span>
                <span className="text-xs font-bold md:text-sm">{d.getDate()}</span>
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* 4. Agenda do dia */}
      <motion.div {...enter(0.12)} className="space-y-2.5">
        {dayAppts.length === 0 ? (
          <button
            type="button"
            onClick={() => openModule('agenda')}
            className="dash-tile pressable flex w-full items-center gap-3 bg-white px-3.5 py-3.5 text-left md:px-4 md:py-4"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFEDD5] md:h-10 md:w-10">
              <Flame size={15} className="text-orange-600" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#1F2937]">Agenda livre</p>
              <p className="text-xs text-[#1F2937]/45">Toque para adicionar</p>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F1F5F9] md:h-9 md:w-9">
              <Plus size={15} />
            </span>
          </button>
        ) : (
          dayAppts.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => openModule('agenda')}
              className="dash-tile pressable flex w-full items-center gap-3 bg-white px-3.5 py-3.5 text-left md:px-4 md:py-4"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFEDD5] md:h-10 md:w-10">
                <Flame size={15} className="text-orange-600" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#1F2937]">{a.title}</p>
                <p className="text-xs tabular-nums text-[#1F2937]/45">{a.time}</p>
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F1F5F9] md:h-9 md:w-9">
                <ChevronRight size={15} />
              </span>
            </button>
          ))
        )}
      </motion.div>

      {/* Personalizar — fora da dobra principal */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={() => openWidgetEditor('personalizar')}
          className="pressable text-xs font-medium text-[var(--app-muted)] underline-offset-2 hover:underline"
        >
          Personalizar widgets
        </button>
      </div>

      <Modal open={editOpen} title="Widgets do dashboard" onClose={() => setEditOpen(false)}>
        <div className="mb-4 flex gap-2 rounded-[16px] border-2 border-[#1F2937] bg-slate-50 p-1">
          {(
            [
              { id: 'padrao' as const, label: 'Padrão' },
              { id: 'personalizar' as const, label: 'Personalizar' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setWidgetTab(tab.id)}
              className={`flex-1 rounded-[12px] py-2 text-sm font-bold transition ${
                widgetTab === tab.id
                  ? 'border-2 border-[#1F2937] bg-[#FFEA5D] text-[#1F2937] shadow-[2px_2px_0_#1F2937]'
                  : 'text-slate-500 hover:text-[#1F2937]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {widgetTab === 'padrao' && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">
              Escolha um layout pronto. Só entram módulos ativos na sidebar. Depois você pode
              personalizar se quiser.
            </p>
            {DASHBOARD_PRESETS.map((preset) => {
              const selected = activePreset === preset.id
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    applyDashboardPreset(
                      preset.id,
                      enabledModules.map((m) => m.id),
                    )
                    setActivePreset(preset.id)
                  }}
                  className={`flex w-full items-start gap-3 rounded-[20px] border-2 border-[#1F2937] p-4 text-left shadow-[2px_2px_0_#1F2937] pressable ${
                    selected ? 'bg-[#A5F387]' : 'bg-white'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[#1F2937] ${
                      selected ? 'bg-[#1F2937] text-white' : 'bg-white'
                    }`}
                  >
                    {selected && <Check size={14} strokeWidth={3} />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#1F2937]">{preset.label}</p>
                    <p className="mt-0.5 text-xs text-[#1F2937]/65">{preset.description}</p>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-[#1F2937]/45">
                      {preset.widgets.length} widgets ·{' '}
                      {preset.widgets.filter((w) => w.size === 'card').length} cards ·{' '}
                      {preset.widgets.filter((w) => w.size === 'square').length} ícones
                    </p>
                  </div>
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => setWidgetTab('personalizar')}
              className="w-full rounded-full border-2 border-dashed border-[#1F2937]/40 py-2.5 text-sm font-bold text-slate-500 hover:border-[#1F2937] hover:text-[#1F2937]"
            >
              Quero personalizar →
            </button>
          </div>
        )}

        {widgetTab === 'personalizar' && (
          <>
            <p className="mb-4 text-sm text-slate-500">
              Ajuste ordem, modalidade e tamanho. Ordem da lista = ordem no dashboard.
            </p>

            <div className="mb-5 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Seus widgets</p>
              {settings.dashboardWidgets.map((w, index) => {
                const color = moduleColor(w.moduleId)
                const mods = modalitiesFor(w.moduleId)
                const total = settings.dashboardWidgets.length
                return (
                  <div
                    key={w.id}
                    className="rounded-[20px] border-2 border-[#1F2937] bg-white p-3 shadow-[2px_2px_0_#1F2937]"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[#1F2937] bg-[#FFEA5D] text-xs font-bold text-[#1F2937]">
                          {index + 1}
                        </span>
                        <span
                          className="truncate rounded-full border-2 border-[#1F2937] px-2.5 py-0.5 text-xs font-bold ink-surface"
                          style={dashSurface(color)}
                        >
                          {moduleLabel(w.moduleId)}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => {
                            moveDashboardWidget(w.id, 'up')
                            setActivePreset(null)
                          }}
                          className="rounded-full border-2 border-[#1F2937] p-1.5 text-[#1F2937] hover:bg-slate-50 disabled:opacity-30"
                          aria-label="Subir"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={index === total - 1}
                          onClick={() => {
                            moveDashboardWidget(w.id, 'down')
                            setActivePreset(null)
                          }}
                          className="rounded-full border-2 border-[#1F2937] p-1.5 text-[#1F2937] hover:bg-slate-50 disabled:opacity-30"
                          aria-label="Descer"
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            removeDashboardWidget(w.id)
                            setActivePreset(null)
                          }}
                          className="rounded-full border-2 border-[#1F2937] p-1.5 text-rose-500 hover:bg-rose-50"
                          aria-label="Remover widget"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                      Modalidade
                    </label>
                    <select
                      value={w.modality}
                      onChange={(e) => {
                        updateDashboardWidget(w.id, { modality: e.target.value })
                        setActivePreset(null)
                      }}
                      className="mb-3 w-full rounded-[14px] border-2 border-[#1F2937] bg-white px-3 py-2 text-sm font-medium text-[#1F2937]"
                    >
                      {mods.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                        </option>
                      ))}
                    </select>

                    <div className="flex gap-2">
                      <SizeBtn
                        active={w.size === 'square'}
                        onClick={() => {
                          updateDashboardWidget(w.id, { size: 'square' })
                          setActivePreset(null)
                        }}
                        icon={<Square size={14} />}
                        label="Quadrado"
                      />
                      <SizeBtn
                        active={w.size === 'card'}
                        onClick={() => {
                          updateDashboardWidget(w.id, { size: 'card' })
                          setActivePreset(null)
                        }}
                        icon={<LayoutGrid size={14} />}
                        label="Card"
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="rounded-[20px] border-2 border-dashed border-[#1F2937] p-3">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                Adicionar widget
              </p>

              <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                Módulo
              </label>
              <select
                value={addModule}
                onChange={(e) => {
                  const id = e.target.value as DashboardWidgetId | ''
                  setAddModule(id)
                  if (id) {
                    const first = modalitiesFor(id)[0]?.id ?? 'overview'
                    setAddModality(first)
                  }
                }}
                className="mb-3 w-full rounded-[14px] border-2 border-[#1F2937] bg-white px-3 py-2 text-sm font-medium"
              >
                <option value="">Escolher módulo…</option>
                {availableModules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>

              {addModule && (
                <>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                    Modalidade
                  </label>
                  <select
                    value={addModality}
                    onChange={(e) => setAddModality(e.target.value)}
                    className="mb-3 w-full rounded-[14px] border-2 border-[#1F2937] bg-white px-3 py-2 text-sm font-medium"
                  >
                    {addModalities.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label} — {m.description}
                      </option>
                    ))}
                  </select>

                  <div className="mb-3 flex gap-2">
                    <SizeBtn
                      active={addSize === 'square'}
                      onClick={() => setAddSize('square')}
                      icon={<Square size={14} />}
                      label="Quadrado"
                    />
                    <SizeBtn
                      active={addSize === 'card'}
                      onClick={() => setAddSize('card')}
                      icon={<LayoutGrid size={14} />}
                      label="Card"
                    />
                  </div>
                </>
              )}

              <button
                type="button"
                disabled={!addModule}
                onClick={() => {
                  if (!addModule) return
                  addDashboardWidget(addModule, addModality, addSize)
                  setActivePreset(null)
                  setAddModule('')
                  setAddModality('overview')
                  setAddSize('square')
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#1F2937] bg-[#A5F387] py-2.5 text-sm font-bold text-[#1F2937] disabled:opacity-40"
              >
                <Plus size={16} /> Adicionar
              </button>
            </div>

            {availableModules.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">
                Ative módulos em Personalizar para usá-los como widgets.
              </p>
            )}
          </>
        )}

        <button
          onClick={() => setEditOpen(false)}
          className="mt-4 w-full rounded-full border-2 border-[#1F2937] bg-[#1F2937] py-3 text-sm font-bold text-white"
        >
          Pronto
        </button>
      </Modal>

      <Modal open={quickModal === 'despesa'} title="Nova despesa" onClose={() => setQuickModal(null)}>
        <QuickExpenseForm
          accounts={accounts}
          onSave={(tx) => {
            const id = uid('tx')
            setTransactions((list) => [{ ...tx, id }, ...list])
            setAccounts((accs) =>
              accs.map((a) => (a.id === tx.accountId ? { ...a, balance: a.balance - tx.amount } : a)),
            )
            addNotification(`Despesa registrada: ${tx.description}`)
            setQuickModal(null)
          }}
        />
      </Modal>

      <Modal open={quickModal === 'compromisso'} title="Novo compromisso" onClose={() => setQuickModal(null)}>
        <QuickApptForm
          onSave={(appt) => {
            setAppointments((list) => [{ ...appt, id: uid('appt') }, ...list])
            setQuickModal(null)
          }}
        />
      </Modal>

      <Modal open={quickModal === 'tarefa'} title="Nova tarefa" onClose={() => setQuickModal(null)}>
        <QuickTaskForm
          onSave={(task) => {
            setTasks((list) => [{ ...task, id: uid('task') }, ...list])
            setQuickModal(null)
          }}
        />
      </Modal>

      {/* FAB — acima da tab bar no mobile */}
      <div className="pointer-events-none fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-30 flex flex-col items-end gap-2 lg:bottom-8 lg:right-8">
        <AnimatePresence>
          {fabOpen && (
            <motion.div
              key="fab-menu"
              className="pointer-events-auto mb-1 flex flex-col items-end gap-2"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.15, ease: EASE_OUT }}
            >
              {(
                [
                  { id: 'despesa' as const, label: 'Despesa', bg: 'bg-[#FDA4AF]' },
                  { id: 'compromisso' as const, label: 'Compromisso', bg: 'bg-[#BAE6FD]' },
                  { id: 'tarefa' as const, label: 'Tarefa', bg: 'bg-[#A5F387]' },
                ] as const
              ).map((item, i) => (
                <motion.button
                  key={item.id}
                  type="button"
                  initial={
                    reduceMotion
                      ? false
                      : { opacity: 0, transform: 'translateY(8px) scale(0.95)' }
                  }
                  animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
                  exit={
                    reduceMotion
                      ? undefined
                      : { opacity: 0, transform: 'translateY(8px) scale(0.95)' }
                  }
                  whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                  transition={{
                    duration: 0.18,
                    ease: EASE_OUT,
                    delay: reduceMotion ? 0 : i * 0.04,
                  }}
                  onClick={() => {
                    setFabOpen(false)
                    setQuickModal(item.id)
                  }}
                  className={`flex min-h-11 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-[#1F2937] shadow-[0_8px_20px_rgba(15,23,42,0.08)] ${item.bg}`}
                >
                  {item.label}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          type="button"
          aria-label={fabOpen ? 'Fechar atalhos' : 'Atalhos rápidos'}
          onClick={() => setFabOpen((o) => !o)}
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#1C1917] text-white shadow-[var(--shadow-lift)]"
          animate={
            reduceMotion
              ? undefined
              : { transform: fabOpen ? 'rotate(45deg)' : 'rotate(0deg)' }
          }
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          transition={{ duration: 0.18, ease: EASE_OUT }}
        >
          {fabOpen ? <X size={24} /> : <Plus size={24} />}
        </motion.button>
      </div>
    </div>
  )
}

function QuickExpenseForm({
  accounts,
  onSave,
}: {
  accounts: { id: string; name: string }[]
  onSave: (tx: Omit<import('../types').Transaction, 'id'>) => void
}) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [category, setCategory] = useState<import('../types').TransactionCategory>('Outros')

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (!accountId || !amount) return
        onSave({
          type: 'despesa',
          category,
          description: description || 'Despesa rápida',
          amount: Number(amount),
          date: todayISO(),
          accountId,
        })
      }}
    >
      <input
        className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm"
        placeholder="Descrição"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        type="number"
        step="0.01"
        min="0"
        className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm"
        placeholder="Valor"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />
      <select
        className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm"
        value={category}
        onChange={(e) => setCategory(e.target.value as import('../types').TransactionCategory)}
      >
        {['Alimentação', 'Transporte', 'Lazer', 'Moradia', 'Educação', 'Investimentos', 'Fatura', 'Outros'].map(
          (c) => (
            <option key={c}>{c}</option>
          ),
        )}
      </select>
      <select
        className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm"
        value={accountId}
        onChange={(e) => setAccountId(e.target.value)}
        required
      >
        <option value="">Selecione a conta</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <button type="submit" className="w-full rounded-full bg-[#1F2937] py-3 text-sm font-bold text-white">
        Salvar
      </button>
    </form>
  )
}

function QuickApptForm({ onSave }: { onSave: (appt: Omit<import('../types').Appointment, 'id'>) => void }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(todayISO())
  const [time, setTime] = useState('09:00')

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        onSave({ title, date, time, priority: 'media', reminder: false })
      }}
    >
      <input
        className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm"
        placeholder="Título"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <input
          type="time"
          className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </div>
      <button type="submit" className="w-full rounded-full bg-[#1F2937] py-3 text-sm font-bold text-white">
        Salvar
      </button>
    </form>
  )
}

function QuickTaskForm({ onSave }: { onSave: (task: Omit<import('../types').WorkTask, 'id'>) => void }) {
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState(todayISO())

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        onSave({ title, client: '', status: 'todo', priority: 'media', dueDate })
      }}
    >
      <input
        className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm"
        placeholder="Título da tarefa"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <input
        type="date"
        className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />
      <button type="submit" className="w-full rounded-full bg-[#1F2937] py-3 text-sm font-bold text-white">
        Salvar
      </button>
    </form>
  )
}

function ProgressRing({ pct, label }: { pct: number; label: string }) {
  const size = 80
  const stroke = 8
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.min(100, Math.max(0, pct))
  const offset = c - (clamped / 100) * c
  return (
    <div className="relative h-20 w-20 shrink-0 md:h-[92px] md:w-[92px]">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(31,41,55,0.14)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#1F2937"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-[#1F2937] md:text-sm">{label}</span>
      </div>
    </div>
  )
}

function SizeBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-[14px] border-2 border-[#1F2937] py-2 text-xs font-bold transition ${
        active ? 'bg-[#1F2937] text-white' : 'bg-white text-[#1F2937]'
      }`}
    >
      {icon} {label}
    </button>
  )
}

function WidgetHeader({
  Icon,
  label,
  subtitle,
  page,
  color,
  trailing,
}: {
  Icon: LucideIcon
  label: string
  subtitle?: string
  /** Nome da página/módulo (ex.: Finanças) — aparece acima do título */
  page?: string
  color?: string
  trailing?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80"
          style={color ? { background: `color-mix(in srgb, ${color} 55%, white)` } : undefined}
        >
          <Icon size={18} className="text-[#1F2937]" />
        </span>
        <div className="min-w-0">
          {page && page !== label && (
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#1F2937]/50">
              {page}
            </p>
          )}
          <h3 className="truncate font-bold leading-tight text-[#1F2937]">{label}</h3>
          {subtitle && (
            <p className="mt-0.5 truncate text-xs font-medium text-[#1F2937]/60">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {trailing}
        <span className="flex items-center gap-0.5 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-[#1F2937]/70">
          Abrir
          <ChevronRight size={13} strokeWidth={2.5} />
        </span>
      </div>
    </div>
  )
}

function StatPill({
  title,
  value,
  bg = 'rgba(255,255,255,0.7)',
  icon,
}: {
  title: string
  value: string
  bg?: string
  icon?: ReactNode
}) {
  return (
    <div className="dash-hero-row px-3 py-2" style={{ background: bg }}>
      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#1F2937]/55">
        {icon} {title}
      </p>
      <p className="mt-0.5 truncate text-sm font-bold text-[#1F2937]">{value}</p>
    </div>
  )
}
