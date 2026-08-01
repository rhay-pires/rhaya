import { useMemo, useState } from 'react'
import { Archive, ArchiveRestore, Plus, Trash2, X } from 'lucide-react'
import { useModuleStyle } from '../hooks/useModuleStyle'
import { useApp } from '../store/AppStore'
import type { LifeGoal } from '../types'
import { uid } from '../utils/format'
import { ModuleHero } from './ModuleHero'
import { EmptyState, Modal, PillTabs, SectionTitle } from './ui'

type MetasTab = 'todas' | 'mensal' | 'trimestral' | 'anual' | 'arquivadas'

const tabs: { id: MetasTab; label: string }[] = [
  { id: 'todas', label: '🎯 Todas' },
  { id: 'mensal', label: '🗓️ Mensal' },
  { id: 'trimestral', label: '📆 Trimestral' },
  { id: 'anual', label: '🏆 Anual' },
  { id: 'arquivadas', label: '🗄️ Arquivadas' },
]

const horizonByTab: Record<MetasTab, LifeGoal['horizon'] | null> = {
  todas: null,
  mensal: 'curto',
  trimestral: 'medio',
  anual: 'longo',
  arquivadas: null,
}

const horizonLabel: Record<LifeGoal['horizon'], string> = {
  curto: 'Curto prazo',
  medio: 'Médio prazo',
  longo: 'Longo prazo',
}

