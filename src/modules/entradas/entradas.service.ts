import { apiFetch } from '../../services/api'
import type { CreateEntradaFormData, UpdateEntradaFormData } from './entradas.schemas'
import type { IncomeEntry, IncomeEntryFilters } from './entradas.types'

// Backend espera snake_case (account_id, category_id, amount_cents, entry_date) — o form
// usa camelCase, essa é a camada que traduz entre os dois (mesmo padrão de contas.service).
function toApiPayload(data: Partial<CreateEntradaFormData>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (data.accountId !== undefined) payload.account_id = data.accountId
  if (data.categoryId !== undefined) payload.category_id = data.categoryId
  if (data.description !== undefined) payload.description = data.description
  if (data.amountCents !== undefined) payload.amount_cents = data.amountCents
  if (data.entryDate !== undefined) payload.entry_date = data.entryDate
  return payload
}

function buildQuery(filters: IncomeEntryFilters): string {
  const params = new URLSearchParams()
  if (filters.accountId) params.set('accountId', filters.accountId)
  if (filters.categoryId) params.set('categoryId', filters.categoryId)
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  const query = params.toString()
  return query ? `?${query}` : ''
}

export const entradasService = {
  async list(filters: IncomeEntryFilters = {}): Promise<IncomeEntry[]> {
    const result = await apiFetch<{ incomeEntries: IncomeEntry[] }>(
      `/income-entries${buildQuery(filters)}`,
    )
    return result.incomeEntries
  },

  async create(data: CreateEntradaFormData): Promise<IncomeEntry> {
    const result = await apiFetch<{ incomeEntry: IncomeEntry }>('/income-entries', {
      method: 'POST',
      body: JSON.stringify(toApiPayload(data)),
    })
    return result.incomeEntry
  },

  async update(id: string, data: UpdateEntradaFormData): Promise<IncomeEntry> {
    const result = await apiFetch<{ incomeEntry: IncomeEntry }>(`/income-entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toApiPayload(data)),
    })
    return result.incomeEntry
  },

  async remove(id: string): Promise<void> {
    await apiFetch(`/income-entries/${id}`, { method: 'DELETE' })
  },
}
