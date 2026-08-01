import { useMemo, useState } from 'react'
import { BookMarked, Heart, Smile, Star } from 'lucide-react'
import { useModuleStyle } from '../hooks/useModuleStyle'
import { useApp } from '../store/AppStore'
import { todayISO, uid } from '../utils/format'
import { ModuleHero } from './ModuleHero'
import { SectionTitle } from './ui'

export function DevPessoal() {
  const {
    wheel,
    setWheel,
    gratitude,
    setGratitude,
    books,
    setBooks,
    moods,
    setMoods,
    journal,
    setJournal,
    affirmations,
  } = useApp()
  const { accent, primaryBtn, pageVars, tileClass, surface } = useModuleStyle(
    'devpessoal',
    '#FDA4AF',
  )

  const [gratitudeText, setGratitudeText] = useState('')
  const [journalTitle, setJournalTitle] = useState('')
  const [journalContent, setJournalContent] = useState('')
  const [mood, setMood] = useState(4)
  const affirmation = affirmations[Math.floor(Date.now() / 86400000) % affirmations.length]

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

      <ModuleHero
        moduleId="devpessoal"
        fallback="#FDA4AF"
        title="Roda da Vida"
        value={`${avgWheel}/10`}
        subtitle={`Humor hoje: ${['😞', '😕', '😐', '🙂', '😄'][mood - 1]}`}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className={`${tileClass} p-5 lg:col-span-6`} style={surface(accent)}>
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
                      list.map((x) =>
                        x.area === w.area ? { ...x, score: Number(e.target.value) } : x,
                      ),
                    )
                  }
                  className="w-full accent-[var(--module-accent)]"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 lg:col-span-6">
          <div className={`${tileClass} p-5`} style={surface(accent)}>
            <p className="text-xs font-bold uppercase tracking-wide text-[#1F2937]/55">
              Afirmação do dia
            </p>
            <p className="mt-2 text-lg font-medium text-[#1F2937]">“{affirmation}”</p>
          </div>

          <div className="bento-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Smile size={18} className="text-amber-500" />
              <h3 className="font-semibold text-slate-800">Humor de hoje</h3>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    setMood(n)
                    setMoods((list) => [
                      { id: uid('m'), date: todayISO(), mood: n, note: '' },
                      ...list.filter((m) => m.date !== todayISO()),
                    ])
                  }}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-lg transition hover:scale-110 ${
                    mood === n ? 'ring-2' : 'bg-slate-50'
                  }`}
                  style={
                    mood === n
                      ? { background: `${accent}55`, outlineColor: accent, boxShadow: `0 0 0 2px ${accent}` }
                      : undefined
                  }
                >
                  {['😞', '😕', '😐', '🙂', '😄'][n - 1]}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-400">Últimos registros: {moods.length}</p>
          </div>

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
                  setGratitude((g) => [
                    { id: uid('g'), text: gratitudeText, date: todayISO() },
                    ...g,
                  ])
                  setGratitudeText('')
                }}
                className="rounded-2xl px-3 py-2 text-sm font-bold text-[#1F2937] hover:scale-105"
                style={{ background: accent }}
              >
                Add
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {gratitude.slice(0, 4).map((g) => (
                <p key={g.id} className="rounded-2xl bg-rose-50/60 px-3 py-2 text-sm text-slate-600">
                  💖 {g.text}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="bento-card p-5 lg:col-span-6">
          <div className="mb-3 flex items-center gap-2">
            <BookMarked size={18} style={{ color: accent }} />
            <h3 className="font-semibold text-slate-800">Lista de Leituras</h3>
          </div>
          <div className="space-y-3">
            {books.map((b) => (
              <div key={b.id} className="rounded-2xl bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{b.title}</p>
                    <p className="text-xs text-slate-400">
                      {b.author} · {b.status}
                    </p>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={i < b.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                      />
                    ))}
                  </div>
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
          </div>
        </div>

        <div className="bento-card p-5 lg:col-span-6">
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
            {journal.slice(0, 3).map((j) => (
              <div
                key={j.id}
                className="rounded-2xl px-3 py-2"
                style={{ background: `${accent}33` }}
              >
                <p className="text-sm font-medium text-slate-700">{j.title}</p>
                <p className="text-xs text-slate-400">{j.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
