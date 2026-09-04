import { apiFetch } from '../../services/api'
import type { CreateDespesaFormData, UpdateDespesaFormData } from './despesas.schemas'
import type { Expense, ExpenseFilters } from './despesas.types'

function toApiPayload(data: Partial<CreateDespesaFormData>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (data.accountId !== undefined) payload.account_id = data.accountId
  if (data.categoryId !== undefined) payload.category_id = data.categoryId
  if (data.description !== undefined) payload.description = data.description
  if (data.amountCents !== undefined) payload.amount_cents = data.amountCents
  if (data.paymentMethod !== undefined) payload.payment_method = data.paymentMethod
  if (data.expenseDate !== undefined) payload.expense_date = data.expenseDate
  return payload
}

function buildQuery(filters: ExpenseFilters): string {
  const params = new URLSearchParams()
  if (filters.accountId) params.set('accountId', filters.accountId)
  if (filters.categoryId) params.set('categoryId', filters.categoryId)
  if (filters.paymentMethod) params.set('paymentMethod', filters.paymentMethod)
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  const query = params.toString()
  return query ? `?${query}` : ''
}

export const despesasService = {
  async list(filters: ExpenseFilters = {}): Promise<Expense[]> {
    const result = await apiFetch<{ expenses: Expense[] }>(`/expenses${buildQuery(filters)}`)
    return result.expenses
  },

  async create(data: CreateDespesaFormData): Promise<Expense> {
    const result = await apiFetch<{ expense: Expense }>('/expenses', {
      method: 'POST',
      body: JSON.stringify(toApiPayload(data)),
    })
    return result.expense
  },

  async update(id: string, data: UpdateDespesaFormData): Promise<Expense> {
    const result = await apiFetch<{ expense: Expense }>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toApiPayload(data)),
    })
    return result.expense
  },

  async remove(id: string): Promise<void> {
    await apiFetch(`/expenses/${id}`, { method: 'DELETE' })
  },
}
