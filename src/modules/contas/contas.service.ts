import { apiFetch } from '../../services/api'
import type { CreateContaFormData, UpdateContaFormData } from './contas.schemas'
import type { Account, AccountStatement, AccountStatusFilter } from './contas.types'

// O backend espera snake_case (name, bank_name, type, initial_balance_cents) — o form usa
// camelCase (convenção JS/TS), então essa é a camada que traduz entre os dois.
function toApiPayload(data: Partial<CreateContaFormData>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (data.name !== undefined) payload.name = data.name
  if (data.bankName !== undefined) payload.bank_name = data.bankName || undefined
  if (data.type !== undefined) payload.type = data.type
  if (data.initialBalanceCents !== undefined)
    payload.initial_balance_cents = data.initialBalanceCents
  // '' (botão "usar cor padrão do banco") precisa virar null explícito, não sumir do
  // payload — o repository só ignora chave ausente (undefined), null de verdade limpa a
  // coluna.
  if (data.color !== undefined) payload.color = data.color || null
  return payload
}

export const contasService = {
  async list(status: AccountStatusFilter = 'active'): Promise<Account[]> {
    const query = status === 'active' ? '' : `?status=${status}`
    const result = await apiFetch<{ accounts: Account[] }>(`/accounts${query}`)
    return result.accounts
  },

  async create(data: CreateContaFormData): Promise<Account> {
    const result = await apiFetch<{ account: Account }>('/accounts', {
      method: 'POST',
      body: JSON.stringify(toApiPayload(data)),
    })
    return result.account
  },

  async update(id: string, data: UpdateContaFormData): Promise<Account> {
    const result = await apiFetch<{ account: Account }>(`/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toApiPayload(data)),
    })
    return result.account
  },

  async archive(id: string): Promise<void> {
    await apiFetch(`/accounts/${id}`, { method: 'DELETE' })
  },

  async deletePermanently(id: string): Promise<void> {
    await apiFetch(`/accounts/${id}/permanent`, { method: 'DELETE' })
  },

  async activate(id: string): Promise<void> {
    await apiFetch(`/accounts/${id}/activate`, { method: 'POST' })
  },

  async getById(id: string): Promise<Account> {
    const result = await apiFetch<{ account: Account }>(`/accounts/${id}`)
    return result.account
  },

  async getStatement(accountId: string, from?: string, to?: string): Promise<AccountStatement> {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const query = params.toString()
    return apiFetch<AccountStatement>(`/accounts/${accountId}/statement${query ? `?${query}` : ''}`)
  },
}
