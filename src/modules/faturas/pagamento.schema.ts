import { z } from 'zod'

export const paySchema = z.object({
  accountId: z.string().uuid('Selecione uma conta'),
  paymentDate: z.string().min(1, 'Informe uma data'),
})

export type PayFormData = z.infer<typeof paySchema>
