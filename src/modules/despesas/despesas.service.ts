import { apiFetch } from '../../services/api'
import { currentMonthString, monthRange } from '../../utils/date'
import type { PaginatedResult } from '../../utils/pagination'
import { isAllMonths, periodQuery } from '../../utils/period'
import { cartoesService } from '../cartoes/cartoes.service'
import { faturasService } from '../faturas/faturas.service'
import type { CreateDespesaFormData, UpdateDespesaFormData } from './despesas.schemas'
import type { DespesaListEntry, Expense, ExpenseFilters, MonthlySummary } from './despesas.types'

export interface PageParams {
  page: number
  pageSize: number
}

function toApiPayload(
  data: Partial<CreateDespesaFormData>,
  mode: 'create' | 'update',
): Record<string, unknown> {
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
  // Observação: na CRIAÇÃO só vai no payload quando preenchida; na EDIÇÃO sempre vai (texto, ou null se
  // o usuário apagou). PUT parcial sem o campo (atalho "Marcar como recebida/paga") NÃO envia notes,
  // então o backend preserva o valor gravado. Trim e "vazio vira null" são do backend.
  if (data.notes !== undefined) {
    if (mode === 'update') payload.notes = data.notes === '' ? null : data.notes
    else if (data.notes !== '') payload.notes = data.notes
  }
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
  if (filters.status) params.set('status', filters.status)
  if (filters.essential) params.set('essential', filters.essential)
  if (filters.planned) params.set('planned', filters.planned)
  if (filters.fixed) params.set('fixed', filters.fixed)
  const period = periodQuery(filters)
  if (period.from) params.set('from', period.from)
  if (period.to) params.set('to', period.to)
  if (period.month !== undefined) params.set('month', period.month)
  params.set('page', String(pagination.page))
  params.set('pageSize', String(pagination.pageSize))
  return `?${params.toString()}`
}

// Requisição obsoleta (AbortController) — mesmo tipo de erro que o fetch lança ao abortar.
function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
}

function entryDate(entry: DespesaListEntry): string {
  return entry.type === 'expense' ? entry.data.expense_date : entry.date
}

// Limites de data efetivos da mesclagem de fatura (pagamento/em aberto): from/to explícitos
// sempre ganham (mesma regra do backend, ver expenses.controller.resolveDateRange); sem
// eles, usa o mês do filtro (ou mês atual, se nenhum foi escolhido ainda). null = sem limite
// nenhum ('all').
function resolveInvoiceDateBounds(filters: ExpenseFilters): { from?: string; to?: string } | null {
  // periodQuery já resolve De/Até explícitos e o "Todos os meses" de um ano (vira 1º/1 a 31/12).
  const period = periodQuery(filters)
  if (period.from || period.to) {
    return { from: period.from, to: period.to }
  }
  const month = period.month ?? currentMonthString()
  if (month === 'all') return null
  const { monthStart, monthEnd } = monthRange(month)
  return { from: monthStart, to: monthEnd }
}

export const despesasService = {
  async list(
    filters: ExpenseFilters = {},
    pagination: PageParams,
    signal?: AbortSignal,
  ): Promise<PaginatedResult<Expense>> {
    const result = await apiFetch<{
      expenses: Expense[]
      total: number
      sumCents: number
      sumMode?: 'pending' | 'default'
      page: number
      pageSize: number
    }>(`/expenses${buildQuery(filters, pagination)}`, { signal })
    return {
      items: result.expenses,
      total: result.total,
      sumCents: result.sumCents,
      sumMode: result.sumMode,
      page: result.page,
      pageSize: result.pageSize,
    }
  },

  async create(data: CreateDespesaFormData): Promise<Expense> {
    const result = await apiFetch<{ expense: Expense }>('/expenses', {
      method: 'POST',
      body: JSON.stringify(toApiPayload(data, 'create')),
    })
    return result.expense
  },

  async update(id: string, data: UpdateDespesaFormData): Promise<Expense> {
    const result = await apiFetch<{ expense: Expense }>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toApiPayload(data, 'update')),
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
  //
  // Filtros novos e as linhas especiais (pagamento de fatura / fatura em aberto):
  //  - Tipo (essencial/supérfluo), Planejamento ou Recorrência ativos: as duas somem (fatura não tem esses
  //    atributos, nunca poderia satisfazê-los) — mesma regra de categoria/forma de pagamento;
  //  - Situação = Pendentes: só as faturas em aberto (a fatura paga não é pendente);
  //  - Situação = Pagas: só os pagamentos de fatura;
  //  - Todas: como antes.
  async listWithInvoicePayments(
    filters: ExpenseFilters = {},
    pagination: PageParams,
    signal?: AbortSignal,
  ): Promise<PaginatedResult<DespesaListEntry>> {
    const expensesResult = await despesasService.list(filters, pagination, signal)
    const expenseEntries: DespesaListEntry[] = expensesResult.items.map((expense) => ({
      type: 'expense',
      data: expense,
    }))
    const base = {
      total: expensesResult.total,
      sumCents: expensesResult.sumCents,
      sumMode: expensesResult.sumMode,
      page: expensesResult.page,
      pageSize: expensesResult.pageSize,
    }

    const includePaymentLines = filters.status !== 'pending'
    const includeUnpaidLines = filters.status !== 'paid' && !filters.accountId
    if (
      filters.categoryId ||
      filters.paymentMethod ||
      filters.essential ||
      filters.planned ||
      filters.fixed ||
      (!includePaymentLines && !includeUnpaidLines)
    ) {
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

    throwIfAborted(signal)
    const paidInvoices = includePaymentLines
      ? invoicesResult.items.filter((invoice) => invoice.displayStatus === 'paid')
      : []
    const paidDetails = await Promise.all(paidInvoices.map((invoice) => faturasService.getById(invoice.id)))
    throwIfAborted(signal)

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
    if (includeUnpaidLines) {
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
  // O endpoint só entende 'YYYY-MM' ou 'all': "Todos os meses" de um ano ('YYYY-all') consulta
  // 'all' (todos os períodos) — ver a decisão registrada no resumo do Bloco B.
  async getMonthlySummary(month?: string, signal?: AbortSignal): Promise<MonthlySummary> {
    const effective = month !== undefined && isAllMonths(month) ? 'all' : month
    const query = effective !== undefined ? `?month=${encodeURIComponent(effective)}` : ''
    return apiFetch<MonthlySummary>(`/expenses/monthly-summary${query}`, { signal })
  },

  // Anos com pelo menos uma despesa de verdade — popula o filtro "Ano" sem lista fixa
  // arbitrária.
  async getYears(): Promise<number[]> {
    const result = await apiFetch<{ years: number[] }>('/expenses/years')
    return result.years
  },
}
