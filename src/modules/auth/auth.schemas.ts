import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('e-mail inválido'),
  password: z.string().min(8, 'senha deve ter pelo menos 8 caracteres'),
})

export const registerSchema = z
  .object({
    name: z.string().min(2, 'nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('e-mail inválido'),
    password: z.string().min(8, 'senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'as senhas não coincidem',
    path: ['confirmPassword'],
  })

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
