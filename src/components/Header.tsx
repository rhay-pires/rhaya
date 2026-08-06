import { Bell, ChevronLeft, ChevronRight, Eye, EyeOff, Palette, Settings, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { useApp } from '../store/AppStore'
import { useSettings } from '../store/SettingsStore'
import { greeting, monthLabel, todayLongLabel, todayShortLabel } from '../utils/format'
import { Avatar } from './Avatar'
import { MobileMenuButton } from './Sidebar'

function useIsDesktop() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia('(min-width: 1024px)')
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    },
    () => window.matchMedia('(min-width: 1024px)').matches,
    () => true,
  )
}

interface HeaderProps {
  onOpenMenu: () => void
  onPersonalizar: () => void
  onConfig: () => void
  themeColor: string
  moduleLabel?: string
  /** Home: saudação; demais módulos: título simples no mobile */
  isHome?: boolean
}

function chipClass(isGlass: boolean, isMinimal: boolean) {
  if (isGlass) return 'glass-chip text-[var(--app-fg)]'
  if (isMinimal) return 'soft-chip text-[var(--app-fg)]'
  return 'soft-chip text-[var(--app-fg)]'
}

export function Header({
  onOpenMenu,
  onPersonalizar,
  onConfig,
  themeColor,
  moduleLabel,
  isHome = false,
}: HeaderProps) {
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
  const isDesktop = useIsDesktop()
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

  const notifButton = (
    <button
      ref={buttonRef}
      onClick={() => setShowNotifs((v) => !v)}
            className="relative shrink-0 rounded-full bg-[var(--app-card)] p-2.5 text-[var(--app-fg)] shadow-[var(--shadow-soft)]"
      aria-label="Notificações"
      aria-expanded={showNotifs}
    >
      <Bell size={18} />
      {notifications.length > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FDA4AF] px-1 text-[9px] font-bold text-[#1F2937]">
          {notifications.length}
        </span>
      )}
    </button>
  )

  return (
    <header className={isHome ? 'mb-3 lg:mb-6' : 'mb-3 lg:mb-6'}>
      {/* Mobile / tablet — barra fina (alinhado ao sidebar lg) */}
      {!isDesktop && (
        <div className="flex items-center gap-3">
          <MobileMenuButton onClick={onOpenMenu} />
          {isHome ? (
            <>
              <Avatar url={settings.avatarUrl} initials={settings.avatarInitials} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500">{greeting()}!</p>
                <p className="truncate text-[15px] font-bold leading-tight text-[var(--app-fg)]">
                  {settings.displayName}
                </p>
              </div>
            </>
          ) : (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[17px] font-bold leading-tight text-[var(--app-fg)]">
                {moduleLabel ?? 'LifeHub'}
              </p>
              <p className="truncate text-xs capitalize text-slate-500">{todayShortLabel()}</p>
            </div>
          )}
          {notifButton}
        </div>
      )}

      {/* Desktop — barra soft (sem card brutal) */}
      {isDesktop && (
        <div className="soft-panel relative overflow-hidden rounded-[28px] px-6 py-5">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-1.5 rounded-l-[28px]"
            style={{ background: themeColor }}
          />
          <div className="relative z-10 flex items-center gap-4 pl-2">
            <div className="relative">
              <Avatar url={settings.avatarUrl} initials={settings.avatarInitials} size="lg" />
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#C8F560]" />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl font-bold tracking-tight text-[var(--app-fg)] lg:text-3xl">
                {greeting()}, {settings.displayName}
              </h1>
              <p className="mt-0.5 truncate text-sm capitalize text-[var(--app-muted)]">
                {todayLongLabel()}
                {moduleLabel ? ` · ${moduleLabel}` : ''}
              </p>
            </div>

            <div className="flex items-center gap-2">
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
                  className="min-w-[140px] text-center text-sm font-semibold capitalize text-[var(--app-fg)] hover:underline"
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
                  className={`rounded-full p-2.5 transition hover:bg-black/[0.04] ${chip}`}
                  aria-label={btn.label}
                  title={btn.label}
                >
                  {btn.icon}
                </button>
              ))}
              <button
                ref={buttonRef}
                onClick={() => setShowNotifs((v) => !v)}
                className={`relative shrink-0 rounded-full p-2.5 transition hover:bg-black/[0.04] ${chip}`}
                aria-label="Notificações"
                aria-expanded={showNotifs}
              >
                <Bell size={18} />
                {notifications.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FDA4AF] px-1 text-[9px] font-bold text-[#1C1917]">
                    {notifications.length}
                  </span>
                )}
              </button>
            </div>
          </div>
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
                  className="soft-panel fixed z-[80] w-[min(320px,calc(100vw-24px))] overflow-hidden rounded-[20px] p-3"
                  style={{ top: panelPos.top, right: panelPos.right }}
                >
                  <div className="mb-2 flex items-center justify-between px-1">
                    <p className="text-sm font-bold text-[var(--app-fg)]">Notificações</p>
                    <button
                      type="button"
                      className="rounded-full p-1 text-slate-400 hover:bg-black/5"
                      onClick={() => setShowNotifs(false)}
                      aria-label="Fechar"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="px-1 py-6 text-center text-sm text-slate-400">Tudo em dia</p>
                  ) : (
                    <ul className="max-h-72 space-y-2 overflow-y-auto">
                      {notifications.map((n, i) => (
                        <li
                          key={`${n}-${i}`}
                          className="flex items-start justify-between gap-2 rounded-2xl bg-violet-50 px-3 py-2.5 text-sm text-[var(--app-fg)]"
                        >
                          <span>{n}</span>
                          <button
                            type="button"
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
