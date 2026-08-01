import { useEffect, useMemo, useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { useModuleStyle } from '../hooks/useModuleStyle'
import { useApp } from '../store/AppStore'
import { ModuleHero } from './ModuleHero'
import { SectionTitle } from './ui'

export function Estudos() {
  const { subjects, setSubjects, flashcards } = useApp()
  const { accent, primaryBtn, secondaryBtn, pageVars, tileClass, surface } = useModuleStyle(
    'estudos',
    '#C4B5FD',
  )
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.id ?? '')
  const [cardIndex, setCardIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const [seconds, setSeconds] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [mode, setMode] = useState<'focus' | 'break'>('focus')

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false)
          if (mode === 'focus') {
            setMode('break')
            return 5 * 60
          }
          setMode('focus')
          return 25 * 60
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running, mode])

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  const avgProgress = useMemo(() => {
    if (!subjects.length) return 0
    return Math.round(subjects.reduce((s, x) => s + x.progress, 0) / subjects.length)
  }, [subjects])

  const subjectCards = flashcards.filter((f) => f.subjectId === selectedSubject)
  const card = subjectCards[cardIndex]

  return (
    <div style={pageVars} className="space-y-5">
      <SectionTitle title="Estudos & Central Acadêmica" subtitle="Matérias, Pomodoro e Flashcards" />

      <ModuleHero
        moduleId="estudos"
        fallback="#C4B5FD"
        title="Progresso médio"
        value={`${avgProgress}%`}
        subtitle={`${subjects.length} matérias · Pomodoro ${mode === 'focus' ? 'foco' : 'pausa'}`}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          {subjects.map((s) => (
            <div key={s.id} className={`${tileClass} p-5`} style={surface(accent)}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold text-[#1F2937]">{s.name}</h4>
                  {s.nextExam && (
                    <p className="text-xs text-[#1F2937]/55">Próxima prova: {s.nextExam}</p>
                  )}
                </div>
                <span className="rounded-full bg-white/80 px-2 py-1 text-sm font-bold text-[#1F2937]">
                  {s.progress}%
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/50">
                <div
                  className="h-full rounded-full bg-[#1F2937]"
                  style={{ width: `${s.progress}%` }}
                />
              </div>
              <textarea
                className="mt-3 w-full rounded-2xl border border-[#1F2937]/10 bg-white/70 px-3 py-2 text-sm"
                rows={2}
                value={s.notes}
                onChange={(e) =>
                  setSubjects((list) =>
                    list.map((x) => (x.id === s.id ? { ...x, notes: e.target.value } : x)),
                  )
                }
              />
              <input
                type="range"
                min={0}
                max={100}
                value={s.progress}
                onChange={(e) =>
                  setSubjects((list) =>
                    list.map((x) =>
                      x.id === s.id ? { ...x, progress: Number(e.target.value) } : x,
                    ),
                  )
                }
                className="mt-2 w-full accent-[var(--module-accent)]"
              />
            </div>
          ))}
        </div>

        <div className="space-y-4 lg:col-span-5">
          <div className={`${tileClass} p-6 text-center`} style={surface(accent)}>
            <p className="text-xs font-bold uppercase tracking-wide text-[#1F2937]/60">
              Pomodoro · {mode === 'focus' ? 'Foco' : 'Pausa'}
            </p>
            <p className="mt-3 text-5xl font-bold tabular-nums text-[#1F2937]">
              {mm}:{ss}
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <button onClick={() => setRunning((r) => !r)} className={`flex items-center gap-2 ${primaryBtn}`}>
                {running ? <Pause size={16} /> : <Play size={16} />}
                {running ? 'Pausar' : 'Iniciar'}
              </button>
              <button
                onClick={() => {
                  setRunning(false)
                  setMode('focus')
                  setSeconds(25 * 60)
                }}
                className={secondaryBtn.replace('px-4 py-2.5', 'p-2.5')}
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>

          <div className="bento-card p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h4 className="font-semibold text-slate-800">Flashcards</h4>
              <select
                className="rounded-xl border border-gray-100 px-2 py-1 text-xs"
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value)
                  setCardIndex(0)
                  setFlipped(false)
                }}
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            {card ? (
              <>
                <button
                  onClick={() => setFlipped((f) => !f)}
                  className="flex min-h-[120px] w-full items-center justify-center rounded-[24px] border border-[#1F2937]/10 p-4 text-center text-sm font-medium text-[#1F2937] hover:scale-[1.01]"
                  style={surface(accent)}
                >
                  {flipped ? card.back : card.front}
                </button>
                <div className="mt-3 flex justify-between">
                  <button
                    className="text-sm font-semibold"
                    style={{ color: accent }}
                    onClick={() => {
                      setFlipped(false)
                      setCardIndex((i) => (i - 1 + subjectCards.length) % subjectCards.length)
                    }}
                  >
                    Anterior
                  </button>
                  <button
                    className="text-sm font-semibold"
                    style={{ color: accent }}
                    onClick={() => {
                      setFlipped(false)
                      setCardIndex((i) => (i + 1) % subjectCards.length)
                    }}
                  >
                    Próximo
                  </button>
                </div>
              </>
            ) : (
              <p className="py-6 text-center text-sm text-slate-400">Sem flashcards</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
