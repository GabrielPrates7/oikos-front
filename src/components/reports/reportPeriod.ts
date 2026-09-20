// Aritmética de período e busca de Relatórios — puro, sem Date parseando "YYYY-MM-DD".
// Meses são { year, month (1-12) } ou a string 'YYYY-MM'; toda navegação é por inteiros.
import { todayInSaoPaulo } from '../../utils/date'

export interface YearMonth {
  year: number
  month: number
}

// Mês/ano correntes no fuso America/Sao_Paulo (todayInSaoPaulo usa Intl.DateTimeFormat com
// timeZone e devolve YYYY-MM-DD; aqui só fatiamos a string).
export function currentYearMonthSP(): YearMonth {
  const [year, month] = todayInSaoPaulo().split('-').map(Number)
  return { year, month }
}

export function toMonthString({ year, month }: YearMonth): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function parseMonthString(value: string): YearMonth {
  const [year, month] = value.split('-').map(Number)
  return { year, month }
}

// Soma `delta` meses com virada de ano (dez → jan) por inteiros.
export function shiftYearMonth({ year, month }: YearMonth, delta: number): YearMonth {
  const index = year * 12 + (month - 1) + delta
  return { year: Math.floor(index / 12), month: (index % 12) + 1 }
}

// Quantos meses `to` está depois de `from` (negativo se antes).
export function monthsDiff(from: YearMonth, to: YearMonth): number {
  return to.year * 12 + to.month - (from.year * 12 + from.month)
}

// Busca por nome: minúsculas + sem acentos (NFD sem diacríticos) + sem espaços nas pontas.
export function normalizeSearch(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').trim()
}

// "Contém" sobre o nome já normalizado. Busca vazia casa com tudo.
export function matchesName(name: string, query: string): boolean {
  const normalizedQuery = normalizeSearch(query)
  if (!normalizedQuery) return true
  return normalizeSearch(name).includes(normalizedQuery)
}

// Anos disponíveis: união das fontes + ano atual, em ordem decrescente e sem repetir.
export function unionYears(sources: number[][], currentYear: number): number[] {
  const all = new Set<number>([currentYear])
  for (const source of sources) for (const year of source) if (Number.isFinite(year)) all.add(year)
  return Array.from(all).sort((a, b) => b - a)
}
