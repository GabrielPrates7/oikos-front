import { apiFetch } from '../../services/api'
import type { CreateCompraFormData, UpdateCompraFormData } from '../compras/compras.schemas'
import type { Purchase, PurchaseInstallment, RawPurchase } from '../compras/compras.types'
import type { CreateCartaoFormData, UpdateCartaoFormData } from './cartoes.schemas'
import type { CreditCard, CreditCardStatusFilter } from './cartoes.types'

export interface PageParams {
  page: number
  pageSize: number
}

export interface PaginatedCreditCards {
  items: CreditCard[]
  total: number
  sumCreditLimitCents: number
  sumAvailableLimitCents: number
  page: number
  pageSize: number
}

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
  // Lista completa (teto pragmático de 100 — cartão não costuma passar disso) — usada pelos
  // formulários/filtros que precisam de TODOS os cartões pra popular um <select>, não só a
  // tela de Cartões em si (que usa listPaginated).
  async list(status: CreditCardStatusFilter = 'active'): Promise<CreditCard[]> {
    const params = new URLSearchParams()
    if (status !== 'active') params.set('status', status)
    params.set('pageSize', '100')
    const result = await apiFetch<{ creditCards: RawCreditCard[] }>(`/credit-cards?${params.toString()}`)
    return Promise.all(result.creditCards.map(withAvailableLimit))
  },

  async listPaginated(
    status: CreditCardStatusFilter,
    pagination: PageParams,
  ): Promise<PaginatedCreditCards> {
    const params = new URLSearchParams()
    if (status !== 'active') params.set('status', status)
    params.set('page', String(pagination.page))
    params.set('pageSize', String(pagination.pageSize))
    const result = await apiFetch<{
      creditCards: RawCreditCard[]
      total: number
      sumCreditLimitCents: number
      sumAvailableLimitCents: number
      page: number
      pageSize: number
    }>(`/credit-cards?${params.toString()}`)
    const items = await Promise.all(result.creditCards.map(withAvailableLimit))
    return {
      items,
      total: result.total,
      sumCreditLimitCents: result.sumCreditLimitCents,
      sumAvailableLimitCents: result.sumAvailableLimitCents,
      page: result.page,
      pageSize: result.pageSize,
    }
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

  // Devolve a compra criada + as parcelas geradas (mesmo shape de POST /purchases desde a
  // Fase 11) — o formulário único de lançamento usa isso pra montar a mensagem de sucesso
  // (fatura/mês da parcela 1) sem precisar buscar a compra de novo.
  async createPurchase(
    cardId: string,
    data: CreateCompraFormData,
  ): Promise<{ purchase: RawPurchase; installments: PurchaseInstallment[] }> {
    const payload: Record<string, unknown> = {
      credit_card_id: cardId,
      category_id: data.categoryId,
      description: data.description,
      total_amount_cents: data.totalAmountCents,
      installments_count: data.installmentsCount,
      purchase_date: data.purchaseDate,
      is_essential: data.isEssential,
      is_fixed: data.isFixed,
      is_planned: data.isPlanned,
    }
    // Criação: notes só quando preenchida (trim e vazio→null são do backend).
    if (data.notes) payload.notes = data.notes
    return apiFetch('/purchases', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  // locked (has_paid_installment) determina se os campos estruturais entram no payload —
  // não só se aparecem desabilitados na UI. O backend trata a PRESENÇA dessas chaves como
  // "isso é uma edição estrutural" (não compara valor novo x antigo), então mandar
  // total_amount_cents/installments_count/purchase_date/credit_card_id junto numa compra
  // travada faria até uma edição só de descrição bater no bloqueio de parcela paga.
  async updatePurchase(
    purchaseId: string,
    data: UpdateCompraFormData,
    locked: boolean,
  ): Promise<void> {
    const payload: Record<string, unknown> = {
      category_id: data.categoryId,
      description: data.description,
      is_essential: data.isEssential,
      is_fixed: data.isFixed,
    }
    // Edição: notes SEMPRE vai (texto, ou null se apagada). Não é campo estrutural: vale também com
    // parcela já paga (locked).
    if (data.notes !== undefined) payload.notes = data.notes === '' ? null : data.notes
    if (!locked) {
      payload.credit_card_id = data.creditCardId
      payload.total_amount_cents = data.totalAmountCents
      payload.installments_count = data.installmentsCount
      payload.purchase_date = data.purchaseDate
    }
    await apiFetch(`/purchases/${purchaseId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  async deletePurchase(purchaseId: string): Promise<void> {
    await apiFetch(`/purchases/${purchaseId}`, { method: 'DELETE' })
  },
}
