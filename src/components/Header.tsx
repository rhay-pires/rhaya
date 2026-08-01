import { Bell, ChevronLeft, ChevronRight, Eye, EyeOff, Palette, Settings, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { contrastText } from '../data/modules'
import { useApp } from '../store/AppStore'
import { useSettings } from '../store/SettingsStore'
import { greeting, monthLabel } from '../utils/format'
import { Avatar } from './Avatar'
import { MobileMenuButton } from './Sidebar'

interface HeaderProps {
  onOpenMenu: () => void
  onPersonalizar: () => void
  onConfig: () => void
  themeColor: string
  moduleLabel?: string
}

export function Header({ onOpenMenu, onPersonalizar, onConfig, themeColor, moduleLabel }: HeaderProps) {
  const {
    year,
    month,
    shiftMonth,
    balanceVisible,
    setBalanceVisible,
    notifications,
    dismissNotification,
  } = useApp()
  const { settings } = useSettings()
  const isGlass = settings.visualStyle === 'glass'
  const isMinimal = settings.visualStyle === 'minimal'
  const isSoft = isGlass || isMinimal
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
        className={
          isGlass
            ? 'glass-panel relative overflow-hidden rounded-[32px] p-5 md:p-7'
            : isMinimal
              ? 'soft-panel relative overflow-hidden rounded-[28px] p-5 md:p-7'
              : 'relative rounded-[32px] border-2 border-[#1F2937] p-5 shadow-[6px_6px_0_#1F2937] md:p-7'
        }
        style={
          isGlass
            ? {
                color: 'var(--app-fg)',
                boxShadow: `0 20px 50px ${themeColor}33, inset 0 1px 0 rgba(255,255,255,0.7)`,
              }
            : isMinimal
              ? { color: 'var(--app-fg)' }
              : { background: themeColor, color: ink }
        }
      >
        {isGlass && (
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-50 blur-3xl"
            style={{ background: themeColor }}
          />
        )}
        {isMinimal && (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-1.5 rounded-l-[28px]"
            style={{ background: themeColor }}
          />
        )}
        {!isSoft && (
          <div className="pointer-events-none absolute -right-8 top-0 overflow-hidden text-7xl opacity-20">
            ✨
          </div>
        )}

        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <MobileMenuButton onClick={onOpenMenu} />
            <div className="relative">
              <Avatar
                url={settings.avatarUrl}
                initials={settings.avatarInitials}
                size="lg"
              />
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#A5F387] ${
                  isSoft ? 'border-2 border-white shadow-sm' : 'border-2 border-[#1F2937]'
                }`}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                {greeting()}, {isSoft ? '👋' : '✨'} {settings.displayName}
              </h1>
              <p className={`mt-1 text-sm ${isSoft ? 'text-slate-500' : 'opacity-80'}`}>
                {moduleLabel ? `Módulo: ${moduleLabel}` : 'Seu Life Operating System'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className={
                isGlass
                  ? 'glass-chip flex items-center gap-1 rounded-full px-2 py-1.5 text-[var(--app-fg)]'
                  : isMinimal
                    ? 'soft-chip flex items-center gap-1 rounded-full px-2 py-1.5 text-[var(--app-fg)]'
                    : 'flex items-center gap-1 rounded-full border-2 border-[#1F2937] bg-white/80 px-2 py-1.5 text-[#1F2937] shadow-[2px_2px_0_#1F2937]'
              }
            >
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

            {(
              [
                {
                  onClick: () => setBalanceVisible(!balanceVisible),
                  label: 'Alternar visibilidade do saldo',
                  icon: balanceVisible ? <Eye size={18} /> : <EyeOff size={18} />,
                },
                {
                  onClick: onPersonalizar,
                  label: 'Personalizar',
                  icon: <Palette size={18} />,
                },
                {
                  onClick: onConfig,
                  label: 'Configurações',
                  icon: <Settings size={18} />,
                },
              ] as const
            ).map((btn) => (
              <button
                key={btn.label}
                onClick={btn.onClick}
                className={
                  isGlass
                    ? 'glass-chip rounded-full p-2.5 text-[var(--app-fg)] transition hover:scale-105'
                    : isMinimal
                      ? 'soft-chip rounded-full p-2.5 text-[var(--app-fg)] transition hover:scale-105'
                      : 'rounded-full border-2 border-[#1F2937] bg-white/80 p-2.5 text-[#1F2937] shadow-[2px_2px_0_#1F2937] hover:scale-105'
                }
                aria-label={btn.label}
                title={btn.label}
              >
                {btn.icon}
              </button>
            ))}

            <button
              ref={buttonRef}
              onClick={() => setShowNotifs((v) => !v)}
              className={
                isGlass
                  ? 'glass-chip relative rounded-full p-2.5 text-[var(--app-fg)] transition hover:scale-105'
                  : isMinimal
                    ? 'soft-chip relative rounded-full p-2.5 text-[var(--app-fg)] transition hover:scale-105'
                    : 'relative rounded-full border-2 border-[#1F2937] bg-white/80 p-2.5 text-[#1F2937] shadow-[2px_2px_0_#1F2937] hover:scale-105'
              }
              aria-label="Notificações"
              aria-expanded={showNotifs}
            >
              <Bell size={18} />
              {notifications.length > 0 && (
                <span
                  className={`absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FDA4AF] px-1 text-[10px] font-bold leading-none text-[#1F2937] ${
                    isSoft ? 'border-2 border-white' : 'border-2 border-[#1F2937]'
                  }`}
                >
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
                  className={
                    isGlass
                      ? 'glass-panel fixed z-[80] w-[min(20rem,calc(100vw-1.5rem))] rounded-[24px] p-3 text-slate-700'
                      : isMinimal
                        ? 'soft-panel fixed z-[80] w-[min(20rem,calc(100vw-1.5rem))] rounded-[24px] p-3 text-slate-700'
                        : 'fixed z-[80] w-[min(20rem,calc(100vw-1.5rem))] rounded-[24px] border-2 border-[#1F2937] bg-white p-3 text-slate-700 shadow-[4px_4px_0_#1F2937]'
                  }
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
