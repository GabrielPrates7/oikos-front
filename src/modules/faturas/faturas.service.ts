import { apiFetch } from '../../services/api'
import type { PayFormData } from './pagamento.schema'
import type { Invoice, InvoiceDetail, InvoiceListItem, InvoicePayment } from './faturas.types'

export const faturasService = {
  // totalCents já vem pronto do backend (subquery na própria listagem) — sem fetch por
  // fatura.
  async list(creditCardId?: string): Promise<InvoiceListItem[]> {
    const query = creditCardId ? `?creditCardId=${creditCardId}` : ''
    const result = await apiFetch<{ invoices: InvoiceListItem[] }>(`/invoices${query}`)
    return result.invoices
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
