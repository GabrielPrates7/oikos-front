import { z } from 'zod'

export const accountTypeSchema = z.enum(['checking', 'savings', 'cash'])

export const createSchema = z.object({
  name: z.string().min(1, 'nome é obrigatório'),
  bankName: z.string().optional(),
  type: accountTypeSchema,
  initialBalanceCents: z.number().int(),
  // '' significa "sem cor customizada" (usa a cor padrão do banco) — só um hex não-vazio
  // vira override de verdade. Ver contas.service.toApiPayload pra tradução '' -> null.
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'cor deve estar no formato hex')
    .or(z.literal(''))
    .optional(),
})

export const updateSchema = createSchema.partial()

export type CreateContaFormData = z.infer<typeof createSchema>
export type UpdateContaFormData = z.infer<typeof updateSchema>
