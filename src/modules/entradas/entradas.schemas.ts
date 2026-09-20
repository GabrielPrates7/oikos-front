import { z } from 'zod'

export const receiptMethodSchema = z.enum(['pix', 'transfer', 'cash', 'other'])

const baseFields = {
  accountId: z.string().uuid('Selecione uma conta'),
  categoryId: z.string().uuid('Selecione uma categoria'),
  description: z.string().min(1, 'Informe uma descrição'),
  amountCents: z.number().int().positive('Informe um valor'),
  entryDate: z.string().min(1, 'Informe uma data'),
  receiptMethod: receiptMethodSchema,
  isReceived: z.boolean({ required_error: 'Selecione se foi recebida ou está pendente' }),
  isPlanned: z.boolean({ required_error: 'Selecione se é planejada' }),
  receivedDate: z.string().optional(),
  // Fase 1 do campo "contar no total" — default true no formulário (useForm), não aqui:
  // zod .default() em campo dentro de .partial() (update) resolveria pra true mesmo quando
  // omitido de propósito, que não é o comportamento certo pra uma edição parcial.
  countInTotals: z.boolean(),
}

// Mesma lógica de despesas.schemas (paidDateRequiredWhenPaid) — o inverso (sem data quando
// pendente) é resolvido na tradução pro payload da API, não aqui.
function receivedDateRequiredWhenReceived(data: {
  isReceived?: boolean
  receivedDate?: string
}): boolean {
  if (!data.isReceived) return true
  return !!data.receivedDate
}

const receivedDateRefinement = { message: 'Informe a data de recebimento', path: ['receivedDate'] }

export const createSchema = z
  .object(baseFields)
  .refine(receivedDateRequiredWhenReceived, receivedDateRefinement)

export const updateSchema = z
  .object(baseFields)
  .partial()
  .refine(receivedDateRequiredWhenReceived, receivedDateRefinement)

export type CreateEntradaFormData = z.infer<typeof createSchema>
export type UpdateEntradaFormData = z.infer<typeof updateSchema>
