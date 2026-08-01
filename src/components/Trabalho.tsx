import { useState } from 'react'
import { Plus } from 'lucide-react'
import { VIEW_OPTIONS } from '../data/modules'
import { useApp } from '../store/AppStore'
import { useCustomization } from '../store/CustomizationStore'
import type { Priority, ViewMode, WorkTask } from '../types'
import { todayISO, uid } from '../utils/format'
import { Modal, SectionTitle } from './ui'
import { ViewSwitcher } from './ViewSwitcher'

const columns: { id: WorkTask['status']; label: string }[] = [
  { id: 'todo', label: 'A Fazer' },
  { id: 'doing', label: 'Em Andamento' },
  { id: 'done', label: 'Concluído' },
]

export function Trabalho() {
  const { tasks, setTasks } = useApp()
  const { getModule, setModuleView } = useCustomization()
  const mod = getModule('trabalho')
  const view = (mod?.viewMode === 'lista' ? 'lista' : 'kanban') as 'lista' | 'kanban'
  const accent = mod?.color ?? '#FDBA74'
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    client: '',
    priority: 'media' as Priority,
    dueDate: todayISO(),
  })

  const priorityColor = {
    baixa: 'bg-emerald-100 text-emerald-700',
    media: 'bg-amber-100 text-amber-700',
    alta: 'bg-rose-100 text-rose-700',
  }

  const move = (id: string, status: WorkTask['status']) => {
    setTasks((list) => list.map((t) => (t.id === id ? { ...t, status } : t)))
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SectionTitle title="Trabalho & Projetos" subtitle="Gestão de tarefas com Lista e Kanban" />
        <div className="flex flex-wrap gap-2">
          <ViewSwitcher
            options={VIEW_OPTIONS.trabalho}
            value={view}
            onChange={(v: ViewMode) => setModuleView('trabalho', v)}
            accent={accent}
          />
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-full border-2 border-[#1F2937] bg-[#1F2937] px-4 py-2 text-sm font-bold text-white shadow-[3px_3px_0_#FDBA74] hover:scale-105"
          >
            <Plus size={16} /> Tarefa
          </button>
        </div>
      </div>

      {view === 'kanban' ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {columns.map((col) => (
            <div key={col.id} className="bento-card p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-600">
                {col.label}{' '}
                <span className="text-slate-400">({tasks.filter((t) => t.status === col.id).length})</span>
              </h3>
              <div className="space-y-2">
                {tasks
                  .filter((t) => t.status === col.id)
                  .map((t) => (
                    <div key={t.id} className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                      <p className="text-sm font-medium text-slate-800">{t.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{t.client} · {t.dueDate}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${priorityColor[t.priority]}`}>
                          {t.priority}
                        </span>
                        <select
                          className="rounded-xl border border-gray-100 px-2 py-1 text-xs"
                          value={t.status}
                          onChange={(e) => move(t.id, e.target.value as WorkTask['status'])}
                        >
                          {columns.map((c) => (
                            <option key={c.id} value={c.id}>{c.label}</option>
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
        <div className="bento-card divide-y divide-gray-50 overflow-hidden">
          {tasks.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-800">{t.title}</p>
                <p className="text-xs text-slate-400">{t.client} · prazo {t.dueDate}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${priorityColor[t.priority]}`}>
                  {t.priority}
                </span>
                <select
                  className="rounded-xl border border-gray-100 px-2 py-1 text-xs"
                  value={t.status}
                  onChange={(e) => move(t.id, e.target.value as WorkTask['status'])}
                >
                  {columns.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => setTasks((list) => list.filter((x) => x.id !== t.id))}
                  className="text-xs text-rose-500 hover:underline"
                >
                  excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} title="Nova Tarefa" onClose={() => setOpen(false)}>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            setTasks((list) => [
              { id: uid('t'), ...form, status: 'todo' },
              ...list,
            ])
            setOpen(false)
            setForm({ title: '', client: '', priority: 'media', dueDate: todayISO() })
          }}
        >
          <input className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm" placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <input className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm" placeholder="Cliente" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} required />
          <select className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </select>
          <input className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <button className="w-full rounded-full bg-gradient-to-r from-[#6C4BFF] to-[#3B82F6] py-2.5 text-sm font-semibold text-white">Salvar</button>
        </form>
      </Modal>
    </div>
  )
}
