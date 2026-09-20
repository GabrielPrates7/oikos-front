import { computeDelta } from '../../components/reports/delta'
import type { Delta } from '../../components/reports/delta'
import { centsToBRL } from '../../utils/currency'
import type { ComparisonCategoryItem } from './relatorios.types'

// Apresentação/agregação de exibição da aba Comparativo — tudo em centavos inteiros.

export interface ComparisonRow {
  key: string
  name: string
  icon: string
  color: string
  baseCents: number
  comparedCents: number
  delta: Delta
}

export interface CategoryMeta {
  icon: string | null
  color: string
}

// Esconde categorias com base e comparado zero; ordena pela maior diferença absoluta
// (mesma ordenação de antes), com o nome como desempate estável.
export function buildRows(
  categories: ComparisonCategoryItem[],
  meta: Map<string, CategoryMeta>,
  fallbackColor: string,
): ComparisonRow[] {
  return categories
    .filter((category) => category.month1Cents !== 0 || category.month2Cents !== 0)
    .map((category) => {
      const info = meta.get(category.categoryId)
      return {
        key: category.categoryId,
        name: category.name,
        icon: info?.icon ?? '📁',
        color: info?.color ?? fallbackColor,
        baseCents: category.month1Cents,
        comparedCents: category.month2Cents,
        delta: computeDelta(category.month1Cents, category.month2Cents),
      }
    })
    .sort(
      (a, b) =>
        Math.abs(b.delta.diff) - Math.abs(a.delta.diff) || a.name.localeCompare(b.name, 'pt-BR'),
    )
}

export interface Totals {
  baseCents: number
  comparedCents: number
  delta: Delta
}

export function totalsOf(rows: ComparisonRow[]): Totals {
  const baseCents = rows.reduce((sum, row) => sum + row.baseCents, 0)
  const comparedCents = rows.reduce((sum, row) => sum + row.comparedCents, 0)
  return { baseCents, comparedCents, delta: computeDelta(baseCents, comparedCents) }
}

export interface Highlights {
  biggestIncrease: ComparisonRow | null
  biggestDrop: ComparisonRow | null
}

// Maior aumento / maior queda por diferença absoluta entre as linhas exibidas; sem aumento
// (ou sem queda) o respectivo destaque fica null.
export function findHighlights(rows: ComparisonRow[]): Highlights {
  let biggestIncrease: ComparisonRow | null = null
  let biggestDrop: ComparisonRow | null = null
  for (const row of rows) {
    if (row.delta.diff > 0 && (!biggestIncrease || row.delta.diff > biggestIncrease.delta.diff)) {
      biggestIncrease = row
    }
    if (row.delta.diff < 0 && (!biggestDrop || row.delta.diff < biggestDrop.delta.diff)) {
      biggestDrop = row
    }
  }
  return { biggestIncrease, biggestDrop }
}

// "+R$ 1.200,00" / "−R$ 300,00" / "R$ 0,00" — sinal sempre no texto (a cor só reforça).
export function formatDiff(diffCents: number): string {
  if (diffCents > 0) return `+${centsToBRL(diffCents)}`
  if (diffCents < 0) return `−${centsToBRL(Math.abs(diffCents))}`
  return centsToBRL(0)
}

// "+12,3%" / "−4,0%" / "0,0%"
export function formatPct(pct: number): string {
  const sign = pct > 0 ? '+' : pct < 0 ? '−' : ''
  return `${sign}${Math.abs(pct).toFixed(1).replace('.', ',')}%`
}

export type Tone = 'good' | 'bad' | 'neutral'

// Cor por sentido: `goodWhenUp` = true pra entradas/resultado (subir é bom), false pra
// despesas (subir é ruim, cair é bom).
export function toneOf(diffCents: number, goodWhenUp: boolean): Tone {
  if (diffCents === 0) return 'neutral'
  return diffCents > 0 === goodWhenUp ? 'good' : 'bad'
}
