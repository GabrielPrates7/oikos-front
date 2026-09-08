import { apiFetch } from '../../services/api'
import type { PaginatedList } from '../../utils/pagination'
import type { CreateCategoriaFormData, UpdateCategoriaFormData } from './categorias.schemas'
import type { Category, CategoryType } from './categorias.types'

export interface PageParams {
  page: number
  pageSize: number
}

export const categoriasService = {
  // Lista completa (teto pragmático de 100 — categoria não costuma passar disso) — usada
  // pelos formulários/filtros que precisam de TODAS as categorias pra popular um <select>,
  // não só a tela de Categorias em si (que usa listPaginated).
  async list(type?: CategoryType): Promise<Category[]> {
    const params = new URLSearchParams()
    if (type) params.set('type', type)
    params.set('pageSize', '100')
    const result = await apiFetch<{ categories: Category[] }>(`/categories?${params.toString()}`)
    return result.categories
  },

  async listPaginated(type: CategoryType, pagination: PageParams): Promise<PaginatedList<Category>> {
    const params = new URLSearchParams()
    params.set('type', type)
    params.set('page', String(pagination.page))
    params.set('pageSize', String(pagination.pageSize))
    const result = await apiFetch<{
      categories: Category[]
      total: number
      page: number
      pageSize: number
    }>(`/categories?${params.toString()}`)
    return {
      items: result.categories,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    }
  },

  async create(data: CreateCategoriaFormData): Promise<Category> {
    const result = await apiFetch<{ category: Category }>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return result.category
  },

  // type nunca é enviado aqui, mesmo que esteja em data — categoria própria não pode
  // trocar de tipo depois de criada.
  async update(id: string, data: UpdateCategoriaFormData): Promise<Category> {
    const payload: Record<string, unknown> = {}
    if (data.name !== undefined) payload.name = data.name
    if (data.icon !== undefined) payload.icon = data.icon
    const result = await apiFetch<{ category: Category }>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    return result.category
  },

  async remove(id: string): Promise<void> {
    await apiFetch(`/categories/${id}`, { method: 'DELETE' })
  },
}
