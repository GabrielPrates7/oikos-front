import { apiFetch } from '../../services/api'
import type { PaginatedResult } from '../../utils/pagination'
import type { CreateTransferenciaFormData } from './transferencias.schemas'
import type { Transfer, TransferFilters } from './transferencias.types'

export interface PageParams {
  page: number
  pageSize: number
}

function toApiPayload(data: CreateTransferenciaFormData): Record<string, unknown> {
  return {
    from_account_id: data.fromAccountId,
    to_account_id: data.toAccountId,
    amount_cents: data.amountCents,
    transfer_date: data.transferDate,
    description: data.description || undefined,
  }
}

function buildQuery(filters: TransferFilters, pagination: PageParams): string {
  const params = new URLSearchParams()
  if (filters.accountId) params.set('accountId', filters.accountId)
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  params.set('page', String(pagination.page))
  params.set('pageSize', String(pagination.pageSize))
  return `?${params.toString()}`
}

export const transferenciasService = {
  async list(
    filters: TransferFilters = {},
    pagination: PageParams,
  ): Promise<PaginatedResult<Transfer>> {
    const result = await apiFetch<{
      transfers: Transfer[]
      total: number
      sumCents: number
      page: number
      pageSize: number
    }>(`/transfers${buildQuery(filters, pagination)}`)
    return {
      items: result.transfers,
      total: result.total,
      sumCents: result.sumCents,
      page: result.page,
      pageSize: result.pageSize,
    }
  },

  async create(data: CreateTransferenciaFormData): Promise<Transfer> {
    const result = await apiFetch<{ transfer: Transfer }>('/transfers', {
      method: 'POST',
      body: JSON.stringify(toApiPayload(data)),
    })
    return result.transfer
  },

  // description sempre vai (string vazia limpa) — no PUT, omitir significa "manter", e o
  // usuário precisa conseguir apagar a descrição editando.
  async update(id: string, data: CreateTransferenciaFormData): Promise<Transfer> {
    const result = await apiFetch<{ transfer: Transfer }>(`/transfers/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...toApiPayload(data), description: data.description ?? '' }),
    })
    return result.transfer
  },

  async remove(id: string): Promise<void> {
    await apiFetch(`/transfers/${id}`, { method: 'DELETE' })
  },
}
