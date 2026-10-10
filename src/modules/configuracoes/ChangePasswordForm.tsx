import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { FormError } from '../../components/feedback/FormError'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../hooks/useAuth'
import { ApiError } from '../../services/api'
import { configuracoesService } from './configuracoes.service'
import { changePasswordSchema, type ChangePasswordFormData } from './configuracoes.schemas'
import './ChangePasswordForm.css'

export function ChangePasswordForm() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({ resolver: zodResolver(changePasswordSchema) })

  async function onSubmit(data: ChangePasswordFormData) {
    setFormError(null)
    try {
      await configuracoesService.changePassword(data)
      // O backend já invalidou a sessão atual (token_version incrementado) e limpou o cookie
      // de refresh — aqui só limpamos o estado local e mandamos pro /login, sem tentar manter
      // o usuário "autenticado" com o token antigo por mais nem uma tela.
      await logout()
      navigate('/login', { replace: true })
    } catch (error) {
      // error.message já é o texto exato da API (ex: "senha atual incorreta").
      setFormError(error instanceof ApiError ? error.message : 'Erro inesperado. Tente novamente.')
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate>
      <Input
        label="Senha atual"
        type="password"
        error={errors.currentPassword?.message}
        {...register('currentPassword')}
      />
      <Input
        label="Nova senha"
        type="password"
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
      <Input
        label="Confirmar nova senha"
        type="password"
        error={errors.confirmNewPassword?.message}
        {...register('confirmNewPassword')}
      />
      <p className="change-password-form__warning">
        Ao trocar a senha, você será desconectado de todos os dispositivos e precisará entrar
        de novo.
      </p>
      <FormError message={formError} />
      <Button type="submit" loading={isSubmitting}>
        Alterar senha
      </Button>
    </form>
  )
}
