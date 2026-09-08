import { z } from 'zod'

export const paymentMethodSchema = z.enum(['debit', 'cash', 'pix'])

// 'credit_card' não é um payment_method de verdade (não existe em expenses.payment_method
// no banco) — é só o gatilho, dentro deste formulário único de lançamento, pra trocar de
// "criar despesa direta" pra "criar compra parcelada" (POST /purchases em vez de
// POST /expenses). Ver DespesasPage.handleCreate.
export const launchPaymentMethodSchema = z.enum(['debit', 'cash', 'pix', 'credit_card'])

const baseFields = {
  description: z.string().min(1, 'Informe uma descrição'),
  amountCents: z.number().int().positive('Informe um valor'),
  categoryId: z.string().uuid('Selecione uma categoria'),
  expenseDate: z.string().min(1, 'Informe uma data'),
  paymentMethod: launchPaymentMethodSchema,
  isEssential: z.boolean({ required_error: 'Selecione se é essencial ou supérfluo' }),
  isFixed: z.boolean({ required_error: 'Selecione se é um gasto fixo' }),
  isPlanned: z.boolean({ required_error: 'Selecione se é planejado' }),
  // Despesa direta (paymentMethod !== 'credit_card').
  accountId: z.string().optional(),
  isPaid: z.boolean().optional(),
  paidDate: z.string().optional(),
  // Compra no cartão (paymentMethod === 'credit_card').
  creditCardId: z.string().optional(),
  installmentsCount: z.number().int().min(1).optional(),
}

// superRefine (não refine) porque os dois ramos validam campos diferentes — precisa poder
// reportar mais de um problema de uma vez, cada um no seu próprio path.
function validateLaunch(
  data: {
    paymentMethod?: string
    accountId?: string
    isPaid?: boolean
    paidDate?: string
    creditCardId?: string
    installmentsCount?: number
  },
  ctx: z.RefinementCtx,
) {
  if (data.paymentMethod === 'credit_card') {
    if (!data.creditCardId) {
      ctx.addIssue({ code: 'custom', path: ['creditCardId'], message: 'Selecione um cartão' })
    }
    if (!data.installmentsCount) {
      ctx.addIssue({
        code: 'custom',
        path: ['installmentsCount'],
        message: 'Informe o número de parcelas',
      })
    }
    return
  }

  // paymentMethod ausente (update parcial) — nenhum dos dois ramos se aplica.
  if (data.paymentMethod === undefined) return

  if (!data.accountId) {
    ctx.addIssue({ code: 'custom', path: ['accountId'], message: 'Selecione uma conta' })
  }
  if (data.isPaid === undefined) {
    ctx.addIssue({
      code: 'custom',
      path: ['isPaid'],
      message: 'Selecione se está pago ou pendente',
    })
  }
  if (data.isPaid && !data.paidDate) {
    ctx.addIssue({ code: 'custom', path: ['paidDate'], message: 'Informe a data de pagamento' })
  }
}

export const createSchema = z.object(baseFields).superRefine(validateLaunch)

export const updateSchema = z.object(baseFields).partial().superRefine(validateLaunch)

export type CreateDespesaFormData = z.infer<typeof createSchema>
export type UpdateDespesaFormData = z.infer<typeof updateSchema>
