import { useMemo, useState } from 'react'
import {
  BookOpen,
  Brain,
  Check,
  Droplets,
  Dumbbell,
  Flame,
  PenLine,
  Plus,
  Sparkles,
  Sunrise,
  Sunset,
  Moon,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { VIEW_OPTIONS } from '../data/modules'
import { useModuleStyle } from '../hooks/useModuleStyle'
import { useApp } from '../store/AppStore'
import { useCustomization } from '../store/CustomizationStore'
import type { Habit, ViewMode } from '../types'
import { todayISO, uid } from '../utils/format'
import { ModuleHero } from './ModuleHero'
import { Modal } from './ui'
import { ViewSwitcher } from './ViewSwitcher'

const periodMeta = {
  manha: { label: 'Manhã', Icon: Sunrise, tint: 'bg-[#EDE9FE] text-[#6C4BFF]', soft: 'bg-[#F5F3FF]' },
  tarde: { label: 'Tarde', Icon: Sunset, tint: 'bg-[#DBEAFE] text-[#3B82F6]', soft: 'bg-[#EFF6FF]' },
  noite: { label: 'Noite', Icon: Moon, tint: 'bg-[#FCE7F3] text-[#DB2777]', soft: 'bg-[#FDF2F8]' },
}

const habitIcons = [Brain, Droplets, BookOpen, Dumbbell, PenLine, Sparkles]

function habitIcon(index: number) {
  return habitIcons[index % habitIcons.length]
}

function durationLabel(period: Habit['period']) {
  if (period === 'manha') return '10–20 min'
  if (period === 'tarde') return '20–40 min'
  return '10–15 min'
}

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

function monthDays(year: number, month: number) {
  const total = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: total }, (_, i) => {
    const day = i + 1
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  })
}

function intensityColor(count: number, max: number) {
  if (count <= 0) return 'bg-white border border-[#EDE9FE] text-slate-400'
  const ratio = count / Math.max(max, 1)
  if (ratio >= 0.85) return 'bg-[#6C4BFF] text-white shadow-[0_8px_20px_rgba(108,75,255,0.35)]'
  if (ratio >= 0.6) return 'bg-[#A78BFA] text-white'
  if (ratio >= 0.35) return 'bg-[#C4B5FD] text-[#4C1D95]'
  return 'bg-[#EDE9FE] text-[#6C4BFF]'
}

