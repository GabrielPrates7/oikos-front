import { apiFetch } from '../../services/api'
import type { PaginatedList } from '../../utils/pagination'
import type { CreateAporteFormData, CreateMetaFormData } from './metas.schemas'
import type { FinancialGoal, GoalContribution, GoalDetail } from './metas.types'

export interface PageParams {
  page: number
  pageSize: number
}

export const metasService = {
  // Único consumidor é MetasPage (a própria tela paginada) — sem versão "lista completa"
  // porque nenhum outro lugar do app precisa de todas as metas de uma vez.
  async list(pagination: PageParams): Promise<PaginatedList<FinancialGoal>> {
    const params = new URLSearchParams()
    params.set('page', String(pagination.page))
    params.set('pageSize', String(pagination.pageSize))
    const result = await apiFetch<{
      goals: FinancialGoal[]
      total: number
      page: number
      pageSize: number
    }>(`/goals?${params.toString()}`)
    return { items: result.goals, total: result.total, page: result.page, pageSize: result.pageSize }
  },

  async getById(id: string): Promise<GoalDetail> {
    const result = await apiFetch<{ goal: GoalDetail }>(`/goals/${id}`)
    return result.goal
  },

  async create(data: CreateMetaFormData): Promise<FinancialGoal> {
    const result = await apiFetch<{ goal: FinancialGoal }>('/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return result.goal
  },

  async update(id: string, data: CreateMetaFormData): Promise<FinancialGoal> {
    const result = await apiFetch<{ goal: FinancialGoal }>(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return result.goal
  },

  async remove(id: string): Promise<void> {
    await apiFetch(`/goals/${id}`, { method: 'DELETE' })
  },

  async createContribution(
    goalId: string,
    data: CreateAporteFormData,
  ): Promise<GoalContribution> {
    const result = await apiFetch<{ contribution: GoalContribution }>(
      `/goals/${goalId}/contributions`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    )
    return result.contribution
  },

  async deleteContribution(goalId: string, contributionId: string): Promise<void> {
    await apiFetch(`/goals/${goalId}/contributions/${contributionId}`, { method: 'DELETE' })
  },
}
