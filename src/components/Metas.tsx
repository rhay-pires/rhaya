import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useApp } from '../store/AppStore'
import type { LifeGoal } from '../types'
import { uid } from '../utils/format'
import { Modal, SectionTitle } from './ui'

export function Metas() {
  const { lifeGoals, setLifeGoals } = useApp()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    horizon: 'curto' as LifeGoal['horizon'],
    area: 'Pessoal' as LifeGoal['area'],
  })

  const toggleStep = (goalId: string, stepId: string) => {
    setLifeGoals((goals) =>
      goals.map((g) => {
        if (g.id !== goalId) return g
        const steps = g.steps.map((s) => (s.id === stepId ? { ...s, done: !s.done } : s))
        const progress = steps.length ? Math.round((steps.filter((s) => s.done).length / steps.length) * 100) : g.progress
        return { ...g, steps, progress }
      }),
    )
  }

  const byHorizon = {
    curto: lifeGoals.filter((g) => g.horizon === 'curto'),
    medio: lifeGoals.filter((g) => g.horizon === 'medio'),
    longo: lifeGoals.filter((g) => g.horizon === 'longo'),
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SectionTitle title="Metas de Vida & OKRs" subtitle="Curto, médio e longo prazo com etapas encadeadas" />
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#6C4BFF] to-[#3B82F6] px-4 py-2 text-sm font-semibold text-white hover:scale-105"
        >
          <Plus size={16} /> Nova meta
        </button>
      </div>

      <div className="space-y-6">
        {(
          [
            ['curto', 'Curto prazo'],
            ['medio', 'Médio prazo'],
            ['longo', 'Longo prazo'],
          ] as const
        ).map(([key, label]) => (
          <div key={key}>
            <h3 className="mb-3 text-sm font-semibold text-slate-600">{label}</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {byHorizon[key].map((g) => (
                <div key={g.id} className="bento-card p-5">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-violet-500">{g.area}</p>
                      <h4 className="font-semibold text-slate-800">{g.title}</h4>
                    </div>
                    <span className="rounded-full bg-violet-50 px-2 py-1 text-xs font-bold text-violet-600">
                      {g.progress}%
                    </span>
                  </div>
                  <div className="mb-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#6C4BFF] to-[#3B82F6]"
                      style={{ width: `${g.progress}%` }}
                    />
                  </div>
                  <div className="space-y-2">
                    {g.steps.map((s) => (
                      <label key={s.id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={s.done}
                          onChange={() => toggleStep(g.id, s.id)}
                          className="accent-[#6C4BFF]"
                        />
                        <span className={s.done ? 'line-through text-slate-400' : ''}>{s.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} title="Nova Meta de Vida" onClose={() => setOpen(false)}>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            setLifeGoals((list) => [
              {
                id: uid('lg'),
                title: form.title,
                horizon: form.horizon,
                area: form.area,
                progress: 0,
                steps: [
                  { id: uid('s'), title: 'Definir primeiro passo', done: false },
                  { id: uid('s'), title: 'Executar plano', done: false },
                ],
              },
              ...list,
            ])
            setOpen(false)
          }}
        >
          <input className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm" placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <select className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm" value={form.horizon} onChange={(e) => setForm({ ...form, horizon: e.target.value as LifeGoal['horizon'] })}>
            <option value="curto">Curto prazo</option>
            <option value="medio">Médio prazo</option>
            <option value="longo">Longo prazo</option>
          </select>
          <select className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value as LifeGoal['area'] })}>
            <option>Carreira</option>
            <option>Saúde</option>
            <option>Finanças</option>
            <option>Pessoal</option>
          </select>
          <button className="w-full rounded-full bg-gradient-to-r from-[#6C4BFF] to-[#3B82F6] py-2.5 text-sm font-semibold text-white">Salvar</button>
        </form>
      </Modal>
    </div>
  )
}
