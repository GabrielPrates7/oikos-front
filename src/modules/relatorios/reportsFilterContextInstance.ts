import { createContext } from 'react'

export interface ReportsFilterContextValue {
  // Mês (1 a 12) e ano do filtro compartilhado entre Visão Geral, Por categoria e Evolução
  // mensal. Em memória: nada na URL, e volta ao mês corrente ao sair de /relatorios/*.
  month: number
  year: number
  // 'YYYY-MM' derivado (formato que a API espera).
  monthString: string
  setMonthYear: (next: { month: number; year: number }) => void
  // Anos para o select: união de /income-entries/years e /expenses/years + ano atual.
  years: number[]
  // true quando mês/ano diferem do mês corrente (São Paulo).
  isCustom: boolean
  reset: () => void
}

export const ReportsFilterContext = createContext<ReportsFilterContextValue | undefined>(undefined)
