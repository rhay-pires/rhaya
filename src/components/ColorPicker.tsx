import { FUN_COLORS } from '../types'
import { contrastText } from '../data/modules'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  size?: 'sm' | 'md'
}

export function ColorPicker({ value, onChange, size = 'md' }: ColorPickerProps) {
  const dim = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9'
  return (
    <div className="flex flex-wrap gap-2">
      {FUN_COLORS.map((c) => {
        const active = value.toLowerCase() === c.hex.toLowerCase()
        return (
          <button
            key={c.id}
            type="button"
            title={c.name}
            onClick={() => onChange(c.hex)}
            className={`${dim} rounded-full border-2 transition hover:scale-110 ${
              active ? 'border-[#1F2937] shadow-[3px_3px_0_#1F2937] scale-110' : 'border-black/10'
            }`}
            style={{ background: c.hex }}
            aria-label={c.name}
          />
        )
      })}
      <label
        className={`${dim} relative flex cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-300 text-[10px] font-bold text-slate-500`}
        title="Cor personalizada"
      >
        +
        <input
          type="color"
          className="absolute inset-0 cursor-pointer opacity-0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  )
}

export function ColorChip({ color, label }: { color: string; label?: string }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border-2 border-[#1F2937] px-3 py-1 text-xs font-bold shadow-[2px_2px_0_#1F2937]"
      style={{ background: color, color: contrastText(color) }}
    >
      <span className="h-2.5 w-2.5 rounded-full border border-black/20 bg-white/50" />
      {label}
    </span>
  )
}
