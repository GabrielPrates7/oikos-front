export type CategoryType = 'income' | 'expense'

export interface Category {
  id: string
  user_id: string | null
  name: string
  type: CategoryType
  icon: string | null
  created_at: string
  // Quantas vezes ESSE usuário usou a categoria (income_entries + expenses + purchases) —
  // mesmo pra categoria padrão compartilhada, nunca conta uso de outros usuários.
  usageCount: number
}

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  expense: 'Despesa',
  income: 'Entrada',
}
