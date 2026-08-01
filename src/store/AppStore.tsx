import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
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

interface AppStore {
  balanceVisible: boolean
  setBalanceVisible: (v: boolean) => void
  year: number
  month: number
  setYear: (y: number) => void
  setMonth: (m: number) => void
  shiftMonth: (delta: number) => void
  notifications: string[]
  addNotification: (msg: string) => void
  dismissNotification: (i: number) => void

  accounts: BankAccount[]
  setAccounts: React.Dispatch<React.SetStateAction<BankAccount[]>>
  cards: CreditCard[]
  setCards: React.Dispatch<React.SetStateAction<CreditCard[]>>
  transactions: Transaction[]
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>
  financialGoals: FinancialGoal[]
  setFinancialGoals: React.Dispatch<React.SetStateAction<FinancialGoal[]>>
  limits: CategoryLimit[]
  setLimits: React.Dispatch<React.SetStateAction<CategoryLimit[]>>
  subscriptions: Subscription[]
  setSubscriptions: React.Dispatch<React.SetStateAction<Subscription[]>>
  decisions: PurchaseDecision[]
  setDecisions: React.Dispatch<React.SetStateAction<PurchaseDecision[]>>

  appointments: Appointment[]
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>
  habits: Habit[]
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>
  tasks: WorkTask[]
  setTasks: React.Dispatch<React.SetStateAction<WorkTask[]>>
  lifeGoals: LifeGoal[]
  setLifeGoals: React.Dispatch<React.SetStateAction<LifeGoal[]>>
  subjects: Subject[]
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>
  flashcards: Flashcard[]
  setFlashcards: React.Dispatch<React.SetStateAction<Flashcard[]>>
  health: HealthLog
  setHealth: React.Dispatch<React.SetStateAction<HealthLog>>
  wheel: WheelScore[]
  setWheel: React.Dispatch<React.SetStateAction<WheelScore[]>>
  gratitude: GratitudeEntry[]
  setGratitude: React.Dispatch<React.SetStateAction<GratitudeEntry[]>>
  books: Book[]
  setBooks: React.Dispatch<React.SetStateAction<Book[]>>
  content: ContentItem[]
  setContent: React.Dispatch<React.SetStateAction<ContentItem[]>>
  moods: MoodEntry[]
  setMoods: React.Dispatch<React.SetStateAction<MoodEntry[]>>
  journal: JournalEntry[]
  setJournal: React.Dispatch<React.SetStateAction<JournalEntry[]>>
  affirmations: string[]

  addTransaction: (tx: Omit<Transaction, 'id'>) => void
  deleteTransaction: (id: string) => void
  payInvoice: (cardId: string) => void
  depositGoal: (goalId: string, amount: number) => void
  toggleHabit: (habitId: string) => void
}

const AppContext = createContext<AppStore | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const now = new Date()
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [notifications, setNotifications] = useState<string[]>([
    'Fatura Nubank vence em 3 dias',
    'Hábito “Beber 2L água” ainda pendente',
    'Reunião às 10:00 — prepare a pauta',
  ])

  const [accounts, setAccounts] = useState(initialAccounts)
  const [cards, setCards] = useState(initialCards)
  const [transactions, setTransactions] = useState(initialTransactions)
  const [financialGoals, setFinancialGoals] = useState(initialGoals)
  const [limits, setLimits] = useState(initialLimits)
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions)
  const [decisions, setDecisions] = useState(initialDecisions)
  const [appointments, setAppointments] = useState(initialAppointments)
  const [habits, setHabits] = useState(initialHabits)
  const [tasks, setTasks] = useState(initialTasks)
  const [lifeGoals, setLifeGoals] = useState(initialLifeGoals)
  const [subjects, setSubjects] = useState(initialSubjects)
  const [flashcards, setFlashcards] = useState(initialFlashcards)
  const [health, setHealth] = useState(initialHealth)
  const [wheel, setWheel] = useState(initialWheel)
  const [gratitude, setGratitude] = useState(initialGratitude)
  const [books, setBooks] = useState(initialBooks)
  const [content, setContent] = useState(initialContent)
  const [moods, setMoods] = useState(initialMoods)
  const [journal, setJournal] = useState(initialJournal)

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
          return { ...h, completedDates: h.completedDates.filter((d) => d !== today), streak: Math.max(0, h.streak - 1) }
        }
        return { ...h, completedDates: [...h.completedDates, today], streak: h.streak + 1 }
      }),
    )
  }

  const value = useMemo(
    () => ({
      balanceVisible,
      setBalanceVisible,
      year,
      month,
      setYear,
      setMonth,
      shiftMonth,
      notifications,
      addNotification,
      dismissNotification,
      accounts,
      setAccounts,
      cards,
      setCards,
      transactions,
      setTransactions,
      financialGoals,
      setFinancialGoals,
      limits,
      setLimits,
      subscriptions,
      setSubscriptions,
      decisions,
      setDecisions,
      appointments,
      setAppointments,
      habits,
      setHabits,
      tasks,
      setTasks,
      lifeGoals,
      setLifeGoals,
      subjects,
      setSubjects,
      flashcards,
      setFlashcards,
      health,
      setHealth,
      wheel,
      setWheel,
      gratitude,
      setGratitude,
      books,
      setBooks,
      content,
      setContent,
      moods,
      setMoods,
      journal,
      setJournal,
      affirmations,
      addTransaction,
      deleteTransaction,
      payInvoice,
      depositGoal,
      toggleHabit,
    }),
    [
      balanceVisible,
      year,
      month,
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

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
