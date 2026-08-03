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
import { todayISO, toLocalISO } from '../utils/format'

const today = todayISO()

export const initialAccounts: BankAccount[] = [
  { id: 'acc_nu', bank: 'nubank', name: 'Conta Nu', balance: 4250.8, color: '#820AD1', emoji: '💜' },
  { id: 'acc_inter', bank: 'inter', name: 'Conta Inter', balance: 1890.4, color: '#FF7A00', emoji: '🧡' },
  { id: 'acc_caixa', bank: 'caixa', name: 'Poupança Caixa', balance: 3200, color: '#005CA9', emoji: '💙' },
  { id: 'acc_brad', bank: 'bradesco', name: 'Conta Bradesco', balance: 980.25, color: '#CC092F', emoji: '❤️' },
  { id: 'acc_itau', bank: 'itau', name: 'Conta Itaú', balance: 1560.9, color: '#EC7000', emoji: '🧡' },
  { id: 'acc_c6', bank: 'c6', name: 'Conta C6', balance: 740.15, color: '#1A1A1A', emoji: '🖤' },
  { id: 'acc_bb', bank: 'bancodobrasil', name: 'Conta BB', balance: 2100, color: '#FDF200', emoji: '💛' },
]

export const initialCards: CreditCard[] = [
  {
    id: 'card_nu',
    name: 'Nubank Ultravioleta',
    brand: 'Mastercard',
    limit: 8000,
    used: 2450,
    invoiceAmount: 1890.5,
    closingDay: 5,
    dueDay: 12,
    linkedAccountId: 'acc_nu',
    gradient: 'linear-gradient(135deg, #820AD1, #4C1D95)',
  },
  {
    id: 'card_inter',
    name: 'Inter Black',
    brand: 'Visa',
    limit: 5000,
    used: 1200,
    invoiceAmount: 890,
    closingDay: 10,
    dueDay: 17,
    linkedAccountId: 'acc_inter',
    gradient: 'linear-gradient(135deg, #FF7A00, #C2410C)',
  },
  {
    id: 'card_c6',
    name: 'C6 Carbon',
    brand: 'Mastercard',
    limit: 6000,
    used: 3100,
    invoiceAmount: 2100,
    closingDay: 20,
    dueDay: 27,
    linkedAccountId: 'acc_c6',
    gradient: 'linear-gradient(135deg, #1A1A1A, #374151)',
  },
]

export const initialTransactions: Transaction[] = [
  { id: 'tx1', type: 'receita', category: 'Salário', description: 'Salário mensal', amount: 6500, date: today.slice(0, 8) + '01', accountId: 'acc_nu' },
  { id: 'tx2', type: 'despesa', category: 'Alimentação', description: 'Mercado', amount: 420.5, date: today.slice(0, 8) + '03', accountId: 'acc_nu' },
  { id: 'tx3', type: 'despesa', category: 'Transporte', description: 'Uber semana', amount: 185, date: today.slice(0, 8) + '05', accountId: 'acc_inter' },
  { id: 'tx4', type: 'despesa', category: 'Lazer', description: 'Cinema + jantar', amount: 220, date: today.slice(0, 8) + '07', accountId: 'acc_itau' },
  { id: 'tx5', type: 'despesa', category: 'Educação', description: 'Curso online', amount: 149.9, date: today.slice(0, 8) + '08', accountId: 'acc_nu' },
  { id: 'tx6', type: 'despesa', category: 'Moradia', description: 'Aluguel', amount: 1800, date: today.slice(0, 8) + '02', accountId: 'acc_caixa' },
  { id: 'tx7', type: 'receita', category: 'Outros', description: 'Freelance', amount: 900, date: today.slice(0, 8) + '10', accountId: 'acc_c6' },
  { id: 'tx8', type: 'despesa', category: 'Investimentos', description: 'Aporte Tesouro', amount: 500, date: today.slice(0, 8) + '11', accountId: 'acc_bb' },
  { id: 'tx9', type: 'despesa', category: 'Saúde', description: 'Farmácia', amount: 87.4, date: today.slice(0, 8) + '12', accountId: 'acc_brad' },
  { id: 'tx10', type: 'despesa', category: 'Alimentação', description: 'Delivery', amount: 64.9, date: today, accountId: 'acc_nu' },
]

