export type CreditCardStatus = 'active' | 'archived'
export type CreditCardStatusFilter = 'active' | 'archived' | 'all'

export interface CreditCard {
  id: string
  user_id: string
  name: string
  brand: string | null
  credit_limit_cents: number
  closing_day: number
  due_day: number
  status: CreditCardStatus
  created_at: string
  updated_at: string
  availableLimitCents: number
}
