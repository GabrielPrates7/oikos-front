import { apiFetch } from '../../services/api'
import { currentMonthString, monthRange } from '../../utils/date'
import type { PaginatedResult } from '../../utils/pagination'
import { cartoesService } from '../cartoes/cartoes.service'
import { faturasService } from '../faturas/faturas.service'
import type { CreateDespesaFormData, UpdateDespesaFormData } from './despesas.schemas'
import type { DespesaListEntry, Expense, ExpenseFilters, MonthlySummary } from './despesas.types'

export interface PageParams {
  page: number
  pageSize: number
}

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
  if (data.countInTotals !== undefined) payload.count_in_totals = data.countInTotals
  // paid_date sempre acompanha is_paid — null explícito quando pendente, mesmo que o
  // formulário ainda tenha algum valor "sobrando" no campo (que nem aparece na tela nesse
  // caso). A API rejeita paid_date presente com is_paid=false, então isso importa de verdade.
  if (data.isPaid !== undefined) {
    payload.is_paid = data.isPaid
    payload.paid_date = data.isPaid ? (data.paidDate ?? null) : null
  }
  return payload
}

function buildQuery(filters: ExpenseFilters, pagination: PageParams): string {
  const params = new URLSearchParams()
  if (filters.accountId) params.set('accountId', filters.accountId)
  if (filters.categoryId) params.set('categoryId', filters.categoryId)
  if (filters.paymentMethod) params.set('paymentMethod', filters.paymentMethod)
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  if (filters.month !== undefined) params.set('month', filters.month)
  params.set('page', String(pagination.page))
  params.set('pageSize', String(pagination.pageSize))
  return `?${params.toString()}`
}

function entryDate(entry: DespesaListEntry): string {
  return entry.type === 'expense' ? entry.data.expense_date : entry.date
}

// Limites de data efetivos da mesclagem de fatura (pagamento/em aberto): from/to explícitos
// sempre ganham (mesma regra do backend, ver expenses.controller.resolveDateRange); sem
// eles, usa o mês do filtro (ou mês atual, se nenhum foi escolhido ainda). null = sem limite
// nenhum ('all').
function resolveInvoiceDateBounds(filters: ExpenseFilters): { from?: string; to?: string } | null {
  if (filters.from || filters.to) {
    return { from: filters.from, to: filters.to }
  }
  const month = filters.month ?? currentMonthString()
  if (month === 'all') return null
  const { monthStart, monthEnd } = monthRange(month)
  return { from: monthStart, to: monthEnd }
}