export const initialGoals: FinancialGoal[] = [
  {
    id: 'goal1',
    title: 'Viagem para Europa',
    targetAmount: 15000,
    currentAmount: 4200,
    deadline: '2026-12-31',
    imageUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80',
    category: 'Viagem',
  },
  {
    id: 'goal2',
    title: 'Reserva de Emergência',
    targetAmount: 20000,
    currentAmount: 12500,
    deadline: '2026-10-01',
    imageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80',
    category: 'Segurança',
  },
  {
    id: 'goal3',
    title: 'Notebook novo',
    targetAmount: 7000,
    currentAmount: 2800,
    deadline: '2026-09-15',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    category: 'Tech',
  },
]

export const initialLimits: CategoryLimit[] = [
  { id: 'lim1', category: 'Alimentação', limit: 800 },
  { id: 'lim2', category: 'Lazer', limit: 400 },
  { id: 'lim3', category: 'Transporte', limit: 350 },
  { id: 'lim4', category: 'Educação', limit: 300 },
  { id: 'lim5', category: 'Saúde', limit: 250 },
]

export const initialSubscriptions: Subscription[] = [
  { id: 'sub1', name: 'Netflix', amount: 55.9, dueDay: 8, category: 'Streaming', paused: false, color: '#E50914' },
  { id: 'sub2', name: 'Spotify', amount: 21.9, dueDay: 15, category: 'Música', paused: false, color: '#1DB954' },
  { id: 'sub3', name: 'Adobe CC', amount: 89.9, dueDay: 20, category: 'Produtividade', paused: false, color: '#FF0000' },
  { id: 'sub4', name: 'iCloud+', amount: 12.9, dueDay: 3, category: 'Cloud', paused: true, color: '#007AFF' },
  { id: 'sub5', name: 'Gympass', amount: 99.9, dueDay: 1, category: 'Saúde', paused: false, color: '#00C2FF' },
]

export const initialDecisions: PurchaseDecision[] = [
  {
    id: 'dec1',
    item: 'Fone Bluetooth',
    price: 349,
    urgency: false,
    importance: true,
    hasBalance: true,
    researched: true,
    score: 3,
    advice: 'Considere',
    createdAt: today,
  },
]

export const initialAppointments: Appointment[] = [
  { id: 'ap1', title: 'Reunião com cliente', date: today, time: '10:00', priority: 'alta', reminder: true, location: 'Meet' },
  { id: 'ap2', title: 'Consulta odontológica', date: today, time: '15:30', priority: 'media', reminder: true },
  { id: 'ap3', title: 'Aula de inglês', date: shiftDays(2), time: '19:00', priority: 'media', reminder: false },
  { id: 'ap4', title: 'Entrega projeto X', date: shiftDays(5), time: '18:00', priority: 'alta', reminder: true },
]

export const initialHabits: Habit[] = [
  { id: 'h1', name: 'Meditar 10 min', period: 'manha', streak: 12, completedDates: [today], color: '#8B5CF6' },
  { id: 'h2', name: 'Beber 2L água', period: 'tarde', streak: 8, completedDates: [], color: '#3B82F6' },
  { id: 'h3', name: 'Ler 20 páginas', period: 'noite', streak: 5, completedDates: [today], color: '#6C4BFF' },
  { id: 'h4', name: 'Treinar', period: 'tarde', streak: 3, completedDates: [], color: '#34D399' },
  { id: 'h5', name: 'Journaling', period: 'noite', streak: 7, completedDates: [today], color: '#FB7185' },
]

export const initialTasks: WorkTask[] = [
  { id: 't1', title: 'Revisar proposta comercial', client: 'Studio Aurora', status: 'todo', priority: 'alta', dueDate: today },
  { id: 't2', title: 'Design landing page', client: 'NovaTech', status: 'doing', priority: 'alta', dueDate: shiftDays(2) },
  { id: 't3', title: 'Enviar relatório semanal', client: 'Interno', status: 'doing', priority: 'media', dueDate: today },
  { id: 't4', title: 'Atualizar portfólio', client: 'Pessoal', status: 'done', priority: 'baixa', dueDate: shiftDays(-1) },
]

