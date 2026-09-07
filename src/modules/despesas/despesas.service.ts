import { apiFetch } from '../../services/api'
import { cartoesService } from '../cartoes/cartoes.service'
import { faturasService } from '../faturas/faturas.service'
import type { CreateDespesaFormData, UpdateDespesaFormData } from './despesas.schemas'
import type { DespesaListEntry, Expense, ExpenseFilters } from './despesas.types'

function toApiPayload(data: Partial<CreateDespesaFormData>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (data.accountId !== undefined) payload.account_id = data.accountId
  if (data.categoryId !== undefined) payload.category_id = data.categoryId
  if (data.description !== undefined) payload.description = data.description
  if (data.amountCents !== undefined) payload.amount_cents = data.amountCents
  if (data.paymentMethod !== undefined) payload.payment_method = data.paymentMethod
  if (data.expenseDate !== undefined) payload.expense_date = data.expenseDate
  if (data.isEssential !== undefined) payload.is_essential = data.isEssential
  if (data.isFixed !== undefined) payload.is_fixed = data.isFixed
  if (data.isPlanned !== undefined) payload.is_planned = data.isPlanned
  // paid_date sempre acompanha is_paid — null explícito quando pendente, mesmo que o
  // formulário ainda tenha algum valor "sobrando" no campo (que nem aparece na tela nesse
  // caso). A API rejeita paid_date presente com is_paid=false, então isso importa de verdade.
  if (data.isPaid !== undefined) {
    payload.is_paid = data.isPaid
    payload.paid_date = data.isPaid ? (data.paidDate ?? null) : null
  }
  return payload
}

function buildQuery(filters: ExpenseFilters): string {
  const params = new URLSearchParams()
  if (filters.accountId) params.set('accountId', filters.accountId)
  if (filters.categoryId) params.set('categoryId', filters.categoryId)
  if (filters.paymentMethod) params.set('paymentMethod', filters.paymentMethod)
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  const query = params.toString()
  return query ? `?${query}` : ''
}

function entryDate(entry: DespesaListEntry): string {
  return entry.type === 'expense' ? entry.data.expense_date : entry.date
}

export const despesasService = {
  async list(filters: ExpenseFilters = {}): Promise<Expense[]> {
    const result = await apiFetch<{ expenses: Expense[] }>(`/expenses${buildQuery(filters)}`)
    return result.expenses
  },

  async create(data: CreateDespesaFormData): Promise<Expense> {
    const result = await apiFetch<{ expense: Expense }>('/expenses', {
      method: 'POST',
      body: JSON.stringify(toApiPayload(data)),
    })
    return result.expense
  },

  async update(id: string, data: UpdateDespesaFormData): Promise<Expense> {
    const result = await apiFetch<{ expense: Expense }>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toApiPayload(data)),
    })
    return result.expense
  },

  async remove(id: string): Promise<void> {
    await apiFetch(`/expenses/${id}`, { method: 'DELETE' })
  },

  // Mescla despesas reais com pagamentos de fatura (só informativo — não tem categoria nem
  // forma de pagamento própria, então some da lista se um desses dois filtros estiver
  // ativo, já que nunca poderia satisfazê-los de verdade). GET /invoices não devolve o
  // pagamento em si, só o status — por isso o detalhe de cada fatura paga é buscado à
  // parte (N+1 pequeno e limitado ao período filtrado, sem endpoint de lote disponível).
  async listWithInvoicePayments(filters: ExpenseFilters = {}): Promise<DespesaListEntry[]> {
    const expenses = await despesasService.list(filters)
    const expenseEntries: DespesaListEntry[] = expenses.map((expense) => ({
      type: 'expense',
      data: expense,
    }))

    if (filters.categoryId || filters.paymentMethod) {
      return expenseEntries.sort((a, b) => entryDate(b).localeCompare(entryDate(a)))
    }

    const [invoices, cards] = await Promise.all([faturasService.list(), cartoesService.list('all')])
    const cardsById = new Map(cards.map((card) => [card.id, card]))
    const paidInvoices = invoices.filter((invoice) => invoice.displayStatus === 'paid')
    const paidDetails = await Promise.all(paidInvoices.map((invoice) => faturasService.getById(invoice.id)))

    const invoiceEntries: DespesaListEntry[] = []
    for (const detail of paidDetails) {
      const payment = detail.payment
      if (!payment) continue
      if (filters.accountId && payment.account_id !== filters.accountId) continue
      if (filters.from && payment.payment_date < filters.from) continue
      if (filters.to && payment.payment_date > filters.to) continue
      const card = cardsById.get(detail.credit_card_id)
      invoiceEntries.push({
        type: 'invoice_payment',
        id: payment.id,
        date: payment.payment_date,
        amountCents: payment.amount_cents,
        description: `Fatura ${card?.name ?? 'cartão removido'}`,
      })
    }

    return [...expenseEntries, ...invoiceEntries].sort((a, b) =>
      entryDate(b).localeCompare(entryDate(a)),
    )
  },
}
