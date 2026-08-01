import { useState } from 'react'
import { Plus } from 'lucide-react'
import { VIEW_OPTIONS } from '../data/modules'
import { useApp } from '../store/AppStore'
import { useCustomization } from '../store/CustomizationStore'
import type { ContentItem, ViewMode } from '../types'
import { todayISO, uid } from '../utils/format'
import { Modal, SectionTitle } from './ui'
import { ViewSwitcher } from './ViewSwitcher'

const pipeline: { id: ContentItem['status']; label: string }[] = [
  { id: 'ideia', label: 'Ideia' },
  { id: 'roteiro', label: 'Roteiro' },
  { id: 'gravando', label: 'Gravando' },
  { id: 'editado', label: 'Editado' },
  { id: 'publicado', label: 'Publicado' },
]

const platforms: ContentItem['platform'][] = ['Instagram', 'YouTube', 'TikTok', 'Blog']

export function Conteudo() {
  const { content, setContent } = useApp()
  const { getModule, setModuleView } = useCustomization()
  const mod = getModule('conteudo')
  const view = (mod?.viewMode === 'lista' ? 'lista' : 'kanban') as 'lista' | 'kanban'
  const accent = mod?.color ?? '#E5D3B3'
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    platform: 'Instagram' as ContentItem['platform'],
    status: 'ideia' as ContentItem['status'],
    publishDate: todayISO(),
  })

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SectionTitle title="Gestão de Conteúdo" subtitle="Pipeline editorial para redes e projetos criativos" />
        <div className="flex flex-wrap gap-2">
          <ViewSwitcher
            options={VIEW_OPTIONS.conteudo}
            value={view}
            onChange={(v: ViewMode) => setModuleView('conteudo', v)}
            accent={accent}
          />
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-full border-2 border-[#1F2937] bg-[#1F2937] px-4 py-2 text-sm font-bold text-white shadow-[3px_3px_0_#E5D3B3] hover:scale-105"
          >
            <Plus size={16} /> Nova ideia
          </button>
        </div>
      </div>

      {view === 'kanban' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {pipeline.map((col) => (
            <div key={col.id} className="rounded-[28px] border-2 border-[#1F2937] bg-white p-4 shadow-[4px_4px_0_#1F2937]">
              <h3 className="mb-3 text-sm font-bold text-slate-700">
                {col.label}{' '}
                <span className="text-slate-400">
                  ({content.filter((c) => c.status === col.id).length})
                </span>
              </h3>
              <div className="space-y-2">
                {content
                  .filter((c) => c.status === col.id)
                  .map((c) => (
                    <div key={c.id} className="rounded-[20px] border-2 border-[#1F2937]/15 bg-[#FAFAF7] p-3">
                      <p className="text-sm font-bold text-slate-800">{c.title}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {c.platform} · {c.publishDate}
                      </p>
                      <select
                        className="mt-2 w-full rounded-xl border-2 border-[#1F2937]/10 px-2 py-1 text-xs"
                        value={c.status}
                        onChange={(e) =>
                          setContent((list) =>
                            list.map((x) =>
                              x.id === c.id ? { ...x, status: e.target.value as ContentItem['status'] } : x,
                            ),
                          )
                        }
                      >
                        {pipeline.map((p) => (
                          <option key={p.id} value={p.id}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[28px] border-2 border-[#1F2937] bg-white shadow-[4px_4px_0_#1F2937]">
          {content.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-0">
              <div>
                <p className="text-sm font-bold text-slate-800">{c.title}</p>
                <p className="text-xs text-slate-400">{c.platform} · {c.publishDate}</p>
              </div>
              <select
                className="rounded-full border-2 border-[#1F2937] px-3 py-1 text-xs font-bold"
                style={{ background: accent }}
                value={c.status}
                onChange={(e) =>
                  setContent((list) =>
                    list.map((x) =>
                      x.id === c.id ? { ...x, status: e.target.value as ContentItem['status'] } : x,
                    ),
                  )
                }
              >
                {pipeline.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} title="Novo Conteúdo" onClose={() => setOpen(false)}>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            setContent((list) => [{ id: uid('c'), ...form }, ...list])
            setOpen(false)
            setForm({ title: '', platform: 'Instagram', status: 'ideia', publishDate: todayISO() })
          }}
        >
          <input className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm" placeholder="Título / ideia" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <select className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value as ContentItem['platform'] })}>
            {platforms.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <select className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ContentItem['status'] })}>
            {pipeline.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <input className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm" type="date" value={form.publishDate} onChange={(e) => setForm({ ...form, publishDate: e.target.value })} />
          <button className="w-full rounded-full bg-[#1F2937] py-2.5 text-sm font-bold text-white">Salvar</button>
        </form>
      </Modal>
    </div>
  )
}
