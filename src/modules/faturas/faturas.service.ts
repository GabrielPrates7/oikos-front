import { apiFetch } from '../../services/api'
import type { PaginatedResult } from '../../utils/pagination'
import type { PayFormData } from './pagamento.schema'
import type { Invoice, InvoiceDetail, InvoiceListItem, InvoicePayment } from './faturas.types'

export interface PageParams {
  page: number
  pageSize: number
}

export type InvoiceSort = 'value_asc' | 'value_desc'

export interface InvoiceListParams {
  creditCardId?: string
  search?: string
  // undefined = padrão do backend (mês atual + não paga de mês anterior); 'all' = sem
  // filtro; 'YYYY-MM' = mês exato. Ver invoices.repository.buildWhere no backend.
  month?: string
  // 'YYYY' do mês de referência; from/to = período de VENCIMENTO (quando presentes,
  // ganham de month/year no backend).
  year?: string
  // 'unpaid' | 'paid' — filtro de status, independente de mês/ano.
  status?: 'unpaid' | 'paid'
  from?: string
  to?: string
  sort?: InvoiceSort
}

export const faturasService = {
  // totalCents já vem pronto do backend (subquery na própria listagem) — sem fetch por
  // fatura. search é resolvido no servidor (compara descrição de compra via ILIKE) porque
  // essa informação não existe na listagem carregada no cliente. month e sort também são
  // resolvidos no servidor, ANTES do LIMIT/OFFSET — não tem mais filtro/ordenação client-side.
  async list(
    params: InvoiceListParams = {},
    pagination: PageParams = { page: 1, pageSize: 20 },
  ): Promise<PaginatedResult<InvoiceListItem>> {
    const searchParams = new URLSearchParams()
    if (params.creditCardId) searchParams.set('creditCardId', params.creditCardId)
    if (params.search) searchParams.set('search', params.search)
    if (params.month !== undefined) searchParams.set('month', params.month)
    if (params.year) searchParams.set('year', params.year)
    if (params.status) searchParams.set('status', params.status)
    if (params.from) searchParams.set('from', params.from)
    if (params.to) searchParams.set('to', params.to)
    if (params.sort) searchParams.set('sort', params.sort)
    searchParams.set('page', String(pagination.page))
    searchParams.set('pageSize', String(pagination.pageSize))
    const result = await apiFetch<{
      invoices: InvoiceListItem[]
      total: number
      sumCents: number
      page: number
      pageSize: number
    }>(`/invoices?${searchParams.toString()}`)
    return {
      items: result.invoices,
      total: result.total,
      sumCents: result.sumCents,
      page: result.page,
      pageSize: result.pageSize,
    }
  },

  async getById(id: string): Promise<InvoiceDetail> {
    const result = await apiFetch<{ invoice: InvoiceDetail }>(`/invoices/${id}`)
    return result.invoice
  },

  async pay(id: string, data: PayFormData): Promise<{ payment: InvoicePayment; invoice: Invoice }> {
    return apiFetch<{ payment: InvoicePayment; invoice: Invoice }>(`/invoices/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify({ accountId: data.accountId, paymentDate: data.paymentDate }),
    })
  },

  // Soft-cancel no backend: devolve o valor pra conta de origem e a fatura volta a "Aberta"
  // ou "Atrasada" (o registro do pagamento não é apagado, só marcado como cancelado).
  async cancelPayment(id: string): Promise<{ payment: InvoicePayment; invoice: Invoice }> {
    return apiFetch<{ payment: InvoicePayment; invoice: Invoice }>(
      `/invoices/${id}/cancel-payment`,
      { method: 'POST' },
    )
  },
}
