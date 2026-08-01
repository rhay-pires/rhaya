import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type {
  Appointment,
  BankAccount,
  Book,
  CategoryLimit,
  ContentItem,
  CreditCard,
  FinancialGoal,
  Flashcard,
  GratitudeEntry,
  Habit,
  HealthLog,
  JournalEntry,
  LifeGoal,
  MoodEntry,
  PurchaseDecision,
  Subject,
  Subscription,
  Transaction,
  WheelScore,
  WorkTask,
} from '../types'
import {
  affirmations,
  initialAccounts,
  initialAppointments,
  initialBooks,
  initialCards,
  initialContent,
  initialDecisions,
  initialFlashcards,
  initialGoals,
  initialGratitude,
  initialHabits,
  initialHealth,
  initialJournal,
  initialLifeGoals,
  initialLimits,
  initialMoods,
  initialSubjects,
  initialSubscriptions,
  initialTasks,
  initialTransactions,
  initialWheel,
} from '../data/seed'
import { isSameMonth, todayISO, uid } from '../utils/format'
import { loadJSON, saveJSON } from '../utils/storage'
import { computeStreak } from '../utils/habits'

const STORAGE_KEY = 'lifehub-data-v1'

interface PersistedData {
  balanceVisible: boolean
  notifications: string[]
  accounts: BankAccount[]
  cards: CreditCard[]
  transactions: Transaction[]
  financialGoals: FinancialGoal[]
  limits: CategoryLimit[]
  subscriptions: Subscription[]
  decisions: PurchaseDecision[]
  appointments: Appointment[]
  habits: Habit[]
  tasks: WorkTask[]
  lifeGoals: LifeGoal[]
  subjects: Subject[]
  flashcards: Flashcard[]
  health: HealthLog
  healthHistory: HealthLog[]
  wheel: WheelScore[]
  gratitude: GratitudeEntry[]
  books: Book[]
  content: ContentItem[]
  moods: MoodEntry[]
  journal: JournalEntry[]
}

const defaults: PersistedData = {
  balanceVisible: true,
  notifications: [
    'Fatura Nubank vence em 3 dias',
    'Hábito “Beber 2L água” ainda pendente',
    'Reunião às 10:00 — prepare a pauta',
  ],
  accounts: initialAccounts,
  cards: initialCards,
  transactions: initialTransactions,
  financialGoals: initialGoals,
  limits: initialLimits,
  subscriptions: initialSubscriptions,
  decisions: initialDecisions,
  appointments: initialAppointments,
  habits: initialHabits,
  tasks: initialTasks,
  lifeGoals: initialLifeGoals,
  subjects: initialSubjects,
  flashcards: initialFlashcards,
  health: initialHealth,
  healthHistory: [],
  wheel: initialWheel,
  gratitude: initialGratitude,
  books: initialBooks,
  content: initialContent,
  moods: initialMoods,
  journal: initialJournal,
}

