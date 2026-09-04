import { apiFetch } from '../../services/api'
import type { DashboardSummary } from './dashboard.types'

export const dashboardService = {
  async getSummary(month: string): Promise<DashboardSummary> {
    return apiFetch<DashboardSummary>(`/dashboard/summary?month=${month}`)
  },
}
