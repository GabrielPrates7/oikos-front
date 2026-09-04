import { z } from 'zod'

export const categoryTypeSchema = z.enum(['income', 'expense'])

export const createSchema = z.object({
  name: z.string().min(1, 'Informe um nome'),
  type: categoryTypeSchema,
  icon: z.string().optional(),
})

// type não é editável depois de criada — mesma regra do backend, por isso nem faz
// parte deste schema (ver categorias.schema.ts do oikos-back).
export const updateSchema = z.object({
  name: z.string().min(1, 'Informe um nome').optional(),
  icon: z.string().optional(),
})

export type CreateCategoriaFormData = z.infer<typeof createSchema>
export type UpdateCategoriaFormData = z.infer<typeof updateSchema>