export const initialLifeGoals: LifeGoal[] = [
  {
    id: 'lg1',
    title: 'Promoção / nova posição',
    horizon: 'medio',
    area: 'Carreira',
    progress: 45,
    steps: [
      { id: 's1', title: 'Atualizar LinkedIn', done: true },
      { id: 's2', title: 'Curso de liderança', done: true },
      { id: 's3', title: 'Mentoria mensal', done: false },
    ],
  },
  {
    id: 'lg2',
    title: 'Correr 5km sem parar',
    horizon: 'curto',
    area: 'Saúde',
    progress: 60,
    steps: [
      { id: 's4', title: 'Treinar 3x/semana', done: true },
      { id: 's5', title: 'Correr 3km', done: true },
      { id: 's6', title: 'Correr 5km', done: false },
    ],
  },
  {
    id: 'lg3',
    title: 'Independência financeira parcial',
    horizon: 'longo',
    area: 'Finanças',
    progress: 28,
    steps: [
      { id: 's7', title: 'Reserva 6 meses', done: false },
      { id: 's8', title: 'Investir 20%/mês', done: true },
    ],
  },
]

export const initialSubjects: Subject[] = [
  { id: 'sub_math', name: 'Estatística Aplicada', progress: 72, nextExam: shiftDays(14), notes: 'Revisar regressão linear', school: 'immes' },
  { id: 'sub_eng', name: 'Inglês Avançado', progress: 55, nextExam: shiftDays(21), notes: 'Praticar listening', school: 'immes' },
  { id: 'sub_ux', name: 'UX Research', progress: 40, notes: 'Montar personas', school: 'univesp' },
]

export const initialFlashcards: Flashcard[] = [
  { id: 'fc1', subjectId: 'sub_math', front: 'O que é desvio padrão?', back: 'Medida de dispersão dos dados em relação à média.' },
  { id: 'fc2', subjectId: 'sub_eng', front: 'Nevertheless', back: 'No entanto / apesar disso' },
  { id: 'fc3', subjectId: 'sub_ux', front: 'O que é JTBD?', back: 'Jobs To Be Done — framework de necessidades do usuário.' },
]

export const initialHealth: HealthLog = {
  date: today,
  waterMl: 1250,
  sleepHours: 7.5,
  workout: 'HIIT 30min',
  meals: 'Café + almoço balanceado',
  weightKg: 65,
}

export const initialWheel: WheelScore[] = [
  { area: 'Saúde', score: 7 },
  { area: 'Carreira', score: 8 },
  { area: 'Relacionamentos', score: 6 },
  { area: 'Finanças', score: 7 },
  { area: 'Lazer', score: 5 },
  { area: 'Crescimento', score: 8 },
  { area: 'Espiritualidade', score: 6 },
  { area: 'Ambiente', score: 7 },
]

export const initialGratitude: GratitudeEntry[] = [
  { id: 'g1', text: 'Pelo café da manhã em paz', date: today },
  { id: 'g2', text: 'Pelo progresso no projeto', date: today },
]

export const initialBooks: Book[] = [
  { id: 'b1', title: 'Atomic Habits', author: 'James Clear', status: 'lido', pagesRead: 320, totalPages: 320, rating: 5 },
  { id: 'b2', title: 'Deep Work', author: 'Cal Newport', status: 'lendo', pagesRead: 110, totalPages: 296, rating: 4 },
  { id: 'b3', title: 'Essencialismo', author: 'Greg McKeown', status: 'desejado', pagesRead: 0, totalPages: 272, rating: 0 },
]

export const initialContent: ContentItem[] = [
  { id: 'c1', title: 'Rotina matinal produtiva', platform: 'Instagram', status: 'ideia', publishDate: shiftDays(3) },
  { id: 'c2', title: 'Como organizar finanças', platform: 'YouTube', status: 'roteiro', publishDate: shiftDays(7) },
  { id: 'c3', title: 'Habit tracker tips', platform: 'TikTok', status: 'gravando', publishDate: shiftDays(2) },
  { id: 'c4', title: 'Review livro Deep Work', platform: 'Blog', status: 'editado', publishDate: shiftDays(5) },
  { id: 'c5', title: 'Desk setup tour', platform: 'Instagram', status: 'publicado', publishDate: shiftDays(-2) },
]

export const initialMoods: MoodEntry[] = [
  { id: 'm1', date: today, mood: 4, note: 'Dia produtivo' },
]

export const initialJournal: JournalEntry[] = [
  { id: 'j1', date: today, title: 'Reflexões da manhã', content: 'Comecei o dia com clareza e foco nas prioridades.' },
]

export const affirmations = [
  'Eu sou capaz de organizar minha vida com leveza e clareza.',
  'Minhas finanças crescem com inteligência e disciplina.',
  'Cada dia eu me torno uma versão melhor de mim mesma.',
  'Eu mereço paz, progresso e prosperidade.',
]

function shiftDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return toLocalISO(d)
}
