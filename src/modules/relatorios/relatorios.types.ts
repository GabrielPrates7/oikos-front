export type ReportCategoryType = 'income' | 'expense'

export interface ByCategoryItem {
  categoryId: string
  name: string
  icon: string | null
  totalCents: number
}

export interface ByCategoryResult {
  month: string
  type: ReportCategoryType
  categories: ByCategoryItem[]
}

export interface MonthlyEvolutionItem {
  month: string
  incomeCents: number
  expenseCents: number
  netCents: number
}

export interface MonthlyEvolutionResult {
  months: MonthlyEvolutionItem[]
}

export interface ComparisonMonthTotals {
  month: string
  incomeCents: number
  expenseCents: number
  netCents: number
}

export interface ComparisonCategoryItem {
  categoryId: string
  name: string
  month1Cents: number
  month2Cents: number
  deltaCents: number
}

export interface ComparisonResult {
  month1: ComparisonMonthTotals
  month2: ComparisonMonthTotals
  delta: {
    incomeCentsDelta: number
    expenseCentsDelta: number
    netCentsDelta: number
  }
  categories: ComparisonCategoryItem[]
}
