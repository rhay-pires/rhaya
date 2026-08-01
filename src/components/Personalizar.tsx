import { useEffect, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Palette,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { ICON_OPTIONS, VIEW_OPTIONS } from '../data/modules'
import { useCustomization } from '../store/CustomizationStore'
import type { ModuleIconKey, ViewMode } from '../types'
import { MODULE_ICONS } from '../utils/icons'
import { ColorPicker } from './ColorPicker'

interface PersonalizarProps {
  open: boolean
  onClose: () => void
  onCreated?: (id: string) => void
  startOnNew?: boolean
}

export function Personalizar({ open, onClose, onCreated, startOnNew }: PersonalizarProps) {
  const {
    modules,
    setModuleColor,
    setModuleView,
    setModuleEnabled,
    renameModule,
    moveModule,
    addCustomModule,
    removeModule,
    resetCustomization,
  } = useCustomization()

  const [tab, setTab] = useState<'modulos' | 'nova'>('modulos')
  const [newLabel, setNewLabel] = useState('')
  const [newColor, setNewColor] = useState('#FFEA5D')
  const [newIcon, setNewIcon] = useState<ModuleIconKey>('star')
  const [newView, setNewView] = useState<ViewMode>('checklist')

  useEffect(() => {
    if (open) setTab(startOnNew ? 'nova' : 'modulos')
  }, [open, startOnNew])

  const sorted = [...modules].sort((a, b) => a.order - b.order)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-[#1F2937]/40 p-3 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[32px] border-2 border-[#1F2937] bg-[#FAFAF7] shadow-[8px_8px_0_#1F2937]"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b-2 border-[#1F2937] bg-[#D1C4FF] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#1F2937] bg-white">
                  <Palette size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1F2937]">Personalizar LifeHub</h3>
                  <p className="text-xs text-[#1F2937]/70">Cores, abas, views — estilo TickTick</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full border-2 border-[#1F2937] bg-white p-2 hover:scale-105"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex gap-2 border-b-2 border-[#1F2937] bg-white px-4 py-3">
              {([
                ['modulos', 'Módulos & cores'],
                ['nova', 'Nova aba'],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`rounded-full border-2 border-[#1F2937] px-4 py-2 text-sm font-bold shadow-[2px_2px_0_#1F2937] ${
                    tab === id ? 'bg-[#FFEA5D]' : 'bg-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-5">
              {tab === 'modulos' && (
                <div className="space-y-3">
                  {sorted.map((mod) => {
                    const Icon = MODULE_ICONS[mod.icon]
                    const views = mod.builtin ? VIEW_OPTIONS[mod.id] ?? [] : VIEW_OPTIONS.custom
                    return (
                      <div
                        key={mod.id}
                        className={`rounded-[28px] border-2 border-[#1F2937] p-4 shadow-[4px_4px_0_#1F2937] ${
                          mod.enabled ? '' : 'opacity-55'
                        }`}
                        style={{ background: mod.color }}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border-2 border-[#1F2937] bg-white text-[#1F2937]">
                              <Icon size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <input
                                className="w-full rounded-xl border-2 border-transparent bg-white/70 px-2 py-1 text-sm font-bold text-[#1F2937] outline-none focus:border-[#1F2937]"
                                value={mod.label}
                                onChange={(e) => renameModule(mod.id, e.target.value)}
                              />
                              <p className="mt-0.5 px-2 text-[10px] font-medium text-[#1F2937]/60">
                                {mod.builtin ? 'Módulo do sistema' : 'Aba criada por você'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => moveModule(mod.id, -1)}
                              className="rounded-full border-2 border-[#1F2937] bg-white p-1.5 hover:scale-105"
                              title="Subir"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              onClick={() => moveModule(mod.id, 1)}
                              className="rounded-full border-2 border-[#1F2937] bg-white p-1.5 hover:scale-105"
                              title="Descer"
                            >
                              <ArrowDown size={14} />
                            </button>
                            <button
                              onClick={() => setModuleEnabled(mod.id, !mod.enabled)}
                              className="rounded-full border-2 border-[#1F2937] bg-white p-1.5 hover:scale-105"
                              title={mod.enabled ? 'Ocultar' : 'Mostrar'}
                            >
                              {mod.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                            {!mod.builtin && (
                              <button
                                onClick={() => removeModule(mod.id)}
                                className="rounded-full border-2 border-[#1F2937] bg-[#FDA4AF] p-1.5 hover:scale-105"
                                title="Excluir aba"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 rounded-[20px] border-2 border-[#1F2937]/15 bg-white/70 p-3">
                          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                            Cor do módulo
                          </p>
                          <ColorPicker
                            value={mod.color}
                            onChange={(c) => setModuleColor(mod.id, c)}
                            size="sm"
                          />
                        </div>

                        {views.length > 0 && (
                          <div className="mt-3">
                            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#1F2937]/70">
                              Visualização padrão
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {views.map((v) => (
                                <button
                                  key={v.id}
                                  onClick={() => setModuleView(mod.id, v.id)}
                                  className={`rounded-full border-2 border-[#1F2937] px-3 py-1.5 text-xs font-bold shadow-[2px_2px_0_#1F2937] ${
                                    mod.viewMode === v.id ? 'bg-[#1F2937] text-white' : 'bg-white'
                                  }`}
                                >
                                  {v.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  <button
                    onClick={() => {
                      if (confirm('Resetar cores, ordem e abas personalizadas?')) {
                        resetCustomization()
                      }
                    }}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#1F2937] bg-white py-3 text-sm font-bold shadow-[3px_3px_0_#1F2937] hover:scale-[1.01]"
                  >
                    <RotateCcw size={16} /> Restaurar padrões
                  </button>
                </div>
              )}

              {tab === 'nova' && (
                <div className="mx-auto max-w-md space-y-4">
                  <div
                    className="rounded-[28px] border-2 border-[#1F2937] p-5 shadow-[6px_6px_0_#1F2937]"
                    style={{ background: newColor }}
                  >
                    <p className="text-xs font-bold uppercase tracking-wide text-[#1F2937]/70">Preview</p>
                    <p className="mt-2 text-2xl font-bold text-[#1F2937]">{newLabel || 'Nova aba'}</p>
                  </div>

                  <label className="block text-sm font-bold text-[#1F2937]">
                    Nome
                    <input
                      className="mt-1 w-full rounded-[20px] border-2 border-[#1F2937] bg-white px-4 py-3 text-sm shadow-[3px_3px_0_#1F2937] outline-none"
                      placeholder="Ex: Viagem, Skincare, Ideias..."
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                    />
                  </label>

                  <div>
                    <p className="mb-2 text-sm font-bold text-[#1F2937]">Cor</p>
                    <ColorPicker value={newColor} onChange={setNewColor} />
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-bold text-[#1F2937]">Ícone</p>
                    <div className="flex flex-wrap gap-2">
                      {ICON_OPTIONS.map((opt) => {
                        const Icon = MODULE_ICONS[opt.id]
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setNewIcon(opt.id)}
                            className={`flex h-11 w-11 items-center justify-center rounded-[14px] border-2 border-[#1F2937] ${
                              newIcon === opt.id ? 'bg-[#1F2937] text-white' : 'bg-white'
                            }`}
                            title={opt.label}
                          >
                            <Icon size={18} />
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-bold text-[#1F2937]">Modelo</p>
                    <div className="flex flex-wrap gap-2">
                      {VIEW_OPTIONS.custom.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setNewView(v.id)}
                          className={`rounded-full border-2 border-[#1F2937] px-3 py-2 text-xs font-bold shadow-[2px_2px_0_#1F2937] ${
                            newView === v.id ? 'bg-[#A5F387]' : 'bg-white'
                          }`}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const id = addCustomModule({
                        label: newLabel.trim() || 'Nova aba',
                        color: newColor,
                        icon: newIcon,
                        viewMode: newView,
                      })
                      setNewLabel('')
                      onCreated?.(id)
                      onClose()
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#1F2937] bg-[#1F2937] py-3.5 text-sm font-bold text-white shadow-[4px_4px_0_#FFEA5D] hover:scale-[1.02]"
                  >
                    <Plus size={18} /> Criar aba
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
