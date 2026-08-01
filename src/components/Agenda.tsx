import { useMemo, useState } from 'react'
import { Bell, BellRing, Check, ChevronLeft, ChevronRight, Pencil, Plus, Repeat, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { VIEW_OPTIONS } from '../data/modules'
import { useModuleStyle } from '../hooks/useModuleStyle'
import { useApp } from '../store/AppStore'
import { useCustomization } from '../store/CustomizationStore'
import type { Appointment, Priority, ViewMode } from '../types'
import { todayISO, uid } from '../utils/format'
import { ModuleHero } from './ModuleHero'
import { EmptyState, Modal, PillTabs, SectionTitle } from './ui'
import { ViewSwitcher } from './ViewSwitcher'

type AgendaTab = 'geral' | 'calendario' | 'lembretes'

const tabs: { id: AgendaTab; label: string }[] = [
  { id: 'geral', label: '🏠 Geral' },
  { id: 'calendario', label: '📅 Calendário' },
  { id: 'lembretes', label: '🔔 Lembretes' },
]

const priorityColor: Record<Priority, string> = {
  baixa: 'bg-emerald-100 text-emerald-700',
  media: 'bg-amber-100 text-amber-700',
  alta: 'bg-rose-100 text-rose-700',
}

type ApptFormValue = {
  title: string
  date: string
  time: string
  priority: Priority
  reminder: boolean
  location: string
  recurrence: 'none' | 'weekly'
}

const emptyForm: ApptFormValue = {
  title: '',
  date: todayISO(),
  time: '09:00',
  priority: 'media',
  reminder: true,
  location: '',
  recurrence: 'none',
}

export function Agenda() {
  const { setAppointments } = useApp()
  const { accent, primaryBtn, pageVars } = useModuleStyle('agenda', '#70CFFF')
  const [tab, setTab] = useState<AgendaTab>('geral')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Appointment | null>(null)

  return (
    <div style={pageVars} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle
          title="Agenda & Compromissos"
          subtitle="Calendário interativo com prioridades e lembretes"
        />
        <button onClick={() => setOpen(true)} className={`flex items-center gap-2 ${primaryBtn}`}>
          <Plus size={16} /> Novo
        </button>
      </div>

      <PillTabs tabs={tabs} active={tab} onChange={setTab} accent={accent} />

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
        >
          {tab === 'geral' && <GeralTab onEdit={setEditing} />}
          {tab === 'calendario' && <CalendarioTab onEdit={setEditing} />}
          {tab === 'lembretes' && <LembretesTab onEdit={setEditing} />}
        </motion.div>
      </AnimatePresence>

      <Modal open={open} title="Novo compromisso" onClose={() => setOpen(false)}>
        <AppointmentForm
          initial={emptyForm}
          onSave={(form) => {
            setAppointments((list) => [
              ...list,
              {
                id: uid('apt'),
                title: form.title,
                date: form.date,
                time: form.time,
                priority: form.priority,
                reminder: form.reminder,
                location: form.location,
                recurrence: form.recurrence,
                done: false,
              },
            ])
            setOpen(false)
          }}
        />
      </Modal>

      <Modal open={!!editing} title="Editar compromisso" onClose={() => setEditing(null)}>
        {editing && (
          <AppointmentForm
            initial={{
              title: editing.title,
              date: editing.date,
              time: editing.time,
              priority: editing.priority,
              reminder: editing.reminder,
              location: editing.location ?? '',
              recurrence: editing.recurrence ?? 'none',
            }}
            onSave={(form) => {
              setAppointments((list) =>
                list.map((a) => (a.id === editing.id ? { ...a, ...form } : a)),
              )
              setEditing(null)
            }}
            onDelete={() => {
              setAppointments((list) => list.filter((a) => a.id !== editing.id))
              setEditing(null)
            }}
          />
        )}
      </Modal>
    </div>
  )
}

function AppointmentForm({
  initial,
  onSave,
  onDelete,
}: {
  initial: ApptFormValue
  onSave: (v: ApptFormValue) => void
  onDelete?: () => void
}) {
  const [form, setForm] = useState<ApptFormValue>(initial)
  const { primaryBtn } = useModuleStyle('agenda', '#70CFFF')

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        onSave(form)
      }}
    >
      <input
        required
        className="w-full rounded-2xl border border-gray-200 px-3 py-3 text-sm"
        placeholder="Título"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          className="rounded-2xl border border-gray-200 px-3 py-3 text-sm"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
        <input
          type="time"
          className="rounded-2xl border border-gray-200 px-3 py-3 text-sm"
          value={form.time}
          onChange={(e) => setForm({ ...form, time: e.target.value })}
        />
      </div>
      <select
        className="w-full rounded-2xl border border-gray-200 px-3 py-3 text-sm"
        value={form.priority}
        onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
      >
        <option value="baixa">Baixa</option>
        <option value="media">Média</option>
        <option value="alta">Alta</option>
      </select>
      <input
        className="w-full rounded-2xl border border-gray-200 px-3 py-3 text-sm"
        placeholder="Local (opcional)"
        value={form.location}
        onChange={(e) => setForm({ ...form, location: e.target.value })}
      />
      <label className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={form.reminder}
          onChange={(e) => setForm({ ...form, reminder: e.target.checked })}
          className="h-4 w-4"
        />
        Lembrete
      </label>
      <label className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={form.recurrence === 'weekly'}
          onChange={(e) => setForm({ ...form, recurrence: e.target.checked ? 'weekly' : 'none' })}
          className="h-4 w-4"
        />
        <Repeat size={14} /> Repetir toda semana
      </label>
      <button type="submit" className={`w-full ${primaryBtn}`}>
        Salvar
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="w-full rounded-full bg-rose-50 py-3 text-sm font-bold text-rose-500"
        >
          Excluir compromisso
        </button>
      )}
    </form>
  )
}

