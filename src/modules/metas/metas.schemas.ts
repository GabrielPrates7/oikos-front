import { z } from 'zod'

export const createGoalSchema = z.object({
  name: z.string().min(1, 'Informe um nome'),
  targetAmountCents: z.number().int().positive('Informe um valor'),
  targetDate: z.string().min(1, 'Informe uma data'),
})

export type CreateMetaFormData = z.infer<typeof createGoalSchema>

export const createContributionSchema = z.object({
  accountId: z.string().uuid('Selecione uma conta'),
  amountCents: z.number().int().positive('Informe um valor'),
  contributionDate: z.string().min(1, 'Informe uma data'),
})

export type CreateAporteFormData = z.infer<typeof createContributionSchema>
