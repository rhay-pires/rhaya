import { useMemo } from 'react'
import { motion } from 'motion/react'
import {
  Bell,
  Briefcase,
  CalendarDays,
  Check,
  Droplets,
  Flame,
  Sparkles,
  Target,
  Wallet,
  Zap,
} from 'lucide-react'
import { useApp } from '../store/AppStore'
import { useCustomization } from '../store/CustomizationStore'
import { formatBRLHidden, isSameMonth, quoteOfDay, todayISO } from '../utils/format'

function weekAround(center: string) {
  const base = new Date(center + 'T12:00:00')
  const start = new Date(base)
  start.setDate(base.getDate() - base.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

const HABIT_COLORS = ['#D1C4FF', '#FFEA5D', '#70CFFF', '#A5F387', '#F9A8D4', '#FDBA74']
const EVENT_COLORS = ['#FFEA5D', '#70CFFF', '#A5F387', '#D1C4FF', '#FDA4AF']

export function Dashboard() {
  const {
    accounts,
    transactions,
    habits,
    tasks,
    appointments,
    balanceVisible,
    year,
    month,
    toggleHabit,
    health,
  } = useApp()
  const { getModule } = useCustomization()
  const theme = getModule('dashboard')?.color ?? '#D1C4FF'

  const today = todayISO()
  const week = useMemo(() => weekAround(today), [today])
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)
  const monthTx = transactions.filter((t) => isSameMonth(t.date, year, month))
  const receitas = monthTx.filter((t) => t.type === 'receita').reduce((s, t) => s + t.amount, 0)
  const despesas = monthTx.filter((t) => t.type === 'despesa').reduce((s, t) => s + t.amount, 0)
  const habitsDone = habits.filter((h) => h.completedDates.includes(today)).length
  const habitPct = habits.length ? Math.round((habitsDone / habits.length) * 100) : 0
  const pendingTasks = tasks.filter((t) => t.status !== 'done').length
  const doneTasks = tasks.filter((t) => t.status === 'done').length
  const todayAppts = appointments
    .filter((a) => a.date === today)
    .sort((a, b) => a.time.localeCompare(b.time))
  const upcoming = appointments
    .filter((a) => a.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 4)
  const bestStreak = Math.max(0, ...habits.map((h) => h.streak))
  const waterPct = Math.min(100, Math.round((health.waterMl / 2000) * 100))
  const quote = quoteOfDay()

  const metrics = [
    {
      label: 'Saldo',
      value: formatBRLHidden(totalBalance, balanceVisible),
      sub: `+${formatBRLHidden(receitas - despesas, balanceVisible)} mês`,
      color: '#A5F387',
      fill: Math.min(100, Math.max(12, 55)),
      Icon: Wallet,
    },
    {
      label: 'Hábitos',
      value: `${habitsDone}/${habits.length}`,
      sub: `${habitPct}% hoje`,
      color: '#FFEA5D',
      fill: habitPct || 8,
      Icon: Zap,
    },
    {
      label: 'Tarefas',
      value: `${pendingTasks}`,
      sub: `${doneTasks} feitas`,
      color: '#70CFFF',
      fill: tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 8,
      Icon: Briefcase,
    },
    {
      label: 'Água',
      value: `${health.waterMl}`,
      sub: 'ml / 2L',
      color: '#D1C4FF',
      fill: waterPct || 8,
      Icon: Droplets,
    },
  ]

  return (
    <div className="pb-8">
      {/* Mobile-first greeting strip */}
      <div className="mb-4 flex items-end justify-between gap-3 md:mb-5">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {new Date(today + 'T12:00:00').toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
            })}
          </p>
          <h2 className="mt-0.5 text-3xl font-bold tracking-tight text-[#1F2937]">
            Seu dia
          </h2>
        </div>
        <span
          className="rounded-full border-2 border-[#1F2937] px-3 py-1.5 text-xs font-bold shadow-[2px_2px_0_#1F2937]"
          style={{ background: theme }}
        >
          🔥 {bestStreak} streak
        </span>
      </div>

      {/* Week calendar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 overflow-hidden rounded-[28px] border-2 border-[#1F2937] bg-white p-3 shadow-[4px_4px_0_#1F2937]"
      >
        <div className="flex justify-between gap-1">
          {week.map((date) => {
            const d = new Date(date + 'T12:00:00')
            const active = date === today
            const hasAppt = appointments.some((a) => a.date === date)
            const habitCount = habits.filter((h) => h.completedDates.includes(date)).length
            return (
              <div
                key={date}
                className="flex flex-1 flex-col items-center gap-1.5 rounded-[20px] px-1 py-1.5"
              >
                <span className={`text-[10px] font-bold uppercase ${active ? 'text-[#1F2937]' : 'text-slate-400'}`}>
                  {d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                </span>
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition ${
                    active
                      ? 'border-2 border-[#1F2937] text-[#1F2937] shadow-[2px_2px_0_#1F2937]'
                      : 'bg-[#F8FAFC] text-slate-600'
                  }`}
                  style={active ? { background: theme } : undefined}
                >
                  {d.getDate()}
                </span>
                <span className="flex h-1.5 gap-0.5">
                  {hasAppt && <span className="h-1.5 w-1.5 rounded-full bg-[#70CFFF]" />}
                  {habitCount > 0 && <span className="h-1.5 w-1.5 rounded-full bg-[#A5F387]" />}
                </span>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Soft reminder / quote card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="relative mb-4 overflow-hidden rounded-[32px] border-2 border-[#1F2937] p-5 shadow-[5px_5px_0_#1F2937]"
        style={{ background: theme }}
      >
        <div className="pointer-events-none absolute -right-2 -top-2 text-7xl opacity-30">💫</div>
        <div className="relative z-10 flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border-2 border-[#1F2937] bg-white text-3xl shadow-[3px_3px_0_#1F2937]">
            ✨
          </div>
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#1F2937] bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1F2937]">
              <Sparkles size={10} /> Frase do dia
            </span>
            <p className="mt-2 text-base font-bold leading-snug text-[#1F2937] md:text-lg">
              {quote}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border-2 border-[#1F2937] bg-[#FFEA5D] px-3 py-1 text-xs font-bold shadow-[2px_2px_0_#1F2937]">
                {habitsDone}/{habits.length} hábitos
              </span>
              <span className="rounded-full border-2 border-[#1F2937] bg-white px-3 py-1 text-xs font-bold shadow-[2px_2px_0_#1F2937]">
                {todayAppts.length} eventos
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Vertical colorful metric cards — like macros */}
      <div className="mb-4">
        <h3 className="mb-3 text-lg font-bold text-[#1F2937]">Resumo rápido</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {metrics.map((m, i) => {
            const Icon = m.Icon
            return (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 + i * 0.04 }}
                className="relative flex min-h-[150px] flex-col overflow-hidden rounded-[28px] border-2 border-[#1F2937] shadow-[4px_4px_0_#1F2937]"
                style={{ background: m.color }}
              >
                <div className="relative z-10 flex flex-1 flex-col justify-between p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#1F2937]/70">
                      {m.label}
                    </p>
                    <div className="rounded-full border-2 border-[#1F2937] bg-white/80 p-1.5">
                      <Icon size={12} className="text-[#1F2937]" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xl font-bold leading-tight text-[#1F2937] sm:text-2xl">
                      {m.value}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-[#1F2937]/65">{m.sub}</p>
                  </div>
                </div>
                {/* bottom fill bar like progress */}
                <div className="h-2 w-full bg-black/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${m.fill}%` }}
                    transition={{ delay: 0.2 + i * 0.05, duration: 0.5 }}
                    className="h-full bg-[#1F2937]/35"
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Habits timeline */}
      <div className="mb-4 rounded-[32px] border-2 border-[#1F2937] bg-white p-4 shadow-[4px_4px_0_#1F2937] md:p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-[14px] border-2 border-[#1F2937] bg-[#FFEA5D]">
              <Target size={16} />
            </div>
            <div>
              <h3 className="font-bold text-[#1F2937]">Rotina de hoje</h3>
              <p className="text-xs text-slate-400">{habitPct}% concluído</p>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-full border-2 border-[#1F2937] bg-[#FFF7ED] px-2.5 py-1 text-xs font-bold text-orange-600">
            <Flame size={12} /> {bestStreak}
          </div>
        </div>

        <div className="relative space-y-2.5">
          <div className="absolute bottom-5 left-[15px] top-5 w-px border-l-2 border-dashed border-[#C4B5FD]" />
          {habits.slice(0, 5).map((h, index) => {
            const done = h.completedDates.includes(today)
            const color = HABIT_COLORS[index % HABIT_COLORS.length]
            return (
              <motion.button
                key={h.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => toggleHabit(h.id)}
                className="relative flex w-full items-center gap-3 text-left"
              >
                <span
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#1F2937] transition ${
                    done ? 'bg-[#A5F387]' : 'bg-white'
                  }`}
                >
                  {done && <Check size={14} strokeWidth={3} />}
                </span>
                <div
                  className={`flex flex-1 items-center gap-3 rounded-[22px] border-2 border-[#1F2937] p-3 shadow-[3px_3px_0_#1F2937] transition hover:scale-[1.01] ${
                    done ? 'opacity-70' : ''
                  }`}
                  style={{ background: done ? '#F8FAFC' : color }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border-2 border-[#1F2937] bg-white text-sm font-bold">
                    {['🧘', '💧', '📖', '🏋️', '✍️'][index % 5]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-bold text-[#1F2937] ${done ? 'line-through' : ''}`}>
                      {h.name}
                    </p>
                    <p className="text-[11px] font-medium capitalize text-[#1F2937]/60">
                      {h.period} · streak {h.streak}d
                    </p>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Schedule colorful cards */}
      <div className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-[14px] border-2 border-[#1F2937] bg-[#70CFFF]">
              <CalendarDays size={16} />
            </div>
            <h3 className="font-bold text-[#1F2937]">Agenda</h3>
          </div>
          <span className="rounded-full border-2 border-[#1F2937] bg-white px-2.5 py-1 text-[10px] font-bold">
            próximos
          </span>
        </div>

        {upcoming.length === 0 ? (
          <div className="rounded-[28px] border-2 border-dashed border-slate-300 py-10 text-center text-sm text-slate-400">
            Sem compromissos por enquanto
          </div>
        ) : (
          <div className="space-y-2.5">
            {upcoming.map((a, i) => {
              const isToday = a.date === today
              const color = EVENT_COLORS[i % EVENT_COLORS.length]
              const priorityDot =
                a.priority === 'alta' ? '#FB7185' : a.priority === 'media' ? '#FBBF24' : '#34D399'
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="overflow-hidden rounded-[26px] border-2 border-[#1F2937] shadow-[3px_3px_0_#1F2937]"
                  style={{ background: color }}
                >
                  <div className="flex items-stretch">
                    <div className="flex w-16 shrink-0 flex-col items-center justify-center border-r-2 border-[#1F2937]/15 bg-white/40 px-2 py-3">
                      <span className="text-lg font-bold text-[#1F2937]">{a.time.slice(0, 5)}</span>
                      <span className="text-[10px] font-bold uppercase text-[#1F2937]/60">
                        {isToday
                          ? 'hoje'
                          : new Date(a.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                            })}
                      </span>
                    </div>
                    <div className="flex flex-1 items-center justify-between gap-2 p-3.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#1F2937]">{a.title}</p>
                        <p className="mt-0.5 text-[11px] font-medium capitalize text-[#1F2937]/65">
                          {a.priority}
                          {a.location ? ` · ${a.location}` : ''}
                          {a.reminder ? ' · 🔔' : ''}
                        </p>
                      </div>
                      <span
                        className="h-3 w-3 shrink-0 rounded-full border-2 border-[#1F2937]"
                        style={{ background: priorityDot }}
                      />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Work progress pills */}
      <div className="rounded-[32px] border-2 border-[#1F2937] bg-white p-4 shadow-[4px_4px_0_#1F2937] md:p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-[14px] border-2 border-[#1F2937] bg-[#FDBA74]">
            <Briefcase size={16} />
          </div>
          <h3 className="font-bold text-[#1F2937]">Trabalho</h3>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {(
            [
              { status: 'todo' as const, label: 'A fazer', color: '#FDA4AF' },
              { status: 'doing' as const, label: 'Andando', color: '#FFEA5D' },
              { status: 'done' as const, label: 'Feito', color: '#A5F387' },
            ]
          ).map((col) => {
            const count = tasks.filter((t) => t.status === col.status).length
            return (
              <div
                key={col.status}
                className="rounded-[22px] border-2 border-[#1F2937] p-3 text-center shadow-[3px_3px_0_#1F2937]"
                style={{ background: col.color }}
              >
                <p className="text-2xl font-bold text-[#1F2937]">{count}</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1F2937]/70">
                  {col.label}
                </p>
              </div>
            )
          })}
        </div>

        {pendingTasks > 0 && (
          <div className="mt-3 flex items-center gap-3 rounded-[20px] border-2 border-[#1F2937] bg-[#FFF7ED] px-3 py-2.5">
            <Bell size={16} className="shrink-0 text-orange-500" />
            <p className="text-xs font-semibold text-[#1F2937]">
              Você tem <span className="font-bold">{pendingTasks} tarefas</span> abertas — foque nas de prioridade alta.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
