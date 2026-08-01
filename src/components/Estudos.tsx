import { useEffect, useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { SectionTitle } from './ui'

export function Estudos() {
  const { subjects, setSubjects, flashcards } = useApp()
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

  const subjectCards = flashcards.filter((f) => f.subjectId === selectedSubject)
  const card = subjectCards[cardIndex]

  return (
    <div>
      <SectionTitle title="Estudos & Central Acadêmica" subtitle="Matérias, Pomodoro e Flashcards" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          {subjects.map((s) => (
            <div key={s.id} className="bento-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-slate-800">{s.name}</h4>
                  {s.nextExam && <p className="text-xs text-slate-400">Próxima prova: {s.nextExam}</p>}
                </div>
                <span className="text-sm font-bold text-violet-600">{s.progress}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#6C4BFF] to-[#3B82F6]"
                  style={{ width: `${s.progress}%` }}
                />
              </div>
              <textarea
                className="mt-3 w-full rounded-2xl border border-gray-100 bg-slate-50 px-3 py-2 text-sm"
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
                    list.map((x) => (x.id === s.id ? { ...x, progress: Number(e.target.value) } : x)),
                  )
                }
                className="mt-2 w-full accent-[#6C4BFF]"
              />
            </div>
          ))}
        </div>

        <div className="space-y-4 lg:col-span-5">
          <div className="bento-card p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-500">
              Pomodoro · {mode === 'focus' ? 'Foco' : 'Pausa'}
            </p>
            <p className="mt-3 text-5xl font-bold tabular-nums text-slate-800">
              {mm}:{ss}
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <button
                onClick={() => setRunning((r) => !r)}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#6C4BFF] to-[#3B82F6] px-4 py-2 text-sm font-semibold text-white hover:scale-105"
              >
                {running ? <Pause size={16} /> : <Play size={16} />}
                {running ? 'Pausar' : 'Iniciar'}
              </button>
              <button
                onClick={() => {
                  setRunning(false)
                  setMode('focus')
                  setSeconds(25 * 60)
                }}
                className="rounded-full bg-slate-100 p-2.5 text-slate-600 hover:scale-105"
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
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            {card ? (
              <>
                <button
                  onClick={() => setFlipped((f) => !f)}
                  className="flex min-h-[120px] w-full items-center justify-center rounded-[24px] bg-gradient-to-br from-violet-50 to-blue-50 p-4 text-center text-sm font-medium text-slate-700 hover:scale-[1.01]"
                >
                  {flipped ? card.back : card.front}
                </button>
                <div className="mt-3 flex justify-between">
                  <button
                    className="text-sm text-violet-600"
                    onClick={() => {
                      setFlipped(false)
                      setCardIndex((i) => (i - 1 + subjectCards.length) % subjectCards.length)
                    }}
                  >
                    Anterior
                  </button>
                  <button
                    className="text-sm text-violet-600"
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
