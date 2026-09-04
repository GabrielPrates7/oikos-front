import { z } from 'zod'

const dayOfMonthSchema = z
  .number({ message: 'Informe um dia entre 1 e 31' })
  .int('Informe um dia entre 1 e 31')
  .min(1, 'Informe um dia entre 1 e 31')
  .max(31, 'Informe um dia entre 1 e 31')

export const createSchema = z.object({
  name: z.string().min(1, 'Informe um nome'),
  brand: z.string().optional(),
  creditLimitCents: z.number().int().positive('Informe um limite'),
  closingDay: dayOfMonthSchema,
  dueDay: dayOfMonthSchema,
})

export const updateSchema = createSchema.partial()

export type CreateCartaoFormData = z.infer<typeof createSchema>
export type UpdateCartaoFormData = z.infer<typeof updateSchema>
