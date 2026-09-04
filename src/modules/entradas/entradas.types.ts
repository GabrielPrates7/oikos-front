export interface IncomeEntry {
  id: string
  user_id: string
  account_id: string
  category_id: string
  description: string
  amount_cents: number
  entry_date: string
  created_at: string
}

export interface IncomeEntryFilters {
  accountId?: string
  categoryId?: string
  from?: string
  to?: string
}
