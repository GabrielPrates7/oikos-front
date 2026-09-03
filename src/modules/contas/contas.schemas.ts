import { z } from 'zod'

export const accountTypeSchema = z.enum(['checking', 'savings', 'cash'])

export const createSchema = z.object({
  name: z.string().min(1, 'nome é obrigatório'),
  bankName: z.string().optional(),
  type: accountTypeSchema,
  initialBalanceCents: z.number().int(),
})

export const updateSchema = createSchema.partial()

export type CreateContaFormData = z.infer<typeof createSchema>
export type UpdateContaFormData = z.infer<typeof updateSchema>
