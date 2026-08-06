/** Bancos locais — sem dependência externa */

export type BancoOption = { slug: string; label: string; fundo: string; initials: string }

export const BANCOS_BRASIL: BancoOption[] = [
  { slug: 'nubank', label: 'Nubank', fundo: '#820AD1', initials: 'Nu' },
  { slug: 'inter', label: 'Inter', fundo: '#FF7A00', initials: 'In' },
  { slug: 'itau', label: 'Itaú', fundo: '#EC7000', initials: 'It' },
  { slug: 'bradesco', label: 'Bradesco', fundo: '#CC092F', initials: 'Br' },
  { slug: 'santander', label: 'Santander', fundo: '#EC0000', initials: 'Sa' },
  { slug: 'caixa', label: 'Caixa', fundo: '#0066A1', initials: 'Cx' },
  { slug: 'bancodobrasil', label: 'Banco do Brasil', fundo: '#003D7A', initials: 'BB' },
  { slug: 'c6', label: 'C6 Bank', fundo: '#121212', initials: 'C6' },
  { slug: 'btg', label: 'BTG', fundo: '#001E27', initials: 'BT' },
  { slug: 'picpay', label: 'PicPay', fundo: '#21C25E', initials: 'Pp' },
  { slug: 'mercadopago', label: 'Mercado Pago', fundo: '#00BCFF', initials: 'MP' },
  { slug: 'outros', label: 'Outros', fundo: '#1F2937', initials: '··' },
]

export function listBancosBrasil() {
  return BANCOS_BRASIL
}

export function bancoLabel(slug: string) {
  return BANCOS_BRASIL.find((b) => b.slug === slug)?.label ?? slug
}

export function bancoPreset(slug: string) {
  return BANCOS_BRASIL.find((b) => b.slug === slug) ?? BANCOS_BRASIL[BANCOS_BRASIL.length - 1]
}

/** Avatar colorido do banco (iniciais) — leve e offline */
export function BancoIcon({
  nome,
  tamanho = 40,
  className = '',
}: {
  nome: string
  tamanho?: number
  className?: string
}) {
  const bank = bancoPreset((nome || 'outros').toLowerCase().replace(/\s+/g, ''))
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full text-white ${className}`}
      style={{
        width: tamanho,
        height: tamanho,
        background: bank.fundo,
        fontSize: Math.max(10, Math.round(tamanho * 0.32)),
        fontWeight: 700,
      }}
      title={bank.label}
      aria-hidden
    >
      {bank.initials}
    </span>
  )
}
