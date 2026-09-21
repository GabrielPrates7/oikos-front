export type PaymentMethod = 'debit' | 'cash' | 'pix'

export interface Expense {
  id: string
  user_id: string
  account_id: string
  category_id: string
  description: string
  amount_cents: number
  payment_method: PaymentMethod
  expense_date: string
  is_essential: boolean
  is_fixed: boolean
  is_paid: boolean
  is_planned: boolean
  paid_date: string | null
  // Fase 1: só afeta o "Total exibido" desta tela (Geral/Já pago/Falta pagar) — Saldo
  // Real/extrato de conta e o resto do sistema continuam somando tudo, de propósito.
  count_in_totals: boolean
  created_at: string
}

// undefined = mês atual (default do backend); 'all' = sem filtro de mês. Ignorado pelo
// backend quando from/to explícitos estão presentes (ver expenses.controller.resolveDateRange).
// month: 'YYYY-MM' ou 'YYYY-all' (todos os meses de um ano — ver utils/period.ts).
export type ExpenseStatusFilter = 'pending' | 'paid'
export type ExpenseEssentialFilter = 'essential' | 'superfluous'
export type ExpensePlannedFilter = 'planned' | 'unplanned'

export interface ExpenseFilters {
  accountId?: string
  categoryId?: string
  paymentMethod?: PaymentMethod
  from?: string
  to?: string
  month?: string
  // undefined = todos
  status?: ExpenseStatusFilter
  essential?: ExpenseEssentialFilter
  planned?: ExpensePlannedFilter
}

export interface MonthlySummary {
  totalGeralCents: number
  totalPagoCents: number
  totalFaltaPagarCents: number
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  debit: 'Débito',
  cash: 'Dinheiro',
  pix: 'PIX',
}

// Pagamento de fatura mesclado na listagem de Despesas — só informativo (agrega várias
// compras, não tem categoria própria), nunca editável/excluível por aqui, e nunca somado
// no total (que é só despesa de verdade).
export interface InvoicePaymentEntry {
  type: 'invoice_payment'
  id: string
  date: string
  amountCents: number
  description: string
}

// Fatura não paga do mês, mesclada como linha informativa — sem categoria/conta própria
// (ainda não foi paga), nunca editável/excluível por aqui, sem botão de pagar rápido
// (link "Ver fatura" leva pra tela de Faturas), e nunca somada no total exibido.
export interface UnpaidInvoiceEntry {
  type: 'unpaid_invoice'
  id: string
  date: string
  amountCents: number
  description: string
}

export type DespesaListEntry =
  | { type: 'expense'; data: Expense }
  | InvoicePaymentEntry
  | UnpaidInvoiceEntry
