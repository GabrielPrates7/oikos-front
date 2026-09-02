import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { FormError } from '../../components/feedback/FormError'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../hooks/useAuth'
import { registerSchema, type RegisterFormData } from './auth.schemas'

export function RegisterForm() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) })

  async function onSubmit(data: RegisterFormData) {
    setFormError(null)
    try {
      // O backend já autentica no próprio registro (retorna user + accessToken), então
      // não precisa de um segundo passo de login aqui.
      await registerUser(data.name, data.email, data.password)
      navigate('/dashboard')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Erro inesperado. Tente novamente.')
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate>
      <Input label="Nome" type="text" error={errors.name?.message} {...register('name')} />
      <Input label="E-mail" type="email" error={errors.email?.message} {...register('email')} />
      <Input
        label="Senha"
        type="password"
        error={errors.password?.message}
        {...register('password')}
      />
      <Input
        label="Confirmar senha"
        type="password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <FormError message={formError} />
      <Button type="submit" loading={isSubmitting}>
        Criar conta
      </Button>
    </form>
  )
}
