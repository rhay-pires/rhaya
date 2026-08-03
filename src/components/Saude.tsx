import { useMemo, useState } from 'react'
import { Droplets, Moon, Salad, Dumbbell, Scale, Zap } from 'lucide-react'
import { useModuleStyle } from '../hooks/useModuleStyle'
import { useApp } from '../store/AppStore'
import { useSettings } from '../store/SettingsStore'
import { todayISO, toLocalISO } from '../utils/format'
import { ModuleHero } from './ModuleHero'
import { PillTabs, SectionTitle } from './ui'

function last7Days(healthHistory: { date: string; waterMl: number; sleepHours: number }[], today: { date: string; waterMl: number; sleepHours: number }) {
  const byDate = new Map([...healthHistory, today].map((h) => [h.date, h]))
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(toLocalISO(d))
  }
  return days.map((date) => byDate.get(date) ?? { date, waterMl: 0, sleepHours: 0 })
}

type SaudeTab = 'geral' | 'medidas' | 'alimentacao' | 'treinos' | 'sono_agua'

const tabs: { id: SaudeTab; label: string }[] = [
  { id: 'geral', label: '🏠 Geral' },
  { id: 'medidas', label: '⚖️ Medidas' },
  { id: 'alimentacao', label: '🥗 Alimentação' },
  { id: 'treinos', label: '💪 Treinos' },
  { id: 'sono_agua', label: '💧 Sono & Água' },
]

export function Saude() {
  const { health } = useApp()
  const { settings } = useSettings()
  const { accent, pageVars } = useModuleStyle('saude', '#86EFAC')
  const [tab, setTab] = useState<SaudeTab>('geral')
  const waterGoal = settings.waterGoalMl
  const waterPct = Math.min(100, Math.round((health.waterMl / waterGoal) * 100))

  return (
    <div style={pageVars} className="space-y-5">
      <SectionTitle title="Saúde & Bem-Estar" subtitle="Água, sono, treinos e diário alimentar" />

      <PillTabs tabs={tabs} active={tab} onChange={setTab} accent={accent} />

      <ModuleHero
        moduleId="saude"
        fallback="#86EFAC"
        title="Hidratação hoje"
        value={`${waterPct}%`}
        subtitle={`${health.waterMl} ml · meta ${waterGoal} ml`}
      />

      {tab === 'geral' && <GeralTab />}
      {tab === 'medidas' && <MedidasTab />}
      {tab === 'alimentacao' && <AlimentacaoTab />}
      {tab === 'treinos' && <TreinosTab />}
      {tab === 'sono_agua' && <SonoAguaTab />}
    </div>
  )
}

