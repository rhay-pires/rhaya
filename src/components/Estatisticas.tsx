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
  const { transactions, habits, tasks, year, month } = useApp()
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