interface AppStore extends PersistedData {
  setBalanceVisible: (v: boolean) => void
  year: number
  month: number
  setYear: (y: number) => void
  setMonth: (m: number) => void
  shiftMonth: (delta: number) => void
  addNotification: (msg: string) => void
  dismissNotification: (i: number) => void
  setAccounts: React.Dispatch<React.SetStateAction<BankAccount[]>>
  setCards: React.Dispatch<React.SetStateAction<CreditCard[]>>
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>
  setFinancialGoals: React.Dispatch<React.SetStateAction<FinancialGoal[]>>
  setLimits: React.Dispatch<React.SetStateAction<CategoryLimit[]>>
  setSubscriptions: React.Dispatch<React.SetStateAction<Subscription[]>>
  setDecisions: React.Dispatch<React.SetStateAction<PurchaseDecision[]>>
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>
  setTasks: React.Dispatch<React.SetStateAction<WorkTask[]>>
  setLifeGoals: React.Dispatch<React.SetStateAction<LifeGoal[]>>
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>
  setFlashcards: React.Dispatch<React.SetStateAction<Flashcard[]>>
  setHealth: React.Dispatch<React.SetStateAction<HealthLog>>
  setHealthHistory: React.Dispatch<React.SetStateAction<HealthLog[]>>
  setWheel: React.Dispatch<React.SetStateAction<WheelScore[]>>
  setGratitude: React.Dispatch<React.SetStateAction<GratitudeEntry[]>>
  setBooks: React.Dispatch<React.SetStateAction<Book[]>>
  setContent: React.Dispatch<React.SetStateAction<ContentItem[]>>
  setMoods: React.Dispatch<React.SetStateAction<MoodEntry[]>>
  setJournal: React.Dispatch<React.SetStateAction<JournalEntry[]>>
  affirmations: string[]
  addTransaction: (tx: Omit<Transaction, 'id'>) => void
  deleteTransaction: (id: string) => void
  payInvoice: (cardId: string) => void
  depositGoal: (goalId: string, amount: number, accountId?: string) => void
  toggleHabit: (habitId: string, dateISO?: string) => void
  generateRecurring: () => void
  replaceAllData: (data: Partial<PersistedData>) => void
  resetAllData: () => void
  exportData: () => PersistedData
}

const AppContext = createContext<AppStore | null>(null)

function loadPersisted(): PersistedData {
  const saved = loadJSON<Partial<PersistedData>>(STORAGE_KEY, {})
  const settings = loadJSON<{ hideBalancesByDefault?: boolean }>('lifehub-settings-v1', {})
  const merged = { ...defaults, ...saved }
  if (settings.hideBalancesByDefault && saved.balanceVisible === undefined) {
    merged.balanceVisible = false
  }
  return merged
}

