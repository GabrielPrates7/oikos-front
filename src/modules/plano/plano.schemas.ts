import { z } from 'zod'
import { monthRange } from '../../utils/date'

// O que o formulário está editando: linha manual nova, linha manual, linha vinculada a um
// lançamento (só valor e data) ou linha de fatura (só a data).
export type LineFormMode = 'manual-create' | 'manual-edit' | 'linked-edit' | 'invoice-edit'

const INT4_MAX = 2_147_483_647

// Validação só de formato/obrigatoriedade (o backend valida de novo e é quem manda). Nenhuma regra
// financeira aqui.
export function createLineSchema(month: string, mode: LineFormMode) {
  const { monthStart, monthEnd } = monthRange(month)
  return z
    .object({
      kind: z.enum(['income', 'expense']).optional(),
      description: z.string(),
      amountCents: z.number().int(),
      categoryId: z.string(),
      plannedDate: z.string(),
      isEssential: z.boolean().optional(),
    })
    .superRefine((data, ctx) => {
      const manual = mode === 'manual-create' || mode === 'manual-edit'
      if (mode === 'manual-create' && !data.kind) {
        ctx.addIssue({ code: 'custom', path: ['kind'], message: 'Selecione entrada ou saída' })
      }
      if (manual) {
        const description = data.description.trim()
        if (description.length === 0) {
          ctx.addIssue({ code: 'custom', path: ['description'], message: 'Informe uma descrição' })
        } else if (description.length > 200) {
          ctx.addIssue({
            code: 'custom',
            path: ['description'],
            message: 'A descrição deve ter no máximo 200 caracteres',
          })
        }
        if (data.kind === 'expense' && data.isEssential === undefined) {
          ctx.addIssue({
            code: 'custom',
            path: ['isEssential'],
            message: 'Selecione essencial ou supérfluo',
          })
        }
      }
      if (mode !== 'invoice-edit') {
        if (!Number.isInteger(data.amountCents) || data.amountCents <= 0) {
          ctx.addIssue({ code: 'custom', path: ['amountCents'], message: 'Informe um valor' })
        } else if (data.amountCents > INT4_MAX) {
          ctx.addIssue({ code: 'custom', path: ['amountCents'], message: 'Valor acima do limite' })
        }
      }
      if (data.plannedDate && (data.plannedDate < monthStart || data.plannedDate > monthEnd)) {
        ctx.addIssue({
          code: 'custom',
          path: ['plannedDate'],
          message: 'A data deve estar dentro do mês do plano',
        })
      }
    })
}

export type LineFormValues = z.infer<ReturnType<typeof createLineSchema>>
