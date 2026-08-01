import { Droplets, Moon, Salad, Dumbbell } from 'lucide-react'
import { useModuleStyle } from '../hooks/useModuleStyle'
import { useApp } from '../store/AppStore'
import { useSettings } from '../store/SettingsStore'
import { ModuleHero } from './ModuleHero'
import { SectionTitle } from './ui'

export function Saude() {
  const { health, setHealth } = useApp()
  const { settings } = useSettings()
  const { accent, secondaryBtn, pageVars, tileClass, surface } = useModuleStyle(
    'saude',
    '#86EFAC',
  )
  const waterGoal = settings.waterGoalMl
  const waterPct = Math.min(100, Math.round((health.waterMl / waterGoal) * 100))

  return (
    <div style={pageVars} className="space-y-5">
      <SectionTitle title="Saúde & Bem-Estar" subtitle="Água, sono, treinos e diário alimentar" />

      <ModuleHero
        moduleId="saude"
        fallback="#86EFAC"
        title="Hidratação hoje"
        value={`${waterPct}%`}
        subtitle={`${health.waterMl} ml · meta ${waterGoal} ml`}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
        <div className={`${tileClass} p-5 lg:col-span-4`} style={surface(accent)}>
          <div className="mb-3 flex items-center gap-2 text-[#1F2937]">
            <Droplets size={18} />
            <h3 className="font-bold">Água</h3>
          </div>
          <p className="text-3xl font-bold text-[#1F2937]">
            {health.waterMl}
            <span className="text-base font-medium text-[#1F2937]/50"> / {waterGoal} ml</span>
          </p>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/50">
            <div
              className="h-full rounded-full bg-[#1F2937]"
              style={{ width: `${waterPct}%` }}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {[200, 250, 500].map((ml) => (
              <button
                key={ml}
                onClick={() => setHealth((h) => ({ ...h, waterMl: h.waterMl + ml }))}
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

        <div className={`${tileClass} p-5 lg:col-span-4`} style={surface(accent)}>
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

        <div className={`${tileClass} p-5 lg:col-span-4`} style={surface(accent)}>
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

        <div className="bento-card p-5 lg:col-span-12">
          <div className="mb-3 flex items-center gap-2 text-[var(--module-accent)]">
            <Salad size={18} />
            <h3 className="font-semibold text-[var(--app-fg)]">Diário alimentar</h3>
          </div>
          <textarea
            className="w-full rounded-[24px] border border-gray-100 bg-slate-50 px-4 py-3 text-sm"
            rows={4}
            value={health.meals}
            onChange={(e) => setHealth((h) => ({ ...h, meals: e.target.value }))}
            placeholder="Registre suas refeições do dia..."
          />
        </div>
      </div>
    </div>
  )
}
