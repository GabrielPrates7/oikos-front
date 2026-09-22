import { centsToBRL } from '../../utils/currency'
import type { HealthLevel, HealthReason, LineSituation, PlanSummary } from './plano.types'

// Apresentação: converte pontos-base (10000 = 100%) em percentual inteiro para exibir. É só formato;
// o backend é quem calcula o progresso.
export function bpsToPercent(bps: number): number {
  return Math.round(bps / 100)
}

// 'YYYY-MM-DD' -> 'dd/mm' (sem usar Date).
export function formatDayMonth(isoDate: string): string {
  const [, month, day] = isoDate.split('-')
  return `${day}/${month}`
}

export const SITUATION_LABELS: Record<LineSituation, string> = {
  pending: 'Pendente',
  received: 'Recebido',
  paid: 'Pago',
  overdue: 'Atrasado',
  estimated: 'Estimado',
}

// Cores semânticas do Plano (valor negativo/despesa usa #cf6b52; positivo #6baf82).
export const PLAN_COLORS = {
  green: '#6baf82',
  amber: '#d4af37',
  red: '#cf6b52',
} as const

export function healthColor(level: HealthLevel): string {
  if (level === 'green') return PLAN_COLORS.green
  if (level === 'amber') return PLAN_COLORS.amber
  if (level === 'red') return PLAN_COLORS.red
  return 'var(--color-text-muted)'
}

// Traduz os códigos do semáforo (calculados no servidor) em frases. Só texto: os valores citados
// (gap_to_zero, gap_to_cash_zero) vêm prontos da API.
export function healthSentences(summary: PlanSummary): { headline: string; details: string[] } {
  const { level, reasons } = summary.health
  const details: string[] = []
  const has = (reason: HealthReason) => reasons.includes(reason)
  if (level === 'green') {
    return { headline: 'Plano saudável', details: ['O resultado planejado é positivo, com folga.'] }
  }
  if (has('NEGATIVE_RESULT')) {
    const gap = centsToBRL(summary.gap_to_zero)
    if (!has('NEGATIVE_MIN_BALANCE') && summary.settings.include_opening_balance) {
      // resultado negativo, mas o caixa não fica negativo: só o saldo de abertura sustenta o mês
      details.push(
        `O resultado do mês é negativo: as saídas passam das entradas em ${gap}. O saldo de abertura cobre a diferença e o caixa não fica negativo.`,
        `Para fechar o mês no zero, reduza ${gap} em saídas ou antecipe entradas.`,
      )
    } else {
      details.push(
        `O resultado do mês é negativo: as saídas passam das entradas em ${gap}. Reduza ${gap} em saídas ou antecipe entradas.`,
      )
    }
  }
  if (has('LOW_MARGIN')) {
    details.push('A sobra é menor que 10% das entradas planejadas.')
  }
  if (has('NEGATIVE_MIN_BALANCE')) {
    details.push(
      `O caixa fica negativo em ${formatDayMonth(summary.planned.min_balance.date)}. Antecipe entradas ou adie saídas: faltam ${centsToBRL(summary.gap_to_cash_zero)}.`,
    )
  }
  return {
    headline: level === 'red' ? 'Plano no vermelho' : 'Plano exige atenção',
    details,
  }
}
