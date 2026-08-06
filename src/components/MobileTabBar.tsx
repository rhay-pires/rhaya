import { CalendarDays, Home, LayoutGrid, Wallet, Zap } from 'lucide-react'
import { useCustomization } from '../store/CustomizationStore'
import type { ModuleId } from '../types'

const TABS: { id: ModuleId; label: string; icon: typeof Home }[] = [
  { id: 'dashboard', label: 'Início', icon: Home },
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'habitos', label: 'Hábitos', icon: Zap },
  { id: 'financas', label: 'Finanças', icon: Wallet },
]

interface MobileTabBarProps {
  active: ModuleId
  onNavigate: (id: ModuleId) => void
  onMore: () => void
}

export function MobileTabBar({ active, onNavigate, onMore }: MobileTabBarProps) {
  const { enabledModules, setModuleEnabled } = useCustomization()
  const enabledIds = new Set(enabledModules.map((m) => m.id))
  const tabs = TABS
  const moreActive = !tabs.some((t) => t.id === active)

  const go = (id: ModuleId) => {
    if (id !== 'dashboard' && !enabledIds.has(id)) {
      setModuleEnabled(id, true)
    }
    onNavigate(id)
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-black/[0.04] bg-[var(--app-card)]/92 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom))' }}
      aria-label="Navegação principal"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => go(tab.id)}
              className={`pressable flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1 ${
                isActive ? 'text-[var(--app-fg)]' : 'text-[var(--app-muted)]'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={20} strokeWidth={isActive ? 2.35 : 1.75} />
              <span className="truncate text-[10px] font-medium leading-none tracking-wide">
                {tab.label}
              </span>
              <span
                className={`h-1 w-1 rounded-full transition ${
                  isActive ? 'bg-[#C8F560]' : 'bg-transparent'
                }`}
              />
            </button>
          )
        })}
        <button
          type="button"
          onClick={onMore}
          className={`pressable flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1 ${
            moreActive ? 'text-[var(--app-fg)]' : 'text-[var(--app-muted)]'
          }`}
          aria-label="Mais módulos"
        >
          <LayoutGrid size={20} strokeWidth={moreActive ? 2.35 : 1.75} />
          <span className="truncate text-[10px] font-medium leading-none tracking-wide">Mais</span>
          <span
            className={`h-1 w-1 rounded-full transition ${
              moreActive ? 'bg-[#C8F560]' : 'bg-transparent'
            }`}
          />
        </button>
      </div>
    </nav>
  )
}
