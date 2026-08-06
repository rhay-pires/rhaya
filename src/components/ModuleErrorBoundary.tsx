import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  label?: string
}

interface State {
  error: Error | null
}

/** Evita tela em branco se um módulo quebrar no mobile */
export class ModuleErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ModuleErrorBoundary]', this.props.label, error, info)
  }

  componentDidUpdate(prev: Props) {
    if (prev.label !== this.props.label && this.state.error) {
      this.setState({ error: null })
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-[24px] border-2 border-[#1F2937] bg-white p-6 text-center shadow-[4px_4px_0_#1F2937]">
          <p className="text-base font-bold text-[#1F2937]">Não foi possível abrir esta tela</p>
          <p className="mt-2 text-sm text-slate-500">{this.state.error.message}</p>
          <button
            type="button"
            className="mt-4 rounded-full bg-[#1F2937] px-4 py-2.5 text-sm font-bold text-white"
            onClick={() => this.setState({ error: null })}
          >
            Tentar de novo
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
