import { currentMonthString, MONTH_NAMES_PT, todayInSaoPaulo } from './date'

// Filtro de período das listas de Entradas/Despesas. O valor guardado em filters.month é:
//  - 'YYYY-MM'  um mês;
//  - 'YYYY-all' "Todos os meses" de um ano (a API não tem year=all: vira from=YYYY-01-01 e
//               to=YYYY-12-31 na hora de montar a consulta);
//  - 'all'      "Todos" em Ano (implica Mês = Todos): a API cobre todos os anos com month=all,
//               sem from/to.
export const ALL_MONTHS = 'all'

export function isAllMonths(month: string | undefined): boolean {
  return !!month && month.endsWith(`-${ALL_MONTHS}`)
}

// Ano = Todos (todos os períodos).
export function isAllPeriods(month: string | undefined): boolean {
  return month === ALL_MONTHS
}

// Separa o valor combinado nos dois <select> (Mês/Ano). 'all' = Ano Todos + Mês Todos.
export function splitPeriod(month: string | undefined): { year: string; monthNum: string } {
  const value = month ?? currentMonthString()
  if (value === ALL_MONTHS) return { year: ALL_MONTHS, monthNum: ALL_MONTHS }
  const [year, monthNum] = value.split('-')
  return { year: year ?? String(new Date().getFullYear()), monthNum: monthNum ?? '01' }
}

// Escolher um Mês. Com Ano = Todos, um mês específico faz o Ano voltar ao corrente (um mês só
// existe dentro de um ano); Mês = Todos com Ano = Todos continua em 'all'.
export function withMonthSelected(month: string | undefined, monthNum: string): string {
  const { year } = splitPeriod(month)
  if (monthNum === ALL_MONTHS) return year === ALL_MONTHS ? ALL_MONTHS : `${year}-${ALL_MONTHS}`
  const effectiveYear = year === ALL_MONTHS ? splitPeriod(currentMonthString()).year : year
  return `${effectiveYear}-${monthNum}`
}

// Escolher um Ano. Ano = Todos implica Mês = Todos.
export function withYearSelected(month: string | undefined, year: string): string {
  if (year === ALL_MONTHS) return ALL_MONTHS
  const { monthNum } = splitPeriod(month)
  return `${year}-${monthNum}`
}

export interface PeriodQuery {
  month?: string
  from?: string
  to?: string
}

// Parâmetros de data da consulta. De/Até explícitos SEMPRE ganham do Mês/Ano (mesma regra do
// backend) — 'YYYY-all' só vira intervalo do ano quando nenhum dos dois foi preenchido.
// 'all' segue como month=all (sem from/to).
export function periodQuery(filters: { month?: string; from?: string; to?: string }): PeriodQuery {
  const query: PeriodQuery = {}
  if (filters.from) query.from = filters.from
  if (filters.to) query.to = filters.to
  const hasExplicitRange = !!(filters.from || filters.to)
  if (filters.month !== undefined && !isAllMonths(filters.month)) {
    query.month = filters.month
  } else if (isAllMonths(filters.month) && !hasExplicitRange) {
    const { year } = splitPeriod(filters.month)
    query.from = `${year}-01-01`
    query.to = `${year}-12-31`
  }
  return query
}

// Quantos dos dois seletores (Mês, Ano) estão fora do padrão (mês e ano correntes) — entram no
// contador de filtros ativos, e "Limpar filtros" volta ao padrão. Ano = Todos conta como fora
// do padrão (e Mês, que ele implica, também).
export function periodFiltersOffDefault(month: string | undefined): number {
  const current = splitPeriod(currentMonthString())
  const selected = splitPeriod(month)
  return (selected.monthNum !== current.monthNum ? 1 : 0) + (selected.year !== current.year ? 1 : 0)
}

// "setembro/2026", "2026" (Todos os meses de um ano) ou "todos os períodos" — pro aviso das
// pendentes.
export function describePeriod(month: string | undefined): string {
  const { year, monthNum } = splitPeriod(month)
  if (year === ALL_MONTHS) return 'todos os períodos'
  if (monthNum === ALL_MONTHS) return year
  const name = MONTH_NAMES_PT[Number(monthNum) - 1]?.toLowerCase() ?? monthNum
  return `${name}/${year}`
}

// ---- Datas dos formulários de Entrada/Despesa (fuso America/Sao_Paulo) --------------------------
export { todayInSaoPaulo } from './date'

// Soma dias de calendário a uma data YYYY-MM-DD. Aritmética por Date.UTC com números separados —
// nunca new Date("YYYY-MM-DD") (que erra 1 dia ao ler de volta no fuso local).
export function addDaysToIso(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const shifted = new Date(Date.UTC(year, month - 1, day + days))
  const y = shifted.getUTCFullYear()
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0')
  const d = String(shifted.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// "Ontem" no fuso de São Paulo.
export function yesterdayInSaoPaulo(): string {
  return addDaysToIso(todayInSaoPaulo(), -1)
}
