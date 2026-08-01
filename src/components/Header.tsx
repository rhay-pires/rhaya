import { Bell, ChevronLeft, ChevronRight, Eye, EyeOff, Palette, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { contrastText } from '../data/modules'
import { useApp } from '../store/AppStore'
import { greeting, monthLabel } from '../utils/format'
import { MobileMenuButton } from './Sidebar'

interface HeaderProps {
  onOpenMenu: () => void
  onPersonalizar: () => void
  themeColor: string
  moduleLabel?: string
}

export function Header({ onOpenMenu, onPersonalizar, themeColor, moduleLabel }: HeaderProps) {
  const {
    year,
    month,
    shiftMonth,
    balanceVisible,
    setBalanceVisible,
    notifications,
    dismissNotification,
  } = useApp()
  const [showNotifs, setShowNotifs] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelPos, setPanelPos] = useState({ top: 0, right: 16 })
  const ink = contrastText(themeColor)

  useEffect(() => {
    if (!showNotifs) return

    const updatePos = () => {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      const width = Math.min(320, window.innerWidth - 24)
      const right = Math.max(12, window.innerWidth - rect.right)
      const top = rect.bottom + 10
      setPanelPos({ top, right: Math.min(right, window.innerWidth - width - 12) })
    }

    updatePos()
    window.addEventListener('resize', updatePos)
    window.addEventListener('scroll', updatePos, true)
    return () => {
      window.removeEventListener('resize', updatePos)
      window.removeEventListener('scroll', updatePos, true)
    }
  }, [showNotifs])

  useEffect(() => {
    if (!showNotifs) return
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node
      if (buttonRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setShowNotifs(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowNotifs(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('touchstart', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('touchstart', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [showNotifs])

  return (
    <header className="mb-6 space-y-4">
      <div
        className="relative rounded-[32px] border-2 border-[#1F2937] p-5 shadow-[6px_6px_0_#1F2937] md:p-7"
        style={{ background: themeColor, color: ink }}
      >
        <div className="pointer-events-none absolute -right-8 top-0 overflow-hidden text-7xl opacity-20">
          ✨
        </div>

        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <MobileMenuButton onClick={onOpenMenu} />
            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#1F2937] bg-white text-xl font-bold text-[#1F2937] shadow-[3px_3px_0_#1F2937] md:h-16 md:w-16">
                Rh
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-[#1F2937] bg-[#A5F387]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                {greeting()}, ✨ Rhayanne
              </h1>
              <p className="mt-1 text-sm opacity-80">
                {moduleLabel ? `Módulo: ${moduleLabel}` : 'Seu Life Operating System'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-full border-2 border-[#1F2937] bg-white/80 px-2 py-1.5 text-[#1F2937] shadow-[2px_2px_0_#1F2937]">
              <button
                onClick={() => shiftMonth(-1)}
                className="rounded-full p-1.5 hover:bg-black/5"
                aria-label="Mês anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="min-w-[140px] text-center text-sm font-bold capitalize">
                {monthLabel(year, month)}
              </span>
              <button
                onClick={() => shiftMonth(1)}
                className="rounded-full p-1.5 hover:bg-black/5"
                aria-label="Próximo mês"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <button
              onClick={() => setBalanceVisible(!balanceVisible)}
              className="rounded-full border-2 border-[#1F2937] bg-white/80 p-2.5 text-[#1F2937] shadow-[2px_2px_0_#1F2937] hover:scale-105"
              aria-label="Alternar visibilidade do saldo"
            >
              {balanceVisible ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>

            <button
              onClick={onPersonalizar}
              className="rounded-full border-2 border-[#1F2937] bg-white/80 p-2.5 text-[#1F2937] shadow-[2px_2px_0_#1F2937] hover:scale-105"
              aria-label="Personalizar"
              title="Personalizar"
            >
              <Palette size={18} />
            </button>

            <button
              ref={buttonRef}
              onClick={() => setShowNotifs((v) => !v)}
              className="relative rounded-full border-2 border-[#1F2937] bg-white/80 p-2.5 text-[#1F2937] shadow-[2px_2px_0_#1F2937] hover:scale-105"
              aria-label="Notificações"
              aria-expanded={showNotifs}
            >
              <Bell size={18} />
              {notifications.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#1F2937] bg-[#FDA4AF] px-1 text-[10px] font-bold leading-none text-[#1F2937]">
                  {notifications.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {showNotifs && (
              <>
                <motion.button
                  type="button"
                  aria-label="Fechar notificações"
                  className="fixed inset-0 z-[70] bg-[#1F2937]/25 backdrop-blur-[2px] md:bg-transparent md:backdrop-blur-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowNotifs(false)}
                />
                <motion.div
                  ref={panelRef}
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  className="fixed z-[80] w-[min(20rem,calc(100vw-1.5rem))] rounded-[24px] border-2 border-[#1F2937] bg-white p-3 text-slate-700 shadow-[4px_4px_0_#1F2937]"
                  style={{ top: panelPos.top, right: panelPos.right }}
                  role="dialog"
                  aria-label="Lista de notificações"
                >
                  <div className="mb-2 flex items-center justify-between px-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Notificações
                    </p>
                    <button
                      onClick={() => setShowNotifs(false)}
                      className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Fechar"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="px-2 py-6 text-center text-sm text-slate-400">Tudo em dia ✨</p>
                  ) : (
                    <ul className="max-h-64 space-y-2 overflow-y-auto">
                      {notifications.map((n, i) => (
                        <li
                          key={`${n}-${i}`}
                          className="flex items-start justify-between gap-2 rounded-2xl bg-violet-50 px-3 py-2 text-sm"
                        >
                          <span>{n}</span>
                          <button
                            onClick={() => dismissNotification(i)}
                            className="shrink-0 text-xs font-bold text-violet-600 hover:underline"
                          >
                            ok
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </header>
  )
}
