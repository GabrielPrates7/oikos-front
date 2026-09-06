export interface FinancialGoal {
  id: string
  user_id: string
  name: string
  target_amount_cents: number
  target_date: string
  created_at: string
  updated_at: string
  currentAmountCents: number
}

export interface GoalContribution {
  id: string
  goal_id: string
  account_id: string
  amount_cents: number
  contribution_date: string
  created_at: string
}

export interface GoalDetail extends FinancialGoal {
  contributions: GoalContribution[]
}
