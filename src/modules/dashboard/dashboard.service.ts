import { apiFetch } from '../../services/api'
import type { DashboardSummary } from './dashboard.types'

export const dashboardService = {
  async getSummary(month: string, signal?: AbortSignal): Promise<DashboardSummary> {
    return apiFetch<DashboardSummary>(`/dashboard/summary?month=${month}`, { signal })
  },
}
