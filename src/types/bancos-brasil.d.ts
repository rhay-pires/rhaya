declare module '@edusites/bancos-brasil' {
  export function svgBanco(opts: {
    nome: string
    formato?: 'quadrado' | 'circulo' | 'sem'
    cor?: string
    fundo?: string
    tamanho?: number
    className?: string
  }): Promise<string>

  export function listarBancos(): string[]

  export function obterPreset(nome: string):
    | {
        cor?: string
        fundo?: string
        formato?: string
        tamanho?: number
      }
    | undefined
}
