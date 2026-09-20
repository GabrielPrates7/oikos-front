import { lightenHex } from '../../utils/chartColors'
import { centsToBRL } from '../../utils/currency'

// Apenas apresentação/agregação de exibição — nenhuma regra financeira aqui. Todo cálculo
// em centavos inteiros; percentual só vira número de tela.

export const TERRACOTTA_TEXT = '#cf6b52'

// Fundo aproximado de um card de vidro (branco 6% sobre #0d1310): base do cálculo de
// contraste das barras.
const CARD_BG_HEX = '#1a201c'

function channel(value: number): number {
  const v = value / 255
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

function luminance(hex: string): number {
  const clean = hex.replace('#', '')
  const n = parseInt(clean, 16)
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  )
}

export function contrastRatio(hexA: string, hexB: string): number {
  const [hi, lo] = [luminance(hexA), luminance(hexB)].sort((a, b) => b - a)
  return (hi + 0.05) / (lo + 0.05)
}

// Barra precisa de pelo menos 3:1 contra o fundo do card. Clareia SÓ a cor da barra
// (mistura com branco, via lightenHex) até bater 3:1 — não altera getBankColor nem os
// badges. Cor que não seja #rrggbb (ex.: var(--x)) volta como veio.
export function barColor(hex: string, minContrast = 3): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex
  for (let amount = 0; amount <= 1.0001; amount += 0.05) {
    const candidate = amount === 0 ? hex : lightenHex(hex, amount)
    if (contrastRatio(candidate, CARD_BG_HEX) >= minContrast) return candidate
  }
  return '#ffffff'
}

// Participação em % (inteiro) só pra exibição. Fatia <1% mostra "<1%"; e um item que não é
// 100% do total nunca arredonda pra "100%".
export function formatShare(valueCents: number, totalCents: number): string {
  if (totalCents <= 0 || valueCents <= 0) return '0%'
  const percent = (valueCents / totalCents) * 100
  if (percent < 1) return '<1%'
  const rounded = Math.round(percent)
  return rounded >= 100 && valueCents < totalCents ? '99%' : `${rounded}%`
}

export interface RankedItem {
  key: string
  label: string
  valueCents: number
  color: string
  icon?: string | null
}

export interface RankedRow extends RankedItem {
  isRest?: boolean
}

// Ordena do maior pro menor; mais de 6 itens → 5 maiores + "Demais (N)". Nunca "Outros" (já
// existe categoria real com esse nome). Soma em centavos inteiros.
// `maxItems`/`keep` (padrão 6/5) deixam Relatórios > Por categoria usar o mesmo agrupamento
// com limite próprio (>10 → 9 maiores + "Demais (N)") sem mudar o comportamento da Visão Geral.
export function rankAndGroup(
  items: RankedItem[],
  restColor: string,
  maxItems = 6,
  keep = 5,
): RankedRow[] {
  const sorted = [...items]
    .filter((item) => item.valueCents > 0)
    .sort((a, b) => b.valueCents - a.valueCents)
  if (sorted.length <= maxItems) return sorted
  const top = sorted.slice(0, keep)
  const rest = sorted.slice(keep)
  return [
    ...top,
    {
      key: '__rest__',
      label: `Demais (${rest.length})`,
      valueCents: rest.reduce((sum, item) => sum + item.valueCents, 0),
      color: restColor,
      isRest: true,
    },
  ]
}

export type VariationDirection = 'up' | 'down' | 'flat' | 'no-base'

export interface Variation {
  direction: VariationDirection
  percentText: string
}

// Variação vs mês anterior. Base zero → "sem base anterior" (nada de divisão por zero).
// Diferença em centavos inteiros; percentual (1 casa) só pra exibição, sobre |base|.
export function computeVariation(currentCents: number, previousCents: number): Variation {
  if (previousCents === 0) return { direction: 'no-base', percentText: 'sem base anterior' }
  const deltaCents = currentCents - previousCents
  if (deltaCents === 0) return { direction: 'flat', percentText: '0,0%' }
  const percent = (Math.abs(deltaCents) / Math.abs(previousCents)) * 100
  const text = `${deltaCents > 0 ? '+' : '−'}${percent.toFixed(1).replace('.', ',')}%`
  return { direction: deltaCents > 0 ? 'up' : 'down', percentText: text }
}

// Paleta FIXA por forma de recebimento (atribuída pelo nome, então a cor não muda entre
// meses): tons dos tokens já usados no sistema.
export const RECEIPT_METHOD_COLORS: Record<string, string> = {
  pix: '#6baf82',
  transfer: '#5b8fd6',
  cash: '#d9a441',
  other: '#8a8f89',
}

export function formatItemTitle(label: string, valueCents: number, share: string): string {
  return `${label}: ${centsToBRL(valueCents)} (${share})`
}