export function Metas() {
  const { lifeGoals, setLifeGoals } = useApp()
  const { accent, primaryBtn, pageVars, tileClass, surface } = useModuleStyle('metas', '#F9A8D4')
  const [tab, setTab] = useState<MetasTab>('todas')
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<LifeGoal | null>(null)
  const [form, setForm] = useState({
    title: '',
    horizon: 'curto' as LifeGoal['horizon'],
    area: 'Pessoal' as LifeGoal['area'],
    deadline: '',
  })

  const activeGoals = lifeGoals.filter((g) => !g.archived)

  const avgProgress = useMemo(() => {
    if (!activeGoals.length) return 0
    return Math.round(activeGoals.reduce((s, g) => s + g.progress, 0) / activeGoals.length)
  }, [activeGoals])

  const toggleStep = (goalId: string, stepId: string) => {
    setLifeGoals((goals) =>
      goals.map((g) => {
        if (g.id !== goalId) return g
        const steps = g.steps.map((s) => (s.id === stepId ? { ...s, done: !s.done } : s))
        const progress = steps.length
          ? Math.round((steps.filter((s) => s.done).length / steps.length) * 100)
          : g.progress
        return { ...g, steps, progress }
      }),
    )
  }

  const toggleArchive = (goalId: string) => {
    setLifeGoals((goals) => goals.map((g) => (g.id === goalId ? { ...g, archived: !g.archived } : g)))
  }

  const isArchivedTab = tab === 'arquivadas'
  const horizon = horizonByTab[tab]
  const baseGoals = isArchivedTab ? lifeGoals.filter((g) => g.archived) : activeGoals
  const filteredGoals = horizon ? baseGoals.filter((g) => g.horizon === horizon) : baseGoals

  const byHorizon = {
    curto: filteredGoals.filter((g) => g.horizon === 'curto'),
    medio: filteredGoals.filter((g) => g.horizon === 'medio'),
    longo: filteredGoals.filter((g) => g.horizon === 'longo'),
  }

  return (
    <div style={pageVars} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle
          title="Metas de Vida & OKRs"
          subtitle="Curto, médio e longo prazo com etapas encadeadas"
        />
        <button onClick={() => setOpen(true)} className={`flex items-center gap-2 ${primaryBtn}`}>
          <Plus size={16} /> Nova meta
        </button>
      </div>

      <PillTabs tabs={tabs} active={tab} onChange={setTab} accent={accent} />

      {!isArchivedTab && (
        <ModuleHero
          moduleId="metas"
          fallback="#F9A8D4"
          title="Progresso médio"
          value={`${avgProgress}%`}
          subtitle={`${filteredGoals.length} de ${activeGoals.length} metas`}
        />
      )}

      {filteredGoals.length === 0 ? (
        <EmptyState text={isArchivedTab ? 'Nenhuma meta arquivada' : 'Nenhuma meta neste horizonte'} />
      ) : (
        <div className="space-y-6">
          {(
            [
              ['curto', horizonLabel.curto],
              ['medio', horizonLabel.medio],
              ['longo', horizonLabel.longo],
            ] as const
          ).map(([key, label]) =>
            byHorizon[key].length === 0 ? null : (
              <div key={key}>
                <h3 className="mb-3 text-sm font-semibold text-slate-600">{label}</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {byHorizon[key].map((g) => (
                    <div key={g.id} className={`${tileClass} p-5`} style={surface(accent)}>
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wide text-[#1F2937]/55">
                            {g.area}
                          </p>
                          <button onClick={() => setDetail(g)} className="text-left">
                            <h4 className="font-bold text-[#1F2937] hover:underline">{g.title}</h4>
                          </button>
                          {g.deadline && (
                            <p className="text-xs text-[#1F2937]/55">Prazo: {g.deadline}</p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="rounded-full bg-white/80 px-2 py-1 text-xs font-bold text-[#1F2937]">
                            {g.progress}%
                          </span>
                          <button
                            onClick={() => toggleArchive(g.id)}
                            className="rounded-full bg-white/70 p-1.5 text-[#1F2937]"
                            title={g.archived ? 'Restaurar meta' : 'Arquivar meta'}
                          >
                            {g.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                          </button>
                        </div>
                      </div>
                      <div className="mb-3 h-2.5 overflow-hidden rounded-full bg-white/50">
                        <div
                          className="h-full rounded-full bg-[#1F2937]"
                          style={{ width: `${g.progress}%` }}
                        />
                      </div>
                      <div className="space-y-2">
                        {g.steps.map((s) => (
                          <label
                            key={s.id}
                            className="flex cursor-pointer items-center gap-2 text-sm text-[#1F2937]/80"
                          >
                            <input
                              type="checkbox"
                              checked={s.done}
                              onChange={() => toggleStep(g.id, s.id)}
                              className="accent-[var(--module-accent)]"
                            />
                            <span className={s.done ? 'line-through opacity-50' : ''}>{s.title}</span>
                          </label>
                        ))}
                      </div>
                      <button
                        onClick={() => setDetail(g)}
                        className="mt-3 text-xs font-bold text-[#1F2937]/60 hover:underline"
                      >
                        Gerenciar etapas →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ),
          )}
        </div>
      )}

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
                deadline: form.deadline || undefined,
                steps: [
                  { id: uid('s'), title: 'Definir primeiro passo', done: false },
                  { id: uid('s'), title: 'Executar plano', done: false },
                ],
              },
              ...list,
            ])
            setOpen(false)
            setForm({ title: '', horizon: 'curto', area: 'Pessoal', deadline: '' })
          }}
        >
          <input
            className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm"
            placeholder="Título"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <select
            className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm"
            value={form.horizon}
            onChange={(e) => setForm({ ...form, horizon: e.target.value as LifeGoal['horizon'] })}
          >
            <option value="curto">Curto prazo</option>
            <option value="medio">Médio prazo</option>
            <option value="longo">Longo prazo</option>
          </select>
          <select
            className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm"
            value={form.area}
            onChange={(e) => setForm({ ...form, area: e.target.value as LifeGoal['area'] })}
          >
            <option>Carreira</option>
            <option>Saúde</option>
            <option>Finanças</option>
            <option>Pessoal</option>
          </select>
          <input
            className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm"
            type="date"
            placeholder="Prazo (opcional)"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
          />
          <button type="submit" className={`w-full ${primaryBtn}`}>
            Salvar
          </button>
        </form>
      </Modal>

      <Modal open={!!detail} title="Etapas da meta" onClose={() => setDetail(null)}>
        {detail && (
          <GoalStepsEditor
            goal={lifeGoals.find((g) => g.id === detail.id) ?? detail}
            onClose={() => setDetail(null)}
          />
        )}
      </Modal>
    </div>
  )
}

function GoalStepsEditor({ goal, onClose }: { goal: LifeGoal; onClose: () => void }) {
  const { setLifeGoals } = useApp()
  const [newStep, setNewStep] = useState('')
  const [deadline, setDeadline] = useState(goal.deadline ?? '')

  const updateSteps = (steps: LifeGoal['steps']) => {
    setLifeGoals((goals) =>
      goals.map((g) => {
        if (g.id !== goal.id) return g
        const progress = steps.length
          ? Math.round((steps.filter((s) => s.done).length / steps.length) * 100)
          : g.progress
        return { ...g, steps, progress }
      }),
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Prazo</p>
        <input
          type="date"
          className="w-full rounded-2xl border border-gray-100 px-3 py-2.5 text-sm"
          value={deadline}
          onChange={(e) => {
            setDeadline(e.target.value)
            setLifeGoals((goals) =>
              goals.map((g) => (g.id === goal.id ? { ...g, deadline: e.target.value || undefined } : g)),
            )
          }}
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Etapas</p>
        {goal.steps.map((s) => (
          <div key={s.id} className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2.5">
            <input
              type="checkbox"
              checked={s.done}
              onChange={() =>
                updateSteps(goal.steps.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)))
              }
              className="h-4 w-4 accent-[#F9A8D4]"
            />
            <input
              className={`flex-1 bg-transparent text-sm outline-none ${s.done ? 'line-through opacity-50' : ''}`}
              value={s.title}
              onChange={(e) =>
                updateSteps(goal.steps.map((x) => (x.id === s.id ? { ...x, title: e.target.value } : x)))
              }
            />
            <button
              onClick={() => updateSteps(goal.steps.filter((x) => x.id !== s.id))}
              className="text-rose-400 hover:text-rose-600"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {goal.steps.length === 0 && <p className="text-sm text-slate-400">Nenhuma etapa ainda</p>}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-2xl border border-gray-100 px-3 py-2.5 text-sm"
          placeholder="Nova etapa"
          value={newStep}
          onChange={(e) => setNewStep(e.target.value)}
        />
        <button
          onClick={() => {
            if (!newStep.trim()) return
            updateSteps([...goal.steps, { id: uid('s'), title: newStep, done: false }])
            setNewStep('')
          }}
          className="rounded-2xl bg-pink-100 px-4 py-2.5 text-sm font-bold text-pink-700"
        >
          <Plus size={14} />
        </button>
      </div>

      <button
        onClick={() => {
          setLifeGoals((goals) => goals.filter((g) => g.id !== goal.id))
          onClose()
        }}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-rose-50 py-3 text-sm font-bold text-rose-500"
      >
        <Trash2 size={14} /> Excluir meta
      </button>
    </div>
  )
}
