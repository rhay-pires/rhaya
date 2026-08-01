import { useEffect, useMemo, useState } from 'react'
import { Pause, Pencil, Play, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { useModuleStyle } from '../hooks/useModuleStyle'
import type { Flashcard, Subject } from '../types'
import { todayISO, uid } from '../utils/format'
import { ModuleHero } from './ModuleHero'
import { EmptyState, Modal, PillTabs, SectionTitle } from './ui'

type EstudosTab = 'immes' | 'univesp' | 'timer'

const tabs: { id: EstudosTab; label: string }[] = [
  { id: 'immes', label: '🏫 IMMES' },
  { id: 'univesp', label: '💻 Univesp' },
  { id: 'timer', label: '⏱️ Timer' },
]

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null
  const today = new Date(todayISO() + 'T00:00:00')
  const target = new Date(dateStr + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

export function Estudos() {
  const { subjects } = useApp()
  const { accent, pageVars } = useModuleStyle('estudos', '#C4B5FD')
  const [tab, setTab] = useState<EstudosTab>('immes')

  const avgProgress = useMemo(() => {
    if (!subjects.length) return 0
    return Math.round(subjects.reduce((s, x) => s + x.progress, 0) / subjects.length)
  }, [subjects])

  const nextExam = useMemo(() => {
    const withExam = subjects
      .map((s) => ({ s, days: daysUntil(s.nextExam) }))
      .filter((x): x is { s: Subject; days: number } => x.days !== null && x.days >= 0)
      .sort((a, b) => a.days - b.days)
    return withExam[0] ?? null
  }, [subjects])

  return (
    <div style={pageVars} className="space-y-5">
      <SectionTitle title="Estudos & Central Acadêmica" subtitle="Matérias, Pomodoro e Flashcards" />

      <PillTabs tabs={tabs} active={tab} onChange={setTab} accent={accent} />

      <ModuleHero
        moduleId="estudos"
        fallback="#C4B5FD"
        title="Progresso médio"
        value={`${avgProgress}%`}
        subtitle={
          nextExam
            ? `${subjects.length} matérias · próxima prova em ${nextExam.days} dia${nextExam.days === 1 ? '' : 's'} (${nextExam.s.name})`
            : `${subjects.length} matérias`
        }
      />

      {tab === 'immes' && <SubjectsTab school="immes" />}
      {tab === 'univesp' && <SubjectsTab school="univesp" />}
      {tab === 'timer' && <TimerTab />}
    </div>
  )
}

function SubjectsTab({ school }: { school: 'immes' | 'univesp' }) {
  const { subjects, setSubjects } = useApp()
  const { accent, tileClass, surface, primaryBtn } = useModuleStyle('estudos', '#C4B5FD')
  const [modal, setModal] = useState<'new' | Subject | null>(null)

  const filtered = subjects.filter((s: Subject) =>
    school === 'immes' ? !s.school || s.school === 'immes' : s.school === 'univesp',
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setModal('new')} className={`flex items-center gap-2 ${primaryBtn}`}>
          <Plus size={16} /> Matéria
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState text="Nenhuma matéria cadastrada nesta instituição" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((s) => {
            const days = daysUntil(s.nextExam)
            return (
              <div key={s.id} className={`${tileClass} p-5`} style={surface(accent)}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-[#1F2937]">{s.name}</h4>
                    {s.nextExam && (
                      <p className="text-xs text-[#1F2937]/55">
                        Próxima prova: {s.nextExam}
                        {days !== null && days >= 0 ? ` · em ${days}d` : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="rounded-full bg-white/80 px-2 py-1 text-sm font-bold text-[#1F2937]">
                      {s.progress}%
                    </span>
                    <button onClick={() => setModal(s)} className="rounded-full bg-white/70 p-1.5 text-[#1F2937]">
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setSubjects((list) => list.filter((x) => x.id !== s.id))}
                      className="rounded-full bg-white/70 p-1.5 text-rose-500"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/50">
                  <div className="h-full rounded-full bg-[#1F2937]" style={{ width: `${s.progress}%` }} />
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
                      list.map((x) => (x.id === s.id ? { ...x, progress: Number(e.target.value) } : x)),
                    )
                  }
                  className="mt-2 w-full accent-[var(--module-accent)]"
                />
              </div>
            )
          })}
        </div>
      )}

      <Modal open={!!modal} title={modal === 'new' ? 'Nova Matéria' : 'Editar Matéria'} onClose={() => setModal(null)}>
        {modal && (
          <SubjectForm
            subject={modal === 'new' ? undefined : modal}
            defaultSchool={school}
            onSave={(s) => {
              setSubjects((list) => (modal === 'new' ? [s, ...list] : list.map((x) => (x.id === s.id ? s : x))))
              setModal(null)
            }}
            onDelete={
              modal !== 'new'
                ? () => {
                    setSubjects((list) => list.filter((x) => x.id !== (modal as Subject).id))
                    setModal(null)
                  }
                : undefined
            }
          />
        )}
      </Modal>
    </div>
  )
}

