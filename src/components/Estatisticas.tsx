import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useModuleStyle } from '../hooks/useModuleStyle'
import { useApp } from '../store/AppStore'
import { formatBRL, isSameMonth } from '../utils/format'
import { ModuleHero } from './ModuleHero'
import { SectionTitle } from './ui'

export function Estatisticas() {
  const { transactions, habits, tasks, year, month, moods, health, healthHistory, content, lifeGoals } = useApp()
  const { accent, pageVars } = useModuleStyle('estatisticas', '#60A5FA')

  const financeSeries = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(year, month - 5 + i, 1)
      const y = d.getFullYear()
      const m = d.getMonth()
      const monthTx = transactions.filter((t) => isSameMonth(t.date, y, m))
      return {
        name: d.toLocaleDateString('pt-BR', { month: 'short' }),
        receitas: monthTx.filter((t) => t.type === 'receita').reduce((s, t) => s + t.amount, 0),
        despesas: monthTx.filter((t) => t.type === 'despesa').reduce((s, t) => s + t.amount, 0),
      }
    })
  }, [transactions, year, month])

  const habitConsistency = useMemo(() => {
    return habits.map((h) => ({
      name: h.name.length > 14 ? h.name.slice(0, 14) + '…' : h.name,
      streak: h.streak,
      checks: h.completedDates.length,
    }))
  }, [habits])

  const productivity = [
    { name: 'A Fazer', value: tasks.filter((t) => t.status === 'todo').length },
    { name: 'Andamento', value: tasks.filter((t) => t.status === 'doing').length },
    { name: 'Concluído', value: tasks.filter((t) => t.status === 'done').length },
  ]

  const doneTasks = tasks.filter((t) => t.status === 'done').length
  const bestStreak = Math.max(0, ...habits.map((h) => h.streak))

  const avgMood = useMemo(() => {
    const recent = moods.slice(0, 7)
    if (recent.length === 0) return null
    return recent.reduce((s, m) => s + m.mood, 0) / recent.length
  }, [moods])

  const avgWater7d = useMemo(() => {
    const days = [health, ...healthHistory].slice(0, 7)
    if (days.length === 0) return 0
    return Math.round(days.reduce((s, d) => s + d.waterMl, 0) / days.length)
  }, [health, healthHistory])

  const publishedCount = content.filter((c) => c.status === 'publicado').length

  const activeGoals = lifeGoals.filter((g) => !g.archived)
  const avgGoalProgress = activeGoals.length
    ? Math.round(activeGoals.reduce((s, g) => s + g.progress, 0) / activeGoals.length)
    : 0

  const expenseInsight = useMemo(() => {
    const thisMonth = transactions
      .filter((t) => t.type === 'despesa' && isSameMonth(t.date, year, month))
      .reduce((s, t) => s + t.amount, 0)
    const prevDate = new Date(year, month - 1, 1)
    const prevMonth = transactions
      .filter((t) => t.type === 'despesa' && isSameMonth(t.date, prevDate.getFullYear(), prevDate.getMonth()))
      .reduce((s, t) => s + t.amount, 0)
    if (prevMonth === 0) return null
    const diff = thisMonth - prevMonth
    const pct = Math.round((Math.abs(diff) / prevMonth) * 100)
    if (diff > 0) return `Você gastou ${pct}% a mais este mês (${formatBRL(thisMonth)}) em relação ao mês anterior (${formatBRL(prevMonth)}).`
    if (diff < 0) return `Você gastou ${pct}% a menos este mês (${formatBRL(thisMonth)}) em relação ao mês anterior (${formatBRL(prevMonth)}).`
    return `Seus gastos este mês (${formatBRL(thisMonth)}) ficaram iguais ao mês anterior.`
  }, [transactions, year, month])

  return (
    <div style={pageVars} className="space-y-5">
      <SectionTitle
        title="Estatísticas & Análises"
        subtitle="Produtividade, hábitos e saúde financeira"
      />

      <ModuleHero
        moduleId="estatisticas"
        fallback="#60A5FA"
        title="Visão geral"
        value={`${doneTasks} tasks`}
        subtitle={`Melhor streak: ${bestStreak} dias`}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="bento-card p-4 text-center">
          <p className="text-2xl font-bold text-slate-800">{avgMood !== null ? avgMood.toFixed(1) : '—'}</p>
          <p className="text-xs text-slate-400">Humor médio</p>
        </div>
        <div className="bento-card p-4 text-center">
          <p className="text-2xl font-bold text-slate-800">{(avgWater7d / 1000).toFixed(1)}L</p>
          <p className="text-xs text-slate-400">Água média 7d</p>
        </div>
        <div className="bento-card p-4 text-center">
          <p className="text-2xl font-bold text-slate-800">{publishedCount}</p>
          <p className="text-xs text-slate-400">Conteúdos publicados</p>
        </div>
        <div className="bento-card p-4 text-center">
          <p className="text-2xl font-bold text-slate-800">{avgGoalProgress}%</p>
          <p className="text-xs text-slate-400">Progresso das metas</p>
        </div>
      </div>

      {expenseInsight && (
        <div className="bento-card p-4 text-sm text-slate-600">
          💡 {expenseInsight}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="bento-card p-5 lg:col-span-7">
          <h3 className="mb-4 font-semibold text-slate-800">Finanças — últimos 6 meses</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financeSeries}>
                <defs>
                  <linearGradient id="rec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34D399" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="des" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FB7185" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#FB7185" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatBRL(Number(v))} />
                <Legend />
                <Area type="monotone" dataKey="receitas" stroke="#34D399" fill="url(#rec)" />
                <Area type="monotone" dataKey="despesas" stroke="#FB7185" fill="url(#des)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bento-card p-5 lg:col-span-5">
          <h3 className="mb-4 font-semibold text-slate-800">Produtividade</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill={accent} radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bento-card p-5 lg:col-span-12">
          <h3 className="mb-4 font-semibold text-slate-800">Consistência em hábitos</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={habitConsistency}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="streak" name="Streak" fill={accent} radius={[10, 10, 0, 0]} />
                <Bar dataKey="checks" name="Check-ins" fill="#3B82F6" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