export function AppProvider({ children }: { children: ReactNode }) {
  const now = new Date()
  const initial = loadPersisted()

  const [balanceVisible, setBalanceVisible] = useState(initial.balanceVisible)
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [notifications, setNotifications] = useState(initial.notifications)
  const [accounts, setAccounts] = useState(initial.accounts)
  const [cards, setCards] = useState(initial.cards)
  const [transactions, setTransactions] = useState(initial.transactions)
  const [financialGoals, setFinancialGoals] = useState(initial.financialGoals)
  const [limits, setLimits] = useState(initial.limits)
  const [subscriptions, setSubscriptions] = useState(initial.subscriptions)
  const [decisions, setDecisions] = useState(initial.decisions)
  const [appointments, setAppointments] = useState(initial.appointments)
  const [habits, setHabits] = useState(initial.habits)
  const [tasks, setTasks] = useState(initial.tasks)
  const [lifeGoals, setLifeGoals] = useState(initial.lifeGoals)
  const [subjects, setSubjects] = useState(initial.subjects)
  const [flashcards, setFlashcards] = useState(initial.flashcards)
  const [health, setHealth] = useState(initial.health)
  const [healthHistory, setHealthHistory] = useState(initial.healthHistory)
  const [wheel, setWheel] = useState(initial.wheel)
  const [gratitude, setGratitude] = useState(initial.gratitude)
  const [books, setBooks] = useState(initial.books)
  const [content, setContent] = useState(initial.content)
  const [moods, setMoods] = useState(initial.moods)
  const [journal, setJournal] = useState(initial.journal)

  const persisted: PersistedData = useMemo(
    () => ({
      balanceVisible,
      notifications,
      accounts,
      cards,
      transactions,
      financialGoals,
      limits,
      subscriptions,
      decisions,
      appointments,
      habits,
      tasks,
      lifeGoals,
      subjects,
      flashcards,
      health,
      healthHistory,
      wheel,
      gratitude,
      books,
      content,
      moods,
      journal,
    }),
    [
      balanceVisible,
      notifications,
      accounts,
      cards,
      transactions,
      financialGoals,
      limits,
      subscriptions,
      decisions,
      appointments,
      habits,
      tasks,
      lifeGoals,
      subjects,
      flashcards,
      health,
      healthHistory,
      wheel,
      gratitude,
      books,
      content,
      moods,
      journal,
    ],
  )

  useEffect(() => {
    saveJSON(STORAGE_KEY, persisted)
  }, [persisted])

  // Reset diário do log de saúde ao virar o dia (mantém peso)
  useEffect(() => {
    const today = todayISO()
    if (health.date !== today) {
      setHealthHistory((h) => [health, ...h].slice(0, 60))
      setHealth({
        date: today,
        waterMl: 0,
        sleepHours: 0,
        workout: '',
        meals: '',
        weightKg: health.weightKg,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Notifica compromissos de hoje com lembrete ativo, uma vez ao abrir o app
  const remindedRef = useRef(false)
  useEffect(() => {
    if (remindedRef.current) return
    remindedRef.current = true
    const today = todayISO()
    const due = appointments.filter((a) => a.reminder && a.date === today && !a.done)
    if (due.length > 0) {
      due.forEach((a) => {
        setNotifications((n) => [`Lembrete: ${a.title} às ${a.time}`, ...n].slice(0, 8))
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  const addNotification = (msg: string) => {
    setNotifications((n) => [msg, ...n].slice(0, 8))
  }

  const dismissNotification = (i: number) => {
    setNotifications((n) => n.filter((_, idx) => idx !== i))
  }

  const addTransaction = (tx: Omit<Transaction, 'id'>) => {
    const id = uid('tx')
    setTransactions((list) => [{ ...tx, id }, ...list])
    setAccounts((accs) =>
      accs.map((a) => {
        if (a.id !== tx.accountId) return a
        const delta = tx.type === 'receita' ? tx.amount : -tx.amount
        return { ...a, balance: a.balance + delta }
      }),
    )
    addNotification(`${tx.type === 'receita' ? 'Receita' : 'Despesa'} registrada: ${tx.description}`)
  }

  const deleteTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id)
    if (!tx) return
    setTransactions((list) => list.filter((t) => t.id !== id))
    setAccounts((accs) =>
      accs.map((a) => {
        if (a.id !== tx.accountId) return a
        const delta = tx.type === 'receita' ? -tx.amount : tx.amount
        return { ...a, balance: a.balance + delta }
      }),
    )
  }

  const payInvoice = (cardId: string) => {
    const card = cards.find((c) => c.id === cardId)
    if (!card || card.invoiceAmount <= 0) return
    const account = accounts.find((a) => a.id === card.linkedAccountId)
    if (!account) return
    if (account.balance < card.invoiceAmount) {
      addNotification(`Saldo insuficiente em ${account.name} para pagar a fatura.`)
      return
    }
    const amount = card.invoiceAmount
    setAccounts((accs) =>
      accs.map((a) => (a.id === account.id ? { ...a, balance: a.balance - amount } : a)),
    )
    setCards((list) =>
      list.map((c) =>
        c.id === cardId ? { ...c, invoiceAmount: 0, used: Math.max(0, c.used - amount) } : c,
      ),
    )
    setTransactions((list) => [
      {
        id: uid('tx'),
        type: 'despesa',
        category: 'Fatura',
        description: `Pagamento fatura ${card.name}`,
        amount,
        date: todayISO(),
        accountId: account.id,
        cardId: card.id,
      },
      ...list,
    ])
    addNotification(`Fatura ${card.name} paga com sucesso!`)
  }

  const depositGoal = (goalId: string, amount: number, accountId?: string) => {
    if (amount <= 0) return
    const goal = financialGoals.find((g) => g.id === goalId)
    setFinancialGoals((goals) =>
      goals.map((g) =>
        g.id === goalId ? { ...g, currentAmount: Math.min(g.targetAmount, g.currentAmount + amount) } : g,
      ),
    )
    if (accountId) {
      setAccounts((accs) =>
        accs.map((a) => (a.id === accountId ? { ...a, balance: a.balance - amount } : a)),
      )
      setTransactions((list) => [
        {
          id: uid('tx'),
          type: 'despesa',
          category: 'Outros',
          description: `Depósito na meta: ${goal?.title ?? ''}`,
          amount,
          date: todayISO(),
          accountId,
        },
        ...list,
      ])
    }
    addNotification(`Depósito de R$ ${amount.toFixed(2)} na meta!`)
  }

  const toggleHabit = (habitId: string, dateISO?: string) => {
    const date = dateISO ?? todayISO()
    setHabits((list) =>
      list.map((h) => {
        if (h.id !== habitId) return h
        const has = h.completedDates.includes(date)
        const completedDates = has
          ? h.completedDates.filter((d) => d !== date)
          : [...h.completedDates, date]
        const next = { ...h, completedDates }
        return { ...next, streak: computeStreak(next) }
      }),
    )
  }

  const generateRecurring = () => {
    const d = new Date(year, month, 1)
    const prev = new Date(year, month - 1, 1)
    const prevRecurring = transactions.filter(
      (t) => t.recurring && isSameMonth(t.date, prev.getFullYear(), prev.getMonth()),
    )
    if (prevRecurring.length === 0) {
      addNotification('Nenhuma transação recorrente encontrada no mês anterior.')
      return
    }
    const existingDescriptions = new Set(
      transactions
        .filter((t) => isSameMonth(t.date, d.getFullYear(), d.getMonth()))
        .map((t) => t.description),
    )
    const created: Transaction[] = []
    prevRecurring.forEach((t) => {
      if (existingDescriptions.has(t.description)) return
      const day = Math.min(
        Number(t.date.slice(-2)) || 1,
        new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(),
      )
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      created.push({ ...t, id: uid('tx'), date })
    })
    if (created.length === 0) {
      addNotification('Recorrentes deste mês já foram geradas.')
      return
    }
    setTransactions((list) => [...created, ...list])
    setAccounts((accs) =>
      accs.map((a) => {
        const delta = created
          .filter((t) => t.accountId === a.id)
          .reduce((s, t) => s + (t.type === 'receita' ? t.amount : -t.amount), 0)
        return delta ? { ...a, balance: a.balance + delta } : a
      }),
    )
    addNotification(`${created.length} transação(ões) recorrente(s) gerada(s) para o mês.`)
  }

  const replaceAllData = (data: Partial<PersistedData>) => {
    const next = { ...defaults, ...data }
    setBalanceVisible(next.balanceVisible)
    setNotifications(next.notifications)
    setAccounts(next.accounts)
    setCards(next.cards)
    setTransactions(next.transactions)
    setFinancialGoals(next.financialGoals)
    setLimits(next.limits)
    setSubscriptions(next.subscriptions)
    setDecisions(next.decisions)
    setAppointments(next.appointments)
    setHabits(next.habits)
    setTasks(next.tasks)
    setLifeGoals(next.lifeGoals)
    setSubjects(next.subjects)
    setFlashcards(next.flashcards)
    setHealth(next.health)
    setHealthHistory(next.healthHistory)
    setWheel(next.wheel)
    setGratitude(next.gratitude)
    setBooks(next.books)
    setContent(next.content)
    setMoods(next.moods)
    setJournal(next.journal)
  }

  const resetAllData = () => replaceAllData(defaults)

  const exportData = () => persisted

  const value = useMemo(
    () => ({
      ...persisted,
      setBalanceVisible,
      year,
      month,
      setYear,
      setMonth,
      shiftMonth,
      addNotification,
      dismissNotification,
      setAccounts,
      setCards,
      setTransactions,
      setFinancialGoals,
      setLimits,
      setSubscriptions,
      setDecisions,
      setAppointments,
      setHabits,
      setTasks,
      setLifeGoals,
      setSubjects,
      setFlashcards,
      setHealth,
      setHealthHistory,
      setWheel,
      setGratitude,
      setBooks,
      setContent,
      setMoods,
      setJournal,
      affirmations,
      addTransaction,
      deleteTransaction,
      payInvoice,
      depositGoal,
      toggleHabit,
      generateRecurring,
      replaceAllData,
      resetAllData,
      exportData,
    }),
    [persisted, year, month],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export type { PersistedData }
