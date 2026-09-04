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

// Não usado pra CreditCardsSummary (falta credit_limit_cents pra calcular a barra de
// uso) — a tela busca os cartões via cartoesService.list('active') em vez disso, que já
// devolve o limite total junto do disponível.
export interface DashboardCreditCardSummary {
  id: string
  name: string
  availableLimitCents: number
}

export interface DashboardCategoryExpense {
  categoryId: string
  name: string
  icon: string | null
  totalCents: number
}

export type DashboardTransactionType = 'income' | 'expense' | 'transfer'

export interface DashboardRecentTransaction {
  type: DashboardTransactionType
  id: string
  description: string
  amountCents: number
  date: string
  accountName: string
  categoryName?: string
}

export interface DashboardSummary {
  month: string
  totals: DashboardTotals
  totalBalanceCents: number
  accounts: DashboardAccountSummary[]
  creditCards: DashboardCreditCardSummary[]
  expensesByCategory: DashboardCategoryExpense[]
  recentTransactions: DashboardRecentTransaction[]
}
