import { apiFetch } from '../../services/api'
import type { CreateTransferenciaFormData } from './transferencias.schemas'
import type { Transfer, TransferFilters } from './transferencias.types'

function toApiPayload(data: CreateTransferenciaFormData): Record<string, unknown> {
  return {
    from_account_id: data.fromAccountId,
    to_account_id: data.toAccountId,
    amount_cents: data.amountCents,
    transfer_date: data.transferDate,
    description: data.description || undefined,
  }
}

function buildQuery(filters: TransferFilters): string {
  const params = new URLSearchParams()
  if (filters.accountId) params.set('accountId', filters.accountId)
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  const query = params.toString()
  return query ? `?${query}` : ''
}

export const transferenciasService = {
  async list(filters: TransferFilters = {}): Promise<Transfer[]> {
    const result = await apiFetch<{ transfers: Transfer[] }>(`/transfers${buildQuery(filters)}`)
    return result.transfers
  },

  async create(data: CreateTransferenciaFormData): Promise<Transfer> {
    const result = await apiFetch<{ transfer: Transfer }>('/transfers', {
      method: 'POST',
      body: JSON.stringify(toApiPayload(data)),
    })
    return result.transfer
  },

  async remove(id: string): Promise<void> {
    await apiFetch(`/transfers/${id}`, { method: 'DELETE' })
  },
}
