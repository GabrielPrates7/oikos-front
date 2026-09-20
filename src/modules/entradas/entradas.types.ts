export type ReceiptMethod = 'pix' | 'transfer' | 'cash' | 'other'

export interface IncomeEntry {
  id: string
  user_id: string
  account_id: string
  category_id: string
  description: string
  amount_cents: number
  entry_date: string
  receipt_method: ReceiptMethod
  is_received: boolean
  is_planned: boolean
  received_date: string | null
  // Fase 1: só afeta o "Total exibido" desta tela (sumCents) — Saldo Real/extrato de conta
  // e o resto do sistema continuam somando tudo, de propósito.
  count_in_totals: boolean
  created_at: string
}

// undefined = mês atual (default do backend); 'all' = sem filtro de mês. Ignorado pelo
// backend quando from/to explícitos estão presentes (mesma regra de expenses.types).
export interface IncomeEntryFilters {
  accountId?: string
  categoryId?: string
  from?: string
  to?: string
  month?: string
}

export const RECEIPT_METHOD_LABELS: Record<ReceiptMethod, string> = {
  pix: 'PIX',
  transfer: 'Transferência',
  cash: 'Dinheiro',
  other: 'Outro',
}
