import {
  createContext,
  useContext,
  useEffect,
  useMemo,
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
import { todayISO, uid } from '../utils/format'
import { loadJSON, saveJSON } from '../utils/storage'

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
  depositGoal: (goalId: string, amount: number) => void
  toggleHabit: (habitId: string) => void
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

  const depositGoal = (goalId: string, amount: number) => {
    if (amount <= 0) return
    setFinancialGoals((goals) =>
      goals.map((g) =>
        g.id === goalId ? { ...g, currentAmount: Math.min(g.targetAmount, g.currentAmount + amount) } : g,
      ),
    )
    addNotification(`Depósito de R$ ${amount.toFixed(2)} na meta!`)
  }

  const toggleHabit = (habitId: string) => {
    const today = todayISO()
    setHabits((list) =>
      list.map((h) => {
        if (h.id !== habitId) return h
        const done = h.completedDates.includes(today)
        if (done) {
          return {
            ...h,
            completedDates: h.completedDates.filter((d) => d !== today),
            streak: Math.max(0, h.streak - 1),
          }
        }
        return { ...h, completedDates: [...h.completedDates, today], streak: h.streak + 1 }
      }),
    )
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
