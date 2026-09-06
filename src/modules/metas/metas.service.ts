import { apiFetch } from '../../services/api'
import type { CreateAporteFormData, CreateMetaFormData } from './metas.schemas'
import type { FinancialGoal, GoalContribution, GoalDetail } from './metas.types'

export const metasService = {
  async list(): Promise<FinancialGoal[]> {
    const result = await apiFetch<{ goals: FinancialGoal[] }>('/goals')
    return result.goals
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