export function Habitos() {
  const { habits, setHabits, toggleHabit } = useApp()
  const { getModule, setModuleView } = useCustomization()
  const { accent, primaryBtn, pageVars } = useModuleStyle('habitos', '#FFEA5D')
  const mod = getModule('habitos')
  const view = (mod?.viewMode === 'insights' ? 'insights' : 'rotina') as 'rotina' | 'insights'
  const [selectedDate, setSelectedDate] = useState(todayISO())
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [period, setPeriod] = useState<'manha' | 'tarde' | 'noite'>('manha')

  const setView = (v: ViewMode) => setModuleView('habitos', v)

  const week = useMemo(() => weekAround(selectedDate), [selectedDate])
  const selected = new Date(selectedDate + 'T12:00:00')
  const heatmap = useMemo(
    () => monthDays(selected.getFullYear(), selected.getMonth()),
    [selectedDate],
  )

  const done = habits.filter((h) => h.completedDates.includes(selectedDate)).length
  const pct = habits.length ? Math.round((done / habits.length) * 100) : 0
  const bestStreak = Math.max(0, ...habits.map((h) => h.streak))

  const ordered = useMemo(() => {
    const order = { manha: 0, tarde: 1, noite: 2 }
    return [...habits].sort((a, b) => order[a.period] - order[b.period])
  }, [habits])

  const completionByDay = useMemo(() => {
    const map: Record<string, number> = {}
    heatmap.forEach((date) => {
      map[date] = habits.filter((h) => h.completedDates.includes(date)).length
    })
    return map
  }, [habits, heatmap])

  const maxDay = Math.max(1, ...Object.values(completionByDay))

  return (
    <div style={pageVars} className="soft-habitos relative mx-auto max-w-3xl space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-wide" style={{ color: accent }}>
            {selected.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
          </p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-[var(--app-fg)] md:text-4xl">
            Sua rotina
          </h2>
          <p className="mt-1 text-sm text-slate-500">Marque, construa streaks e acompanhe o ritmo.</p>
        </div>
        <ViewSwitcher
          options={VIEW_OPTIONS.habitos}
          value={view}
          onChange={setView}
          accent={accent}
        />
      </div>

      <ModuleHero
        moduleId="habitos"
        fallback="#FFEA5D"
        title="Conclusão do dia"
        value={`${pct}%`}
        subtitle={`${done}/${habits.length} hábitos · streak ${bestStreak}`}
      />

      <AnimatePresence mode="wait">
        {view === 'rotina' ? (
          <motion.div
            key="rotina"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            {/* Week strip */}
            <div className="rounded-[32px] bg-white p-4 shadow-[0_10px_40px_rgba(108,75,255,0.06)]">
              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
                {week.map((date) => {
                  const d = new Date(date + 'T12:00:00')
                  const active = date === selectedDate
                  const isToday = date === todayISO()
                  const dayDone = habits.filter((h) => h.completedDates.includes(date)).length
                  return (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`flex min-w-[52px] flex-col items-center gap-2 rounded-[24px] px-2 py-2 transition hover:scale-105 ${
                        active ? '' : 'hover:bg-[#F5F3FF]'
                      }`}
                    >
                      <span className={`text-xs font-medium ${active ? 'text-[#6C4BFF]' : 'text-slate-400'}`}>
                        {d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                      </span>
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold transition ${
                          active
                            ? 'bg-[#2E1065] text-white shadow-[0_10px_24px_rgba(46,16,101,0.35)]'
                            : isToday
                              ? 'bg-[#EDE9FE] text-[#6C4BFF]'
                              : 'bg-[#F8FAFC] text-slate-600'
                        }`}
                      >
                        {d.getDate()}
                      </span>
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          dayDone > 0 ? 'bg-[#6C4BFF]' : 'bg-transparent'
                        }`}
                      />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Soft feature card */}
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#EDE9FE] via-[#F5F3FF] to-[#DBEAFE] p-5 md:p-6">
              <div className="pointer-events-none absolute -right-4 -top-4 h-28 w-28 rounded-full bg-white/40 blur-2xl" />
              <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-white/80 text-3xl shadow-sm">
                    ✨
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#6C4BFF]">
                      Progresso do dia
                    </p>
                    <p className="mt-1 text-2xl font-bold text-[#1E1B4B]">
                      {done} de {habits.length} hábitos
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {pct >= 80
                        ? 'Você está arrasando hoje!'
                        : pct >= 40
                          ? 'Bom ritmo — continue assim.'
                          : 'Um check de cada vez. Você consegue.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-[#6C4BFF] shadow-sm">
                    <Flame className="mr-1 inline" size={14} /> {bestStreak} dias
                  </div>
                  <div className="relative h-14 w-14">
                    <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#fff" strokeWidth="3" />
                      <circle
                        cx="18"
                        cy="18"
                        r="15"
                        fill="none"
                        stroke="#6C4BFF"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${pct} 100`}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#2E1065]">
                      {pct}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline list */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#1E1B4B]">Rotina diária</h3>
                <button
                  onClick={() => setSelectedDate(todayISO())}
                  className="text-sm font-medium text-[#6C4BFF] hover:underline"
                >
                  Ir para hoje
                </button>
              </div>

              <div className="relative space-y-3">
                <div className="absolute bottom-6 left-[27px] top-6 w-px border-l-2 border-dashed border-[#DDD6FE]" />

                {ordered.map((h, index) => {
                  const checked = h.completedDates.includes(selectedDate)
                  const meta = periodMeta[h.period]
                  const Icon = habitIcon(index)
                  const PeriodIcon = meta.Icon
                  const isSelectedDayToday = selectedDate === todayISO()

                  return (
                    <motion.div
                      key={h.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="relative flex items-stretch gap-3"
                    >
                      <button
                        onClick={() => {
                          if (isSelectedDayToday) toggleHabit(h.id)
                          else {
                            // allow toggling any selected day by manually updating
                            setHabits((list) =>
                              list.map((item) => {
                                if (item.id !== h.id) return item
                                const has = item.completedDates.includes(selectedDate)
                                return {
                                  ...item,
                                  completedDates: has
                                    ? item.completedDates.filter((d) => d !== selectedDate)
                                    : [...item.completedDates, selectedDate],
                                  streak: has
                                    ? Math.max(0, item.streak - (selectedDate === todayISO() ? 1 : 0))
                                    : item.streak + (selectedDate === todayISO() ? 1 : 0),
                                }
                              }),
                            )
                          }
                        }}
                        className={`relative z-10 mt-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition hover:scale-110 ${
                          checked
                            ? 'border-[#6C4BFF] bg-[#6C4BFF] text-white shadow-[0_0_0_4px_rgba(108,75,255,0.15)]'
                            : 'border-[#C4B5FD] bg-white text-transparent'
                        }`}
                        aria-label={checked ? 'Desmarcar hábito' : 'Concluir hábito'}
                      >
                        <Check size={14} strokeWidth={3} />
                      </button>

                      <button
                        onClick={() => {
                          if (isSelectedDayToday) toggleHabit(h.id)
                        }}
                        className={`flex flex-1 items-center gap-3 rounded-[28px] bg-white p-3.5 text-left shadow-[0_8px_30px_rgba(108,75,255,0.06)] transition hover:scale-[1.01] ${
                          checked ? 'ring-2 ring-[#DDD6FE]' : ''
                        }`}
                      >
                        <div className={`flex h-12 w-12 items-center justify-center rounded-[18px] ${meta.tint}`}>
                          <Icon size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-sm font-bold text-[#1E1B4B] ${checked ? 'line-through opacity-60' : ''}`}>
                            {h.name}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            <PeriodIcon size={11} className="mr-1 inline" />
                            {meta.label} · 🔥 {h.streak} streak
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-[#F5F3FF] px-3 py-1 text-xs font-semibold text-[#6C4BFF]">
                          {durationLabel(h.period)}
                        </span>
                      </button>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            <div className="rounded-[32px] bg-white p-5 shadow-[0_10px_40px_rgba(108,75,255,0.06)] md:p-6">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#1E1B4B]">Seu progresso</h3>
                <span className="rounded-full bg-[#EDE9FE] px-3 py-1 text-xs font-semibold text-[#6C4BFF]">
                  {selected.toLocaleDateString('pt-BR', { month: 'long' })}
                </span>
              </div>

              {/* Pill bars */}
              <div className="mb-6 flex h-56 items-end justify-around gap-3 px-2">
                {habits.slice(0, 5).map((h, i) => {
                  const height = Math.max(18, Math.min(100, h.streak * 12 + h.completedDates.length * 4))
                  const tones = ['#6C4BFF', '#8B5CF6', '#3B82F6', '#A78BFA', '#7C3AED']
                  return (
                    <div key={h.id} className="flex h-full w-12 flex-col items-center justify-end gap-2 sm:w-14">
                      <div
                        className="relative w-full flex-1 overflow-hidden rounded-full"
                        style={{
                          backgroundImage:
                            'repeating-linear-gradient(135deg, #EDE9FE 0 6px, #F5F3FF 6px 12px)',
                        }}
                      >
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{ type: 'spring', stiffness: 120, damping: 18, delay: i * 0.05 }}
                          className="absolute bottom-0 left-0 right-0 flex items-end justify-center rounded-full pb-3"
                          style={{ background: tones[i % tones.length] }}
                        >
                          <span className="text-[10px] font-bold text-white">{h.streak}d</span>
                        </motion.div>
                      </div>
                      <p className="w-full truncate text-center text-[10px] font-medium text-slate-500">
                        {h.name.split(' ')[0]}
                      </p>
                    </div>
                  )
                })}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Concluídos hoje', value: `${done}/${habits.length}` },
                  { label: 'Melhor streak', value: `${bestStreak}` },
                  { label: 'Check-ins', value: `${habits.reduce((s, h) => s + h.completedDates.length, 0)}` },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-[24px] bg-[#F8F7FF] p-3 text-center">
                    <p className="text-lg font-bold text-[#2E1065]">{stat.value}</p>
                    <p className="mt-0.5 text-[10px] font-medium text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Heatmap */}
            <div className="rounded-[32px] bg-white p-5 shadow-[0_10px_40px_rgba(108,75,255,0.06)] md:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#1E1B4B]">Mapa de atividade</h3>
                <p className="text-xs text-slate-400">quanto mais roxo, mais consistente</p>
              </div>
              <div className="mb-2 grid grid-cols-7 gap-2 text-center text-[10px] font-medium uppercase text-slate-400">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                  <span key={`${d}-${i}`}>{d}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: new Date(selected.getFullYear(), selected.getMonth(), 1).getDay() }).map(
                  (_, i) => (
                    <div key={`pad-${i}`} />
                  ),
                )}
                {heatmap.map((date) => {
                  const day = Number(date.slice(-2))
                  const count = completionByDay[date] ?? 0
                  const active = date === selectedDate
                  return (
                    <button
                      key={date}
                      onClick={() => {
                        setSelectedDate(date)
                        setView('rotina')
                      }}
                      className={`aspect-square rounded-full text-xs font-semibold transition hover:scale-110 ${intensityColor(count, maxDay)} ${
                        active ? 'ring-2 ring-offset-2 ring-[#6C4BFF]' : ''
                      }`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              onClick={() => setView('rotina')}
              className={`w-full ${primaryBtn}`}
            >
              Voltar para a rotina
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center ${primaryBtn} !rounded-full !px-0 !py-0 md:bottom-8 md:right-10`}
        aria-label="Adicionar hábito"
      >
        <Plus size={24} />
      </button>

      <Modal open={open} title="Novo hábito" onClose={() => setOpen(false)}>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            setHabits((list) => [
              {
                id: uid('h'),
                name,
                period,
                streak: 0,
                completedDates: [],
                color: '#8B5CF6',
              },
              ...list,
            ])
            setName('')
            setOpen(false)
            setView('rotina')
          }}
        >
          <input
            className="w-full rounded-[20px] border border-[#EDE9FE] bg-[#F8F7FF] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#C4B5FD]"
            placeholder="Nome do hábito"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div className="grid grid-cols-3 gap-2">
            {(['manha', 'tarde', 'noite'] as const).map((p) => {
              const meta = periodMeta[p]
              const Icon = meta.Icon
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`rounded-[20px] px-3 py-3 text-sm font-semibold transition ${
                    period === p
                      ? 'bg-[#2E1065] text-white'
                      : `${meta.soft} text-slate-600`
                  }`}
                >
                  <Icon size={16} className="mx-auto mb-1" />
                  {meta.label}
                </button>
              )
            })}
          </div>
          <button className={`w-full ${primaryBtn}`}>
            Salvar hábito
          </button>
        </form>
      </Modal>
    </div>
  )
}
