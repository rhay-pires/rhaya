import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { VIEW_OPTIONS } from '../data/modules'
import { useModuleStyle } from '../hooks/useModuleStyle'
import { useApp } from '../store/AppStore'
import { useCustomization } from '../store/CustomizationStore'
import type { Priority, ViewMode, WorkTask } from '../types'
import { todayISO, uid } from '../utils/format'
import { ModuleHero } from './ModuleHero'
import { EmptyState, Modal, PillTabs, SectionTitle } from './ui'
import { ViewSwitcher } from './ViewSwitcher'

function isOverdue(task: WorkTask): boolean {
  return task.status !== 'done' && task.dueDate < todayISO()
}

type TrabalhoTab = 'projetos' | 'eisenhower'

const tabs: { id: TrabalhoTab; label: string }[] = [
  { id: 'projetos', label: '📋 Projetos' },
  { id: 'eisenhower', label: '🧭 Eisenhower' },
]

const columns: { id: WorkTask['status']; label: string }[] = [
  { id: 'todo', label: 'A Fazer' },
  { id: 'doing', label: 'Em Andamento' },
  { id: 'done', label: 'Concluído' },
]

const priorityColor: Record<Priority, string> = {
  baixa: 'bg-emerald-100 text-emerald-700',
  media: 'bg-amber-100 text-amber-700',
  alta: 'bg-rose-100 text-rose-700',
}

export function Trabalho() {
  const { setTasks } = useApp()
  const { accent, primaryBtn, pageVars } = useModuleStyle('trabalho', '#FDBA74')
  const [tab, setTab] = useState<TrabalhoTab>('projetos')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    client: '',
    priority: 'media' as Priority,
    dueDate: todayISO(),
  })

  return (
    <div style={pageVars} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle title="Trabalho & Projetos" subtitle="Gestão de tarefas com Lista, Kanban e Matriz" />
        <button onClick={() => setOpen(true)} className={`flex items-center gap-2 ${primaryBtn}`}>
          <Plus size={16} /> Tarefa
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
          {tab === 'projetos' && <ProjetosTab />}
          {tab === 'eisenhower' && <EisenhowerTab />}
        </motion.div>
      </AnimatePresence>

      <Modal open={open} title="Nova Tarefa" onClose={() => setOpen(false)}>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            setTasks((list) => [{ id: uid('t'), ...form, status: 'todo' }, ...list])
            setOpen(false)
            setForm({ title: '', client: '', priority: 'media', dueDate: todayISO() })
          }}
        >
          <input
            className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm"
            placeholder="Título"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <input
            className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm"
            placeholder="Cliente"
            value={form.client}
            onChange={(e) => setForm({ ...form, client: e.target.value })}
            required
          />
          <select
            className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
          >
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </select>
          <input
            className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm"
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
          <button type="submit" className={`w-full ${primaryBtn}`}>
            Salvar
          </button>
        </form>
      </Modal>
    </div>
  )
}

type QuickFilter = 'todas' | 'hoje' | 'atrasadas'