function GeralTab({ onEdit }: { onEdit: (a: Appointment) => void }) {
  const { appointments, setAppointments } = useApp()
  const { tileClass, surface, accent } = useModuleStyle('agenda', '#70CFFF')
  const today = todayISO()

  const upcoming = useMemo(
    () =>
      appointments
        .filter((a) => a.date >= today && !a.done)
        .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date))),
    [appointments, today],
  )
  const todayAppts = upcoming.filter((a) => a.date === today)
  const nextAppts = upcoming.filter((a) => a.date !== today)

  const toggleDone = (id: string) => {
    setAppointments((list) => list.map((a) => (a.id === id ? { ...a, done: !a.done } : a)))
  }

  return (
    <div className="space-y-5">
      <ModuleHero
        moduleId="agenda"
        fallback="#70CFFF"
        title="Próximos compromissos"
        value={String(upcoming.length)}
        subtitle={`${todayAppts.length} hoje · ${nextAppts.length} nos próximos dias`}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={`${tileClass} p-5`} style={surface(accent)}>
          <h3 className="mb-3 font-bold text-[#1F2937]">Hoje</h3>
          {todayAppts.length === 0 ? (
            <p className="text-sm text-[#1F2937]/55">Sem compromissos para hoje</p>
          ) : (
            <div className="space-y-2">
              {todayAppts.map((a) => (
                <AppointmentRow key={a.id} appt={a} onEdit={() => onEdit(a)} onToggleDone={() => toggleDone(a.id)} />
              ))}
            </div>
          )}
        </div>

        <div className="bento-card p-5">
          <h3 className="mb-3 font-semibold text-slate-800">Próximos dias</h3>
          {nextAppts.length === 0 ? (
            <EmptyState text="Nenhum compromisso futuro" />
          ) : (
            <div className="space-y-2">
              {nextAppts.slice(0, 8).map((a) => (
                <button
                  key={a.id}
                  onClick={() => onEdit(a)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2.5 text-left hover:bg-slate-100"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-700">{a.title}</p>
                    <p className="text-xs text-slate-400">
                      {a.date} · {a.time}
                      {a.location ? ` · ${a.location}` : ''}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${priorityColor[a.priority]}`}>
                    {a.priority}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConcluidosSection />
    </div>
  )
}

function ConcluidosSection() {
  const { appointments, setAppointments } = useApp()
  const done = appointments.filter((a) => a.done)
  if (done.length === 0) return null
  return (
    <div className="bento-card p-4">
      <p className="mb-2 text-sm font-semibold text-slate-600">Concluídos ({done.length})</p>
      <div className="space-y-1.5">
        {done.slice(0, 5).map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
            <p className="truncate text-xs text-slate-400 line-through">{a.title}</p>
            <button
              onClick={() => setAppointments((list) => list.map((x) => (x.id === a.id ? { ...x, done: false } : x)))}
              className="shrink-0 text-[11px] font-semibold text-violet-500"
            >
              reabrir
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function AppointmentRow({
  appt,
  onEdit,
  onToggleDone,
}: {
  appt: Appointment
  onEdit?: () => void
  onToggleDone?: () => void
}) {
  return (
    <div className="flex items-stretch gap-2 rounded-[16px] border border-[#1F2937]/10 bg-white/75 px-3 py-2.5">
      {onToggleDone && (
        <button
          onClick={onToggleDone}
          aria-label="Marcar como concluído"
          className={`flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-full border-2 transition ${
            appt.done ? 'border-[#1F2937] bg-[#1F2937] text-white' : 'border-[#1F2937]/25 text-transparent'
          }`}
        >
          <Check size={14} strokeWidth={3} />
        </button>
      )}
      <button onClick={onEdit} className="min-w-0 flex-1 text-left">
        <p className={`truncate text-sm font-bold text-[#1F2937] ${appt.done ? 'line-through opacity-60' : ''}`}>
          {appt.title}
        </p>
        <p className="text-xs text-[#1F2937]/60">
          {appt.time}
          {appt.location ? ` · ${appt.location}` : ''}
          {appt.recurrence === 'weekly' ? ' · semanal' : ''}
        </p>
        <span
          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${priorityColor[appt.priority]}`}
        >
          {appt.priority}
        </span>
      </button>
      {onEdit && (
        <button onClick={onEdit} className="self-center rounded-full p-1.5 text-[#1F2937]/50" aria-label="Editar">
          <Pencil size={14} />
        </button>
      )}
    </div>
  )
}

function CalendarioTab({ onEdit }: { onEdit: (a: Appointment) => void }) {
  const { appointments, year, month, shiftMonth } = useApp()
  const { getModule, setModuleView } = useCustomization()
  const { accent, isSoft, surface, tileClass } = useModuleStyle('agenda', '#70CFFF')
  const mod = getModule('agenda')
  const view = (mod?.viewMode === 'semana' ? 'semana' : 'mes') as 'mes' | 'semana'
  const [selected, setSelected] = useState(todayISO())

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow = new Date(year, month, 1).getDay()

  const byDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {}
    appointments.forEach((a) => {
      map[a.date] = [...(map[a.date] ?? []), a]
    })
    return map
  }, [appointments])

  const weekStart = useMemo(() => {
    const d = new Date(selected + 'T12:00:00')
    d.setDate(d.getDate() - d.getDay())
    return d
  }, [selected])

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d.toISOString().slice(0, 10)
  })

  const selectedAppts = (byDate[selected] ?? []).sort((a, b) => a.time.localeCompare(b.time))

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ViewSwitcher
          options={VIEW_OPTIONS.agenda}
          value={view}
          onChange={(v: ViewMode) => setModuleView('agenda', v)}
          accent={accent}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="bento-card p-4 lg:col-span-8">
          {view === 'mes' ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <button onClick={() => shiftMonth(-1)} className="rounded-full p-2 hover:bg-slate-50">
                  <ChevronLeft size={18} />
                </button>
                <p className="font-bold capitalize text-[var(--app-fg)]">
                  {new Date(year, month).toLocaleDateString('pt-BR', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <button onClick={() => shiftMonth(1)} className="rounded-full p-2 hover:bg-slate-50">
                  <ChevronRight size={18} />
                </button>
              </div>
              <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDow }).map((_, i) => (
                  <div key={`e-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const active = date === selected
                  const has = (byDate[date] ?? []).length > 0
                  return (
                    <button
                      key={date}
                      onClick={() => setSelected(date)}
                      className={`relative flex h-12 flex-col items-center justify-center rounded-2xl text-sm font-bold transition ${
                        active
                          ? isSoft
                            ? 'text-[#1F2937] shadow-[0_8px_20px_rgba(0,0,0,0.08)]'
                            : 'border-2 border-[#1F2937] text-[#1F2937] shadow-[2px_2px_0_#1F2937]'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                      style={active ? surface(accent) : undefined}
                    >
                      {day}
                      {has && (
                        <span
                          className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full"
                          style={{ background: active ? '#1F2937' : accent }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((date) => {
                const d = new Date(date + 'T12:00:00')
                const active = date === selected
                return (
                  <button
                    key={date}
                    onClick={() => setSelected(date)}
                    className={`rounded-[20px] p-3 text-center transition ${
                      active
                        ? isSoft
                          ? 'shadow-[0_8px_20px_rgba(0,0,0,0.08)]'
                          : 'border-2 border-[#1F2937] shadow-[2px_2px_0_#1F2937]'
                        : 'bg-slate-50'
                    }`}
                    style={active ? surface(accent) : undefined}
                  >
                    <p className="text-[10px] font-bold uppercase text-[#1F2937]/60">
                      {d.toLocaleDateString('pt-BR', { weekday: 'short' })}
                    </p>
                    <p className="mt-1 text-lg font-bold text-[#1F2937]">{d.getDate()}</p>
                    <p className="mt-1 text-[10px] text-[#1F2937]/50">
                      {(byDate[date] ?? []).length} evt
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className={`${tileClass} p-5 lg:col-span-4`} style={surface(accent)}>
          <h3 className="mb-3 font-bold text-[#1F2937]">Do dia</h3>
          <div className="space-y-2">
            {selectedAppts.length === 0 ? (
              <p className="text-sm text-[#1F2937]/55">Sem compromissos</p>
            ) : (
              selectedAppts.map((a) => <AppointmentRow key={a.id} appt={a} onEdit={() => onEdit(a)} />)
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function LembretesTab({ onEdit }: { onEdit: (a: Appointment) => void }) {
  const { appointments, setAppointments, addNotification } = useApp()
  const { tileClass, surface, accent } = useModuleStyle('agenda', '#70CFFF')

  const reminders = useMemo(
    () => appointments.filter((a) => a.reminder && !a.done).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)),
    [appointments],
  )

  const toggleReminder = (id: string) => {
    setAppointments((list) => list.map((a) => (a.id === id ? { ...a, reminder: !a.reminder } : a)))
  }

  return (
    <div className="space-y-4">
      <ModuleHero
        moduleId="agenda"
        fallback="#70CFFF"
        title="Lembretes ativos"
        value={String(reminders.length)}
        subtitle="Toque para enviar uma notificação agora"
      />

      {reminders.length === 0 ? (
        <EmptyState text="Nenhum lembrete ativo" />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {reminders.map((a) => (
            <div key={a.id} className={`${tileClass} flex items-center justify-between gap-3 p-4`} style={surface(accent)}>
              <button onClick={() => onEdit(a)} className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-bold text-[#1F2937]">{a.title}</p>
                <p className="text-xs text-[#1F2937]/60">
                  {a.date} · {a.time}
                  {a.location ? ` · ${a.location}` : ''}
                </p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${priorityColor[a.priority]}`}
                >
                  {a.priority}
                </span>
              </button>
              <div className="flex shrink-0 flex-col gap-1.5">
                <button
                  onClick={() => addNotification(`Lembrete: ${a.title} às ${a.time}`)}
                  className="rounded-full border border-[#1F2937]/15 bg-white/90 p-2 text-[#1F2937] hover:scale-105"
                  title="Enviar lembrete agora"
                >
                  <BellRing size={16} />
                </button>
                <button
                  onClick={() => toggleReminder(a.id)}
                  className="rounded-full border border-[#1F2937]/15 bg-white/80 p-2 text-rose-500 hover:scale-105"
                  title="Desativar lembrete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bento-card p-4">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
          <Bell size={14} /> Sem lembrete
        </p>
        <p className="text-xs text-slate-400">
          {appointments.filter((a) => !a.reminder).length} compromissos sem notificação
        </p>
      </div>
    </div>
  )
}
