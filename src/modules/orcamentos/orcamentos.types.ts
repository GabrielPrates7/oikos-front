export interface Budget {
  id: string
  user_id: string
  category_id: string
  reference_month: string
  limit_amount_cents: number
  created_at: string
  updated_at: string
  spentCents: number
  percentageUsed: number
}
