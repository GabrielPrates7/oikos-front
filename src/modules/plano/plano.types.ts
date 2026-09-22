// Tipos da API do Plano do mês (snake_case, como o backend). Dinheiro em centavos inteiros; datas
// 'YYYY-MM-DD'. O front só apresenta: nenhum número financeiro é calculado aqui.

export type PlanKind = 'income' | 'expense'
export type PlanSourceType = 'income_entry' | 'expense' | 'invoice'
export type LineSituation = 'pending' | 'received' | 'paid' | 'overdue' | 'estimated'
export type HealthLevel = 'red' | 'amber' | 'green' | 'none'
export type HealthReason =
  'EMPTY_PLAN' | 'NO_COUNTED_ITEMS' | 'NEGATIVE_RESULT' | 'LOW_MARGIN' | 'NEGATIVE_MIN_BALANCE'
export type CategoryStatus = 'no_plan' | 'ok' | 'attention' | 'over' | 'unplanned'

export interface CategoryRef {
  id: string
  name: string
  icon: string | null
}

export type PlanLineSource =
  | {
      type: 'income_entry'
      entry_date: string
      is_received: boolean
      received_date: string | null
      is_planned: boolean
      current_amount_cents: number
    }
  | {
      type: 'expense'
      expense_date: string
      is_paid: boolean
      paid_date: string | null
      is_planned: boolean
      current_amount_cents: number
    }
  | {
      type: 'invoice'
      due_date: string
      reference_month: string
      status: string
      credit_card: { id: string; name: string; brand: string | null }
      paid: { payment_date: string; amount_cents: number } | null
    }

export interface PlanLine {
  id: string
  kind: PlanKind
  source_type: PlanSourceType | null
  source_id: string | null
  description: string
  category: CategoryRef | null
  planned_amount_cents: number
  amount_is_dynamic: boolean
  planned_date: string | null
  is_essential: boolean | null
  source: PlanLineSource | null
  situation: LineSituation
  realized_amount: number | null
  delta: number | null
  settled_date: string | null
  counts_in_month: boolean
  not_counted_reason: 'settled_before_month' | null
}

export interface PlanSettings {
  id: string | null
  month: string
  include_opening_balance: boolean
}

export interface TimelinePoint {
  date: string
  planned_cents: number
  realized_cents: number | null
}

export interface CategoryRow {
  category_id: string
  name: string
  icon: string | null
  planned: number
  realized: number
  variance: number
  percent_used: number | null
  status: CategoryStatus
  invoice_month_mismatch: boolean
}

export interface PlanSummary {
  month: string
  today: string
  period: 'past' | 'current' | 'future'
  settings: PlanSettings
  opening_balance: number
  today_balance: number
  planned: {
    inflow: number
    outflow: number
    result: number
    projected_end_balance: number
    min_balance: { date: string; cents: number }
    undated_count: number
  }
  realized: {
    received: number
    paid: number
    expenses_paid: number
    invoice_payments: number
    result: number
    other_outflows: number
    // Pontos-base (10000 = 100%): convertido em % só na apresentação.
    progress: { received_bps: number; paid_bps: number }
    window: { from: string; to: string } | null
  }
  health: { level: HealthLevel; reasons: HealthReason[] }
  gap_to_zero: number
  gap_to_cash_zero: number
  timeline: TimelinePoint[]
  by_category: CategoryRow[]
  alerts: {
    not_in_plan: {
      pending_income_count: number
      pending_expense_count: number
      invoices_count: number
      income_cents: number
      expense_cents: number
      invoices_cents: number
      cents: number
    }
    unplanned_categories: { category_id: string; name: string; realized: number }[]
  }
  cut_suggestions: {
    total_cents: number
    cuttable_cents: number
    top: {
      id: string
      description: string
      planned_amount_cents: number
      situation: LineSituation
      planned_date: string | null
    }[]
    covers_gap_to_zero_bps: number | null
    covers_gap_to_cash_zero_bps: number | null
  }
  pending_before_month: {
    income_cents: number
    expense_cents: number
    invoice_cents: number
    count: number
  }
  counts: { lines: number; counted: number; not_counted: number }
  items: PlanLine[]
}

export type CandidateKind = 'income' | 'expense' | 'invoice'
export type CandidateSituation = 'pending' | 'overdue' | 'received' | 'paid'

export interface Candidate {
  kind: CandidateKind
  id: string
  description: string
  amount_cents: number
  date: string
  is_planned: boolean | null
  situation: CandidateSituation
  settled_date: string | null
  category: CategoryRef | null
  credit_card: { id: string; name: string; brand: string | null } | null
}

export interface CandidatesPage {
  candidates: Candidate[]
  total: number
  page: number
  pageSize: number
}

export type ImportSource = 'planned' | 'invoices' | 'fixed_previous_month'

export interface ImportCounts {
  added: number
  overdue_previous_months: number
  skipped_already_in_plan: number
  skipped_settled: number
}

export interface ImportResult {
  dry_run: boolean
  month: string
  sources: {
    planned?: {
      added: number
      overdue_previous_months: number
      income: ImportCounts
      expense: ImportCounts
    }
    invoices?: { added: number; skipped_already_in_plan: number; paid_included: number }
    fixed_previous_month?: { added: number; found: number; skipped_duplicates: number }
  }
  total_added: number
}

export interface LinkResult {
  added: PlanLine[]
  ignored: { type: PlanSourceType; id: string; reason: string }[]
}
