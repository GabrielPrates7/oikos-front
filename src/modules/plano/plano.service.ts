import { apiFetch } from '../../services/api'
import type {
  CandidateKind,
  CandidatesPage,
  ImportResult,
  ImportSource,
  LinkResult,
  PlanKind,
  PlanSettings,
  PlanSourceType,
  PlanSummary,
} from './plano.types'

export interface CandidatesParams {
  kind: CandidateKind
  status: 'pending' | 'all'
  search?: string
  page: number
  pageSize: number
}

export interface ManualLineBody {
  kind: PlanKind
  description: string
  category_id?: string
  planned_amount_cents: number
  planned_date?: string
  is_essential?: boolean
}

// Só os campos editáveis: manual (todos), vinculada (valor e data), fatura (data).
export interface UpdateLineBody {
  description?: string
  category_id?: string | null
  planned_amount_cents?: number
  planned_date?: string | null
  is_essential?: boolean | null
}

export const planoService = {
  getSummary(month: string, signal?: AbortSignal): Promise<PlanSummary> {
    return apiFetch<PlanSummary>(`/plans/${month}/summary`, { signal })
  },

  async updateSettings(month: string, includeOpeningBalance: boolean): Promise<PlanSettings> {
    const result = await apiFetch<{ plan: PlanSettings }>(`/plans/${month}/settings`, {
      method: 'PUT',
      body: JSON.stringify({ include_opening_balance: includeOpeningBalance }),
    })
    return result.plan
  },

  createLine(month: string, body: ManualLineBody): Promise<unknown> {
    return apiFetch(`/plans/${month}/items`, { method: 'POST', body: JSON.stringify(body) })
  },

  updateLine(id: string, body: UpdateLineBody): Promise<unknown> {
    return apiFetch(`/plans/items/${id}`, { method: 'PUT', body: JSON.stringify(body) })
  },

  removeLine(id: string): Promise<void> {
    return apiFetch<void>(`/plans/items/${id}`, { method: 'DELETE' })
  },

  link(month: string, sources: { type: PlanSourceType; id: string }[]): Promise<LinkResult> {
    return apiFetch<LinkResult>(`/plans/${month}/items/link`, {
      method: 'POST',
      body: JSON.stringify({ sources }),
    })
  },

  listCandidates(
    month: string,
    params: CandidatesParams,
    signal?: AbortSignal,
  ): Promise<CandidatesPage> {
    const query = new URLSearchParams({
      kind: params.kind,
      status: params.status,
      page: String(params.page),
      pageSize: String(params.pageSize),
    })
    if (params.search) query.set('search', params.search)
    return apiFetch<CandidatesPage>(`/plans/${month}/candidates?${query.toString()}`, { signal })
  },

  importItems(
    month: string,
    body: { sources: ImportSource[]; include_settled: boolean; dry_run: boolean },
    signal?: AbortSignal,
  ): Promise<ImportResult> {
    return apiFetch<ImportResult>(`/plans/${month}/import`, {
      method: 'POST',
      body: JSON.stringify(body),
      signal,
    })
  },
}
