import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { FormError } from '../../components/feedback/FormError'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../hooks/useAuth'
import { loginSchema, type LoginFormData } from './auth.schemas'

interface LoginLocationState {
  message?: string
}

export function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)
  const locationMessage = (location.state as LoginLocationState | null)?.message ?? null

  // O redirecionamento por sessão inválida (ver AuthContext.tsx) pode chegar numa atualização de
  // location já com o componente montado (ex.: o próprio ProtectedRoute também redireciona pra
  // /login, sem state, assim que o usuário vira null — então às vezes essa mensagem só chega
  // numa location.key diferente da que existia na montagem). Por isso capturamos durante o
  // render, comparando com a última location.key já processada, em vez de só uma vez no mount.
  const [lastMessageKey, setLastMessageKey] = useState<string | undefined>(undefined)
  if (locationMessage && lastMessageKey !== location.key) {
    setLastMessageKey(location.key)
    setFormError(locationMessage)
  }

  useEffect(() => {
    if (locationMessage) {
      // Limpa o state da rota assim que a mensagem foi capturada pro state do formulário — sem
      // isso, voltar pra /login pelo botão "voltar" do navegador reexibiria a mesma mensagem
      // residual (o history entry ainda teria o state antigo).
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [locationMessage, location.pathname, navigate])

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
