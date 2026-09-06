import { apiFetch } from '../../services/api'
import type { CreateOrcamentoFormData } from './orcamentos.schemas'
import type { Budget } from './orcamentos.types'

export const orcamentosService = {
  async list(month: string): Promise<Budget[]> {
    const result = await apiFetch<{ budgets: Budget[] }>(`/budgets?month=${month}`)
    return result.budgets
  },

  async create(month: string, data: CreateOrcamentoFormData): Promise<Budget> {
    const result = await apiFetch<{ budget: Budget }>('/budgets', {
      method: 'POST',
      body: JSON.stringify({
        categoryId: data.categoryId,
        referenceMonth: month,
        limitAmountCents: data.limitAmountCents,
      }),
    })
    return result.budget
  },

  // Mês nunca é enviado aqui, mesmo em edição — é fixo, criar um novo orçamento é o caminho
  // pra mudar de mês.
  async update(id: string, data: CreateOrcamentoFormData): Promise<Budget> {
    const result = await apiFetch<{ budget: Budget }>(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        categoryId: data.categoryId,
        limitAmountCents: data.limitAmountCents,
      }),
    })
    return result.budget
  },

  async remove(id: string): Promise<void> {
    await apiFetch(`/budgets/${id}`, { method: 'DELETE' })
  },
}
