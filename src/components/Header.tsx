import { Bell, ChevronLeft, ChevronRight, Eye, EyeOff, Palette, Settings, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { contrastText } from '../data/modules'
import { useApp } from '../store/AppStore'
import { useSettings } from '../store/SettingsStore'
import { greeting, monthLabel, todayLongLabel, todayShortLabel } from '../utils/format'
import { Avatar } from './Avatar'
import { MobileMenuButton } from './Sidebar'

interface HeaderProps {
  onOpenMenu: () => void
  onPersonalizar: () => void
  onConfig: () => void
  themeColor: string
  moduleLabel?: string
}

function chipClass(isGlass: boolean, isMinimal: boolean) {
  if (isGlass) return 'glass-chip text-[var(--app-fg)]'
  if (isMinimal) return 'soft-chip text-[var(--app-fg)]'
  return 'border-2 border-[#1F2937] bg-white/80 text-[#1F2937] shadow-[2px_2px_0_#1F2937]'
}

export function Header({ onOpenMenu, onPersonalizar, onConfig, themeColor, moduleLabel }: HeaderProps) {
  const {
    year,
    month,
    shiftMonth,
    setYear,
    setMonth,
    balanceVisible,
    setBalanceVisible,
    notifications,
    dismissNotification,
  } = useApp()
  const { settings } = useSettings()
  const isGlass = settings.visualStyle === 'glass'
  const isMinimal = settings.visualStyle === 'minimal'
  const isSoft = isGlass || isMinimal
  const now = new Date()
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()
  const goToCurrentMonth = () => {
    setYear(now.getFullYear())
    setMonth(now.getMonth())
  }
  const [showNotifs, setShowNotifs] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelPos, setPanelPos] = useState({ top: 0, right: 16 })
  const ink = contrastText(themeColor)
  const chip = chipClass(isGlass, isMinimal)

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
    <header className="mb-4 md:mb-6">
      <div
        className={
          isGlass
            ? 'glass-panel relative overflow-hidden rounded-[24px] p-3.5 md:rounded-[32px] md:p-7'
            : isMinimal
              ? 'soft-panel relative overflow-hidden rounded-[22px] p-3.5 md:rounded-[28px] md:p-7'
              : 'relative rounded-[24px] border-2 border-[#1F2937] p-3.5 shadow-[4px_4px_0_#1F2937] md:rounded-[32px] md:p-7 md:shadow-[6px_6px_0_#1F2937]'
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
            className="pointer-events-none absolute inset-y-0 left-0 w-1.5 rounded-l-[22px] md:rounded-l-[28px]"
            style={{ background: themeColor }}
          />
        )}
        {!isSoft && (
          <div className="pointer-events-none absolute -right-8 top-0 hidden overflow-hidden text-7xl opacity-20 md:block">
            ✨
          </div>
        )}

        <div className="relative z-10 flex items-center gap-2.5 md:gap-4">
          <MobileMenuButton onClick={onOpenMenu} />

          {/* Avatar só no desktop */}
          <div className="relative hidden md:block">
            <Avatar url={settings.avatarUrl} initials={settings.avatarInitials} size="lg" />
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#A5F387] ${
                isSoft ? 'border-2 border-white shadow-sm' : 'border-2 border-[#1F2937]'
              }`}
            />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold tracking-tight leading-tight md:text-3xl">
              <span className="md:hidden">
                {greeting()}, {settings.displayName}
              </span>
              <span className="hidden md:inline">
                {greeting()}, {isSoft ? '👋' : '✨'} {settings.displayName}
              </span>
            </h1>
            <p className={`mt-0.5 truncate text-xs capitalize md:mt-1 md:text-sm ${isSoft ? 'text-slate-500' : 'opacity-75 md:opacity-80'}`}>
              <span className="md:hidden">{todayShortLabel()}</span>
              <span className="hidden md:inline">{todayLongLabel()}</span>
              {moduleLabel ? (
                <span className="hidden sm:inline">{` · ${moduleLabel}`}</span>
              ) : null}
            </p>
          </div>

          {/* Ações desktop */}
          <div className="hidden items-center gap-2 md:flex">
            <div className={`flex items-center gap-1 rounded-full px-2 py-1.5 ${chip}`}>
              <button
                onClick={() => shiftMonth(-1)}
                className="rounded-full p-1.5 hover:bg-black/5"
                aria-label="Mês anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={goToCurrentMonth}
                className="min-w-[140px] text-center text-sm font-bold capitalize hover:underline"
                title={isCurrentMonth ? 'Mês atual' : 'Voltar para o mês atual'}
              >
                {monthLabel(year, month)}
              </button>
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
                className={`rounded-full p-2.5 transition hover:scale-105 ${chip}`}
                aria-label={btn.label}
                title={btn.label}
              >
                {btn.icon}
              </button>
            ))}
          </div>

          {/* Sino — único (mobile + desktop) */}
          <button
            ref={buttonRef}
            onClick={() => setShowNotifs((v) => !v)}
            className={`relative shrink-0 rounded-full p-2.5 transition hover:scale-105 ${chip}`}
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

      {/* Se o mês foi desviado no desktop, no mobile mostra atalho pra voltar */}
      {!isCurrentMonth && (
        <div className="mt-2 flex justify-center md:hidden">
          <button
            type="button"
            onClick={goToCurrentMonth}
            className={`rounded-full px-4 py-2 text-xs font-bold ${chip}`}
          >
            Voltar para {monthLabel(now.getFullYear(), now.getMonth())}
          </button>
        </div>
      )}

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
