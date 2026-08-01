import type { ReactNode } from 'react'
import { useModuleStyle } from '../hooks/useModuleStyle'
import type { ModuleId } from '../types'

/** Hero/resumo no topo do módulo — mesmo padrão do dashboard/finanças */
export function ModuleHero({
  moduleId,
  title,
  subtitle,
  value,
  actions,
  children,
  fallback,
}: {
  moduleId: ModuleId
  title: string
  subtitle?: string
  value?: ReactNode
  actions?: ReactNode
  children?: ReactNode
  fallback?: string
}) {
  const { accent, isGlass, isMinimal, isSoft, surface, panelClass } = useModuleStyle(
    moduleId,
    fallback,
  )

  return (
    <div
      className={`relative overflow-hidden p-5 md:p-6 ${panelClass}`}
      style={
        isSoft
          ? isMinimal
            ? undefined
            : { boxShadow: `0 20px 50px ${accent}33` }
          : surface(accent)
      }
    >
      {isGlass && (
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full opacity-45 blur-3xl"
          style={{ background: accent }}
        />
      )}
      {isMinimal && (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-1.5 rounded-l-[28px]"
          style={{ background: accent }}
        />
      )}

      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={`text-sm font-semibold ${isSoft ? 'text-slate-500' : 'text-[#1F2937]/70'}`}>
            {title}
          </p>
          {value && (
            <div
              className={`mt-1 text-3xl font-bold md:text-4xl ${
                isSoft ? 'text-[var(--app-fg)]' : 'text-[#1F2937]'
              }`}
            >
              {value}
            </div>
          )}
          {subtitle && (
            <p className={`mt-2 text-sm ${isSoft ? 'text-slate-500' : 'text-[#1F2937]/65'}`}>
              {subtitle}
            </p>
          )}
          {children}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  )
}
