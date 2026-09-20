import { monthsDiff } from '../../components/reports/reportPeriod'
import type { YearMonth } from '../../components/reports/reportPeriod'
import { centsToBRL } from '../../utils/currency'
import { MONTH_NAMES_PT, formatMonthShort } from '../../utils/date'
import type { MonthlyEvolutionItem } from './relatorios.types'

// Apenas apresentação/agregação de exibição, sempre em centavos inteiros. Nenhuma regra
// financeira nova: "Resultado" é o netCents que a própria API já devolve.

export interface EvolutionPoint {
  month: string
  label: string
  // Rótulo curto sem o ano ("Set"), pro eixo X em telas estreitas.
  labelShort: string
  incomeCents: number
  expenseCents: number
  // null (e não 0) em mês SEM movimento: a linha não desenha rampa entre um mês vazio e um
  // com dados (connectNulls={false}).
  netCents: number | null
  hasMovement: boolean
  isCurrent: boolean
  // Séries das barras: zero vira null, então mês com valor zero não desenha barra.
  incomeBar: number | null
  expenseBar: number | null
}

// `currentMonth` é 'YYYY-MM' no fuso America/Sao_Paulo — comparação sempre por string, nunca
// por new Date("YYYY-MM-DD").
export function buildPoints(
  months: MonthlyEvolutionItem[],
  currentMonth: string,
): EvolutionPoint[] {
  return months.map((item) => {
    const hasMovement = item.incomeCents > 0 || item.expenseCents > 0
    const label = formatMonthShort(item.month)
    return {
      month: item.month,
      label,
      labelShort: label.split('/')[0] ?? label,
      incomeCents: item.incomeCents,
      expenseCents: item.expenseCents,
      netCents: hasMovement ? item.netCents : null,
      hasMovement,
      isCurrent: item.month === currentMonth,
      incomeBar: item.incomeCents > 0 ? item.incomeCents : null,
      expenseBar: item.expenseCents > 0 ? item.expenseCents : null,
    }
  })
}

export interface EvolutionSummary {
  incomeCents: number
  expenseCents: number
  netCents: number
  movementCount: number
  // null quando nenhum mês tem movimento ("sem dados").
  averageExpenseCents: number | null
  // O mês em andamento está no período E tem movimento (então entra na média).
  includesCurrentMonth: boolean
  // Índice do primeiro mês com movimento (-1 se nenhum).
  firstMovementIndex: number
  peakExpense: EvolutionPoint | null
}

export function summarize(points: EvolutionPoint[]): EvolutionSummary {
  let incomeCents = 0
  let expenseCents = 0
  let netCents = 0
  let movementExpense = 0
  let movementCount = 0
  let peakExpense: EvolutionPoint | null = null

  for (const point of points) {
    incomeCents += point.incomeCents
    expenseCents += point.expenseCents
    netCents += point.netCents ?? 0
    if (point.hasMovement) {
      movementCount += 1
      movementExpense += point.expenseCents
    }
    if (point.expenseCents > 0 && (!peakExpense || point.expenseCents > peakExpense.expenseCents)) {
      peakExpense = point
    }
  }

  return {
    incomeCents,
    expenseCents,
    netCents,
    movementCount,
    averageExpenseCents: movementCount > 0 ? Math.round(movementExpense / movementCount) : null,
    includesCurrentMonth: points.some((point) => point.isCurrent && point.hasMovement),
    firstMovementIndex: points.findIndex((point) => point.hasMovement),
    peakExpense,
  }
}

export interface NiceScale {
  ticks: number[]
  domain: [number, number]
}

// Ticks "redondos" (passos 1-2-5 × 10^n) que sempre incluem o 0 — assim o domínio comporta
// Resultado negativo e nunca aparecem ticks quebrados como 950 ou 2.850. Valores em centavos.
export function niceTicks(dataMin: number, dataMax: number, count = 5): NiceScale {
  const min = Math.min(0, dataMin)
  const max = Math.max(0, dataMax)
  if (max === min) return { ticks: [0, 100], domain: [0, 100] }

  const rawStep = (max - min) / (count - 1)
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const normalized = rawStep / magnitude
  const factor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  const step = Math.max(1, factor * magnitude)

  const niceMin = Math.floor(min / step) * step
  const niceMax = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let value = niceMin; value <= niceMax + step / 2; value += step) {
    ticks.push(Math.round(value))
  }
  return { ticks, domain: [niceMin, niceMax] }
}

const compactFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
})

// Eixo Y compacto ("R$ 1,5 mil"); centavos viram reais só na exibição.
export function formatCompactBRL(cents: number): string {
  return compactFormatter.format(cents / 100)
}

// "+R$ 1.200,00" / "−R$ 300,00" / "R$ 0,00" — o sinal vai no texto (a cor só reforça).
export function formatSignedBRL(cents: number): string {
  if (cents > 0) return `+${centsToBRL(cents)}`
  if (cents < 0) return `−${centsToBRL(Math.abs(cents))}`
  return centsToBRL(0)
}

// "setembro de 2026"
export function formatMonthLong(month: string): string {
  const [year, monthNum] = month.split('-')
  if (!year || !monthNum) return month
  const name = MONTH_NAMES_PT[Number(monthNum) - 1] ?? monthNum
  return `${name.toLowerCase()} de ${year}`
}

export type EvolutionPlan =
  | { kind: 'ok'; monthsBack: number; effectiveMonths: number; truncated: boolean }
  | { kind: 'future' }
  | { kind: 'too-old' }

// /reports/monthly-evolution só aceita `monthsBack` (1 a 24), contado a partir do mês
// CORRENTE — não existe "mês final". Pra escolher um mês final pedimos UMA requisição com
// monthsBack = (meses até hoje) + período e recortamos a resposta no cliente (fatiar, não
// somar). Fora da janela de 24 meses não dá pra atender.
export function planEvolutionRequest(
  end: YearMonth,
  current: YearMonth,
  periodMonths: number,
): EvolutionPlan {
  const monthsAgo = monthsDiff(end, current)
  if (monthsAgo < 0) return { kind: 'future' }
  if (monthsAgo > 23) return { kind: 'too-old' }
  const monthsBack = Math.min(24, monthsAgo + periodMonths)
  const effectiveMonths = monthsBack - monthsAgo
  return { kind: 'ok', monthsBack, effectiveMonths, truncated: effectiveMonths < periodMonths }
}

// Os `count` meses que terminam em `endMonth` (YYYY-MM, comparação por string).
export function sliceToEnd(
  months: MonthlyEvolutionItem[],
  endMonth: string,
  count: number,
): MonthlyEvolutionItem[] {
  return months.filter((item) => item.month <= endMonth).slice(-count)
}