function GeralTab() {
  const { health, healthHistory, habits, toggleHabit, addNotification } = useApp()
  const { settings } = useSettings()
  const { accent, tileClass, surface } = useModuleStyle('saude', '#86EFAC')
  const waterGoal = settings.waterGoalMl
  const waterPct = Math.min(100, Math.round((health.waterMl / waterGoal) * 100))
  const today = todayISO()

  const days = useMemo(() => last7Days(healthHistory, health), [healthHistory, health])
  const maxWater = Math.max(waterGoal, ...days.map((d) => d.waterMl), 1)
  const maxSleep = Math.max(settings.sleepGoalHours, ...days.map((d) => d.sleepHours), 1)

  const waterHabit = habits.find((h) => /(água|agua|water)/i.test(h.name))
  const waterHabitDone = waterHabit?.completedDates.includes(today)

  const tiles = [
    {
      icon: Droplets,
      label: 'Água',
      value: `${health.waterMl} ml`,
      subtitle: `${waterPct}% da meta`,
    },
    {
      icon: Moon,
      label: 'Sono',
      value: `${health.sleepHours}h`,
      subtitle: `Meta: ${settings.sleepGoalHours}h`,
    },
    {
      icon: Dumbbell,
      label: 'Treino',
      value: health.workout || '—',
      subtitle: 'Atividade registrada',
    },
    {
      icon: Scale,
      label: 'Peso',
      value: `${health.weightKg ?? 65} kg`,
      subtitle: 'Última medição',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className={`${tileClass} p-5`} style={surface(accent)}>
            <div className="mb-3 flex items-center gap-2 text-[#1F2937]">
              <t.icon size={18} />
              <h3 className="font-bold">{t.label}</h3>
            </div>
            <p className="text-2xl font-bold text-[#1F2937]">{t.value}</p>
            <p className="mt-1 text-xs text-[#1F2937]/60">{t.subtitle}</p>
          </div>
        ))}
      </div>

      {waterHabit && (
        <button
          onClick={() => {
            if (!waterHabitDone) toggleHabit(waterHabit.id)
            addNotification(`Hábito "${waterHabit.name}" marcado a partir da Saúde 💧`)
          }}
          disabled={waterHabitDone}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-50 py-3 text-sm font-bold text-blue-600 disabled:opacity-50"
        >
          <Zap size={14} /> {waterHabitDone ? 'Hábito Água já concluído hoje' : `Marcar hábito "${waterHabit.name}"`}
        </button>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="bento-card p-5">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
            <Droplets size={14} className="text-blue-400" /> Água — últimos 7 dias
          </h4>
          <div className="flex h-28 items-end justify-between gap-2">
            {days.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-blue-300"
                  style={{ height: `${Math.max(4, (d.waterMl / maxWater) * 100)}%` }}
                />
                <span className="text-[9px] text-slate-400">
                  {new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'narrow' })}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="bento-card p-5">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
            <Moon size={14} className="text-indigo-400" /> Sono — últimos 7 dias
          </h4>
          <div className="flex h-28 items-end justify-between gap-2">
            {days.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-indigo-300"
                  style={{ height: `${Math.max(4, (d.sleepHours / maxSleep) * 100)}%` }}
                />
                <span className="text-[9px] text-slate-400">
                  {new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'narrow' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MedidasTab() {
  const { health, setHealth } = useApp()
  const { accent, tileClass, surface } = useModuleStyle('saude', '#86EFAC')

  return (
    <div className={`${tileClass} p-5`} style={surface(accent)}>
      <div className="mb-3 flex items-center gap-2 text-[#1F2937]">
        <Scale size={18} />
        <h3 className="font-bold">Peso corporal</h3>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="number"
          step="0.1"
          min={0}
          className="w-32 rounded-2xl border border-[#1F2937]/10 bg-white/70 px-3 py-2 text-lg font-bold text-[#1F2937]"
          value={health.weightKg ?? 65}
          onChange={(e) => setHealth((h) => ({ ...h, weightKg: Number(e.target.value) || 0 }))}
        />
        <span className="text-sm font-medium text-[#1F2937]/60">kg</span>
      </div>
      <input
        type="range"
        min={30}
        max={180}
        step={0.5}
        value={health.weightKg ?? 65}
        onChange={(e) => setHealth((h) => ({ ...h, weightKg: Number(e.target.value) }))}
        className="mt-4 w-full accent-[var(--module-accent)]"
      />
      <p className="mt-2 text-xs text-[#1F2937]/55">Registre seu peso regularmente para acompanhar sua evolução.</p>
    </div>
  )
}

function AlimentacaoTab() {
  const { health, setHealth } = useApp()

  return (
    <div className="bento-card p-5">
      <div className="mb-3 flex items-center gap-2 text-[var(--module-accent)]">
        <Salad size={18} />
        <h3 className="font-semibold text-[var(--app-fg)]">Diário alimentar</h3>
      </div>
      <textarea
        className="w-full rounded-[24px] border border-gray-100 bg-slate-50 px-4 py-3 text-sm"
        rows={8}
        value={health.meals}
        onChange={(e) => setHealth((h) => ({ ...h, meals: e.target.value }))}
        placeholder="Registre suas refeições do dia..."
      />
    </div>
  )
}

function TreinosTab() {
  const { health, setHealth } = useApp()
  const { accent, tileClass, surface } = useModuleStyle('saude', '#86EFAC')

  return (
    <div className={`${tileClass} p-5`} style={surface(accent)}>
      <div className="mb-3 flex items-center gap-2 text-[#1F2937]">
        <Dumbbell size={18} />
        <h3 className="font-bold">Treino</h3>
      </div>
      <input
        className="w-full rounded-2xl border border-[#1F2937]/10 bg-white/70 px-3 py-2 text-sm"
        value={health.workout}
        onChange={(e) => setHealth((h) => ({ ...h, workout: e.target.value }))}
        placeholder="Ex: Musculação 45min"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {['Caminhada', 'HIIT', 'Yoga', 'Musculação'].map((w) => (
          <button
            key={w}
            onClick={() => setHealth((h) => ({ ...h, workout: w }))}
            className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-[#1F2937] hover:scale-105"
          >
            {w}
          </button>
        ))}
      </div>
    </div>
  )
}

function SonoAguaTab() {
  const { health, setHealth, habits, toggleHabit, addNotification } = useApp()
  const { settings } = useSettings()
  const { accent, secondaryBtn, tileClass, surface } = useModuleStyle('saude', '#86EFAC')
  const waterGoal = settings.waterGoalMl
  const waterPct = Math.min(100, Math.round((health.waterMl / waterGoal) * 100))
  const today = todayISO()
  const waterHabit = habits.find((h) => /(água|agua|water)/i.test(h.name))

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className={`${tileClass} p-5`} style={surface(accent)}>
        <div className="mb-3 flex items-center gap-2 text-[#1F2937]">
          <Droplets size={18} />
          <h3 className="font-bold">Água</h3>
        </div>
        <p className="text-3xl font-bold text-[#1F2937]">
          {health.waterMl}
          <span className="text-base font-medium text-[#1F2937]/50"> / {waterGoal} ml</span>
        </p>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/50">
          <div className="h-full rounded-full bg-[#1F2937]" style={{ width: `${waterPct}%` }} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[200, 250, 500].map((ml) => (
            <button
              key={ml}
              onClick={() => {
                setHealth((h) => ({ ...h, waterMl: h.waterMl + ml }))
                if (waterHabit && !waterHabit.completedDates.includes(today)) {
                  toggleHabit(waterHabit.id)
                  addNotification(`Hábito "${waterHabit.name}" marcado automaticamente 💧`)
                }
              }}
              className={secondaryBtn.replace('px-4 py-2.5', 'px-3 py-1.5')}
            >
              +{ml}ml
            </button>
          ))}
          <button
            onClick={() => setHealth((h) => ({ ...h, waterMl: 0 }))}
            className="rounded-full bg-white/60 px-3 py-1.5 text-sm text-[#1F2937]/60"
          >
            Reset
          </button>
        </div>
      </div>

      <div className={`${tileClass} p-5`} style={surface(accent)}>
        <div className="mb-3 flex items-center gap-2 text-[#1F2937]">
          <Moon size={18} />
          <h3 className="font-bold">Sono</h3>
        </div>
        <p className="text-3xl font-bold text-[#1F2937]">{health.sleepHours}h</p>
        <input
          type="range"
          min={0}
          max={12}
          step={0.5}
          value={health.sleepHours}
          onChange={(e) => setHealth((h) => ({ ...h, sleepHours: Number(e.target.value) }))}
          className="mt-4 w-full accent-[var(--module-accent)]"
        />
        <p className="mt-2 text-xs text-[#1F2937]/55">Meta: {settings.sleepGoalHours}h</p>
      </div>
    </div>
  )
}
