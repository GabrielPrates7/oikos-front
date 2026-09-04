export type CategoryType = 'income' | 'expense'

export interface Category {
  id: string
  user_id: string | null
  name: string
  type: CategoryType
  icon: string | null
  created_at: string
}

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  expense: 'Despesa',
  income: 'Entrada',
}
