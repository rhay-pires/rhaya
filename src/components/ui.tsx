import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

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
      <h2 className="text-xl font-bold text-slate-800 md:text-2xl">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
  )
}

export function PillTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[]
  active: T
  onChange: (id: T) => void
}) {
  return (
    <div className="mb-5 flex flex-wrap gap-2 rounded-[24px] bg-white/70 p-2 border border-gray-100">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition hover:scale-[1.02] ${
            active === tab.id
              ? 'bg-gradient-to-r from-[#6C4BFF] to-[#3B82F6] text-white shadow-md'
              : 'bg-transparent text-slate-600 hover:bg-violet-50'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-violet-200 bg-violet-50/40 px-4 py-8 text-center text-sm text-slate-500">
      {text}
    </div>
  )
}
