import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useSettings } from '../store/SettingsStore'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}

export function Modal({ open, title, onClose, children, wide }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`bento-card w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto p-6`}
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
              <button
                onClick={onClose}
                className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:scale-105 hover:bg-slate-200"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold text-[var(--app-fg)] md:text-2xl">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
  )
}

export function PillTabs<T extends string>({
  tabs,
  active,
  onChange,
  accent,
}: {
  tabs: { id: T; label: string }[]
  active: T
  onChange: (id: T) => void
  accent?: string
}) {
  const { settings } = useSettings()
  const style = settings.visualStyle
  const accentColor = accent ?? '#6C4BFF'

  return (
    <div
      className={
        style === 'glass'
          ? 'glass-panel mb-5 flex flex-wrap gap-2 rounded-[24px] p-2'
          : style === 'minimal'
            ? 'soft-panel mb-5 flex flex-wrap gap-2 rounded-[24px] p-2'
            : 'mb-5 flex flex-wrap gap-2 rounded-[24px] border-2 border-[#1F2937] bg-white p-2 shadow-[3px_3px_0_#1F2937]'
      }
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition hover:scale-[1.02] ${
              isActive
                ? style === 'minimal'
                  ? 'text-white shadow-[0_8px_20px_rgba(59,130,246,0.28)]'
                  : style === 'glass'
                    ? 'border border-white/50 text-[#0f172a] shadow-[0_8px_24px_rgba(99,102,241,0.18)]'
                    : 'border-2 border-[#1F2937] text-[#1F2937] shadow-[2px_2px_0_#1F2937]'
                : style === 'minimal'
                  ? 'text-slate-500 hover:bg-slate-50'
                  : style === 'glass'
                    ? 'text-slate-600 hover:bg-white/35'
                    : 'text-slate-600 hover:bg-slate-50'
            }`}
            style={
              isActive
                ? style === 'minimal'
                  ? { background: accentColor }
                  : style === 'glass'
                    ? {
                        background: `linear-gradient(135deg, ${accentColor}99, rgba(255,255,255,0.65))`,
                      }
                    : { background: accentColor }
                : undefined
            }
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

export function EmptyState({ text }: { text: string }) {
  const { settings } = useSettings()
  const style = settings.visualStyle
  return (
    <div
      className={
        style === 'minimal'
          ? 'rounded-[24px] border border-dashed border-[var(--app-border)] bg-[var(--app-soft)] px-4 py-8 text-center text-sm text-slate-500'
          : style === 'glass'
            ? 'rounded-[24px] border border-dashed border-white/40 bg-white/30 px-4 py-8 text-center text-sm text-slate-500 backdrop-blur'
            : 'rounded-[24px] border-2 border-dashed border-[#1F2937]/25 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500'
      }
    >
      {text}
    </div>
  )
}
