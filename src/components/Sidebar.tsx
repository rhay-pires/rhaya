import { Menu, Palette, Plus, X } from 'lucide-react'
import { motion } from 'motion/react'
import { contrastText } from '../data/modules'
import { useCustomization } from '../store/CustomizationStore'
import type { ModuleId } from '../types'
import { MODULE_ICONS } from '../utils/icons'

interface SidebarProps {
  active: ModuleId
  onNavigate: (id: ModuleId) => void
  open: boolean
  onClose: () => void
  onPersonalizar: () => void
  onQuickAdd: () => void
}

export function Sidebar({
  active,
  onNavigate,
  open,
  onClose,
  onPersonalizar,
  onQuickAdd,
}: SidebarProps) {
  const { enabledModules } = useCustomization()

  return (
    <>
      {open && (
        <button
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-label="Fechar menu"
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-[290px] flex-col border-r-2 border-[#1F2937]/10 bg-white p-4 transition-transform duration-300 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border-2 border-[#1F2937] bg-[#D1C4FF] text-lg font-bold text-[#1F2937] shadow-[3px_3px_0_#1F2937]">
              R
            </div>
            <div>
              <p className="text-sm font-bold text-[#1F2937]">LifeHub</p>
              <p className="text-xs text-slate-500">Rhayanne OS</p>
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
                className={`relative flex w-full items-center gap-3 rounded-[18px] border-2 px-3 py-2.5 text-left text-sm font-bold transition hover:scale-[1.02] ${
                  isActive
                    ? 'border-[#1F2937] shadow-[3px_3px_0_#1F2937]'
                    : 'border-transparent text-slate-600 hover:bg-slate-50'
                }`}
                style={
                  isActive
                    ? { background: item.color, color: ink }
                    : undefined
                }
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-dot"
                    className="absolute left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#1F2937]"
                  />
                )}
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-[12px] border-2 border-[#1F2937]/15 ${
                    isActive ? 'bg-white/70' : 'bg-slate-100'
                  }`}
                >
                  <Icon size={16} />
                </span>
                <span className="truncate">{item.label}</span>
                <span
                  className="ml-auto h-3 w-3 shrink-0 rounded-full border border-black/10"
                  style={{ background: item.color }}
                />
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
            className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#1F2937] bg-[#FFEA5D] py-2.5 text-sm font-bold text-[#1F2937] shadow-[3px_3px_0_#1F2937] hover:scale-[1.02]"
          >
            <Plus size={16} /> Nova aba
          </button>
          <button
            onClick={() => {
              onPersonalizar()
              onClose()
            }}
            className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#1F2937] bg-white py-2.5 text-sm font-bold text-[#1F2937] shadow-[3px_3px_0_#1F2937] hover:scale-[1.02]"
          >
            <Palette size={16} /> Personalizar
          </button>
        </div>
      </aside>
    </>
  )
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-[16px] border-2 border-[#1F2937] bg-white p-2.5 text-[#1F2937] shadow-[3px_3px_0_#1F2937] hover:scale-105 lg:hidden"
      aria-label="Abrir menu"
    >
      <Menu size={20} />
    </button>
  )
}
