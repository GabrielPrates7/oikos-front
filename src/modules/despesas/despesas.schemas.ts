import { z } from 'zod'

export const paymentMethodSchema = z.enum(['debit', 'cash', 'pix'])

const baseFields = {
  accountId: z.string().uuid('Selecione uma conta'),
  categoryId: z.string().uuid('Selecione uma categoria'),
  description: z.string().min(1, 'Informe uma descrição'),
  amountCents: z.number().int().positive('Informe um valor'),
  paymentMethod: paymentMethodSchema,
  expenseDate: z.string().min(1, 'Informe uma data'),
  isEssential: z.boolean({ required_error: 'Selecione se é essencial ou supérfluo' }),
  isFixed: z.boolean({ required_error: 'Selecione se é um gasto fixo' }),
  isPaid: z.boolean({ required_error: 'Selecione se está pago ou pendente' }),
  isPlanned: z.boolean({ required_error: 'Selecione se é planejado' }),
  paidDate: z.string().optional(),
}

// Só valida "tem data quando pago" — o inverso ("sem data quando pendente") é resolvido na
// tradução pro payload da API (despesas.service.toApiPayload manda paid_date: null nesse
// caso), não aqui: o campo de data nem aparece na tela quando isPaid é false, então o que
// sobra no estado do form é irrelevante.
function paidDateRequiredWhenPaid(data: { isPaid?: boolean; paidDate?: string }): boolean {
  if (!data.isPaid) return true
  return !!data.paidDate
}

const paidDateRefinement = { message: 'Informe a data de pagamento', path: ['paidDate'] }

export const createSchema = z.object(baseFields).refine(paidDateRequiredWhenPaid, paidDateRefinement)

export const updateSchema = z
  .object(baseFields)
  .partial()
  .refine(paidDateRequiredWhenPaid, paidDateRefinement)

export type CreateDespesaFormData = z.infer<typeof createSchema>
export type UpdateDespesaFormData = z.infer<typeof updateSchema>
