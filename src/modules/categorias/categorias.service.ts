import { apiFetch } from '../../services/api'
import type { CreateCategoriaFormData, UpdateCategoriaFormData } from './categorias.schemas'
import type { Category, CategoryType } from './categorias.types'

export const categoriasService = {
  async list(type?: CategoryType): Promise<Category[]> {
    const query = type ? `?type=${type}` : ''
    const result = await apiFetch<{ categories: Category[] }>(`/categories${query}`)
    return result.categories
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
