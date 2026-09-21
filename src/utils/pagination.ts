// Shape das listagens paginadas com "total exibido" (entradas, despesas, transferências,
// faturas, contas) — espelha PaginatedResult do backend (oikos-back/src/utils/pagination.ts).
export interface PaginatedResult<T> {
  items: T[]
  total: number
  sumCents: number
  // Só Entradas/Despesas: 'pending' quando a lista foi filtrada por Situação = Pendentes — aí
  // sumCents é a soma dos PENDENTES (a tela troca o rótulo pra "Total pendente"). Ausente ou
  // 'default' = a soma de sempre.
  sumMode?: 'pending' | 'default'
  page: number
  pageSize: number
}

// Shape das listagens paginadas SEM "total exibido" (categorias, orçamentos, metas) —
// espelha PaginatedList do backend. Cartões usa um shape próprio (duas somas), não este.
export interface PaginatedList<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export const DEFAULT_PAGE_SIZE = 20

export function totalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize))
}
