import { Droplets, Moon, Salad, Dumbbell } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { SectionTitle } from './ui'

const WATER_GOAL = 2000

export function Saude() {
  const { health, setHealth } = useApp()
  const waterPct = Math.min(100, Math.round((health.waterMl / WATER_GOAL) * 100))

  return (
    <div>
      <SectionTitle title="Saúde & Bem-Estar" subtitle="Água, sono, treinos e diário alimentar" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
        <div className="bento-card p-5 lg:col-span-4">
          <div className="mb-3 flex items-center gap-2 text-blue-600">
            <Droplets size={18} />
            <h3 className="font-semibold">Água</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800">
            {health.waterMl}
            <span className="text-base font-medium text-slate-400"> / {WATER_GOAL} ml</span>
          </p>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-600"
              style={{ width: `${waterPct}%` }}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {[200, 250, 500].map((ml) => (
              <button
                key={ml}
                onClick={() => setHealth((h) => ({ ...h, waterMl: h.waterMl + ml }))}
                className="rounded-full bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700 hover:scale-105"
              >
                +{ml}ml
              </button>
            ))}
            <button
              onClick={() => setHealth((h) => ({ ...h, waterMl: 0 }))}
              className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-500"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="bento-card p-5 lg:col-span-4">
          <div className="mb-3 flex items-center gap-2 text-violet-600">
            <Moon size={18} />
            <h3 className="font-semibold">Sono</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800">{health.sleepHours}h</p>
          <input
            type="range"
            min={0}
            max={12}
            step={0.5}
            value={health.sleepHours}
            onChange={(e) => setHealth((h) => ({ ...h, sleepHours: Number(e.target.value) }))}
            className="mt-4 w-full accent-[#6C4BFF]"
          />
          <p className="mt-2 text-xs text-slate-400">Meta: 7–9 horas</p>
        </div>

        <div className="bento-card p-5 lg:col-span-4">
          <div className="mb-3 flex items-center gap-2 text-emerald-600">
            <Dumbbell size={18} />
            <h3 className="font-semibold">Treino</h3>
          </div>
          <input
            className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm"
            value={health.workout}
            onChange={(e) => setHealth((h) => ({ ...h, workout: e.target.value }))}
            placeholder="Ex: Musculação 45min"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {['Caminhada', 'HIIT', 'Yoga', 'Musculação'].map((w) => (
              <button
                key={w}
                onClick={() => setHealth((h) => ({ ...h, workout: w }))}
                className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 hover:scale-105"
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        <div className="bento-card p-5 lg:col-span-12">
          <div className="mb-3 flex items-center gap-2 text-rose-500">
            <Salad size={18} />
            <h3 className="font-semibold">Diário alimentar</h3>
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
