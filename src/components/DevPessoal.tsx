import { useEffect, useMemo, useState } from 'react'
import { BookMarked, Heart, Pause, Play, Plus, Pencil, RotateCcw, Smile, Star, Trash2 } from 'lucide-react'
import { useModuleStyle } from '../hooks/useModuleStyle'
import { useApp } from '../store/AppStore'
import type { Book } from '../types'
import { todayISO, uid } from '../utils/format'
import { ModuleHero } from './ModuleHero'
import { Modal, PillTabs, SectionTitle } from './ui'

type DevTab = 'diario' | 'livros' | 'competencias' | 'meditacao'

const tabs: { id: DevTab; label: string }[] = [
  { id: 'diario', label: '📔 Diário' },
  { id: 'livros', label: '📚 Livros' },
  { id: 'competencias', label: '🎡 Competências' },
  { id: 'meditacao', label: '🧘 Meditação' },
]

export function DevPessoal() {
  const { wheel } = useApp()
  const { accent, pageVars } = useModuleStyle('devpessoal', '#FDA4AF')
  const [tab, setTab] = useState<DevTab>('diario')

  const avgWheel = useMemo(() => {
    if (!wheel.length) return 0
    return Math.round((wheel.reduce((s, w) => s + w.score, 0) / wheel.length) * 10) / 10
  }, [wheel])

  return (
    <div style={pageVars} className="space-y-5">
      <SectionTitle
        title="Desenvolvimento Pessoal"
        subtitle="Roda da Vida, gratidão, leituras e journaling"
      />

      <PillTabs tabs={tabs} active={tab} onChange={setTab} accent={accent} />

      <ModuleHero
        moduleId="devpessoal"
        fallback="#FDA4AF"
        title="Roda da Vida"
        value={`${avgWheel}/10`}
        subtitle="Acompanhe seu equilíbrio de vida"
      />

      {tab === 'diario' && <DiarioTab />}
      {tab === 'livros' && <LivrosTab />}
      {tab === 'competencias' && <CompetenciasTab />}
      {tab === 'meditacao' && <MeditacaoTab />}
    </div>
  )
}

