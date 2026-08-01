import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { VIEW_OPTIONS } from '../data/modules'
import { useModuleStyle } from '../hooks/useModuleStyle'
import { useApp } from '../store/AppStore'
import { useCustomization } from '../store/CustomizationStore'
import type { Appointment, Priority, ViewMode } from '../types'
import { todayISO, uid } from '../utils/format'
import { ModuleHero } from './ModuleHero'
import { Modal, SectionTitle } from './ui'
import { ViewSwitcher } from './ViewSwitcher'

export function Agenda() {
  const { appointments, setAppointments, year, month, shiftMonth } = useApp()
  const { getModule, setModuleView } = useCustomization()
  const { accent, isSoft, primaryBtn, pageVars, surface, tileClass } = useModuleStyle(
    'agenda',
    '#70CFFF',
  )
  const mod = getModule('agenda')
  const view = (mod?.viewMode === 'semana' ? 'semana' : 'mes') as 'mes' | 'semana'
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
  const upcomingCount = appointments.filter((a) => a.date >= todayISO()).length

  const priorityColor = {
    baixa: 'bg-emerald-100 text-emerald-700',
    media: 'bg-amber-100 text-amber-700',
    alta: 'bg-rose-100 text-rose-700',
  }

  return (
    <div style={pageVars} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle
          title="Agenda & Compromissos"
          subtitle="Calendário interativo com prioridades e lembretes"
        />
        <div className="flex flex-wrap gap-2">
          <ViewSwitcher
            options={VIEW_OPTIONS.agenda}
            value={view}
            onChange={(v: ViewMode) => setModuleView('agenda', v)}
            accent={accent}
          />
          <button onClick={() => setOpen(true)} className={`flex items-center gap-2 ${primaryBtn}`}>
            <Plus size={16} /> Novo
          </button>
        </div>
      </div>

      <ModuleHero
        moduleId="agenda"
        fallback="#70CFFF"
        title="Próximos compromissos"
        value={String(upcomingCount)}
        subtitle={`Selecionado: ${selected}`}
      />

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
              selectedAppts.map((a) => (
                <div
                  key={a.id}
                  className="rounded-[16px] border border-[#1F2937]/10 bg-white/75 px-3 py-2.5"
                >
                  <p className="text-sm font-bold text-[#1F2937]">{a.title}</p>
                  <p className="text-xs text-[#1F2937]/60">
                    {a.time}
                    {a.location ? ` · ${a.location}` : ''}
                  </p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${priorityColor[a.priority]}`}
                  >
                    {a.priority}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal open={open} title="Novo compromisso" onClose={() => setOpen(false)}>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
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
              },
            ])
            setOpen(false)
            setForm({
              title: '',
              date: todayISO(),
              time: '09:00',
              priority: 'media',
              reminder: true,
              location: '',
            })
          }}
        >
          <input
            required
            className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="Título"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              className="rounded-2xl border border-gray-200 px-3 py-2 text-sm"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            <input
              type="time"
              className="rounded-2xl border border-gray-200 px-3 py-2 text-sm"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
            />
          </div>
          <select
            className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
          >
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </select>
          <input
            className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="Local (opcional)"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.reminder}
              onChange={(e) => setForm({ ...form, reminder: e.target.checked })}
            />
            Lembrete
          </label>
          <button type="submit" className={`w-full ${primaryBtn}`}>
            Salvar
          </button>
        </form>
      </Modal>
    </div>
  )
}