function SubjectForm({
  subject,
  defaultSchool,
  onSave,
  onDelete,
}: {
  subject?: Subject
  defaultSchool: 'immes' | 'univesp'
  onSave: (s: Subject) => void
  onDelete?: () => void
}) {
  const [form, setForm] = useState<Subject>(
    subject ?? {
      id: uid('sub'),
      name: '',
      progress: 0,
      nextExam: '',
      notes: '',
      school: defaultSchool,
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
      <input
        className="w-full rounded-2xl border border-gray-100 px-3 py-3 text-sm"
        placeholder="Nome da matéria"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />
      <select
        className="w-full rounded-2xl border border-gray-100 px-3 py-3 text-sm"
        value={form.school ?? 'immes'}
        onChange={(e) => setForm({ ...form, school: e.target.value as Subject['school'] })}
      >
        <option value="immes">IMMES</option>
        <option value="univesp">Univesp</option>
        <option value="outro">Outro</option>
      </select>
      <input
        className="w-full rounded-2xl border border-gray-100 px-3 py-3 text-sm"
        type="date"
        placeholder="Próxima prova"
        value={form.nextExam ?? ''}
        onChange={(e) => setForm({ ...form, nextExam: e.target.value })}
      />
      <textarea
        className="w-full rounded-2xl border border-gray-100 px-3 py-3 text-sm"
        rows={3}
        placeholder="Notas"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
      />
      <button className="w-full rounded-full bg-[#C4B5FD] py-3 text-sm font-bold text-[#1F2937]">Salvar</button>
      {onDelete && (
        <button type="button" onClick={onDelete} className="w-full rounded-full bg-rose-50 py-3 text-sm font-bold text-rose-500">
          Excluir matéria
        </button>
      )}
    </form>
  )
}

function TimerTab() {
  const { subjects, flashcards, setFlashcards, setSubjects, addNotification } = useApp()
  const { accent, primaryBtn, secondaryBtn, tileClass, surface } = useModuleStyle('estudos', '#C4B5FD')
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.id ?? '')
  const [cardIndex, setCardIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [cardModal, setCardModal] = useState<'new' | Flashcard | null>(null)

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
            if (selectedSubject) {
              setSubjects((list) =>
                list.map((x) => (x.id === selectedSubject ? { ...x, progress: Math.min(100, x.progress + 2) } : x)),
              )
              const subject = subjects.find((x) => x.id === selectedSubject)
              addNotification(`Sessão de foco concluída! +2% em ${subject?.name ?? 'matéria'} 🎉`)
            }
            return 5 * 60
          }
          setMode('focus')
          return 25 * 60
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running, mode, selectedSubject, subjects, setSubjects, addNotification])

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  const subjectCards = flashcards.filter((f) => f.subjectId === selectedSubject)
  const card = subjectCards[cardIndex]

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
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
          <p className="mt-3 text-xs text-[#1F2937]/55">
            Ao concluir um foco, a matéria selecionada ganha +2% de progresso.
          </p>
        </div>
      </div>

      <div className="space-y-4 lg:col-span-7">
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
              <div className="mt-3 flex items-center justify-between">
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
                <div className="flex gap-2">
                  <button onClick={() => setCardModal(card)} className="rounded-full bg-slate-50 p-2 text-slate-500">
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => {
                      setFlashcards((list) => list.filter((f) => f.id !== card.id))
                      setCardIndex(0)
                    }}
                    className="rounded-full bg-rose-50 p-2 text-rose-500"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
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
          <button
            onClick={() => setCardModal('new')}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#C4B5FD] py-2.5 text-sm font-bold text-[#7C3AED]"
          >
            <Plus size={14} /> Novo flashcard
          </button>
        </div>
      </div>

      <Modal open={!!cardModal} title={cardModal === 'new' ? 'Novo Flashcard' : 'Editar Flashcard'} onClose={() => setCardModal(null)}>
        {cardModal && (
          <FlashcardForm
            flashcard={cardModal === 'new' ? undefined : cardModal}
            subjectId={selectedSubject}
            onSave={(f) => {
              setFlashcards((list) => (cardModal === 'new' ? [f, ...list] : list.map((x) => (x.id === f.id ? f : x))))
              setCardModal(null)
            }}
          />
        )}
      </Modal>
    </div>
  )
}

function FlashcardForm({
  flashcard,
  subjectId,
  onSave,
}: {
  flashcard?: Flashcard
  subjectId: string
  onSave: (f: Flashcard) => void
}) {
  const [form, setForm] = useState<Flashcard>(
    flashcard ?? { id: uid('fc'), front: '', back: '', subjectId },
  )
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        onSave(form)
      }}
    >
      <textarea
        className="w-full rounded-2xl border border-gray-100 px-3 py-3 text-sm"
        rows={2}
        placeholder="Frente (pergunta)"
        value={form.front}
        onChange={(e) => setForm({ ...form, front: e.target.value })}
        required
      />
      <textarea
        className="w-full rounded-2xl border border-gray-100 px-3 py-3 text-sm"
        rows={2}
        placeholder="Verso (resposta)"
        value={form.back}
        onChange={(e) => setForm({ ...form, back: e.target.value })}
        required
      />
      <button className="w-full rounded-full bg-[#C4B5FD] py-3 text-sm font-bold text-[#1F2937]">Salvar</button>
    </form>
  )
}
