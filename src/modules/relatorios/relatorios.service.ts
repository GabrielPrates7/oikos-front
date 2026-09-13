import { apiFetch } from '../../services/api'
import type {
  ByAccountResult,
  ByCategoryResult,
  ByReceiptMethodResult,
  ComparisonResult,
  EssentialVsSuperfluousResult,
  FixedVsNonFixedResult,
  MonthlyEvolutionResult,
  ReportCategoryType,
  SpendingTrendsResult,
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

  async getByAccount(month: string, type: ReportCategoryType): Promise<ByAccountResult> {
    return apiFetch<ByAccountResult>(`/reports/by-account?month=${month}&type=${type}`)
  },

  async getByReceiptMethod(month: string): Promise<ByReceiptMethodResult> {
    return apiFetch<ByReceiptMethodResult>(`/reports/by-receipt-method?month=${month}`)
  },

  async getEssentialVsSuperfluous(month: string): Promise<EssentialVsSuperfluousResult> {
    return apiFetch<EssentialVsSuperfluousResult>(
      `/reports/essential-vs-superfluous?month=${month}`,
    )
  },

  async getFixedVsNonFixed(month: string): Promise<FixedVsNonFixedResult> {
    return apiFetch<FixedVsNonFixedResult>(`/reports/fixed-vs-non-fixed?month=${month}`)
  },

  // Só as categorias de maior variância nos últimos monthsBack meses — usado pelo card
  // "Tendências de Gastos Mensais" do Dashboard.
  async getSpendingTrends(month: string, monthsBack = 6): Promise<SpendingTrendsResult> {
    return apiFetch<SpendingTrendsResult>(
      `/reports/spending-trends?month=${month}&monthsBack=${monthsBack}`,
    )
  },
}
