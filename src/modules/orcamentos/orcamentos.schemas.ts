import { z } from 'zod'

export const createBudgetSchema = z.object({
  categoryId: z.string().uuid('Selecione uma categoria'),
  limitAmountCents: z.number().int().positive('Informe um valor'),
})

export type CreateOrcamentoFormData = z.infer<typeof createBudgetSchema>
