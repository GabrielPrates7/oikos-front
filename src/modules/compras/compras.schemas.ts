import { z } from 'zod'

// creditCardId não faz parte do schema: vem fixo do contexto da rota (/cartoes/:id),
// só é adicionado ao payload na hora de chamar a API (ver cartoes.service.createPurchase).
export const createSchema = z.object({
  categoryId: z.string().uuid('Selecione uma categoria'),
  description: z.string().min(1, 'Informe uma descrição'),
  totalAmountCents: z.number().int().positive('Informe um valor'),
  installmentsCount: z.number().int().min(1, 'Mínimo 1 parcela'),
  purchaseDate: z.string().min(1, 'Informe uma data'),
  isEssential: z.boolean({ required_error: 'Selecione se é essencial ou supérfluo' }),
  isFixed: z.boolean({ required_error: 'Selecione se é um gasto fixo' }),
})

export type CreateCompraFormData = z.infer<typeof createSchema>
