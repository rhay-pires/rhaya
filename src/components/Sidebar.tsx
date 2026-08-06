import { Menu, Palette, Plus, Settings, X } from 'lucide-react'
import { motion } from 'motion/react'
import { contrastText } from '../data/modules'
import { useCustomization } from '../store/CustomizationStore'
import { useSettings } from '../store/SettingsStore'
import type { ModuleId } from '../types'
import { MODULE_ICONS } from '../utils/icons'
import { Avatar } from './Avatar'

interface SidebarProps {
  active: ModuleId
  onNavigate: (id: ModuleId) => void
  open: boolean
  onClose: () => void
  onPersonalizar: () => void
  onQuickAdd: () => void
  onConfig: () => void
}

export function Sidebar({
  active,
  onNavigate,
  open,
  onClose,
  onPersonalizar,
  onQuickAdd,
  onConfig,
}: SidebarProps) {
  const { enabledModules } = useCustomization()
  const { settings } = useSettings()
  const isGlass = settings.visualStyle === 'glass'
  const isMinimal = settings.visualStyle === 'minimal'
  const isSoft = isGlass || isMinimal

  return (
    <>
      {open && (
        <button
          className={`fixed inset-0 z-40 lg:hidden ${
            isSoft ? 'bg-slate-900/20 backdrop-blur-md' : 'bg-slate-900/30 backdrop-blur-sm'
          }`}
          onClick={onClose}
          aria-label="Fechar menu"
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-[290px] flex-col p-4 transition-transform duration-300 lg:static lg:translate-x-0 lg:pointer-events-auto ${
          isGlass
            ? 'border-r border-white/40'
            : isMinimal
              ? 'border-r border-[var(--app-border)]'
              : 'border-r-2 border-[#1F2937]/10 bg-[var(--app-card)] dark:border-white/10'
        } ${open ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none lg:pointer-events-auto'}`}
        style={isGlass ? undefined : { background: 'var(--app-card)' }}
      >
        <div className="mb-6 flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <Avatar url={settings.avatarUrl} initials={settings.avatarInitials} size="md" />
            <div>
              <p className="text-sm font-bold text-[var(--app-fg)]">LifeHub</p>
              <p className="text-xs text-slate-500">{settings.displayName} OS</p>
            </div>
          </div>
          <button className="rounded-full p-2 text-slate-500 lg:hidden" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          {enabledModules.map((item) => {
            const Icon = MODULE_ICONS[item.icon]
            const isActive = active === item.id
            const ink = contrastText(item.color)
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id)
                  onClose()
                }}
                className={`relative flex w-full items-center gap-3 rounded-[18px] px-3 py-2.5 text-left text-sm font-bold transition hover:scale-[1.01] ${
                  isGlass
                    ? isActive
                      ? 'border border-white/50 shadow-[0_8px_24px_rgba(99,102,241,0.15)]'
                      : 'border border-transparent text-slate-600 hover:bg-white/35'
                    : isMinimal
                      ? isActive
                        ? 'border border-transparent text-white shadow-[0_8px_20px_rgba(59,130,246,0.25)]'
                        : 'border border-transparent text-slate-600 hover:bg-slate-50'
                      : isActive
                        ? 'border-2 border-[#1F2937] shadow-[3px_3px_0_#1F2937]'
                        : 'border-2 border-transparent text-slate-600 hover:bg-slate-50'
                }`}
                style={
                  isActive
                    ? isGlass
                      ? {
                          background: `linear-gradient(135deg, ${item.color}88, rgba(255,255,255,0.55))`,
                          color: ink,
                          boxShadow: `0 8px 28px ${item.color}55`,
                        }
                      : isMinimal
                        ? {
                            background: `linear-gradient(135deg, ${item.color}, color-mix(in srgb, ${item.color} 70%, #3b82f6))`,
                            color: ink,
                          }
                        : { background: item.color, color: ink }
                    : undefined
                }
              >
                {isActive && !isSoft && (
                  <motion.span
                    layoutId="nav-dot"
                    className="absolute left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#1F2937]"
                  />
                )}
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-[12px] ${
                    isGlass
                      ? isActive
                        ? 'border border-white/60 bg-white/70'
                        : 'border border-white/40 bg-white/45'
                      : isMinimal
                        ? isActive
                          ? 'bg-white/25'
                          : 'bg-slate-100'
                        : `border-2 border-[#1F2937]/15 ${isActive ? 'bg-white/70' : 'bg-slate-100'}`
                  }`}
                >
                  <Icon size={16} />
                </span>
                <span className="truncate">{item.label}</span>
                {!isMinimal && (
                  <span
                    className="ml-auto h-3 w-3 shrink-0 rounded-full border border-black/10"
                    style={{ background: item.color }}
                  />
                )}
                {isMinimal && (
                  <span
                    className="ml-auto h-2 w-2 shrink-0 rounded-full"
                    style={{ background: isActive ? 'rgba(255,255,255,0.9)' : item.color }}
                  />
                )}
              </button>
            )
          })}
        </nav>

        <div className="mt-3 space-y-2">
          <button
            onClick={() => {
              onQuickAdd()
              onClose()
            }}
            className={
              isGlass
                ? 'glass-chip flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold text-[#0f172a] transition hover:scale-[1.02]'
                : isMinimal
                  ? 'flex w-full items-center justify-center gap-2 rounded-full bg-[#3B82F6] py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(59,130,246,0.3)] transition hover:scale-[1.02]'
                  : 'flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#1F2937] bg-[#FFEA5D] py-2.5 text-sm font-bold text-[#1F2937] shadow-[3px_3px_0_#1F2937] hover:scale-[1.02] dark:border-white/40'
            }
            style={isGlass ? { background: 'rgba(255, 234, 93, 0.75)' } : undefined}
          >
            <Plus size={16} /> Nova aba
          </button>
          <button
            onClick={() => {
              onPersonalizar()
              onClose()
            }}
            className={
              isGlass
                ? 'glass-chip flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold text-[var(--app-fg)] transition hover:scale-[1.02]'
                : isMinimal
                  ? 'soft-chip flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold text-[var(--app-fg)] transition hover:scale-[1.02]'
                  : 'flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#1F2937] bg-[var(--app-card)] py-2.5 text-sm font-bold text-[var(--app-fg)] shadow-[3px_3px_0_#1F2937] hover:scale-[1.02] dark:border-white/40'
            }
          >
            <Palette size={16} /> Personalizar
          </button>
          <button
            onClick={() => {
              onConfig()
              onClose()
            }}
            className={
              isGlass
                ? 'glass-chip flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold text-[#0f172a] transition hover:scale-[1.02]'
                : isMinimal
                  ? 'soft-chip flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold text-[var(--app-fg)] transition hover:scale-[1.02]'
                  : 'flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#1F2937] bg-[#70CFFF] py-2.5 text-sm font-bold text-[#1F2937] shadow-[3px_3px_0_#1F2937] hover:scale-[1.02] dark:border-white/40'
            }
            style={isGlass ? { background: 'rgba(112, 207, 255, 0.7)' } : undefined}
          >
            <Settings size={16} /> Configurações
          </button>
        </div>
      </aside>
    </>
  )
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  const { settings } = useSettings()
  const isGlass = settings.visualStyle === 'glass'
  return (
    <button
      onClick={onClick}
      className={
        isGlass
          ? 'glass-chip rounded-[16px] p-2.5 text-[var(--app-fg)] transition lg:hidden'
          : 'soft-chip rounded-[16px] p-2.5 text-[var(--app-fg)] transition lg:hidden'
      }
      aria-label="Abrir menu"
    >
      <Menu size={20} />
    </button>
  )
}
