import { z } from 'zod'

export const createSchema = z
  .object({
    fromAccountId: z.string().uuid('Selecione a conta de origem'),
    toAccountId: z.string().uuid('Selecione a conta de destino'),
    amountCents: z.number().int().positive('Informe um valor'),
    transferDate: z.string().min(1, 'Informe uma data'),
    description: z.string().optional(),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: 'conta de origem e destino não podem ser a mesma',
    path: ['toAccountId'],
  })

export type CreateTransferenciaFormData = z.infer<typeof createSchema>
