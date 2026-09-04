import { z } from 'zod'

export const createSchema = z.object({
  accountId: z.string().uuid('Selecione uma conta'),
  categoryId: z.string().uuid('Selecione uma categoria'),
  description: z.string().min(1, 'Informe uma descrição'),
  amountCents: z.number().int().positive('Informe um valor'),
  entryDate: z.string().min(1, 'Informe uma data'),
})

export const updateSchema = createSchema.partial()

export type CreateEntradaFormData = z.infer<typeof createSchema>
export type UpdateEntradaFormData = z.infer<typeof updateSchema>
