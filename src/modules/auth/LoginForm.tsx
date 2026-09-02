import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { FormError } from '../../components/feedback/FormError'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../hooks/useAuth'
import { loginSchema, type LoginFormData } from './auth.schemas'

export function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginFormData) {
    setFormError(null)
    try {
      await login(data.email, data.password)
      navigate('/dashboard')
    } catch (error) {
      // AuthContext já traduz o erro da API pra uma mensagem legível (error.message) —
      // exibimos exatamente ela, sem inventar texto diferente.
      setFormError(error instanceof Error ? error.message : 'Erro inesperado. Tente novamente.')
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate>
      <Input label="E-mail" type="email" error={errors.email?.message} {...register('email')} />
      <Input
        label="Senha"
        type="password"
        error={errors.password?.message}
        {...register('password')}
      />
      <FormError message={formError} />
      <Button type="submit" loading={isSubmitting}>
        Entrar
      </Button>
    </form>
  )
}
