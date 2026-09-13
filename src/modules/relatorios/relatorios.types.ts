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

export interface ByAccountItem {
  accountId: string
  name: string
  totalCents: number
}

export interface ByAccountResult {
  month: string
  type: ReportCategoryType
  accounts: ByAccountItem[]
}

export type ReceiptMethod = 'pix' | 'transfer' | 'cash' | 'other'

export const RECEIPT_METHOD_LABELS: Record<ReceiptMethod, string> = {
  pix: 'Pix',
  transfer: 'Transferência',
  cash: 'Dinheiro',
  other: 'Outro',
}

export interface ByReceiptMethodItem {
  receiptMethod: string
  totalCents: number
}

export interface ByReceiptMethodResult {
  month: string
  methods: ByReceiptMethodItem[]
}

export interface EssentialVsSuperfluousResult {
  month: string
  essentialCents: number
  superfluousCents: number
}

export interface FixedVsNonFixedResult {
  month: string
  fixedCents: number
  nonFixedCents: number
}

export interface SpendingTrendPoint {
  month: string
  totalCents: number
  movingAvgCents: number
}

export interface SpendingTrendCategoryItem {
  categoryId: string
  name: string
  icon: string | null
  points: SpendingTrendPoint[]
}

export interface SpendingTrendsResult {
  months: string[]
  categories: SpendingTrendCategoryItem[]
}
