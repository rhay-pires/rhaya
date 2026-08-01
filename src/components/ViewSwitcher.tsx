import type { ViewMode } from '../types'

interface ViewSwitcherProps {
  options: { id: ViewMode; label: string }[]
  value: ViewMode
  onChange: (v: ViewMode) => void
  accent?: string
}

export function ViewSwitcher({ options, value, onChange, accent = '#D1C4FF' }: ViewSwitcherProps) {
  if (options.length < 2) return null
  return (
    <div className="inline-flex rounded-full border-2 border-[#1F2937] bg-white p-1 shadow-[3px_3px_0_#1F2937]">
      {options.map((opt) => {
        const active = value === opt.id
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition hover:scale-[1.02] ${
              active ? 'text-[#1F2937]' : 'text-slate-500'
            }`}
            style={active ? { background: accent } : undefined}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
