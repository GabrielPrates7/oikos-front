import { apiFetch } from '../../services/api'
import type { PaginatedResult } from '../../utils/pagination'
import { periodQuery } from '../../utils/period'
import type { CreateEntradaFormData, UpdateEntradaFormData } from './entradas.schemas'
import type { IncomeEntry, IncomeEntryFilters } from './entradas.types'

export interface PageParams {
  page: number
  pageSize: number
}

// Backend espera snake_case (account_id, category_id, amount_cents, entry_date) — o form
// usa camelCase, essa é a camada que traduz entre os dois (mesmo padrão de contas.service).
function toApiPayload(
  data: Partial<CreateEntradaFormData>,
  mode: 'create' | 'update',
): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (data.accountId !== undefined) payload.account_id = data.accountId
  if (data.categoryId !== undefined) payload.category_id = data.categoryId
  if (data.description !== undefined) payload.description = data.description
  if (data.amountCents !== undefined) payload.amount_cents = data.amountCents
  if (data.entryDate !== undefined) payload.entry_date = data.entryDate
  if (data.receiptMethod !== undefined) payload.receipt_method = data.receiptMethod
  if (data.isPlanned !== undefined) payload.is_planned = data.isPlanned
  if (data.isFixed !== undefined) payload.is_fixed = data.isFixed
  // Observação: na CRIAÇÃO só vai no payload quando preenchida; na EDIÇÃO sempre vai (texto, ou null se
  // o usuário apagou). PUT parcial sem o campo (atalho "Marcar como recebida/paga") NÃO envia notes,
  // então o backend preserva o valor gravado. Trim e "vazio vira null" são do backend.
  if (data.notes !== undefined) {
    if (mode === 'update') payload.notes = data.notes === '' ? null : data.notes
    else if (data.notes !== '') payload.notes = data.notes
  }
  if (data.countInTotals !== undefined) payload.count_in_totals = data.countInTotals
  // received_date sempre acompanha is_received — mesmo motivo do paid_date em
  // despesas.service (a API rejeita received_date presente com is_received=false).
  if (data.isReceived !== undefined) {
    payload.is_received = data.isReceived
    payload.received_date = data.isReceived ? (data.receivedDate ?? null) : null
  }
  return payload
}

function buildQuery(filters: IncomeEntryFilters, pagination: PageParams): string {
  const params = new URLSearchParams()
  if (filters.accountId) params.set('accountId', filters.accountId)
  if (filters.categoryId) params.set('categoryId', filters.categoryId)
  if (filters.status) params.set('status', filters.status)
  if (filters.fixed) params.set('fixed', filters.fixed)
  const period = periodQuery(filters)
  if (period.from) params.set('from', period.from)
  if (period.to) params.set('to', period.to)
  if (period.month !== undefined) params.set('month', period.month)
  params.set('page', String(pagination.page))
  params.set('pageSize', String(pagination.pageSize))
  return `?${params.toString()}`
}

export const entradasService = {
  async list(
    filters: IncomeEntryFilters = {},
    pagination: PageParams,
    signal?: AbortSignal,
  ): Promise<PaginatedResult<IncomeEntry>> {
    const result = await apiFetch<{
      incomeEntries: IncomeEntry[]
      total: number
      sumCents: number
      sumMode?: 'pending' | 'default'
      page: number
      pageSize: number
    }>(`/income-entries${buildQuery(filters, pagination)}`, { signal })
    return {
      items: result.incomeEntries,
      total: result.total,
      sumCents: result.sumCents,
      sumMode: result.sumMode,
      page: result.page,
      pageSize: result.pageSize,
    }
  },

  async create(data: CreateEntradaFormData): Promise<IncomeEntry> {
    const result = await apiFetch<{ incomeEntry: IncomeEntry }>('/income-entries', {
      method: 'POST',
      body: JSON.stringify(toApiPayload(data, 'create')),
    })
    return result.incomeEntry
  },

  async update(id: string, data: UpdateEntradaFormData): Promise<IncomeEntry> {
    const result = await apiFetch<{ incomeEntry: IncomeEntry }>(`/income-entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toApiPayload(data, 'update')),
    })
    return result.incomeEntry
  },

  async remove(id: string): Promise<void> {
    await apiFetch(`/income-entries/${id}`, { method: 'DELETE' })
  },

  // Anos com pelo menos uma entrada de verdade — popula o filtro "Ano" sem lista fixa
  // arbitrária.
  async getYears(): Promise<number[]> {
    const result = await apiFetch<{ years: number[] }>('/income-entries/years')
    return result.years
  },
}
