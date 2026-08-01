import { useState } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'
import { useModuleStyle } from '../hooks/useModuleStyle'
import { useCustomization } from '../store/CustomizationStore'
import { contrastText, VIEW_OPTIONS } from '../data/modules'
import type { ModuleId } from '../types'
import { uid } from '../utils/format'
import { ModuleHero } from './ModuleHero'
import { ViewSwitcher } from './ViewSwitcher'

interface CustomBoardProps {
  moduleId: string
}

export function CustomBoard({ moduleId }: CustomBoardProps) {
  const { getModule, customData, updateCustomData, setModuleView } = useCustomization()
  const { accent, primaryBtn, pageVars, tileClass, surface, panelClass } = useModuleStyle(
    moduleId as ModuleId,
    '#D1C4FF',
  )
  const mod = getModule(moduleId)
  const data = customData[moduleId] ?? { id: moduleId, notes: '', items: [] }
  const [text, setText] = useState('')
  const view = mod?.viewMode ?? 'checklist'
  const ink = contrastText(accent)
  const doneCount = data.items.filter((i) => i.done).length

  if (!mod) return null

  return (
    <div style={pageVars} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span
            className="mb-2 inline-flex rounded-full border px-3 py-1 text-xs font-bold"
            style={{ background: accent, color: ink, borderColor: 'rgba(31,41,55,0.2)' }}
          >
            Aba personalizada
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-[var(--app-fg)]">{mod.label}</h2>
          <p className="mt-1 text-sm text-slate-500">
            Crie checklists, notas ou um board simples — do seu jeito.
          </p>
        </div>
        <ViewSwitcher
          options={VIEW_OPTIONS.custom}
          value={view}
          onChange={(v) => setModuleView(moduleId, v)}
          accent={accent}
        />
      </div>

      <ModuleHero
        moduleId={moduleId as ModuleId}
        fallback={accent}
        title="Itens"
        value={`${doneCount}/${data.items.length}`}
        subtitle={view === 'notas' ? 'Modo notas' : view === 'kanban' ? 'Modo board' : 'Checklist'}
      />

      {view === 'notas' && (
        <div className={`${panelClass} p-5`} style={surface(accent)}>
          <textarea
            className="min-h-[280px] w-full resize-y rounded-[24px] border border-[#1F2937]/15 bg-white/80 p-4 text-sm outline-none"
            placeholder="Escreva suas notas livres aqui..."
            value={data.notes}
            onChange={(e) => updateCustomData(moduleId, { notes: e.target.value })}
          />
        </div>
      )}

      {(view === 'checklist' || view === 'kanban') && (
        <div className="space-y-4">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (!text.trim()) return
              updateCustomData(moduleId, {
                items: [...data.items, { id: uid('item'), text: text.trim(), done: false }],
              })
              setText('')
            }}
          >
            <input
              className="flex-1 rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-medium outline-none"
              placeholder="Novo item..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button type="submit" className={`flex items-center gap-2 ${primaryBtn}`}>
              <Plus size={16} /> Add
            </button>
          </form>

          {view === 'checklist' ? (
            <div className="space-y-2">
              {data.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-[24px] border border-gray-100 bg-white px-4 py-3 shadow-sm"
                >
                  <button
                    onClick={() =>
                      updateCustomData(moduleId, {
                        items: data.items.map((i) =>
                          i.id === item.id ? { ...i, done: !i.done } : i,
                        ),
                      })
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-[#1F2937]/20"
                    style={{ background: item.done ? accent : 'white' }}
                  >
                    {item.done && <Check size={14} strokeWidth={3} />}
                  </button>
                  <p
                    className={`flex-1 text-sm font-semibold ${
                      item.done ? 'line-through text-slate-400' : 'text-[#1F2937]'
                    }`}
                  >
                    {item.text}
                  </p>
                  <button
                    onClick={() =>
                      updateCustomData(moduleId, {
                        items: data.items.filter((i) => i.id !== item.id),
                      })
                    }
                    className="text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {data.items.length === 0 && (
                <p className="rounded-[24px] border-2 border-dashed border-slate-300 py-10 text-center text-sm text-slate-400">
                  Nenhum item ainda — adicione o primeiro!
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                { key: 'todo', label: 'A fazer', filter: (d: boolean) => !d },
                { key: 'done', label: 'Feito', filter: (d: boolean) => d },
              ].map((col) => (
                <div
                  key={col.key}
                  className={`${tileClass} p-4`}
                  style={surface(col.key === 'done' ? '#A5F387' : accent)}
                >
                  <h3 className="mb-3 text-sm font-bold text-[#1F2937]">{col.label}</h3>
                  <div className="space-y-2">
                    {data.items
                      .filter((i) => col.filter(i.done))
                      .map((item) => (
                        <button
                          key={item.id}
                          onClick={() =>
                            updateCustomData(moduleId, {
                              items: data.items.map((i) =>
                                i.id === item.id ? { ...i, done: !i.done } : i,
                              ),
                            })
                          }
                          className="w-full rounded-[20px] border border-[#1F2937]/10 bg-white/85 px-3 py-2.5 text-left text-sm font-semibold hover:scale-[1.01]"
                        >
                          {item.text}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
