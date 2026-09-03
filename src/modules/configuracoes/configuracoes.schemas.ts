import { z } from 'zod'

export const profileSchema = z
  .object({
    name: z.string().min(2, 'nome deve ter pelo menos 2 caracteres').optional(),
    email: z.string().email('e-mail inválido').optional(),
  })
  .refine((data) => data.name !== undefined || data.email !== undefined, {
    message: 'informe ao menos um campo',
  })

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'informe a senha atual'),
    newPassword: z.string().min(8, 'senha deve ter pelo menos 8 caracteres'),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'as senhas não coincidem',
    path: ['confirmNewPassword'],
  })

export type ProfileFormData = z.infer<typeof profileSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
