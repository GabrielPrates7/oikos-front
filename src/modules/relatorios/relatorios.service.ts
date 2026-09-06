import { apiFetch } from '../../services/api'
import type {
  ByCategoryResult,
  ComparisonResult,
  MonthlyEvolutionResult,
  ReportCategoryType,
} from './relatorios.types'

export const relatoriosService = {
  async getByCategory(month: string, type: ReportCategoryType): Promise<ByCategoryResult> {
    return apiFetch<ByCategoryResult>(`/reports/by-category?month=${month}&type=${type}`)
  },

  async getMonthlyEvolution(monthsBack: number): Promise<MonthlyEvolutionResult> {
    return apiFetch<MonthlyEvolutionResult>(`/reports/monthly-evolution?monthsBack=${monthsBack}`)
  },

  async getComparison(month1: string, month2: string): Promise<ComparisonResult> {
    return apiFetch<ComparisonResult>(`/reports/comparison?month1=${month1}&month2=${month2}`)
  },
}
