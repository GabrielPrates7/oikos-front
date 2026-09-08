// Shape comum das 4 listagens paginadas (entradas, despesas, transferências, faturas) —
// espelha PaginatedResult do backend (oikos-back/src/utils/pagination.ts).
export interface PaginatedResult<T> {
  items: T[]
  total: number
  sumCents: number
  page: number
  pageSize: number
}

export const DEFAULT_PAGE_SIZE = 20

export function totalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize))
}