function DiarioTab() {
  const { journal, setJournal, affirmations } = useApp()
  const { accent, primaryBtn, tileClass, surface } = useModuleStyle('devpessoal', '#FDA4AF')
  const [journalTitle, setJournalTitle] = useState('')
  const [journalContent, setJournalContent] = useState('')
  const affirmation = affirmations[Math.floor(Date.now() / 86400000) % affirmations.length]

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className={`${tileClass} p-5 lg:col-span-5`} style={surface(accent)}>
        <p className="text-xs font-bold uppercase tracking-wide text-[#1F2937]/55">
          Afirmação do dia
        </p>
        <p className="mt-2 text-lg font-medium text-[#1F2937]">“{affirmation}”</p>
      </div>

      <div className="bento-card p-5 lg:col-span-7">
        <h3 className="mb-3 font-semibold text-slate-800">Diário reflexivo</h3>
        <input
          className="mb-2 w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm"
          placeholder="Título"
          value={journalTitle}
          onChange={(e) => setJournalTitle(e.target.value)}
        />
        <textarea
          className="w-full rounded-[24px] border border-gray-100 bg-slate-50 px-3 py-2 text-sm"
          rows={4}
          placeholder="Como você está se sentindo?"
          value={journalContent}
          onChange={(e) => setJournalContent(e.target.value)}
        />
        <button
          onClick={() => {
            if (!journalTitle.trim()) return
            setJournal((j) => [
              { id: uid('j'), date: todayISO(), title: journalTitle, content: journalContent },
              ...j,
            ])
            setJournalTitle('')
            setJournalContent('')
          }}
          className={`mt-3 w-full ${primaryBtn}`}
        >
          Salvar entrada
        </button>
        <div className="mt-4 space-y-2">
          {journal.slice(0, 5).map((j) => (
            <div key={j.id} className="rounded-2xl px-3 py-2" style={{ background: `${accent}33` }}>
              <p className="text-sm font-medium text-slate-700">{j.title}</p>
              <p className="text-xs text-slate-400">{j.date}</p>
              {j.content && <p className="mt-1 text-xs text-slate-500">{j.content}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LivrosTab() {
  const { books, setBooks } = useApp()
  const { accent } = useModuleStyle('devpessoal', '#FDA4AF')
  const [modal, setModal] = useState<'new' | Book | null>(null)

  return (
    <div className="bento-card p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookMarked size={18} style={{ color: accent }} />
          <h3 className="font-semibold text-slate-800">Lista de Leituras</h3>
        </div>
        <button
          onClick={() => setModal('new')}
          className="flex items-center gap-1 rounded-full bg-rose-50 px-3 py-2 text-xs font-bold text-rose-500"
        >
          <Plus size={14} /> Livro
        </button>
      </div>
      <div className="space-y-3">
        {books.map((b) => (
          <div key={b.id} className="rounded-2xl bg-slate-50 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">{b.title}</p>
                <p className="text-xs text-slate-400">{b.author}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <select
                  className="rounded-xl border border-gray-100 px-2 py-1 text-[11px]"
                  value={b.status}
                  onChange={(e) =>
                    setBooks((list) =>
                      list.map((x) => (x.id === b.id ? { ...x, status: e.target.value as Book['status'] } : x)),
                    )
                  }
                >
                  <option value="desejado">Desejado</option>
                  <option value="lendo">Lendo</option>
                  <option value="lido">Lido</option>
                </select>
                <button onClick={() => setModal(b)} className="text-slate-400 hover:text-slate-600">
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => setBooks((list) => list.filter((x) => x.id !== b.id))}
                  className="text-rose-400 hover:text-rose-600"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <div className="mt-2 flex gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <button
                  key={i}
                  onClick={() =>
                    setBooks((list) =>
                      list.map((x) => (x.id === b.id ? { ...x, rating: i + 1 === x.rating ? 0 : i + 1 } : x)),
                    )
                  }
                >
                  <Star
                    size={14}
                    className={i < b.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                  />
                </button>
              ))}
            </div>
            {b.status === 'lendo' && (
              <div className="mt-2">
                <div className="mb-1 flex justify-between text-xs text-slate-400">
                  <span>
                    {b.pagesRead}/{b.totalPages} págs
                  </span>
                  <button
                    className="font-semibold"
                    style={{ color: accent }}
                    onClick={() =>
                      setBooks((list) =>
                        list.map((x) =>
                          x.id === b.id
                            ? { ...x, pagesRead: Math.min(x.totalPages, x.pagesRead + 10) }
                            : x,
                        ),
                      )
                    }
                  >
                    +10 págs
                  </button>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(b.pagesRead / b.totalPages) * 100}%`,
                      background: accent,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
        {books.length === 0 && <p className="py-4 text-center text-sm text-slate-400">Nenhum livro cadastrado</p>}
      </div>

      <Modal open={!!modal} title={modal === 'new' ? 'Novo Livro' : 'Editar Livro'} onClose={() => setModal(null)}>
        {modal && (
          <BookForm
            book={modal === 'new' ? undefined : modal}
            onSave={(b) => {
              setBooks((list) => (modal === 'new' ? [b, ...list] : list.map((x) => (x.id === b.id ? b : x))))
              setModal(null)
            }}
          />
        )}
      </Modal>
    </div>
  )
}

function BookForm({ book, onSave }: { book?: Book; onSave: (b: Book) => void }) {
  const [form, setForm] = useState<Book>(
    book ?? { id: uid('b'), title: '', author: '', status: 'desejado', pagesRead: 0, totalPages: 0, rating: 0 },
  )
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        onSave(form)
      }}
    >
      <input className="w-full rounded-2xl border border-gray-100 px-3 py-3 text-sm" placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
      <input className="w-full rounded-2xl border border-gray-100 px-3 py-3 text-sm" placeholder="Autor" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} required />
      <select className="w-full rounded-2xl border border-gray-100 px-3 py-3 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Book['status'] })}>
        <option value="desejado">Desejado</option>
        <option value="lendo">Lendo</option>
        <option value="lido">Lido</option>
      </select>
      <input className="w-full rounded-2xl border border-gray-100 px-3 py-3 text-sm" type="number" placeholder="Total de páginas" value={form.totalPages} onChange={(e) => setForm({ ...form, totalPages: Number(e.target.value) || 0 })} />
      <button className="w-full rounded-full bg-rose-400 py-3 text-sm font-bold text-white">Salvar</button>
    </form>
  )
}

function CompetenciasTab() {
  const { wheel, setWheel } = useApp()
  const { accent, tileClass, surface } = useModuleStyle('devpessoal', '#FDA4AF')

  return (
    <div className={`${tileClass} p-5`} style={surface(accent)}>
      <h3 className="mb-4 font-bold text-[#1F2937]">Roda da Vida</h3>
      <div className="space-y-3">
        {wheel.map((w) => (
          <div key={w.area}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-[#1F2937]/75">{w.area}</span>
              <span className="font-bold text-[#1F2937]">{w.score}/10</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={w.score}
              onChange={(e) =>
                setWheel((list) =>
                  list.map((x) => (x.area === w.area ? { ...x, score: Number(e.target.value) } : x)),
                )
              }
              className="w-full accent-[var(--module-accent)]"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

const MOOD_EMOJI = ['😞', '😕', '😐', '🙂', '😄']

function MeditationTimer() {
  const { addNotification } = useApp()
  const { primaryBtn, secondaryBtn } = useModuleStyle('devpessoal', '#FDA4AF')
  const DURATION = 5 * 60
  const [seconds, setSeconds] = useState(DURATION)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false)
          addNotification('Sessão de meditação de 5 minutos concluída 🧘')
          return DURATION
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running, addNotification])

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  return (
    <div className="bento-card p-5 text-center">
      <h3 className="mb-1 font-semibold text-slate-800">Meditação guiada</h3>
      <p className="mb-3 text-xs text-slate-400">Respire fundo por 5 minutos</p>
      <p className="text-4xl font-bold tabular-nums text-[#1F2937]">{mm}:{ss}</p>
      <div className="mt-4 flex justify-center gap-2">
        <button onClick={() => setRunning((r) => !r)} className={`flex items-center gap-2 ${primaryBtn}`}>
          {running ? <Pause size={16} /> : <Play size={16} />}
          {running ? 'Pausar' : 'Iniciar'}
        </button>
        <button
          onClick={() => {
            setRunning(false)
            setSeconds(DURATION)
          }}
          className={secondaryBtn.replace('px-4 py-2.5', 'p-2.5')}
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  )
}

function MeditacaoTab() {
  const { gratitude, setGratitude, moods, setMoods } = useApp()
  const { accent } = useModuleStyle('devpessoal', '#FDA4AF')
  const today = todayISO()
  const todayMood = moods.find((m) => m.date === today)
  const [mood, setMood] = useState(todayMood?.mood ?? 4)
  const [note, setNote] = useState(todayMood?.note ?? '')
  const [gratitudeText, setGratitudeText] = useState('')

  const last7 = useMemo(() => {
    const days: string[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push(d.toISOString().slice(0, 10))
    }
    return days.map((date) => ({ date, entry: moods.find((m) => m.date === date) }))
  }, [moods])

  const saveMood = (n: number, noteText: string) => {
    setMood(n)
    setMoods((list) => [
      { id: uid('m'), date: today, mood: n, note: noteText },
      ...list.filter((m) => m.date !== today),
    ])
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="bento-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Smile size={18} className="text-amber-500" />
          <h3 className="font-semibold text-slate-800">Humor de hoje</h3>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => saveMood(n, note)}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-lg transition hover:scale-110 ${
                mood === n ? 'ring-2' : 'bg-slate-50'
              }`}
              style={
                mood === n
                  ? { background: `${accent}55`, outlineColor: accent, boxShadow: `0 0 0 2px ${accent}` }
                  : undefined
              }
            >
              {MOOD_EMOJI[n - 1]}
            </button>
          ))}
        </div>
        <input
          className="mt-3 w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm"
          placeholder="Uma nota sobre seu dia (opcional)"
          value={note}
          onChange={(e) => {
            setNote(e.target.value)
            saveMood(mood, e.target.value)
          }}
        />
        <div className="mt-4 flex justify-between gap-1">
          {last7.map(({ date, entry }) => (
            <div key={date} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-lg">{entry ? MOOD_EMOJI[entry.mood - 1] : '·'}</span>
              <span className="text-[9px] text-slate-400">
                {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'narrow' })}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
          💡 Dica: reserve 2 minutos para respirar fundo e observar como você se sente antes de registrar seu humor.
        </p>
      </div>

      <div className="space-y-4">
        <MeditationTimer />
        <div className="bento-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Heart size={18} className="text-rose-500" />
            <h3 className="font-semibold text-slate-800">Diário de Gratidão</h3>
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-2xl border border-gray-100 px-3 py-2 text-sm"
              placeholder="Hoje sou grata por..."
              value={gratitudeText}
              onChange={(e) => setGratitudeText(e.target.value)}
            />
            <button
              onClick={() => {
                if (!gratitudeText.trim()) return
                setGratitude((g) => [{ id: uid('g'), text: gratitudeText, date: todayISO() }, ...g])
                setGratitudeText('')
              }}
              className="rounded-2xl px-3 py-2 text-sm font-bold text-[#1F2937] hover:scale-105"
              style={{ background: accent }}
            >
              Add
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {gratitude.slice(0, 6).map((g) => (
              <p key={g.id} className="rounded-2xl bg-rose-50/60 px-3 py-2 text-sm text-slate-600">
                💖 {g.text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
