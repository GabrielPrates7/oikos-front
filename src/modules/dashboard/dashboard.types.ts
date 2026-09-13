export interface DashboardTotals {
  incomeCents: number
  expenseCents: number
  netCents: number
}

export interface DashboardAccountSummary {
  id: string
  name: string
  balanceCents: number
}

export interface DashboardCreditCardSummary {
  id: string
  name: string
  creditLimitCents: number
  availableLimitCents: number
}

export interface DashboardCategoryExpense {
  categoryId: string
  name: string
  icon: string | null
  totalCents: number
  percentOfTotal: number
}

export type DashboardTransactionType =
  | 'income'
  | 'expense'
  | 'transfer'
  | 'invoice_payment'
  | 'goal_contribution'

export interface DashboardRecentTransaction {
  type: DashboardTransactionType
  id: string
  description: string
  amountCents: number
  date: string
  accountName: string
  categoryName?: string
  categoryIcon?: string | null
}

export interface DashboardSummary {
  month: string
  totals: DashboardTotals
  totalBalanceCents: number
  // Mesmo conceito de Já pago/Falta pagar de Despesas, mas escopado pelo mês do
  // MonthSwitcher — substitui o antigo totalPendingInvoicesCents (que era global, sem
  // filtro de mês).
  jaPagoCents: number
  jaPagoPercent: number
  faltaPagarCents: number
  faltaPagarPercent: number
  lucroCents: number
  lucroMargemPercent: number
  patrimonioLiquidoCents: number
  patrimonioLiquidoPercent: number
  poupancaCents: number
  taxaPoupancaPercent: number
  accounts: DashboardAccountSummary[]
  creditCards: DashboardCreditCardSummary[]
  expensesByCategory: DashboardCategoryExpense[]
  recentTransactions: DashboardRecentTransaction[]
}