function ProjetosTab() {
  const { tasks, setTasks } = useApp()
  const { getModule, setModuleView } = useCustomization()
  const { accent, tileClass, surface, panelClass } = useModuleStyle('trabalho', '#FDBA74')
  const mod = getModule('trabalho')
  const view = (mod?.viewMode === 'lista' ? 'lista' : 'kanban') as 'lista' | 'kanban'
  const [filter, setFilter] = useState<QuickFilter>('todas')
  const [editing, setEditing] = useState<WorkTask | null>(null)
  const today = todayISO()

  const move = (id: string, status: WorkTask['status']) => {
    setTasks((list) => list.map((t) => (t.id === id ? { ...t, status } : t)))
  }

  const openCount = tasks.filter((t) => t.status !== 'done').length
  const doneCount = tasks.filter((t) => t.status === 'done').length
  const overdueCount = tasks.filter(isOverdue).length

  const filtered = useMemo(() => {
    if (filter === 'hoje') return tasks.filter((t) => t.dueDate === today)
    if (filter === 'atrasadas') return tasks.filter(isOverdue)
    return tasks
  }, [tasks, filter, today])

  const filters: { id: QuickFilter; label: string }[] = [
    { id: 'todas', label: 'Todas' },
    { id: 'hoje', label: 'Hoje' },
    { id: 'atrasadas', label: `Atrasadas${overdueCount ? ` (${overdueCount})` : ''}` },
  ]

  return (
    <div className="space-y-5">
      <ModuleHero
        moduleId="trabalho"
        fallback="#FDBA74"
        title="Em aberto"
        value={String(openCount)}
        subtitle={`${doneCount} concluídas · ${overdueCount} atrasadas`}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                filter === f.id
                  ? f.id === 'atrasadas'
                    ? 'bg-rose-500 text-white'
                    : 'text-white'
                  : 'bg-white text-slate-600 shadow-sm'
              }`}
              style={filter === f.id && f.id !== 'atrasadas' ? { background: accent } : undefined}
            >
              {f.label}
            </button>
          ))}
        </div>
        <ViewSwitcher
          options={VIEW_OPTIONS.trabalho}
          value={view}
          onChange={(v: ViewMode) => setModuleView('trabalho', v)}
          accent={accent}
        />
      </div>

      {filtered.length === 0 && <EmptyState text="Nenhuma tarefa aqui" />}

      {view === 'kanban' ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {columns.map((col) => (
            <div key={col.id} className={`${tileClass} p-4`} style={surface(accent)}>
              <h3 className="mb-3 text-sm font-bold text-[#1F2937]">
                {col.label}{' '}
                <span className="text-[#1F2937]/50">
                  ({filtered.filter((t) => t.status === col.id).length})
                </span>
              </h3>
              <div className="space-y-2">
                {filtered
                  .filter((t) => t.status === col.id)
                  .map((t) => (
                    <div
                      key={t.id}
                      className={`rounded-[16px] border bg-white/80 p-3 ${
                        isOverdue(t) ? 'border-rose-400 ring-1 ring-rose-200' : 'border-[#1F2937]/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-[#1F2937]">{t.title}</p>
                        <button onClick={() => setEditing(t)} className="shrink-0 text-[#1F2937]/40">
                          <Pencil size={13} />
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-[#1F2937]/55">
                        {t.client} · {t.dueDate}
                        {isOverdue(t) && <span className="ml-1 font-bold text-rose-500">atrasada</span>}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${priorityColor[t.priority]}`}
                        >
                          {t.priority}
                        </span>
                        <select
                          className="rounded-xl border border-gray-100 px-2 py-1 text-xs"
                          value={t.status}
                          onChange={(e) => move(t.id, e.target.value as WorkTask['status'])}
                        >
                          {columns.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`${panelClass} divide-y divide-gray-100 overflow-hidden`}>
          {filtered.map((t) => (
            <div
              key={t.id}
              className={`flex flex-wrap items-center justify-between gap-3 bg-white/70 px-4 py-3 ${
                isOverdue(t) ? 'border-l-4 border-rose-400' : ''
              }`}
            >
              <div>
                <p className="text-sm font-medium text-slate-800">{t.title}</p>
                <p className="text-xs text-slate-400">
                  {t.client} · prazo {t.dueDate}
                  {isOverdue(t) && <span className="ml-1 font-bold text-rose-500">atrasada</span>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${priorityColor[t.priority]}`}
                >
                  {t.priority}
                </span>
                <select
                  className="rounded-xl border border-gray-100 px-2 py-1 text-xs"
                  value={t.status}
                  onChange={(e) => move(t.id, e.target.value as WorkTask['status'])}
                >
                  {columns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <button onClick={() => setEditing(t)} className="rounded-full bg-slate-50 p-1.5 text-slate-500">
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => setTasks((list) => list.filter((x) => x.id !== t.id))}
                  className="rounded-full bg-rose-50 p-1.5 text-rose-500"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} title="Editar Tarefa" onClose={() => setEditing(null)}>
        {editing && (
          <TaskForm
            task={editing}
            onSave={(t) => {
              setTasks((list) => list.map((x) => (x.id === t.id ? t : x)))
              setEditing(null)
            }}
            onDelete={() => {
              setTasks((list) => list.filter((x) => x.id !== editing.id))
              setEditing(null)
            }}
          />
        )}
      </Modal>
    </div>
  )
}

