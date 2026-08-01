import { useRef, useState } from 'react'
import {
  Camera,
  Download,
  Moon,
  Monitor,
  RotateCcw,
  Settings,
  Sun,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useApp } from '../store/AppStore'
import { useCustomization } from '../store/CustomizationStore'
import {
  DEFAULT_SETTINGS,
  VISUAL_STYLES,
  useSettings,
  type ThemeMode,
} from '../store/SettingsStore'
import { fileToAvatarDataUrl } from '../utils/avatar'
import { downloadJSON, readJSONFile } from '../utils/storage'
import { Avatar } from './Avatar'

interface ConfiguracoesProps {
  open: boolean
  onClose: () => void
}

const themes: { id: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { id: 'light', label: 'Claro', Icon: Sun },
  { id: 'dark', label: 'Escuro', Icon: Moon },
  { id: 'system', label: 'Sistema', Icon: Monitor },
]

export function Configuracoes({ open, onClose }: ConfiguracoesProps) {
  const {
    settings,
    updateSettings,
    setThemeMode,
    setVisualStyle,
    resetSettings,
    importSettings,
  } = useSettings()
  const { exportData, replaceAllData, resetAllData, setBalanceVisible, addNotification } = useApp()
  const { exportCustomization, importCustomization, resetCustomization } = useCustomization()
  const fileRef = useRef<HTMLInputElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  const flash = (text: string) => {
    setMsg(text)
    window.setTimeout(() => setMsg(''), 2500)
  }

  const exportBackup = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      data: exportData(),
      customization: exportCustomization(),
    }
    downloadJSON(`lifehub-backup-${new Date().toISOString().slice(0, 10)}.json`, payload)
    flash('Backup exportado!')
  }

  const importBackup = async (file: File) => {
    try {
      const raw = (await readJSONFile(file)) as {
        settings?: Partial<typeof settings>
        data?: Parameters<typeof replaceAllData>[0]
        customization?: Parameters<typeof importCustomization>[0]
      }
      if (raw.settings) importSettings(raw.settings)
      if (raw.data) replaceAllData(raw.data)
      if (raw.customization) importCustomization(raw.customization)
      flash('Backup restaurado com sucesso!')
      addNotification('Backup restaurado')
    } catch {
      flash('Arquivo inválido. Tente outro backup.')
    }
  }

  const onPickPhoto = async (file: File) => {
    try {
      const url = await fileToAvatarDataUrl(file)
      updateSettings({ avatarUrl: url })
      flash('Foto atualizada!')
    } catch {
      flash('Não deu pra usar essa imagem. Tente JPG ou PNG.')
    }
  }

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
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[32px] border-2 border-[#1F2937] bg-[var(--app-card)] shadow-[8px_8px_0_#1F2937]"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b-2 border-[#1F2937] bg-[#70CFFF] px-5 py-4">
              <div className="flex items-center gap-3 text-[#1F2937]">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#1F2937] bg-white">
                  <Settings size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Configurações</h3>
                  <p className="text-xs opacity-70">Perfil, estilos, tema e backup</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full border-2 border-[#1F2937] bg-white p-2 text-[#1F2937] hover:scale-105"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-4 md:p-5">
              {msg && (
                <div className="rounded-[20px] border-2 border-[#1F2937] bg-[#A5F387] px-4 py-2 text-sm font-bold text-[#1F2937]">
                  {msg}
                </div>
              )}

              <section className="rounded-[28px] border-2 border-[#1F2937] bg-[#D1C4FF] p-4 shadow-[4px_4px_0_#1F2937]">
                <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#1F2937]/70">
                  Perfil
                </h4>
                <div className="mb-4 flex flex-wrap items-center gap-4">
                  <Avatar url={settings.avatarUrl} initials={settings.avatarInitials} size="lg" />
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => photoRef.current?.click()}
                      className="flex items-center gap-2 rounded-full border-2 border-[#1F2937] bg-white px-3 py-2 text-sm font-bold text-[#1F2937] shadow-[2px_2px_0_#1F2937] hover:scale-105"
                    >
                      <Camera size={16} /> Enviar foto
                    </button>
                    {settings.avatarUrl && (
                      <button
                        onClick={() => {
                          updateSettings({ avatarUrl: null })
                          flash('Foto removida')
                        }}
                        className="flex items-center gap-2 rounded-full border-2 border-[#1F2937] bg-[#FDA4AF] px-3 py-2 text-sm font-bold text-[#1F2937] hover:scale-105"
                      >
                        <Trash2 size={16} /> Remover
                      </button>
                    )}
                  </div>
                  <input
                    ref={photoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) void onPickPhoto(file)
                      e.target.value = ''
                    }}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-bold text-[#1F2937]">
                    Nome de exibição
                    <input
                      className="mt-1 w-full rounded-[16px] border-2 border-[#1F2937] bg-white px-3 py-2.5 text-sm outline-none"
                      value={settings.displayName}
                      onChange={(e) => updateSettings({ displayName: e.target.value })}
                    />
                  </label>
                  <label className="block text-sm font-bold text-[#1F2937]">
                    Iniciais (se sem foto)
                    <input
                      className="mt-1 w-full rounded-[16px] border-2 border-[#1F2937] bg-white px-3 py-2.5 text-sm outline-none"
                      maxLength={3}
                      value={settings.avatarInitials}
                      onChange={(e) => updateSettings({ avatarInitials: e.target.value })}
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-[28px] border-2 border-[#1F2937] bg-white p-4 shadow-[4px_4px_0_#1F2937] dark:bg-[var(--app-soft)]">
                <h4 className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-500">
                  Estilo visual do app
                </h4>
                <p className="mb-3 text-xs text-slate-500">Escolha a “cara” do LifeHub</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {VISUAL_STYLES.map((style) => {
                    const active = settings.visualStyle === style.id
                    return (
                      <button
                        key={style.id}
                        onClick={() => setVisualStyle(style.id)}
                        className={`rounded-[22px] border-2 border-[#1F2937] p-3 text-left transition hover:scale-[1.02] ${
                          active
                            ? 'bg-[#FFEA5D] shadow-[3px_3px_0_#1F2937]'
                            : 'bg-[var(--app-card)]'
                        }`}
                      >
                        <div className="mb-2 flex gap-1">
                          {style.preview.map((c) => (
                            <span
                              key={c}
                              className="h-4 w-4 rounded-full border border-black/10"
                              style={{ background: c }}
                            />
                          ))}
                        </div>
                        <p className="text-sm font-bold text-[#1F2937]">{style.label}</p>
                        <p className="mt-1 text-[11px] leading-snug text-slate-500">{style.description}</p>
                      </button>
                    )
                  })}
                </div>
              </section>

              <section className="rounded-[28px] border-2 border-[#1F2937] bg-white p-4 shadow-[4px_4px_0_#1F2937] dark:bg-[var(--app-soft)]">
                <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                  Modo claro / escuro
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {themes.map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      onClick={() => setThemeMode(id)}
                      className={`flex flex-col items-center gap-2 rounded-[20px] border-2 border-[#1F2937] px-3 py-3 text-sm font-bold shadow-[2px_2px_0_#1F2937] transition hover:scale-[1.02] ${
                        settings.themeMode === id
                          ? 'bg-[#FFEA5D] text-[#1F2937]'
                          : 'bg-[var(--app-card)] text-[var(--app-fg)]'
                      }`}
                    >
                      <Icon size={18} />
                      {label}
                    </button>
                  ))}
                </div>
                <label className="mt-4 flex items-center justify-between gap-3 rounded-[16px] bg-[var(--app-soft)] px-3 py-3 text-sm font-semibold text-[var(--app-fg)]">
                  Reduzir animações
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#6C4BFF]"
                    checked={settings.reduceMotion}
                    onChange={(e) => updateSettings({ reduceMotion: e.target.checked })}
                  />
                </label>
                <label className="mt-2 flex items-center justify-between gap-3 rounded-[16px] bg-[var(--app-soft)] px-3 py-3 text-sm font-semibold text-[var(--app-fg)]">
                  Ocultar saldos por padrão
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#6C4BFF]"
                    checked={settings.hideBalancesByDefault}
                    onChange={(e) => {
                      updateSettings({ hideBalancesByDefault: e.target.checked })
                      setBalanceVisible(!e.target.checked)
                    }}
                  />
                </label>
              </section>

              <section className="rounded-[28px] border-2 border-[#1F2937] bg-[#A5F387] p-4 shadow-[4px_4px_0_#1F2937]">
                <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#1F2937]/70">
                  Metas de bem-estar
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-bold text-[#1F2937]">
                    Meta de água (ml)
                    <input
                      type="number"
                      min={500}
                      step={100}
                      className="mt-1 w-full rounded-[16px] border-2 border-[#1F2937] bg-white px-3 py-2.5 text-sm outline-none"
                      value={settings.waterGoalMl}
                      onChange={(e) =>
                        updateSettings({ waterGoalMl: Number(e.target.value) || 2000 })
                      }
                    />
                  </label>
                  <label className="block text-sm font-bold text-[#1F2937]">
                    Meta de sono (h)
                    <input
                      type="number"
                      min={4}
                      max={12}
                      step={0.5}
                      className="mt-1 w-full rounded-[16px] border-2 border-[#1F2937] bg-white px-3 py-2.5 text-sm outline-none"
                      value={settings.sleepGoalHours}
                      onChange={(e) =>
                        updateSettings({ sleepGoalHours: Number(e.target.value) || 8 })
                      }
                    />
                  </label>
                </div>
                <label className="mt-3 block text-sm font-bold text-[#1F2937]">
                  Semana começa em
                  <select
                    className="mt-1 w-full rounded-[16px] border-2 border-[#1F2937] bg-white px-3 py-2.5 text-sm outline-none"
                    value={settings.weekStartsOn}
                    onChange={(e) =>
                      updateSettings({ weekStartsOn: Number(e.target.value) as 0 | 1 })
                    }
                  >
                    <option value={0}>Domingo</option>
                    <option value={1}>Segunda</option>
                  </select>
                </label>
              </section>

              <section className="rounded-[28px] border-2 border-[#1F2937] bg-[#FFEA5D] p-4 shadow-[4px_4px_0_#1F2937]">
                <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#1F2937]/70">
                  Dados & backup
                </h4>
                <p className="mb-3 text-xs font-medium text-[#1F2937]/70">
                  Tudo já é salvo automaticamente neste navegador. Exporte um backup para não perder nada.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={exportBackup}
                    className="flex items-center gap-2 rounded-full border-2 border-[#1F2937] bg-white px-4 py-2.5 text-sm font-bold text-[#1F2937] shadow-[2px_2px_0_#1F2937] hover:scale-105"
                  >
                    <Download size={16} /> Exportar backup
                  </button>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 rounded-full border-2 border-[#1F2937] bg-[#1F2937] px-4 py-2.5 text-sm font-bold text-white hover:scale-105"
                  >
                    <Upload size={16} /> Importar backup
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) void importBackup(file)
                      e.target.value = ''
                    }}
                  />
                </div>
              </section>

              <section className="rounded-[28px] border-2 border-[#1F2937] bg-[#FDA4AF] p-4 shadow-[4px_4px_0_#1F2937]">
                <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#1F2937]/70">
                  Zona de risco
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      if (confirm('Restaurar apenas as configurações padrão?')) {
                        resetSettings()
                        flash('Configurações resetadas')
                      }
                    }}
                    className="flex items-center gap-2 rounded-full border-2 border-[#1F2937] bg-white px-4 py-2 text-sm font-bold text-[#1F2937] hover:scale-105"
                  >
                    <RotateCcw size={14} /> Reset configs
                  </button>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          'Isso apaga finanças, hábitos, tarefas e personalização deste navegador. Continuar?',
                        )
                      ) {
                        resetAllData()
                        resetCustomization()
                        resetSettings()
                        flash('App restaurado aos dados iniciais')
                      }
                    }}
                    className="flex items-center gap-2 rounded-full border-2 border-[#1F2937] bg-[#1F2937] px-4 py-2 text-sm font-bold text-white hover:scale-105"
                  >
                    <RotateCcw size={14} /> Reset completo
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-[#1F2937]/70">
                  {DEFAULT_SETTINGS.displayName} · {settings.visualStyle} · {settings.themeMode}
                </p>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
