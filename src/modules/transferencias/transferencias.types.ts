export interface Transfer {
  id: string
  user_id: string
  from_account_id: string
  to_account_id: string
  amount_cents: number
  transfer_date: string
  description: string | null
  created_at: string
}

export interface TransferFilters {
  accountId?: string
  from?: string
  to?: string
}
