import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './components/Dashboard'
import { Financas } from './components/Financas'
import { Agenda } from './components/Agenda'
import { Habitos } from './components/Habitos'
import { Trabalho } from './components/Trabalho'
import { Metas } from './components/Metas'
import { Estudos } from './components/Estudos'
import { Saude } from './components/Saude'
import { DevPessoal } from './components/DevPessoal'
import { Estatisticas } from './components/Estatisticas'
import { Conteudo } from './components/Conteudo'
import { CustomBoard } from './components/CustomBoard'
import { Personalizar } from './components/Personalizar'
import { AppProvider } from './store/AppStore'
import { CustomizationProvider, useCustomization } from './store/CustomizationStore'
import { softTint } from './data/modules'
import type { BuiltinModuleId, ModuleId } from './types'

function ModuleView({ active }: { active: ModuleId }) {
  if (String(active).startsWith('custom_')) {
    return <CustomBoard moduleId={String(active)} />
  }

  switch (active as BuiltinModuleId) {
    case 'dashboard':
      return <Dashboard />
    case 'financas':
      return <Financas />
    case 'agenda':
      return <Agenda />
    case 'habitos':
      return <Habitos />
    case 'trabalho':
      return <Trabalho />
    case 'metas':
      return <Metas />
    case 'estudos':
      return <Estudos />
    case 'saude':
      return <Saude />
    case 'devpessoal':
      return <DevPessoal />
    case 'estatisticas':
      return <Estatisticas />
    case 'conteudo':
      return <Conteudo />
    default:
      return <Dashboard />
  }
}

function AppShell() {
  const { enabledModules, getModule } = useCustomization()
  const [active, setActive] = useState<ModuleId>('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)
  const [personalizarOpen, setPersonalizarOpen] = useState(false)
  const [personalizarTabNova, setPersonalizarTabNova] = useState(false)

  const current = getModule(active)
  const themeColor = current?.color ?? '#D1C4FF'

  useEffect(() => {
    if (!enabledModules.find((m) => m.id === active) && enabledModules[0]) {
      setActive(enabledModules[0].id)
    }
  }, [enabledModules, active])

  return (
    <div
      className="flex min-h-screen transition-colors duration-300"
      style={{
        background: `
          radial-gradient(900px 500px at 0% 0%, ${softTint(themeColor, 0.45)}, transparent 55%),
          radial-gradient(700px 400px at 100% 0%, ${softTint(themeColor, 0.28)}, transparent 50%),
          #FAFAF7
        `,
      }}
    >
      <Sidebar
        active={active}
        onNavigate={setActive}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onPersonalizar={() => {
          setPersonalizarTabNova(false)
          setPersonalizarOpen(true)
        }}
        onQuickAdd={() => {
          setPersonalizarTabNova(true)
          setPersonalizarOpen(true)
        }}
      />
      <main className="flex-1 overflow-x-hidden px-4 py-4 md:px-6 md:py-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Header
            onOpenMenu={() => setMenuOpen(true)}
            onPersonalizar={() => {
              setPersonalizarTabNova(false)
              setPersonalizarOpen(true)
            }}
            themeColor={themeColor}
            moduleLabel={current?.label}
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              <ModuleView active={active} />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <Personalizar
        open={personalizarOpen}
        onClose={() => setPersonalizarOpen(false)}
        onCreated={(id) => setActive(id)}
        startOnNew={personalizarTabNova}
      />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <CustomizationProvider>
        <AppShell />
      </CustomizationProvider>
    </AppProvider>
  )
}
