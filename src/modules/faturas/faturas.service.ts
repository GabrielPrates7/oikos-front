import { apiFetch } from '../../services/api'
import type { PaginatedResult } from '../../utils/pagination'
import type { PayFormData } from './pagamento.schema'
import type { Invoice, InvoiceDetail, InvoiceListItem, InvoicePayment } from './faturas.types'

export interface PageParams {
  page: number
  pageSize: number
}

export const faturasService = {
  // totalCents já vem pronto do backend (subquery na própria listagem) — sem fetch por
  // fatura. search é resolvido no servidor (compara descrição de compra via ILIKE) porque
  // essa informação não existe na listagem carregada no cliente.
  async list(
    creditCardId?: string,
    search?: string,
    pagination: PageParams = { page: 1, pageSize: 20 },
  ): Promise<PaginatedResult<InvoiceListItem>> {
    const params = new URLSearchParams()
    if (creditCardId) params.set('creditCardId', creditCardId)
    if (search) params.set('search', search)
    params.set('page', String(pagination.page))
    params.set('pageSize', String(pagination.pageSize))
    const result = await apiFetch<{
      invoices: InvoiceListItem[]
      total: number
      sumCents: number
      page: number
      pageSize: number
    }>(`/invoices?${params.toString()}`)
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
}
