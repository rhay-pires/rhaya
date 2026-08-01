import { useMemo, useState, type CSSProperties } from 'react'
import {
  AlertTriangle,
  CreditCard as CreditCardIcon,
  Eye,
  EyeOff,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  TrendingDown,
  TrendingUp,
  PiggyBank,
  LineChart,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { BancoIcon, listBancosBrasil } from './BancoIcon'
import { useApp } from '../store/AppStore'
import type {
  BankAccount,
  CreditCard,
  FinancialGoal,
  Subscription,
  Transaction,
  TransactionCategory,
  TransactionType,
} from '../types'
import { formatBRL, formatBRLHidden, isSameMonth, percent, todayISO, uid } from '../utils/format'
import { useModuleStyle } from '../hooks/useModuleStyle'
import { EmptyState, Modal, PillTabs, SectionTitle } from './ui'

type FinTab =
  | 'resumo'
  | 'faturas'
  | 'extrato'
  | 'limites'
  | 'metas'
  | 'decisao'
  | 'assinaturas'

const CATEGORIES: TransactionCategory[] = [
  'Salário',
  'Educação',
  'Lazer',
  'Alimentação',
  'Transporte',
  'Investimentos',
  'Fatura',
  'Outros',
  'Moradia',
  'Saúde',
]

const COLORS = ['#6C4BFF', '#8B5CF6', '#3B82F6', '#34D399', '#FB7185', '#F59E0B', '#06B6D4', '#EC4899']

const tabs: { id: FinTab; label: string }[] = [
  { id: 'resumo', label: '📊 Resumo' },
  { id: 'faturas', label: '💳 Faturas' },
  { id: 'extrato', label: '📋 Extrato' },
  { id: 'limites', label: '⚠️ Limites' },
  { id: 'metas', label: '🎯 Metas' },
  { id: 'decisao', label: '🧠 Should I Buy?' },
  { id: 'assinaturas', label: '🔄 Assinaturas' },
]

export function Financas() {
  const [tab, setTab] = useState<FinTab>('resumo')
  const { accent, pageVars } = useModuleStyle('financas', '#A5F387')

  return (
    <div style={pageVars}>
      <SectionTitle
        title="Finanças & Poupança"
        subtitle="Financier Hub — controle total do seu dinheiro"
      />
      <PillTabs tabs={tabs} active={tab} onChange={setTab} accent={accent} />
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
        >
          {tab === 'resumo' && <ResumoTab />}
          {tab === 'faturas' && <FaturasTab />}
          {tab === 'extrato' && <ExtratoTab />}
          {tab === 'limites' && <LimitesTab />}
          {tab === 'metas' && <MetasTab />}
          {tab === 'decisao' && <DecisaoTab />}
          {tab === 'assinaturas' && <AssinaturasTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function ResumoTab() {
  const {
    accounts,
    setAccounts,
    transactions,
    financialGoals,
    balanceVisible,
    setBalanceVisible,
    year,
    month,
    addTransaction,
  } = useApp()
  const { accent, isGlass, isMinimal, isSoft, surface, primaryBtn, secondaryBtn } = useModuleStyle('financas', '#A5F387')
  const [txModal, setTxModal] = useState<TransactionType | null>(null)
  const [accountModal, setAccountModal] = useState<'new' | BankAccount | null>(null)

  const monthTx = useMemo(
    () => transactions.filter((t) => isSameMonth(t.date, year, month)),
    [transactions, year, month],
  )
  const receitas = monthTx.filter((t) => t.type === 'receita').reduce((s, t) => s + t.amount, 0)
  const despesas = monthTx.filter((t) => t.type === 'despesa').reduce((s, t) => s + t.amount, 0)
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)
  const savedInGoals = financialGoals.reduce((s, g) => s + g.currentAmount, 0)
  const investments = monthTx
    .filter((t) => t.category === 'Investimentos')
    .reduce((s, t) => s + t.amount, 0)

  const byCategory = CATEGORIES.map((cat) => ({
    name: cat,
    value: monthTx
      .filter((t) => t.type === 'despesa' && t.category === cat)
      .reduce((s, t) => s + t.amount, 0),
  })).filter((c) => c.value > 0)

  const latest = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)

  const metrics = [
    { label: 'Receitas', value: receitas, color: '#A5F387', Icon: TrendingUp },
    { label: 'Despesas', value: despesas, color: '#FDA4AF', Icon: TrendingDown },
    { label: 'Metas', value: savedInGoals, color: accent, Icon: PiggyBank },
    { label: 'Investimentos', value: investments, color: '#70CFFF', Icon: LineChart },
  ]

  return (
    <div className="space-y-5">
      {/* Hero — mesmo modelo do dashboard */}
      <div
        className={
          isGlass
            ? 'glass-panel relative overflow-hidden rounded-[28px] p-6'
            : isMinimal
              ? 'soft-panel relative overflow-hidden rounded-[28px] p-6'
              : 'relative overflow-hidden rounded-[28px] border-2 border-[#1F2937] p-6 shadow-[6px_6px_0_#1F2937] ink-surface'
        }
        style={isSoft ? (isMinimal ? undefined : { boxShadow: `0 20px 50px ${accent}33` }) : surface(accent)}
      >
        {isGlass && (
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-50 blur-3xl"
            style={{ background: accent }}
          />
        )}
        {isMinimal && (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-1.5 rounded-l-[28px]"
            style={{ background: accent }}
          />
        )}
        {!isSoft && (
          <div className="pointer-events-none absolute -right-6 -top-4 text-7xl opacity-20">💰</div>
        )}

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={`text-sm font-semibold ${isSoft ? 'text-slate-500' : 'text-[#1F2937]/70'}`}>
              Saldo total disponível
            </p>
            <div className="mt-2 flex items-center gap-3">
              <h3 className={`text-3xl font-bold md:text-4xl ${isSoft ? 'text-[var(--app-fg)]' : 'text-[#1F2937]'}`}>
                {formatBRLHidden(totalBalance, balanceVisible)}
              </h3>
              <button
                onClick={() => setBalanceVisible(!balanceVisible)}
                className={
                  isSoft
                    ? isGlass
                      ? 'glass-chip rounded-full p-2'
                      : 'soft-chip rounded-full p-2'
                    : 'rounded-full border-2 border-[#1F2937] bg-white/80 p-2'
                }
                aria-label="Alternar visibilidade do saldo"
              >
                {balanceVisible ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            <p className={`mt-3 text-sm ${isSoft ? 'text-slate-500' : 'text-[#1F2937]/70'}`}>
              Resultado do mês:{' '}
              <span className="font-bold text-[var(--app-fg)]">
                {formatBRLHidden(receitas - despesas, balanceVisible)}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setTxModal('receita')} className={primaryBtn}>
              <span className="inline-flex items-center gap-1">
                <Plus size={14} /> Receita
              </span>
            </button>
            <button onClick={() => setTxModal('despesa')} className={secondaryBtn}>
              <span className="inline-flex items-center gap-1">
                <Plus size={14} /> Despesa
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Métricas — tiles coloridos como widgets */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className={
              isSoft
                ? 'ink-surface rounded-[24px] border p-4'
                : 'rounded-[24px] border-2 border-[#1F2937] p-4 shadow-[3px_3px_0_#1F2937] ink-surface'
            }
            style={surface(m.color)}
          >
            <div className="mb-3 flex items-center justify-between">
              <span
                className={
                  isMinimal
                    ? 'soft-accent flex h-9 w-9 items-center justify-center rounded-full'
                    : isGlass
                      ? 'glass-accent flex h-9 w-9 items-center justify-center rounded-full'
                      : 'flex h-9 w-9 items-center justify-center rounded-[12px] border-2 border-[#1F2937] bg-white'
                }
                style={isSoft ? ({ ['--accent' as string]: m.color } as CSSProperties) : undefined}
              >
                <m.Icon size={16} className="text-[#1F2937]" />
              </span>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#1F2937]/60">
                {m.label}
              </p>
            </div>
            <p className="truncate text-lg font-bold text-[#1F2937] sm:text-xl">
              {formatBRLHidden(m.value, balanceVisible)}
            </p>
          </div>
        ))}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-bold text-[var(--app-fg)]">Nossas Contas</h4>
          <button
            onClick={() => setAccountModal('new')}
            className="flex items-center gap-1 rounded-full bg-white/80 px-3 py-2 text-xs font-bold text-[#1F2937] hover:scale-105"
          >
            <Plus size={14} /> Conta
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className={
                isSoft
                  ? 'ink-surface relative overflow-hidden rounded-[24px] p-5'
                  : 'relative overflow-hidden rounded-[24px] border-2 border-[#1F2937] p-5 shadow-[4px_4px_0_#1F2937] ink-surface'
              }
              style={surface(acc.color)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <BancoIcon nome={acc.bank} tamanho={36} />
                  <p className="mt-2 text-sm font-bold text-[#1F2937]">{acc.name}</p>
                  <p className="text-xs text-[#1F2937]/65">{acc.bank}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setAccountModal(acc)}
                    className="rounded-full border-2 border-[#1F2937]/15 bg-white/70 p-1.5 text-[#1F2937]"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setAccounts((list) => list.filter((a) => a.id !== acc.id))}
                    className="rounded-full border-2 border-[#1F2937]/15 bg-white/70 p-1.5 text-[#1F2937]"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="mt-6 text-xl font-bold text-[#1F2937]">
                {formatBRLHidden(acc.balance, balanceVisible)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="bento-card p-5 lg:col-span-7">
          <h4 className="mb-3 font-bold text-[var(--app-fg)]">Últimos Lançamentos</h4>
          <div className="space-y-2">
            {latest.map((t) => (
              <div
                key={t.id}
                className={
                  isSoft
                    ? 'flex items-center justify-between rounded-2xl bg-[var(--app-soft)] px-3 py-2.5'
                    : 'flex items-center justify-between rounded-2xl border-2 border-[#1F2937]/10 bg-slate-50 px-3 py-2.5'
                }
              >
                <div>
                  <p className="text-sm font-bold text-[var(--app-fg)]">{t.description}</p>
                  <p className="text-xs text-slate-400">
                    {t.category} · {t.date}
                  </p>
                </div>
                <p
                  className={`text-sm font-bold ${
                    t.type === 'receita' ? 'text-emerald-600' : 'text-rose-500'
                  }`}
                >
                  {t.type === 'receita' ? '+' : '-'}
                  {formatBRLHidden(t.amount, balanceVisible)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bento-card p-5 lg:col-span-5">
          <h4 className="mb-3 font-bold text-[var(--app-fg)]">Distribuição de Gastos</h4>
          {byCategory.length === 0 ? (
            <EmptyState text="Sem despesas neste mês" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {byCategory.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatBRL(Number(v))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <TransactionModal
        open={!!txModal}
        type={txModal ?? 'despesa'}
        accounts={accounts}
        onClose={() => setTxModal(null)}
        onSave={(data) => {
          addTransaction(data)
          setTxModal(null)
        }}
      />

      <Modal
        open={!!accountModal}
        title={accountModal === 'new' ? 'Nova Conta' : 'Editar Conta'}
        onClose={() => setAccountModal(null)}
      >
        {accountModal && (
          <AccountForm
            account={accountModal === 'new' ? undefined : accountModal}
            onSave={(acc) => {
              setAccounts((list) =>
                accountModal === 'new' ? [acc, ...list] : list.map((a) => (a.id === acc.id ? acc : a)),
              )
              setAccountModal(null)
            }}
            onDelete={
              accountModal !== 'new'
                ? () => {
                    setAccounts((list) => list.filter((a) => a.id !== (accountModal as BankAccount).id))
                    setAccountModal(null)
                  }
                : undefined
            }
          />
        )}
      </Modal>
    </div>
  )
}

function FaturasTab() {
  const { cards, setCards, accounts, payInvoice, balanceVisible } = useApp()
  const { accent, primaryBtn } = useModuleStyle('financas', '#A5F387')
  const [cardModal, setCardModal] = useState<'new' | CreditCard | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setCardModal('new')}
          className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-[#1F2937] shadow-sm hover:scale-105"
        >
          <Plus size={16} /> Novo cartão
        </button>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const usedPct = percent(card.used, card.limit)
          const account = accounts.find((a) => a.id === card.linkedAccountId)
          return (
            <div key={card.id} className="space-y-3">
              <div
                className="relative overflow-hidden rounded-[28px] p-6 text-white shadow-xl"
                style={{ background: card.gradient }}
              >
                <div className="mb-8 flex items-start justify-between">
                  <div>
                    <p className="text-sm text-white/70">{card.brand}</p>
                    <p className="mt-1 text-lg font-semibold">{card.name}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCardModal(card)}
                      className="rounded-full bg-white/20 p-1.5 hover:bg-white/30"
                      aria-label="Editar cartão"
                    >
                      <Pencil size={14} />
                    </button>
                    <CreditCardIcon size={28} className="opacity-80" />
                  </div>
                </div>
                <div className="mb-4 h-8 w-12 rounded-md bg-gradient-to-br from-amber-200 to-amber-400 opacity-90" />
                <p className="text-xs text-white/70">Fatura atual</p>
                <p className="text-2xl font-bold">{formatBRLHidden(card.invoiceAmount, balanceVisible)}</p>
              </div>

              <div className="bento-card space-y-3 p-4">
                <div>
                  <div className="mb-1 flex justify-between text-xs text-slate-500">
                    <span>Limite usado</span>
                    <span>
                      {formatBRLHidden(card.used, balanceVisible)} /{' '}
                      {formatBRLHidden(card.limit, balanceVisible)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${usedPct >= 80 ? 'bg-rose-500' : ''}`}
                      style={{
                        width: `${usedPct}%`,
                        background: usedPct >= 80 ? undefined : accent,
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                  <p>Fecha: dia {card.closingDay}</p>
                  <p>Vence: dia {card.dueDay}</p>
                  <p className="col-span-2 flex items-center gap-1 text-xs text-slate-400">
                    Débito em: <BancoIcon nome={account?.bank ?? ''} tamanho={16} /> {account?.name ?? '—'}
                  </p>
                </div>
                <button
                  onClick={() => payInvoice(card.id)}
                  disabled={card.invoiceAmount <= 0}
                  className={`w-full disabled:opacity-40 ${primaryBtn}`}
                >
                  Pagar Fatura
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {cards.length === 0 && <EmptyState text="Nenhum cartão cadastrado" />}

      <Modal
        open={!!cardModal}
        title={cardModal === 'new' ? 'Novo Cartão' : 'Editar Cartão'}
        onClose={() => setCardModal(null)}
      >
        {cardModal && (
          <CardForm
            card={cardModal === 'new' ? undefined : cardModal}
            accounts={accounts}
            onSave={(c) => {
              setCards((list) => (cardModal === 'new' ? [c, ...list] : list.map((x) => (x.id === c.id ? c : x))))
              setCardModal(null)
            }}
            onDelete={
              cardModal !== 'new'
                ? () => {
                    setCards((list) => list.filter((x) => x.id !== (cardModal as CreditCard).id))
                    setCardModal(null)
                  }
                : undefined
            }
          />
        )}
      </Modal>
    </div>
  )
}

const GRADIENTS = [
  'linear-gradient(135deg, #820AD1, #4C1D95)',
  'linear-gradient(135deg, #FF7A00, #C2410C)',
  'linear-gradient(135deg, #1A1A1A, #374151)',
  'linear-gradient(135deg, #005CA9, #003D7A)',
  'linear-gradient(135deg, #CC092F, #7F1D1D)',
  'linear-gradient(135deg, #6C4BFF, #3B0764)',
]

function CardForm({
  card,
  accounts,
  onSave,
  onDelete,
}: {
  card?: CreditCard
  accounts: BankAccount[]
  onSave: (c: CreditCard) => void
  onDelete?: () => void
}) {
  const [form, setForm] = useState<CreditCard>(
    card ?? {
      id: uid('card'),
      name: '',
      brand: 'Mastercard',
      limit: 1000,
      used: 0,
      invoiceAmount: 0,
      closingDay: 5,
      dueDay: 12,
      linkedAccountId: accounts[0]?.id ?? '',
      gradient: GRADIENTS[0],
    },
  )
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        onSave(form)
      }}
    >
      <input className="w-full rounded-2xl border border-gray-100 px-3 py-3 text-sm" placeholder="Nome do cartão" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <select className="w-full rounded-2xl border border-gray-100 px-3 py-3 text-sm" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}>
        <option>Mastercard</option>
        <option>Visa</option>
        <option>Elo</option>
        <option>American Express</option>
      </select>
      <div className="grid grid-cols-2 gap-2">
        <input className="rounded-2xl border border-gray-100 px-3 py-3 text-sm" type="number" placeholder="Limite" value={form.limit} onChange={(e) => setForm({ ...form, limit: Number(e.target.value) || 0 })} />
        <input className="rounded-2xl border border-gray-100 px-3 py-3 text-sm" type="number" placeholder="Usado" value={form.used} onChange={(e) => setForm({ ...form, used: Number(e.target.value) || 0 })} />
      </div>
      <input className="w-full rounded-2xl border border-gray-100 px-3 py-3 text-sm" type="number" placeholder="Valor da fatura atual" value={form.invoiceAmount} onChange={(e) => setForm({ ...form, invoiceAmount: Number(e.target.value) || 0 })} />
      <div className="grid grid-cols-2 gap-2">
        <input className="rounded-2xl border border-gray-100 px-3 py-3 text-sm" type="number" min={1} max={31} placeholder="Dia fechamento" value={form.closingDay} onChange={(e) => setForm({ ...form, closingDay: Number(e.target.value) || 1 })} />
        <input className="rounded-2xl border border-gray-100 px-3 py-3 text-sm" type="number" min={1} max={31} placeholder="Dia vencimento" value={form.dueDay} onChange={(e) => setForm({ ...form, dueDay: Number(e.target.value) || 1 })} />
      </div>
      <select className="w-full rounded-2xl border border-gray-100 px-3 py-3 text-sm" value={form.linkedAccountId} onChange={(e) => setForm({ ...form, linkedAccountId: e.target.value })}>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Cor</p>
        <div className="flex flex-wrap gap-2">
          {GRADIENTS.map((g) => (
            <button
              type="button"
              key={g}
              onClick={() => setForm({ ...form, gradient: g })}
              className={`h-9 w-9 rounded-full border-2 ${form.gradient === g ? 'border-[#1F2937]' : 'border-transparent'}`}
              style={{ background: g }}
            />
          ))}
        </div>
      </div>
      <button className="w-full rounded-full bg-[var(--fin-accent,#6C4BFF)] py-3 text-sm font-bold text-[#1F2937]">Salvar</button>
      {onDelete && (
        <button type="button" onClick={onDelete} className="w-full rounded-full bg-rose-50 py-3 text-sm font-bold text-rose-500">
          Excluir cartão
        </button>
      )}
    </form>
  )
}

function ExtratoTab() {
  const { transactions, accounts, deleteTransaction, generateRecurring, year, month, balanceVisible } = useApp()
  const [type, setType] = useState<'todos' | TransactionType>('todos')
  const [category, setCategory] = useState<'todas' | TransactionCategory>('todas')
  const [accountId, setAccountId] = useState('todas')

  const filtered = transactions
    .filter((t) => isSameMonth(t.date, year, month))
    .filter((t) => (type === 'todos' ? true : t.type === type))
    .filter((t) => (category === 'todas' ? true : t.category === category))
    .filter((t) => (accountId === 'todas' ? true : t.accountId === accountId))
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="space-y-4">
      <button
        onClick={generateRecurring}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#6C4BFF]/40 py-3 text-sm font-bold text-[#6C4BFF] hover:border-[#6C4BFF]"
      >
        <RefreshCw size={14} /> Gerar recorrentes do mês
      </button>
      <div className="bento-card flex flex-wrap gap-3 p-4">
        <select
          className="rounded-2xl border border-gray-100 bg-white px-3 py-2 text-sm"
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
        >
          <option value="todos">Todos os tipos</option>
          <option value="receita">Receita</option>
          <option value="despesa">Despesa</option>
        </select>
        <select
          className="rounded-2xl border border-gray-100 bg-white px-3 py-2 text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value as typeof category)}
        >
          <option value="todas">Todas categorias</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className="rounded-2xl border border-gray-100 bg-white px-3 py-2 text-sm"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
        >
          <option value="todas">Todas as contas</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bento-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState text="Nenhum lançamento encontrado" />
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((t) => {
              const acc = accounts.find((a) => a.id === t.accountId)
              return (
                <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                      {t.description}
                      {t.recurring && <RefreshCw size={11} className="text-violet-400" />}
                    </p>
                    <p className="text-xs text-slate-400">
                      {t.date} · {t.category} · {acc?.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-semibold ${t.type === 'receita' ? 'text-emerald-600' : 'text-rose-500'}`}
                    >
                      {t.type === 'receita' ? '+' : '-'}
                      {formatBRLHidden(t.amount, balanceVisible)}
                    </span>
                    <button
                      onClick={() => deleteTransaction(t.id)}
                      className="rounded-full bg-rose-50 p-2 text-rose-500 hover:scale-105"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function LimitesTab() {
  const { limits, setLimits, transactions, year, month } = useApp()

  return (
    <div className="space-y-4">
      {limits.map((lim) => {
        const spent = transactions
          .filter((t) => isSameMonth(t.date, year, month) && t.type === 'despesa' && t.category === lim.category)
          .reduce((s, t) => s + t.amount, 0)
        const pct = percent(spent, lim.limit)
        const alert = pct >= 80
        return (
          <div key={lim.id} className={`bento-card p-5 ${alert ? 'ring-2 ring-rose-300' : ''}`}>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-800">{lim.category}</p>
                {alert && (
                  <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-600">
                    <AlertTriangle size={12} /> 🚨 80%+
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">
                {formatBRL(spent)} / {formatBRL(lim.limit)}
              </p>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all ${alert ? 'bg-rose-500' : 'bg-[var(--fin-accent,#6C4BFF)]'}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                className="w-32 rounded-2xl border border-gray-100 px-3 py-1.5 text-sm"
                value={lim.limit}
                onChange={(e) =>
                  setLimits((list) =>
                    list.map((l) => (l.id === lim.id ? { ...l, limit: Number(e.target.value) || 0 } : l)),
                  )
                }
              />
              <span className="text-xs text-slate-400">ajustar teto</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MetasTab() {
  const { financialGoals, depositGoal, setFinancialGoals, accounts } = useApp()
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [depositAccount, setDepositAccount] = useState<Record<string, string>>({})
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    targetAmount: '',
    deadline: '',
    imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80',
    category: 'Sonho',
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-[var(--fin-accent,#6C4BFF)] px-4 py-2 text-sm font-bold text-[#1F2937] hover:scale-105"
        >
          <Plus size={16} /> Nova Meta
        </button>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {financialGoals.map((goal) => {
          const pct = percent(goal.currentAmount, goal.targetAmount)
          return (
            <div key={goal.id} className="bento-card overflow-hidden">
              <div
                className="h-36 bg-cover bg-center"
                style={{ backgroundImage: `url(${goal.imageUrl})` }}
              />
              <div className="space-y-3 p-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-violet-500">{goal.category}</p>
                  <h4 className="text-lg font-semibold text-slate-800">{goal.title}</h4>
                  <p className="text-xs text-slate-400">Prazo: {goal.deadline}</p>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs text-slate-500">
                    <span>{formatBRL(goal.currentAmount)}</span>
                    <span>{formatBRL(goal.targetAmount)}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[var(--fin-accent,#6C4BFF)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-right text-xs font-medium text-violet-600">{pct}%</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="number"
                    placeholder="Valor"
                    className="flex-1 rounded-2xl border border-gray-100 px-3 py-2.5 text-sm"
                    value={amounts[goal.id] ?? ''}
                    onChange={(e) => setAmounts((a) => ({ ...a, [goal.id]: e.target.value }))}
                  />
                  <select
                    className="rounded-2xl border border-gray-100 px-3 py-2.5 text-sm"
                    value={depositAccount[goal.id] ?? accounts[0]?.id ?? ''}
                    onChange={(e) => setDepositAccount((a) => ({ ...a, [goal.id]: e.target.value }))}
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      depositGoal(
                        goal.id,
                        Number(amounts[goal.id]) || 0,
                        depositAccount[goal.id] ?? accounts[0]?.id,
                      )
                      setAmounts((a) => ({ ...a, [goal.id]: '' }))
                    }}
                    className="rounded-2xl bg-violet-100 px-4 py-2.5 text-sm font-semibold text-violet-700 hover:scale-105"
                  >
                    Depositar
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={open} title="Nova Meta de Poupança" onClose={() => setOpen(false)}>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const goal: FinancialGoal = {
              id: uid('goal'),
              title: form.title,
              targetAmount: Number(form.targetAmount) || 0,
              currentAmount: 0,
              deadline: form.deadline || todayISO(),
              imageUrl: form.imageUrl,
              category: form.category,
            }
            setFinancialGoals((g) => [goal, ...g])
            setOpen(false)
          }}
        >
          <input className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm" placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <input className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm" type="number" placeholder="Valor alvo" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} required />
          <input className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          <input className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm" placeholder="URL da imagem" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
          <button className="w-full rounded-full bg-[var(--fin-accent,#6C4BFF)] py-2.5 text-sm font-bold text-[#1F2937]">Salvar</button>
        </form>
      </Modal>
    </div>
  )
}

function DecisaoTab() {
  const { decisions, setDecisions } = useApp()
  const [item, setItem] = useState('')
  const [price, setPrice] = useState('')
  const [q, setQ] = useState({ urgency: false, importance: false, hasBalance: false, researched: false })

  const score = [q.urgency, q.importance, q.hasBalance, q.researched].filter(Boolean).length
  const advice = score >= 4 ? 'Liberado para comprar' : score >= 3 ? 'Considere' : 'Aguarde & Reflita'

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <div className="bento-card space-y-4 p-5 lg:col-span-7">
        <h4 className="font-semibold text-slate-800">Matriz de Decisão — Should I Buy?</h4>
        <input
          className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm"
          placeholder="O que você quer comprar?"
          value={item}
          onChange={(e) => setItem(e.target.value)}
        />
        <input
          className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm"
          type="number"
          placeholder="Preço (R$)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        {[
          { key: 'urgency', label: 'É urgente? Preciso disso agora?' },
          { key: 'importance', label: 'É realmente importante para mim?' },
          { key: 'hasBalance', label: 'Tenho saldo disponível sem comprometer metas?' },
          { key: 'researched', label: 'Pesquisei preço e alternativas?' },
        ].map((opt) => (
          <label key={opt.key} className="flex cursor-pointer items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3 text-sm">
            <input
              type="checkbox"
              checked={q[opt.key as keyof typeof q]}
              onChange={(e) => setQ({ ...q, [opt.key]: e.target.checked })}
              className="h-4 w-4 accent-[#6C4BFF]"
            />
            {opt.label}
          </label>
        ))}

        <div className={`rounded-[24px] p-4 text-center ${score >= 4 ? 'bg-emerald-50 text-emerald-700' : score >= 3 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-600'}`}>
          <p className="text-2xl font-bold">{score}/4</p>
          <p className="font-medium">{advice}</p>
        </div>

        <button
          onClick={() => {
            if (!item) return
            setDecisions((d) => [
              {
                id: uid('dec'),
                item,
                price: Number(price) || 0,
                ...q,
                score,
                advice,
                createdAt: todayISO(),
              },
              ...d,
            ])
            setItem('')
            setPrice('')
            setQ({ urgency: false, importance: false, hasBalance: false, researched: false })
          }}
          className="w-full rounded-full bg-[var(--fin-accent,#6C4BFF)] py-2.5 text-sm font-bold text-[#1F2937] hover:scale-[1.02]"
        >
          Salvar decisão
        </button>
      </div>

      <div className="bento-card p-5 lg:col-span-5">
        <h4 className="mb-3 font-semibold text-slate-800">Histórico</h4>
        <div className="space-y-2">
          {decisions.map((d) => (
            <div key={d.id} className="rounded-2xl bg-slate-50 px-3 py-2.5">
              <div className="flex justify-between gap-2">
                <p className="text-sm font-medium text-slate-700">{d.item}</p>
                <span className="text-xs font-semibold text-violet-600">{d.score}/4</span>
              </div>
              <p className="text-xs text-slate-400">
                {formatBRL(d.price)} · {d.advice} · {d.createdAt}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AssinaturasTab() {
  const { subscriptions, setSubscriptions, balanceVisible } = useApp()
  const activeTotal = subscriptions.filter((s) => !s.paused).reduce((s, x) => s + x.amount, 0)
  const [subModal, setSubModal] = useState<'new' | Subscription | null>(null)

  return (
    <div className="space-y-4">
      <div className="bento-card flex items-center justify-between gap-3 p-5">
        <div>
          <p className="text-sm text-slate-500">Faturamento previsto (ativas)</p>
          <p className="mt-1 text-2xl font-bold text-violet-600">{formatBRLHidden(activeTotal, balanceVisible)}</p>
        </div>
        <button
          onClick={() => setSubModal('new')}
          className="flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2.5 text-sm font-bold text-violet-700 hover:scale-105"
        >
          <Plus size={16} /> Nova
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {subscriptions.map((sub) => (
          <div key={sub.id} className={`bento-card p-5 ${sub.paused ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl text-white" style={{ background: sub.color }}>
                  {sub.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{sub.name}</p>
                  <p className="text-xs text-slate-400">{sub.category} · vence dia {sub.dueDay}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() =>
                    setSubscriptions((list) =>
                      list.map((s) => (s.id === sub.id ? { ...s, paused: !s.paused } : s)),
                    )
                  }
                  className="rounded-full bg-violet-50 p-2 text-violet-600 hover:scale-105"
                  title={sub.paused ? 'Retomar' : 'Pausar'}
                >
                  {sub.paused ? <Play size={16} /> : <Pause size={16} />}
                </button>
                <button
                  onClick={() => setSubModal(sub)}
                  className="rounded-full bg-slate-50 p-2 text-slate-500 hover:scale-105"
                  title="Editar"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => setSubscriptions((list) => list.filter((s) => s.id !== sub.id))}
                  className="rounded-full bg-rose-50 p-2 text-rose-500 hover:scale-105"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <p className="mt-4 text-lg font-bold text-slate-700">{formatBRL(sub.amount)}</p>
            <p className="text-xs text-slate-400">{sub.paused ? 'Pausada — não impacta previsão' : 'Ativa'}</p>
          </div>
        ))}
      </div>
      {subscriptions.length === 0 && <EmptyState text="Nenhuma assinatura cadastrada" />}

      <Modal
        open={!!subModal}
        title={subModal === 'new' ? 'Nova Assinatura' : 'Editar Assinatura'}
        onClose={() => setSubModal(null)}
      >
        {subModal && (
          <SubscriptionForm
            subscription={subModal === 'new' ? undefined : subModal}
            onSave={(s) => {
              setSubscriptions((list) =>
                subModal === 'new' ? [s, ...list] : list.map((x) => (x.id === s.id ? s : x)),
              )
              setSubModal(null)
            }}
            onDelete={
              subModal !== 'new'
                ? () => {
                    setSubscriptions((list) => list.filter((x) => x.id !== (subModal as Subscription).id))
                    setSubModal(null)
                  }
                : undefined
            }
          />
        )}
      </Modal>
    </div>
  )
}

function SubscriptionForm({
  subscription,
  onSave,
  onDelete,
}: {
  subscription?: Subscription
  onSave: (s: Subscription) => void
  onDelete?: () => void
}) {
  const [form, setForm] = useState<Subscription>(
    subscription ?? {
      id: uid('sub'),
      name: '',
      amount: 0,
      dueDay: 10,
      category: 'Streaming',
      paused: false,
      color: '#6C4BFF',
    },
  )
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        onSave(form)
      }}
    >
      <input className="w-full rounded-2xl border border-gray-100 px-3 py-3 text-sm" placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <input className="w-full rounded-2xl border border-gray-100 px-3 py-3 text-sm" type="number" step="0.01" placeholder="Valor mensal" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) || 0 })} required />
      <div className="grid grid-cols-2 gap-2">
        <input className="rounded-2xl border border-gray-100 px-3 py-3 text-sm" type="number" min={1} max={31} placeholder="Dia vencimento" value={form.dueDay} onChange={(e) => setForm({ ...form, dueDay: Number(e.target.value) || 1 })} />
        <input className="rounded-2xl border border-gray-100 px-3 py-3 text-sm" placeholder="Categoria" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
      </div>
      <button className="w-full rounded-full bg-violet-600 py-3 text-sm font-bold text-white">Salvar</button>
      {onDelete && (
        <button type="button" onClick={onDelete} className="w-full rounded-full bg-rose-50 py-3 text-sm font-bold text-rose-500">
          Excluir assinatura
        </button>
      )}
    </form>
  )
}

function TransactionModal({
  open,
  type,
  accounts,
  onClose,
  onSave,
}: {
  open: boolean
  type: TransactionType
  accounts: BankAccount[]
  onClose: () => void
  onSave: (tx: Omit<Transaction, 'id'>) => void
}) {
  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: 'Outros' as TransactionCategory,
    accountId: accounts[0]?.id ?? '',
    date: todayISO(),
    recurring: false,
  })

  return (
    <Modal open={open} title={type === 'receita' ? 'Nova Receita' : 'Nova Despesa'} onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          onSave({
            type,
            description: form.description,
            amount: Number(form.amount) || 0,
            category: form.category,
            accountId: form.accountId,
            date: form.date,
            recurring: form.recurring,
          })
        }}
      >
        <input className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm" placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        <input className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm" type="number" step="0.01" placeholder="Valor" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
        <select className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as TransactionCategory })}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm" value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <input className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <label className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={form.recurring}
            onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
            className="h-4 w-4 accent-[#6C4BFF]"
          />
          Repetir todo mês
        </label>
        <button className="w-full rounded-full bg-[var(--fin-accent,#6C4BFF)] py-2.5 text-sm font-bold text-[#1F2937]">Salvar</button>
      </form>
    </Modal>
  )
}

function AccountForm({
  account,
  onSave,
  onDelete,
}: {
  account?: BankAccount
  onSave: (a: BankAccount) => void
  onDelete?: () => void
}) {
  const bancos = useMemo(() => listBancosBrasil(), [])
  const [form, setForm] = useState<BankAccount>(
    account ?? {
      id: uid('acc'),
      bank: bancos[0]?.slug ?? 'nubank',
      name: '',
      balance: 0,
      color: bancos[0]?.fundo ?? '#6C4BFF',
      emoji: '🏦',
    },
  )
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        onSave(form)
      }}
    >
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Banco</p>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
          {bancos.map((b) => (
            <button
              type="button"
              key={b.slug}
              onClick={() => setForm((f) => ({ ...f, bank: b.slug, color: b.fundo }))}
              className={`flex min-w-[68px] flex-col items-center gap-1.5 rounded-2xl border-2 px-2 py-2.5 transition ${
                form.bank === b.slug ? 'border-[#1F2937] bg-slate-50' : 'border-transparent'
              }`}
            >
              <BancoIcon nome={b.slug} tamanho={32} />
              <span className="max-w-[64px] truncate text-[10px] font-semibold text-slate-600">
                {b.label}
              </span>
            </button>
          ))}
        </div>
      </div>
      <input
        className="w-full rounded-2xl border border-gray-100 px-3 py-3 text-sm"
        placeholder="Nome da conta"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />
      <input
        className="w-full rounded-2xl border border-gray-100 px-3 py-3 text-sm"
        type="number"
        step="0.01"
        placeholder="Saldo"
        value={form.balance}
        onChange={(e) => setForm({ ...form, balance: Number(e.target.value) || 0 })}
      />
      <button className="w-full rounded-full bg-[var(--fin-accent,#6C4BFF)] py-3 text-sm font-bold text-[#1F2937]">
        Salvar
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="w-full rounded-full bg-rose-50 py-3 text-sm font-bold text-rose-500"
        >
          Excluir conta
        </button>
      )}
    </form>
  )
}