function TaskForm({
  task,
  onSave,
  onDelete,
}: {
  task: WorkTask
  onSave: (t: WorkTask) => void
  onDelete: () => void
}) {
  const [form, setForm] = useState<WorkTask>(task)
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        onSave(form)
      }}
    >
      <input
        className="w-full rounded-2xl border border-gray-100 px-3 py-3 text-sm"
        placeholder="Título"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        required
      />
      <input
        className="w-full rounded-2xl border border-gray-100 px-3 py-3 text-sm"
        placeholder="Cliente"
        value={form.client}
        onChange={(e) => setForm({ ...form, client: e.target.value })}
        required
      />
      <select
        className="w-full rounded-2xl border border-gray-100 px-3 py-3 text-sm"
        value={form.priority}
        onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
      >
        <option value="baixa">Baixa</option>
        <option value="media">Média</option>
        <option value="alta">Alta</option>
      </select>
      <input
        className="w-full rounded-2xl border border-gray-100 px-3 py-3 text-sm"
        type="date"
        value={form.dueDate}
        onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
      />
      <button type="submit" className="w-full rounded-full bg-[#FDBA74] py-3 text-sm font-bold text-[#1F2937]">
        Salvar
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="w-full rounded-full bg-rose-50 py-3 text-sm font-bold text-rose-500"
      >
        Excluir tarefa
      </button>
    </form>
  )
}

function daysFromToday(dateStr: string): number {
  const today = new Date(todayISO() + 'T00:00:00')
  const target = new Date(dateStr + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

function EisenhowerTab() {
  const { tasks, setTasks } = useApp()
  const { tileClass, surface } = useModuleStyle('trabalho', '#FDBA74')

  const open = useMemo(() => tasks.filter((t) => t.status !== 'done'), [tasks])

  const quadrants = useMemo(() => {
    const fazerAgora: WorkTask[] = []
    const agendar: WorkTask[] = []
    const delegar: WorkTask[] = []
    const eliminar: WorkTask[] = []

    open.forEach((t) => {
      const soon = daysFromToday(t.dueDate) <= 2
      if (t.priority === 'alta' && soon) fazerAgora.push(t)
      else if (t.priority === 'alta' && !soon) agendar.push(t)
      else if ((t.priority === 'media' || t.priority === 'baixa') && soon) delegar.push(t)
      else eliminar.push(t)
    })

    return [
      { id: 'fazer', label: 'Fazer agora', subtitle: 'Urgente & importante', items: fazerAgora, color: '#FDA4AF' },
      { id: 'agendar', label: 'Agendar', subtitle: 'Importante, não urgente', items: agendar, color: '#70CFFF' },
      { id: 'delegar', label: 'Delegar', subtitle: 'Urgente, pouco importante', items: delegar, color: '#FFEA5D' },
      { id: 'eliminar', label: 'Eliminar / depois', subtitle: 'Nem urgente, nem importante', items: eliminar, color: '#E2E8F0' },
    ]
  }, [open])

  const cycleStatus = (id: string) => {
    setTasks((list) =>
      list.map((t) => {
        if (t.id !== id) return t
        const order: WorkTask['status'][] = ['todo', 'doing', 'done']
        const next = order[(order.indexOf(t.status) + 1) % order.length]
        return { ...t, status: next }
      }),
    )
  }

  return (
    <div className="space-y-5">
      <ModuleHero
        moduleId="trabalho"
        fallback="#FDBA74"
        title="Tarefas em aberto"
        value={String(open.length)}
        subtitle="Matriz de Eisenhower — priorize com clareza"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {quadrants.map((q) => (
          <div key={q.id} className={`${tileClass} p-4`} style={surface(q.color)}>
            <div className="mb-3">
              <h3 className="text-sm font-bold text-[#1F2937]">{q.label}</h3>
              <p className="text-xs text-[#1F2937]/55">{q.subtitle}</p>
            </div>
            {q.items.length === 0 ? (
              <p className="text-sm text-[#1F2937]/50">Nenhuma tarefa aqui</p>
            ) : (
              <div className="space-y-2">
                {q.items.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => cycleStatus(t.id)}
                    className="w-full rounded-[16px] border border-[#1F2937]/10 bg-white/80 p-3 text-left transition hover:scale-[1.01]"
                  >
                    <p className="text-sm font-bold text-[#1F2937]">{t.title}</p>
                    <p className="mt-1 text-xs text-[#1F2937]/55">
                      {t.client} · {t.dueDate}
                    </p>
                    <span
                      className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${priorityColor[t.priority]}`}
                    >
                      {t.priority} · {t.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {open.length === 0 && <EmptyState text="Nenhuma tarefa em aberto" />}
    </div>
  )
}
