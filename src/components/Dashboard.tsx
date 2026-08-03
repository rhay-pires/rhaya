import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { motion } from 'motion/react'
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
  Settings2,
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

const MAX_SQUARES_PER_ROW = 3

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
  const isMinimal = settings.visualStyle === 'minimal'
  const isSoft = isGlass || isMinimal
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
  const theme = getModule('dashboard')?.color ?? '#D1C4FF'

  const surfaceStyle = (color: string): CSSProperties =>
    isGlass
      ? {
          background: `linear-gradient(160deg, ${color} 0%, color-mix(in srgb, ${color} 72%, white) 100%)`,
          ['--accent' as string]: color,
        }
      : isMinimal
        ? {
            background: `color-mix(in srgb, ${color} 82%, white)`,
            ['--accent' as string]: color,
          }
        : { background: color }

  const iconBadgeStyle = (color: string): CSSProperties => ({ background: color })

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
          className="w-full overflow-hidden rounded-[28px] border-2 border-[#1F2937] text-left shadow-[4px_4px_0_#1F2937] ink-surface transition hover:scale-[1.01]"
          style={surfaceStyle(color)}
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
          className="w-full overflow-hidden rounded-[28px] border-2 border-[#1F2937] text-left shadow-[4px_4px_0_#1F2937] ink-surface transition hover:scale-[1.01]"
          style={surfaceStyle(color)}
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
        const list = upcoming.slice(0, 3)
        return (
          <div
            className="overflow-hidden rounded-[28px] border-2 border-[#1F2937] shadow-[4px_4px_0_#1F2937] ink-surface"
            style={surfaceStyle(color)}
          >
            <button type="button" onClick={() => openModule('agenda')} className="w-full text-left">
              <WidgetHeader
                Icon={CalendarDays}
                page={label}
                label="Próximos"
                subtitle={
                  upcoming.length
                    ? `${upcoming.length} na fila`
                    : 'Nada agendado'
                }
                color={color}
              />
            </button>
            <div className="space-y-2 px-3 pb-4">
              {list.length === 0 ? (
                <p className="rounded-[18px] border-2 border-dashed border-[#1F2937]/20 bg-white/50 py-5 text-center text-sm text-[#1F2937]/50">
                  Agenda livre por agora
                </p>
              ) : (
                list.map((a) => {
                  const when = new Date(a.date + 'T12:00:00')
                  const dayLabel =
                    a.date === today
                      ? 'Hoje'
                      : when.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => openModule('agenda')}
                      className="flex w-full items-center gap-3 rounded-[18px] border-2 border-[#1F2937]/15 bg-white/75 px-2.5 py-2.5 text-left transition hover:bg-white"
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
                        {a.priority && (
                          <span className="mt-0.5 text-[10px] font-bold capitalize text-[#1F2937]/50">
                            {a.priority}
                          </span>
                        )}
                      </div>
                      <ChevronRight size={16} strokeWidth={2.5} className="shrink-0 text-[#1F2937]/35" />
                    </button>
                  )
                })
              )}
            </div>
          </div>
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
          className="overflow-hidden rounded-[28px] border-2 border-[#1F2937] shadow-[4px_4px_0_#1F2937] ink-surface"
          style={surfaceStyle(color)}
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
              <div className="flex justify-between gap-1 rounded-[22px] border-2 border-[#1F2937]/15 bg-white/70 p-2">
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
                        active
                          ? 'border-2 border-[#1F2937] shadow-[2px_2px_0_#1F2937]'
                          : 'bg-transparent'
                      }`}
                      style={active ? { background: color } : undefined}
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
            className="w-full overflow-hidden rounded-[28px] border-2 border-[#1F2937] text-left shadow-[4px_4px_0_#1F2937] ink-surface transition hover:scale-[1.01]"
            style={surfaceStyle(color)}
          >
            <WidgetHeader Icon={data.Icon} page={label} label={modTitle} color={color} />
            <p className="px-4 pb-5 text-3xl font-bold text-[#1F2937]">{data.value}</p>
          </button>
        )
      }

      const list = mod === 'pendentes' ? pendingHabits.slice(0, 4) : habits.slice(0, 4)
      return (
        <div
          className="overflow-hidden rounded-[28px] border-2 border-[#1F2937] shadow-[4px_4px_0_#1F2937] ink-surface"
          style={surfaceStyle(color)}
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
            className="w-full overflow-hidden rounded-[28px] border-2 border-[#1F2937] p-4 text-left shadow-[4px_4px_0_#1F2937] ink-surface transition hover:scale-[1.01]"
            style={surfaceStyle(color)}
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
          className="w-full overflow-hidden rounded-[28px] border-2 border-[#1F2937] p-4 text-left shadow-[4px_4px_0_#1F2937] ink-surface transition hover:scale-[1.01]"
          style={surfaceStyle(color)}
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
            className="w-full overflow-hidden rounded-[28px] border-2 border-[#1F2937] text-left shadow-[4px_4px_0_#1F2937] ink-surface transition hover:scale-[1.01]"
            style={surfaceStyle(color)}
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
          className="w-full overflow-hidden rounded-[28px] border-2 border-[#1F2937] text-left shadow-[4px_4px_0_#1F2937] ink-surface transition hover:scale-[1.01]"
          style={surfaceStyle(color)}
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
            className="w-full overflow-hidden rounded-[28px] border-2 border-[#1F2937] text-left shadow-[4px_4px_0_#1F2937] ink-surface transition hover:scale-[1.01]"
            style={surfaceStyle(color)}
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
          className="w-full overflow-hidden rounded-[28px] border-2 border-[#1F2937] text-left shadow-[4px_4px_0_#1F2937] ink-surface transition hover:scale-[1.01]"
          style={surfaceStyle(color)}
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
            className="w-full overflow-hidden rounded-[28px] border-2 border-[#1F2937] text-left shadow-[4px_4px_0_#1F2937] ink-surface transition hover:scale-[1.01]"
            style={surfaceStyle(color)}
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
          className="w-full overflow-hidden rounded-[28px] border-2 border-[#1F2937] text-left shadow-[4px_4px_0_#1F2937] ink-surface transition hover:scale-[1.01]"
          style={surfaceStyle(color)}
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
            className="w-full overflow-hidden rounded-[28px] border-2 border-[#1F2937] text-left shadow-[4px_4px_0_#1F2937] ink-surface transition hover:scale-[1.01]"
            style={surfaceStyle(color)}
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
            className="w-full overflow-hidden rounded-[28px] border-2 border-[#1F2937] text-left shadow-[4px_4px_0_#1F2937] ink-surface transition hover:scale-[1.01]"
            style={surfaceStyle(color)}
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
          className="w-full overflow-hidden rounded-[28px] border-2 border-[#1F2937] text-left shadow-[4px_4px_0_#1F2937] ink-surface transition hover:scale-[1.01]"
          style={surfaceStyle(color)}
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
            className="w-full overflow-hidden rounded-[28px] border-2 border-[#1F2937] text-left shadow-[4px_4px_0_#1F2937] ink-surface transition hover:scale-[1.01]"
            style={surfaceStyle(color)}
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
          className="w-full overflow-hidden rounded-[28px] border-2 border-[#1F2937] text-left shadow-[4px_4px_0_#1F2937] ink-surface transition hover:scale-[1.01]"
          style={surfaceStyle(color)}
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
            className="w-full overflow-hidden rounded-[28px] border-2 border-[#1F2937] text-left shadow-[4px_4px_0_#1F2937] ink-surface transition hover:scale-[1.01]"
            style={surfaceStyle(color)}
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
          className="w-full overflow-hidden rounded-[28px] border-2 border-[#1F2937] text-left shadow-[4px_4px_0_#1F2937] ink-surface transition hover:scale-[1.01]"
          style={surfaceStyle(color)}
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
        className="w-full rounded-[28px] border-2 border-[#1F2937] p-4 text-left shadow-[4px_4px_0_#1F2937] ink-surface"
        style={surfaceStyle(color)}
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
        className={
          isSoft
            ? `${isGlass ? 'glass-widget' : 'ink-surface'} flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-[24px] p-2 text-center transition hover:scale-[1.03] sm:gap-1.5 sm:p-3`
            : 'flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-[24px] border-2 border-[#1F2937] p-2 text-center shadow-[3px_3px_0_#1F2937] ink-surface transition hover:scale-[1.03] sm:gap-1.5 sm:p-3'
        }
        style={surfaceStyle(color)}
      >
        <p className="max-w-full truncate px-0.5 text-[9px] font-bold uppercase tracking-wide text-[#1F2937]/55 sm:text-[10px]">
          {pageName}
        </p>
        <span
          className={
            isSoft
              ? `${isGlass ? 'glass-accent' : 'soft-accent'} flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10`
              : 'flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px] border-2 border-[#1F2937] bg-white sm:h-10 sm:w-10 sm:rounded-[16px]'
          }
          style={iconBadgeStyle(color)}
        >
          <data.Icon size={18} className="text-[#1F2937]" />
        </span>
        <p className="max-w-full truncate px-0.5 text-sm font-bold leading-tight text-[#1F2937] sm:text-lg">
          {data.value}
        </p>
        <p className="max-w-full truncate text-[9px] font-bold uppercase tracking-wide text-[#1F2937]/65 sm:text-[10px]">
          {data.label}
        </p>
      </button>
    )
  }

  const addModalities = addModule ? modalitiesFor(addModule) : []

  return (
    <div className="pb-8">
      <div className="mb-4 flex items-end justify-between gap-3 md:mb-5">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {new Date(today + 'T12:00:00').toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
            })}
          </p>
          <h2 className="mt-0.5 text-3xl font-bold tracking-tight text-[var(--app-fg)]">Seu dia</h2>
          <p className="mt-1 text-xs text-slate-400">O essencial do dia, no seu jeito</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setWidgetTab('padrao')
              setEditOpen(true)
            }}
            className={
              isGlass
                ? 'glass-chip flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-[var(--app-fg)] transition hover:scale-105'
                : isMinimal
                  ? 'soft-chip flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-[var(--app-fg)] transition hover:scale-105'
                  : 'flex items-center gap-1.5 rounded-full border-2 border-[#1F2937] bg-white px-3 py-1.5 text-xs font-bold text-[#1F2937] shadow-[2px_2px_0_#1F2937] hover:scale-105'
            }
          >
            <Settings2 size={14} /> Widgets
          </button>
          <span
            className={
              isGlass
                ? 'glass-chip rounded-full px-3 py-1.5 text-xs font-bold'
                : isMinimal
                  ? 'soft-chip rounded-full px-3 py-1.5 text-xs font-bold'
                  : 'rounded-full border-2 border-[#1F2937] px-3 py-1.5 text-xs font-bold shadow-[2px_2px_0_#1F2937] ink-surface'
            }
            style={
              isSoft
                ? isMinimal
                  ? { color: '#ea580c' }
                  : { boxShadow: `0 4px 16px ${theme}66` }
                : { background: theme }
            }
          >
            🔥 {bestStreak}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {layout.map((group, gi) => {
          if (group.type === 'squares') {
            return (
              <motion.div
                key={`sq-${gi}-${group.items.map((i) => i.id).join('-')}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gi * 0.04 }}
                className="grid grid-cols-3 gap-2 sm:gap-3"
              >
                {group.items.map((w) => (
                  <div key={w.id} className="min-w-0">
                    {renderSquare(w)}
                  </div>
                ))}
              </motion.div>
            )
          }
          return (
            <motion.div
              key={group.item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.04 }}
            >
              {renderCard(group.item)}
            </motion.div>
          )
        })}
      </div>

      {activeWidgets.length === 0 && (
        <div className="rounded-[28px] border-2 border-dashed border-slate-300 py-12 text-center">
          <p className="text-sm text-slate-400">Nenhum widget ativo</p>
          <button
            onClick={() => setEditOpen(true)}
            className="mt-3 rounded-full border-2 border-[#1F2937] bg-[#FFEA5D] px-4 py-2 text-sm font-bold text-[#1F2937]"
          >
            Montar dashboard
          </button>
        </div>
      )}

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
                  className={`flex w-full items-start gap-3 rounded-[20px] border-2 border-[#1F2937] p-4 text-left shadow-[2px_2px_0_#1F2937] transition hover:scale-[1.01] ${
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
                          style={surfaceStyle(color)}
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

      {/* FAB — atalhos rápidos sem poluir a home */}
      <div className="pointer-events-none fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2 md:bottom-8 md:right-8">
        {fabOpen && (
          <div className="pointer-events-auto mb-1 flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={() => {
                setFabOpen(false)
                setQuickModal('despesa')
              }}
              className="flex min-h-11 items-center gap-2 rounded-full border-2 border-[#1F2937] bg-[#FDA4AF] px-4 py-2.5 text-sm font-bold text-[#1F2937] shadow-[3px_3px_0_#1F2937]"
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => {
                setFabOpen(false)
                setQuickModal('compromisso')
              }}
              className="flex min-h-11 items-center gap-2 rounded-full border-2 border-[#1F2937] bg-[#BAE6FD] px-4 py-2.5 text-sm font-bold text-[#1F2937] shadow-[3px_3px_0_#1F2937]"
            >
              Compromisso
            </button>
            <button
              type="button"
              onClick={() => {
                setFabOpen(false)
                setQuickModal('tarefa')
              }}
              className="flex min-h-11 items-center gap-2 rounded-full border-2 border-[#1F2937] bg-[#A5F387] px-4 py-2.5 text-sm font-bold text-[#1F2937] shadow-[3px_3px_0_#1F2937]"
            >
              Tarefa
            </button>
          </div>
        )}
        <button
          type="button"
          aria-label={fabOpen ? 'Fechar atalhos' : 'Atalhos rápidos'}
          onClick={() => setFabOpen((o) => !o)}
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#1F2937] bg-[#1F2937] text-white shadow-[4px_4px_0_#FFEA5D] transition hover:scale-105"
        >
          {fabOpen ? <X size={24} /> : <Plus size={24} />}
        </button>
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
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border-2 border-[#1F2937] bg-white"
          style={color ? { background: color } : undefined}
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
        <span className="soft-open flex items-center gap-0.5 rounded-full border-2 border-[#1F2937] bg-white/85 px-2.5 py-1 text-[11px] font-bold text-[#1F2937] shadow-[2px_2px_0_#1F2937]">
          Abrir
          <ChevronRight size={13} strokeWidth={3} />
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
    <div className="rounded-[16px] border-2 border-[#1F2937] px-3 py-2" style={{ background: bg }}>
      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#1F2937]/65">
        {icon} {title}
      </p>
      <p className="mt-0.5 truncate text-sm font-bold text-[#1F2937]">{value}</p>
    </div>
  )
}
