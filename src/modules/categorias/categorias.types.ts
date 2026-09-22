export type CategoryType = 'income' | 'expense'

export interface Category {
  id: string
  // Toda categoria tem dono (nenhuma mais compartilhada/user_id NULL — ver migration
  // 1790097890432_give-ownership-to-shared-categories).
  user_id: string
  name: string
  type: CategoryType
  icon: string | null
  created_at: string
  // Quantas vezes ESSE usuário usou a categoria (income_entries + expenses + purchases) —
  // nunca conta uso de outros usuários.
  usageCount: number
}

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  expense: 'Despesa',
  income: 'Entrada',
}
