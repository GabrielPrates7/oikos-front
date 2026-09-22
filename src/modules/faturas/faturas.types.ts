export type InvoiceStatus = 'open' | 'closed' | 'paid' | 'overdue'

export interface InvoiceItem {
  installment_number: number
  installments_count: number
  amount_cents: number
  description: string
  category_name: string
  category_icon: string | null
  is_essential: boolean
}

export interface Invoice {
  id: string
  credit_card_id: string
  reference_month: string
  closing_date: string
  due_date: string
  status: InvoiceStatus
  displayStatus: InvoiceStatus
  created_at: string
  updated_at: string
}

// Só usado na listagem: totalCents não vem do GET /invoices (só do detalhe), então é
// buscado por fatura em paralelo — mesmo padrão do limite disponível em CartoesList.
export interface InvoiceListItem extends Invoice {
  totalCents: number
}

export interface InvoiceDetail extends Invoice {
  items: InvoiceItem[]
  totalCents: number
  payment: InvoicePayment | null
}

export interface InvoicePayment {
  id: string
  invoice_id: string
  account_id: string
  amount_cents: number
  payment_date: string
  created_at: string
  // null = pagamento ativo. Preenchido só na resposta de cancelPayment (soft-cancel: o
  // registro nunca é apagado).
  canceled_at: string | null
}
