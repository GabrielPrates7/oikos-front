import { z } from 'zod'

export const paymentMethodSchema = z.enum(['debit', 'cash', 'pix'])

export const createSchema = z.object({
  accountId: z.string().uuid('Selecione uma conta'),
  categoryId: z.string().uuid('Selecione uma categoria'),
  description: z.string().min(1, 'Informe uma descrição'),
  amountCents: z.number().int().positive('Informe um valor'),
  paymentMethod: paymentMethodSchema,
  expenseDate: z.string().min(1, 'Informe uma data'),
})

export const updateSchema = createSchema.partial()

export type CreateDespesaFormData = z.infer<typeof createSchema>
export type UpdateDespesaFormData = z.infer<typeof updateSchema>
