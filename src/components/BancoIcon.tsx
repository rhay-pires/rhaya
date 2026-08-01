import { useEffect, useState } from 'react'
import { svgBanco, listarBancos, obterPreset } from '@edusites/bancos-brasil'

export type BancoSlug = string

const LABEL_OVERRIDES: Record<string, string> = {
  bancodobrasil: 'Banco do Brasil',
  c6: 'C6 Bank',
  btg: 'BTG',
  xp: 'XP',
  mercadopago: 'Mercado Pago',
  pagbank: 'PagBank',
  infinitepay: 'InfinitePay',
}

export function bancoLabel(slug: string) {
  if (LABEL_OVERRIDES[slug]) return LABEL_OVERRIDES[slug]
  return slug
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase())
}

export function listBancosBrasil(): { slug: string; label: string; fundo: string; cor: string }[] {
  try {
    const names = listarBancos() as string[]
    return names.map((slug) => {
      const preset = obterPreset(slug) as { fundo?: string; cor?: string } | undefined
      return {
        slug,
        label: bancoLabel(slug),
        fundo: preset?.fundo ?? '#1F2937',
        cor: preset?.cor ?? '#FFFFFF',
      }
    })
  } catch {
    return [
      { slug: 'nubank', label: 'Nubank', fundo: '#820AD1', cor: '#FFFFFF' },
      { slug: 'inter', label: 'Inter', fundo: '#FF7A00', cor: '#FFFFFF' },
      { slug: 'itau', label: 'Itaú', fundo: '#EC7000', cor: '#FFFFFF' },
      { slug: 'c6', label: 'C6 Bank', fundo: '#121212', cor: '#FFFFFF' },
      { slug: 'caixa', label: 'Caixa', fundo: '#0066A1', cor: '#FFFFFF' },
      { slug: 'bradesco', label: 'Bradesco', fundo: '#CC092F', cor: '#FFFFFF' },
      { slug: 'bancodobrasil', label: 'Banco do Brasil', fundo: '#003D7A', cor: '#FFDD00' },
    ]
  }
}

/** Ícone SVG do banco — mobile-friendly (toque grande) */
export function BancoIcon({
  nome,
  tamanho = 40,
  formato = 'circulo',
  className = '',
}: {
  nome: string
  tamanho?: number
  formato?: 'quadrado' | 'circulo' | 'sem'
  className?: string
}) {
  const [svg, setSvg] = useState('')

  useEffect(() => {
    let alive = true
    svgBanco({ nome: nome.toLowerCase().replace(/\s+/g, ''), formato, tamanho })
      .then((html) => {
        if (alive) setSvg(html)
      })
      .catch(() => {
        if (alive) setSvg('')
      })
    return () => {
      alive = false
    }
  }, [nome, formato, tamanho])

  if (!svg) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600 ${className}`}
        style={{ width: tamanho, height: tamanho }}
      >
        {nome.slice(0, 2).toUpperCase()}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex shrink-0 overflow-hidden ${className}`}
      style={{ width: tamanho, height: tamanho }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
