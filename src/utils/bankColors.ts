export interface BankColor {
  base: string
  muted: string
}

// Tons escolhidos pra combinar com o fundo verde-escuro do app (ver tokens.css), não pra
// reproduzir a identidade visual exata de cada banco. PicPay usa um verde vibrante/claro
// (a marca real é um verde bem mais aceso que o verde-musgo do design system) —
// deliberadamente DIFERENTE de --color-accent, pra não ser confundido com o fallback de
// banco desconhecido. Nubank e PicPay usam tons saturados estilo neon/plástico (pedido
// explícito) — não mais os tons "lavados"/escurecidos de antes.
const BANK_COLORS: Record<string, BankColor> = {
  nubank: { base: '#9C27B0', muted: '#6A1B9A' },
  bradesco: { base: '#C0392B', muted: '#4A2420' },
  picpay: { base: '#2ECC71', muted: '#27AE60' },
}

// Exportado só pro AccountBadge saber quando o banco/cor não resolveu (comparação por
// identidade) e usar um cinza neutro em vez deste verde.
export const FALLBACK_COLOR: BankColor = { base: 'var(--color-accent)', muted: 'var(--color-bg-elevated)' }

// Case-insensitive e tolerante a espaço extra — "Nubank", " nubank ", "NUBANK" todos batem.
//
// colorOverride (account.color) tem prioridade sobre o mapa por nome do banco. Não dá pra
// pré-computar um "muted" pra uma cor arbitrária escolhida pelo usuário (os presets acima
// são curados à mão), então usamos color-mix em tempo de render pra escurecer a cor
// escolhida — funciona em qualquer hex/var válido, sem precisar de matemática de cor em JS.
export function getBankColor(
  bankName: string | null | undefined,
  colorOverride?: string | null,
): BankColor {
  if (colorOverride) {
    return { base: colorOverride, muted: `color-mix(in srgb, ${colorOverride} 55%, black)` }
  }
  if (!bankName) return FALLBACK_COLOR
  const key = bankName.trim().toLowerCase()
  return BANK_COLORS[key] ?? FALLBACK_COLOR
}
