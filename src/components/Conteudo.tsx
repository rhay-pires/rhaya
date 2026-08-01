import { useMemo, useState } from 'react'
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import { VIEW_OPTIONS } from '../data/modules'
import { useModuleStyle } from '../hooks/useModuleStyle'
import { useApp } from '../store/AppStore'
import { useCustomization } from '../store/CustomizationStore'
import type { ContentItem, ViewMode } from '../types'
import { todayISO, uid } from '../utils/format'
import { ModuleHero } from './ModuleHero'
import { EmptyState, Modal, PillTabs, SectionTitle } from './ui'
import { ViewSwitcher } from './ViewSwitcher'

type ConteudoTab = 'planejamento' | 'publicados' | 'desempenho'

const tabs: { id: ConteudoTab; label: string }[] = [
  { id: 'planejamento', label: '🗂️ Planejamento' },
  { id: 'publicados', label: '✅ Publicados' },
  { id: 'desempenho', label: '📊 Desempenho' },
]

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
  const { accent, primaryBtn, pageVars } = useModuleStyle('conteudo', '#E5D3B3')
  const [tab, setTab] = useState<ConteudoTab>('planejamento')
  const [modal, setModal] = useState<'new' | ContentItem | null>(null)

  const inPipeline = content.filter((c) => c.status !== 'publicado').length

  return (
    <div style={pageVars} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle
          title="Gestão de Conteúdo"
          subtitle="Pipeline editorial para redes e projetos criativos"
        />
        <button onClick={() => setModal('new')} className={`flex items-center gap-2 ${primaryBtn}`}>
          <Plus size={16} /> Nova ideia
        </button>
      </div>

      <PillTabs tabs={tabs} active={tab} onChange={setTab} accent={accent} />

      <ModuleHero
        moduleId="conteudo"
        fallback="#E5D3B3"
        title="Em produção"
        value={String(inPipeline)}
        subtitle={`${content.filter((c) => c.status === 'publicado').length} publicados`}
      />

      {tab === 'planejamento' && <PlanejamentoTab onEdit={setModal} />}
      {tab === 'publicados' && <PublicadosTab onEdit={setModal} />}
      {tab === 'desempenho' && <DesempenhoTab />}

      <Modal open={!!modal} title={modal === 'new' ? 'Novo Conteúdo' : 'Editar Conteúdo'} onClose={() => setModal(null)}>
        {modal && (
          <ContentForm
            item={modal === 'new' ? undefined : modal}
            onSave={(c) => {
              setContent((list) => (modal === 'new' ? [c, ...list] : list.map((x) => (x.id === c.id ? c : x))))
              setModal(null)
            }}
            onDelete={
              modal !== 'new'
                ? () => {
                    setContent((list) => list.filter((x) => x.id !== (modal as ContentItem).id))
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

function ContentForm({
  item,
  onSave,
  onDelete,
}: {
  item?: ContentItem
  onSave: (c: ContentItem) => void
  onDelete?: () => void
}) {
  const [form, setForm] = useState<ContentItem>(
    item ?? {
      id: uid('c'),
      title: '',
      platform: 'Instagram',
      status: 'ideia',
      publishDate: todayISO(),
      brief: '',
      link: '',
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
        className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm"
        placeholder="Título / ideia"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        required
      />
      <textarea
        className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm"
        rows={2}
        placeholder="Briefing / roteiro resumido"
        value={form.brief ?? ''}
        onChange={(e) => setForm({ ...form, brief: e.target.value })}
      />
      <select
        className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm"
        value={form.platform}
        onChange={(e) => setForm({ ...form, platform: e.target.value as ContentItem['platform'] })}
      >
        {platforms.map((p) => (
          <option key={p}>{p}</option>
        ))}
      </select>
      <select
        className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm"
        value={form.status}
        onChange={(e) => setForm({ ...form, status: e.target.value as ContentItem['status'] })}
      >
        {pipeline.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
      <input
        className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm"
        type="date"
        value={form.publishDate}
        onChange={(e) => setForm({ ...form, publishDate: e.target.value })}
      />
      <input
        className="w-full rounded-2xl border border-gray-100 px-3 py-2 text-sm"
        placeholder="Link (opcional)"
        value={form.link ?? ''}
        onChange={(e) => setForm({ ...form, link: e.target.value })}
      />
      <button type="submit" className="w-full rounded-full bg-[#E5D3B3] py-2.5 text-sm font-bold text-[#1F2937]">
        Salvar
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="w-full rounded-full bg-rose-50 py-2.5 text-sm font-bold text-rose-500"
        >
          Excluir conteúdo
        </button>
      )}
    </form>
  )
}

function PlanejamentoTab({ onEdit }: { onEdit: (c: ContentItem) => void }) {
  const { content, setContent } = useApp()
  const { getModule, setModuleView } = useCustomization()
  const { accent, tileClass, surface, panelClass } = useModuleStyle('conteudo', '#E5D3B3')
  const mod = getModule('conteudo')
  const view = (mod?.viewMode === 'lista' ? 'lista' : 'kanban') as 'lista' | 'kanban'
  const pipelineCols = pipeline.filter((p) => p.id !== 'publicado')
  const inProgress = content.filter((c) => c.status !== 'publicado')

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ViewSwitcher
          options={VIEW_OPTIONS.conteudo}
          value={view}
          onChange={(v: ViewMode) => setModuleView('conteudo', v)}
          accent={accent}
        />
      </div>

      {view === 'kanban' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {pipelineCols.map((col) => (
            <div key={col.id} className={`${tileClass} p-4`} style={surface(accent)}>
              <h3 className="mb-3 text-sm font-bold text-[#1F2937]">
                {col.label}{' '}
                <span className="text-[#1F2937]/50">
                  ({content.filter((c) => c.status === col.id).length})
                </span>
              </h3>
              <div className="space-y-2">
                {content
                  .filter((c) => c.status === col.id)
                  .map((c) => (
                    <div key={c.id} className="rounded-[16px] border border-[#1F2937]/10 bg-white/80 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-[#1F2937]">{c.title}</p>
                        <div className="flex shrink-0 gap-1">
                          <button onClick={() => onEdit(c)} className="text-[#1F2937]/40">
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => setContent((list) => list.filter((x) => x.id !== c.id))}
                            className="text-rose-400"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-[#1F2937]/55">
                        {c.platform} · {c.publishDate}
                      </p>
                      <select
                        className="mt-2 w-full rounded-xl border border-gray-100 px-2 py-1 text-xs"
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
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`${panelClass} overflow-hidden`}>
          {inProgress.length === 0 ? (
            <div className="p-6">
              <EmptyState text="Nenhum conteúdo em planejamento" />
            </div>
          ) : (
            inProgress.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-white/70 px-4 py-3 last:border-0"
              >
                <div>
                  <p className="text-sm font-bold text-slate-800">{c.title}</p>
                  <p className="text-xs text-slate-400">
                    {c.platform} · {c.publishDate}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="rounded-full border px-3 py-1 text-xs font-bold"
                    style={{ background: accent, borderColor: 'rgba(31,41,55,0.15)' }}
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
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => onEdit(c)} className="rounded-full bg-slate-50 p-1.5 text-slate-500">
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setContent((list) => list.filter((x) => x.id !== c.id))}
                    className="rounded-full bg-rose-50 p-1.5 text-rose-500"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function PublicadosTab({ onEdit }: { onEdit: (c: ContentItem) => void }) {
  const { content, setContent } = useApp()
  const { accent, tileClass, surface } = useModuleStyle('conteudo', '#E5D3B3')
  const published = content.filter((c) => c.status === 'publicado')

  if (published.length === 0) {
    return <EmptyState text="Nenhum conteúdo publicado ainda" />
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {published.map((c) => (
        <div key={c.id} className={`${tileClass} p-4`} style={surface(accent)}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-[#1F2937]">{c.title}</p>
            <div className="flex shrink-0 gap-2">
              {c.link && (
                <a href={c.link} target="_blank" rel="noreferrer" className="text-[#1F2937]/50">
                  <ExternalLink size={14} />
                </a>
              )}
              <button onClick={() => onEdit(c)} className="text-[#1F2937]/50">
                <Pencil size={14} />
              </button>
              <button
                onClick={() => setContent((list) => list.filter((x) => x.id !== c.id))}
                className="text-rose-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          <p className="mt-1 text-xs text-[#1F2937]/55">
            {c.platform} · publicado em {c.publishDate}
          </p>
          {c.brief && <p className="mt-2 text-xs text-[#1F2937]/60">{c.brief}</p>}
          <span className="mt-3 inline-block rounded-full bg-white/80 px-2 py-1 text-[10px] font-bold text-[#1F2937]">
            ✅ Publicado · 👁 {c.views ?? 0} · ❤️ {c.likes ?? 0}
          </span>
        </div>
      ))}
    </div>
  )
}

function DesempenhoTab() {
  const { content, setContent } = useApp()
  const { tileClass, surface, accent } = useModuleStyle('conteudo', '#E5D3B3')

  const byPlatform = useMemo(() => {
    return platforms.map((p) => ({ platform: p, count: content.filter((c) => c.platform === p).length }))
  }, [content])

  const byStatus = useMemo(() => {
    return pipeline.map((p) => ({ status: p.label, count: content.filter((c) => c.status === p.id).length }))
  }, [content])

  const published = content.filter((c) => c.status === 'publicado')
  const totalViews = published.reduce((s, c) => s + (c.views ?? 0), 0)
  const totalLikes = published.reduce((s, c) => s + (c.likes ?? 0), 0)

  const updateMetric = (id: string, key: 'views' | 'likes', value: number) => {
    setContent((list) => list.map((x) => (x.id === id ? { ...x, [key]: Math.max(0, value) } : x)))
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className={`${tileClass} p-5`} style={surface(accent)}>
        <h3 className="mb-4 font-bold text-[#1F2937]">Por plataforma</h3>
        <div className="space-y-3">
          {byPlatform.map((p) => (
            <div key={p.platform}>
              <div className="mb-1 flex justify-between text-sm text-[#1F2937]/75">
                <span>{p.platform}</span>
                <span className="font-bold text-[#1F2937]">{p.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/50">
                <div
                  className="h-full rounded-full bg-[#1F2937]"
                  style={{ width: `${content.length ? (p.count / content.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bento-card p-5">
        <h3 className="mb-4 font-semibold text-slate-800">Por status</h3>
        <div className="grid grid-cols-2 gap-3">
          {byStatus.map((s) => (
            <div key={s.status} className="rounded-2xl bg-slate-50 p-3 text-center">
              <p className="text-2xl font-bold text-slate-800">{s.count}</p>
              <p className="text-xs text-slate-400">{s.status}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">Total de {content.length} conteúdos</p>
      </div>

      <div className="bento-card p-5 lg:col-span-2">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-slate-800">Métricas dos publicados</h3>
          <p className="text-xs font-bold text-slate-500">
            👁 {totalViews} · ❤️ {totalLikes}
          </p>
        </div>
        {published.length === 0 ? (
          <EmptyState text="Publique um conteúdo para ver métricas" />
        ) : (
          <div className="space-y-2">
            {published.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2.5"
              >
                <p className="text-sm font-bold text-slate-700">{c.title}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <label className="flex items-center gap-1.5">
                    👁
                    <input
                      type="number"
                      min={0}
                      className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-xs"
                      value={c.views ?? 0}
                      onChange={(e) => updateMetric(c.id, 'views', Number(e.target.value))}
                    />
                  </label>
                  <label className="flex items-center gap-1.5">
                    ❤️
                    <input
                      type="number"
                      min={0}
                      className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-xs"
                      value={c.likes ?? 0}
                      onChange={(e) => updateMetric(c.id, 'likes', Number(e.target.value))}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
