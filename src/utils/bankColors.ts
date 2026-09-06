export interface BankColor {
  base: string
  muted: string
}

// Tons escolhidos pra combinar com o fundo verde-escuro do app (ver tokens.css), não pra
// reproduzir a identidade visual exata de cada banco. PicPay reusa o --color-accent do
// próprio design system (mesmo verde), já que a marca é literalmente verde.
const BANK_COLORS: Record<string, BankColor> = {
  nubank: { base: '#8257E5', muted: '#362B54' },
  bradesco: { base: '#C0392B', muted: '#4A2420' },
  picpay: { base: '#4f8f63', muted: '#24352A' },
}

const FALLBACK_COLOR: BankColor = { base: 'var(--color-accent)', muted: 'var(--color-bg-elevated)' }

// Case-insensitive e tolerante a espaço extra — "Nubank", " nubank ", "NUBANK" todos batem.
export function getBankColor(bankName: string | null | undefined): BankColor {
  if (!bankName) return FALLBACK_COLOR
  const key = bankName.trim().toLowerCase()
  return BANK_COLORS[key] ?? FALLBACK_COLOR
}
