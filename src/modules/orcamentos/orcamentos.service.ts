import { apiFetch } from '../../services/api'
import type { PaginatedList } from '../../utils/pagination'
import type { CreateOrcamentoFormData } from './orcamentos.schemas'
import type { Budget } from './orcamentos.types'

export interface PageParams {
  page: number
  pageSize: number
}

export const orcamentosService = {
  // Lista completa (teto pragmático de 100 — orçamento é no máximo 1 por categoria de
  // despesa, não costuma passar disso) — usada por quem precisa de TODOS os orçamentos do
  // mês (ex: PorCategoriaTab), não só a tela de Orçamentos em si (que usa listPaginated).
  async list(month: string): Promise<Budget[]> {
    const result = await apiFetch<{ budgets: Budget[] }>(`/budgets?month=${month}&pageSize=100`)
    return result.budgets
  },

  async listPaginated(month: string, pagination: PageParams): Promise<PaginatedList<Budget>> {
    const params = new URLSearchParams({ month })
    params.set('page', String(pagination.page))
    params.set('pageSize', String(pagination.pageSize))
    const result = await apiFetch<{ budgets: Budget[]; total: number; page: number; pageSize: number }>(
      `/budgets?${params.toString()}`,
    )
    return {
      items: result.budgets,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    }
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