export const despesasService = {
  async list(
    filters: ExpenseFilters = {},
    pagination: PageParams,
  ): Promise<PaginatedResult<Expense>> {
    const result = await apiFetch<{
      expenses: Expense[]
      total: number
      sumCents: number
      page: number
      pageSize: number
    }>(`/expenses${buildQuery(filters, pagination)}`)
    return {
      items: result.expenses,
      total: result.total,
      sumCents: result.sumCents,
      page: result.page,
      pageSize: result.pageSize,
    }
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

  // Mescla despesas reais (paginadas) com pagamentos de fatura (só informativo — não tem
  // categoria nem forma de pagamento própria, então some da lista se um desses dois filtros
  // estiver ativo, já que nunca poderia satisfazê-los de verdade). GET /invoices não devolve
  // o pagamento em si, só o status — por isso o detalhe de cada fatura paga é buscado à
  // parte (N+1 pequeno e limitado ao período filtrado, sem endpoint de lote disponível).
  //
  // total/sumCents/page/pageSize vêm só da paginação de expenses — pagamento de fatura
  // nunca contou no total (mesma regra de antes da paginação) e é anexado por cima da
  // página atual de despesas, então "Página X de Y" reflete só a paginação de expenses.
  // pageSize:100 abaixo é o teto do endpoint de faturas — cobre o uso real (fatura é mensal
  // por cartão), mas um histórico com mais de 100 faturas pagas não seria varrido por
  // inteiro aqui.
  async listWithInvoicePayments(
    filters: ExpenseFilters = {},
    pagination: PageParams,
  ): Promise<PaginatedResult<DespesaListEntry>> {
    const expensesResult = await despesasService.list(filters, pagination)
    const expenseEntries: DespesaListEntry[] = expensesResult.items.map((expense) => ({
      type: 'expense',
      data: expense,
    }))
    const base = {
      total: expensesResult.total,
      sumCents: expensesResult.sumCents,
      page: expensesResult.page,
      pageSize: expensesResult.pageSize,
    }

    if (filters.categoryId || filters.paymentMethod) {
      return {
        items: expenseEntries.sort((a, b) => entryDate(b).localeCompare(entryDate(a))),
        ...base,
      }
    }

    // month: 'all' é obrigatório aqui — sem isso, o padrão do backend (mês atual + não
    // paga de mês anterior) esconderia pagamentos de faturas mais antigas dessa mesclagem.
    // O filtro de mês real da mesclagem é aplicado depois, client-side, via
    // resolveInvoiceDateBounds — dá pra reaproveitar a MESMA busca pras faturas pagas
    // (payment_date) e não pagas (due_date), sem duas idas ao servidor.
    const [invoicesResult, cards] = await Promise.all([
      faturasService.list({ month: 'all' }, { page: 1, pageSize: 100 }),
      cartoesService.list('all'),
    ])
    const cardsById = new Map(cards.map((card) => [card.id, card]))
    const bounds = resolveInvoiceDateBounds(filters)
    function inBounds(dateStr: string): boolean {
      if (!bounds) return true
      if (bounds.from && dateStr < bounds.from) return false
      if (bounds.to && dateStr > bounds.to) return false
      return true
    }

    const paidInvoices = invoicesResult.items.filter((invoice) => invoice.displayStatus === 'paid')
    const paidDetails = await Promise.all(paidInvoices.map((invoice) => faturasService.getById(invoice.id)))

    const invoiceEntries: DespesaListEntry[] = []
    for (const detail of paidDetails) {
      const payment = detail.payment
      if (!payment) continue
      if (filters.accountId && payment.account_id !== filters.accountId) continue
      if (!inBounds(payment.payment_date)) continue
      const card = cardsById.get(detail.credit_card_id)
      invoiceEntries.push({
        type: 'invoice_payment',
        id: payment.id,
        date: payment.payment_date,
        amountCents: payment.amount_cents,
        description: `Fatura ${card?.name ?? 'cartão removido'}`,
      })
    }

    // Fatura não paga não tem conta associada ainda (só existe quando ela é paga) — some da
    // mesclagem se o filtro de conta estiver ativo, mesma regra de categoria/forma de
    // pagamento acima.
    const unpaidEntries: DespesaListEntry[] = []
    if (!filters.accountId) {
      const unpaidInvoices = invoicesResult.items.filter((invoice) => invoice.displayStatus !== 'paid')
      for (const invoice of unpaidInvoices) {
        if (!inBounds(invoice.due_date)) continue
        const card = cardsById.get(invoice.credit_card_id)
        unpaidEntries.push({
          type: 'unpaid_invoice',
          id: invoice.id,
          date: invoice.due_date,
          amountCents: invoice.totalCents,
          description: `Fatura ${card?.name ?? 'cartão removido'}`,
        })
      }
    }

    return {
      items: [...expenseEntries, ...invoiceEntries, ...unpaidEntries].sort((a, b) =>
        entryDate(b).localeCompare(entryDate(a)),
      ),
      ...base,
    }
  },

  // Totais do mês (geral/pago/falta pagar) — independentes da paginação da lista, sempre
  // pro mês inteiro. month undefined deixa o backend decidir (mês atual).
  async getMonthlySummary(month?: string): Promise<MonthlySummary> {
    const query = month !== undefined ? `?month=${encodeURIComponent(month)}` : ''
    return apiFetch<MonthlySummary>(`/expenses/monthly-summary${query}`)
  },

  // Anos com pelo menos uma despesa de verdade — popula o filtro "Ano" sem lista fixa
  // arbitrária.
  async getYears(): Promise<number[]> {
    const result = await apiFetch<{ years: number[] }>('/expenses/years')
    return result.years
  },
}
