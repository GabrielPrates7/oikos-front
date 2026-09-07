import { apiFetch } from '../../services/api'
import type { CreateCompraFormData } from '../compras/compras.schemas'
import type { Purchase } from '../compras/compras.types'
import type { CreateCartaoFormData, UpdateCartaoFormData } from './cartoes.schemas'
import type { CreditCard, CreditCardStatusFilter } from './cartoes.types'

function toApiPayload(data: Partial<CreateCartaoFormData>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (data.name !== undefined) payload.name = data.name
  if (data.brand !== undefined) payload.brand = data.brand || undefined
  if (data.creditLimitCents !== undefined) payload.credit_limit_cents = data.creditLimitCents
  if (data.closingDay !== undefined) payload.closing_day = data.closingDay
  if (data.dueDay !== undefined) payload.due_day = data.dueDay
  return payload
}

type RawCreditCard = Omit<CreditCard, 'availableLimitCents'>

async function withAvailableLimit(card: RawCreditCard): Promise<CreditCard> {
  const result = await apiFetch<{ availableLimitCents: number }>(
    `/credit-cards/${card.id}/available-limit`,
  )
  return { ...card, availableLimitCents: result.availableLimitCents }
}

export const cartoesService = {
  async list(status: CreditCardStatusFilter = 'active'): Promise<CreditCard[]> {
    const query = status === 'active' ? '' : `?status=${status}`
    const result = await apiFetch<{ creditCards: RawCreditCard[] }>(`/credit-cards${query}`)
    return Promise.all(result.creditCards.map(withAvailableLimit))
  },

  async create(data: CreateCartaoFormData): Promise<CreditCard> {
    const result = await apiFetch<{ creditCard: RawCreditCard }>('/credit-cards', {
      method: 'POST',
      body: JSON.stringify(toApiPayload(data)),
    })
    return withAvailableLimit(result.creditCard)
  },

  async update(id: string, data: UpdateCartaoFormData): Promise<CreditCard> {
    const result = await apiFetch<{ creditCard: RawCreditCard }>(`/credit-cards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toApiPayload(data)),
    })
    return withAvailableLimit(result.creditCard)
  },

  async archive(id: string): Promise<void> {
    await apiFetch(`/credit-cards/${id}`, { method: 'DELETE' })
  },

  async deletePermanently(id: string): Promise<void> {
    await apiFetch(`/credit-cards/${id}/permanent`, { method: 'DELETE' })
  },

  async activate(id: string): Promise<void> {
    await apiFetch(`/credit-cards/${id}/activate`, { method: 'POST' })
  },

  async getById(id: string): Promise<CreditCard> {
    const result = await apiFetch<{ creditCard: RawCreditCard }>(`/credit-cards/${id}`)
    return withAvailableLimit(result.creditCard)
  },

  async getAvailableLimit(id: string): Promise<number> {
    const result = await apiFetch<{ availableLimitCents: number }>(
      `/credit-cards/${id}/available-limit`,
    )
    return result.availableLimitCents
  },

  async getPurchaseHistory(cardId: string): Promise<Purchase[]> {
    const result = await apiFetch<{ purchases: Purchase[] }>(`/credit-cards/${cardId}/purchases`)
    return result.purchases
  },

  async createPurchase(cardId: string, data: CreateCompraFormData): Promise<void> {
    await apiFetch('/purchases', {
      method: 'POST',
      body: JSON.stringify({
        credit_card_id: cardId,
        category_id: data.categoryId,
        description: data.description,
        total_amount_cents: data.totalAmountCents,
        installments_count: data.installmentsCount,
        purchase_date: data.purchaseDate,
        is_essential: data.isEssential,
        is_fixed: data.isFixed,
      }),
    })
  },
}
