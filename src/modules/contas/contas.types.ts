export type AccountType = 'checking' | 'savings' | 'cash'
export type AccountStatus = 'active' | 'archived'
export type AccountStatusFilter = 'active' | 'archived' | 'all'

// Espelha o retorno cru do backend: a maioria dos campos vem em snake_case (linha do
// banco), só balanceCents é adicionado pelo service do backend em camelCase.
export interface Account {
  id: string
  user_id: string
  name: string
  bank_name: string | null
  type: AccountType
  initial_balance_cents: number
  color: string | null
  status: AccountStatus
  created_at: string
  updated_at: string
  balanceCents: number
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: 'Conta corrente',
  savings: 'Poupança',
  cash: 'Dinheiro',
}

export type StatementEntryType =
  | 'income'
  | 'expense'
  | 'transfer_out'
  | 'transfer_in'
  | 'invoice_payment'

export interface StatementEntry {
  id: string
  type: StatementEntryType
  description: string
  amountCents: number
  date: string
  runningBalanceCents: number
}

export interface AccountStatement {
  openingBalanceCents: number
  closingBalanceCents: number
  entries: StatementEntry[]
}
