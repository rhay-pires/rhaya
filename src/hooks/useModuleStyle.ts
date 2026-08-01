import type { CSSProperties } from 'react'
import { useCustomization } from '../store/CustomizationStore'
import { useSettings, type VisualStyle } from '../store/SettingsStore'
import type { ModuleId } from '../types'

export function useModuleStyle(moduleId: ModuleId, fallback = '#D1C4FF') {
  const { getModule } = useCustomization()
  const { settings } = useSettings()
  const accent = getModule(moduleId)?.color ?? fallback
  const style = settings.visualStyle as VisualStyle
  const isGlass = style === 'glass'
  const isMinimal = style === 'minimal'
  const isSoft = isGlass || isMinimal

  const surface = (color = accent): CSSProperties =>
    isGlass
      ? {
          background: `linear-gradient(160deg, ${color} 0%, color-mix(in srgb, ${color} 72%, white) 100%)`,
        }
      : isMinimal
        ? { background: `color-mix(in srgb, ${color} 82%, white)` }
        : { background: color }

  const primaryBtn = isMinimal
    ? 'rounded-full bg-[#3B82F6] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(59,130,246,0.3)] transition hover:scale-[1.02]'
    : isGlass
      ? 'rounded-full border border-white/50 bg-white/70 px-4 py-2.5 text-sm font-bold text-[#0f172a] shadow-[0_8px_24px_rgba(99,102,241,0.15)] backdrop-blur transition hover:scale-[1.02]'
      : 'rounded-full border-2 border-[#1F2937] bg-[#1F2937] px-4 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_#1F2937] transition hover:scale-[1.02]'

  const secondaryBtn = isMinimal
    ? 'soft-chip rounded-full px-4 py-2.5 text-sm font-bold text-[var(--app-fg)] transition hover:scale-[1.02]'
    : isGlass
      ? 'glass-chip rounded-full px-4 py-2.5 text-sm font-bold text-[var(--app-fg)] transition hover:scale-[1.02]'
      : 'rounded-full border-2 border-[#1F2937] bg-white px-4 py-2.5 text-sm font-bold text-[#1F2937] shadow-[2px_2px_0_#1F2937] transition hover:scale-[1.02]'

  const panelClass = isGlass
    ? 'glass-panel rounded-[28px]'
    : isMinimal
      ? 'soft-panel rounded-[28px]'
      : 'rounded-[28px] border-2 border-[#1F2937] shadow-[4px_4px_0_#1F2937] ink-surface'

  const tileClass = isSoft
    ? 'ink-surface rounded-[24px] border'
    : 'rounded-[24px] border-2 border-[#1F2937] shadow-[3px_3px_0_#1F2937] ink-surface'

  const pageVars = { ['--module-accent' as string]: accent, ['--fin-accent' as string]: accent }

  return {
    accent,
    style,
    isGlass,
    isMinimal,
    isSoft,
    surface,
    primaryBtn,
    secondaryBtn,
    panelClass,
    tileClass,
    pageVars,
  }
}
