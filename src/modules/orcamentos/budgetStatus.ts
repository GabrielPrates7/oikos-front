export type BudgetStatus = 'ok' | 'warning' | 'over'

export const BUDGET_STATUS_LABELS: Record<BudgetStatus, string> = {
  ok: 'No limite',
  warning: 'Atenção',
  over: 'Excedido',
}

// Três níveis: até 70% (verde, "No limite"), 70-100% (âmbar, "Atenção" — aviso antecipado
// antes de estourar de verdade), acima de 100% (terracota, "Excedido" — já estourou).
// Compartilhado entre Orçamentos e Relatórios > Por categoria (planejado x realizado).
export function getBudgetStatus(percentageUsed: number): BudgetStatus {
  if (percentageUsed > 100) return 'over'
  if (percentageUsed >= 70) return 'warning'
  return 'ok'
}
