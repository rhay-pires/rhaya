import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { VIEW_OPTIONS } from '../data/modules'
import { useApp } from '../store/AppStore'
import { useCustomization } from '../store/CustomizationStore'
import type { Appointment, Priority, ViewMode } from '../types'
import { todayISO, uid } from '../utils/format'
import { Modal, SectionTitle } from './ui'
import { ViewSwitcher } from './ViewSwitcher'

export function Agenda() {
  const { appointments, setAppointments, year, month, shiftMonth } = useApp()
  const { getModule, setModuleView } = useCustomization()
  const mod = getModule('agenda')
  const view = (mod?.viewMode === 'semana' ? 'semana' : 'mes') as 'mes' | 'semana'
  const accent = mod?.color ?? '#70CFFF'
  const [selected, setSelected] = useState(todayISO())
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    date: todayISO(),
    time: '09:00',
    priority: 'media' as Priority,
    reminder: true,
    location: '',
  })

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

  const priorityColor = {
    baixa: 'bg-emerald-100 text-emerald-700',
    media: 'bg-amber-100 text-amber-700',
    alta: 'bg-rose-100 text-rose-700',
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SectionTitle title="Agenda & Compromissos" subtitle="Calendário interativo com prioridades e lembretes" />
        <div className="flex flex-wrap gap-2">
          <ViewSwitcher
            options={VIEW_OPTIONS.agenda}
            value={view}
            onChange={(v: ViewMode) => setModuleView('agenda', v)}
            accent={accent}
          />
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-full border-2 border-[#1F2937] bg-[#1F2937] px-4 py-2 text-sm font-bold text-white shadow-[3px_3px_0_#70CFFF] hover:scale-105"
          >
            <Plus size={16} /> Novo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="bento-card p-4 lg:col-span-8">
          {view === 'mes' ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <button onClick={() => shiftMonth(-1)} className="rounded-full p-2 hover:bg-violet-50">
                  <ChevronLeft size={18} />
                </button>
                <p className="font-semibold capitalize text-slate-800">
                  {new Date(year, month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </p>
                <button onClick={() => shiftMonth(1)} className="rounded-full p-2 hover:bg-violet-50">
                  <ChevronRight size={18} />
                </button>
              </div>
              <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDow }).map((_, i) => (
                  <div key={`e${i}`} />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1
                  const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const has = (byDate[date]?.length ?? 0) > 0
                  const isSelected = selected === date
                  const isToday = date === todayISO()
                  return (
                    <button
                      key={date}
                      onClick={() => setSelected(date)}
                      className={`relative aspect-square rounded-2xl text-sm transition hover:scale-105 ${
                        isSelected
                          ? 'bg-gradient-to-br from-[#6C4BFF] to-[#3B82F6] text-white'
                          : isToday
                            ? 'bg-violet-50 text-violet-700'
                            : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {day}
                      {has && (
                        <span
                          className={`absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${
                            isSelected ? 'bg-white' : 'bg-violet-500'
                          }`}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
              {weekDays.map((date) => {
                const d = new Date(date + 'T12:00:00')
                const items = byDate[date] ?? []
                return (
                  <button
                    key={date}
                    onClick={() => setSelected(date)}
                    className={`rounded-[20px] p-3 text-left ${
                      selected === date ? 'bg-violet-50 ring-2 ring-violet-300' : 'bg-slate-50'
                    }`}
                  >
                    <p className="text-xs text-slate-400">
                      {d.toLocaleDateString('pt-BR', { weekday: 'short' })}
                    </p>
                    <p className="text-lg font-bold text-slate-700">{d.getDate()}</p>
                    <p className="mt-2 text-xs text-violet-600">{items.length} evento(s)</p>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="bento-card p-5 lg:col-span-4">
          <h3 className="mb-3 font-semibold text-slate-800">
            {new Date(selected + 'T12:00:00').toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: '2-digit',
              month: 'short',
            })}
          </h3>
          {selectedAppts.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">Sem compromissos</p>
          ) : (
            <div className="space-y-2">
              {selectedAppts.map((a) => (
                <div key={a.id} className="rounded-2xl border border-gray-100 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{a.title}</p>
                      <p className="text-xs text-slate-400">
                        {a.time}
                        {a.reminder ? ' · 🔔 lembrete' : ''}
                        {a.location ? ` · ${a.location}` : ''}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${priorityColor[a.priority]}`}>
                      {a.priority}
                    </span>
                  </div>
                  <button
                    onClick={() => setAppointments((list) => list.filter((x) => x.id !== a.id))}
                    className="mt-2 text-xs text-rose-500 hover:underline"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={open} title="Novo Compromisso" onClose={() => setOpen(false)}>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            setAppointments((list) => [{ id: uid('ap'), ...form }, ...list])
            setSelected(form.date)
            setOpen(false)
          }}
        >
          <input className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm" placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <div className="grid grid-cols-2 gap-2">
            <input className="rounded-2xl border border-gray-100 px-3 py-2 text-sm" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <input className="rounded-2xl border border-gray-100 px-3 py-2 text-sm" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </div>
          <select className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
            <option value="baixa">Prioridade baixa</option>
            <option value="media">Prioridade média</option>
            <option value="alta">Prioridade alta</option>
          </select>
          <input className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm" placeholder="Local (opcional)" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.reminder} onChange={(e) => setForm({ ...form, reminder: e.target.checked })} className="accent-[#6C4BFF]" />
            Ativar lembrete
          </label>
          <button className="w-full rounded-full bg-gradient-to-r from-[#6C4BFF] to-[#3B82F6] py-2.5 text-sm font-semibold text-white">Salvar</button>
        </form>
      </Modal>
    </div>
  )
}
