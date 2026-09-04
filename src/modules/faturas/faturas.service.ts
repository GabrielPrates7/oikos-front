import { apiFetch } from '../../services/api'
import type { PayFormData } from './pagamento.schema'
import type { Invoice, InvoiceDetail, InvoiceListItem, InvoicePayment } from './faturas.types'

async function withTotal(invoice: Invoice): Promise<InvoiceListItem> {
  const result = await apiFetch<{ invoice: InvoiceDetail }>(`/invoices/${invoice.id}`)
  return { ...invoice, totalCents: result.invoice.totalCents }
}

export const faturasService = {
  async list(creditCardId?: string): Promise<InvoiceListItem[]> {
    const query = creditCardId ? `?creditCardId=${creditCardId}` : ''
    const result = await apiFetch<{ invoices: Invoice[] }>(`/invoices${query}`)
    return Promise.all(result.invoices.map(withTotal))
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
