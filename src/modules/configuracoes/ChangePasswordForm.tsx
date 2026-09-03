import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FormError } from '../../components/feedback/FormError'
import { SuccessMessage } from '../../components/feedback/SuccessMessage'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { ApiError } from '../../services/api'
import { configuracoesService } from './configuracoes.service'
import { changePasswordSchema, type ChangePasswordFormData } from './configuracoes.schemas'

export function ChangePasswordForm() {
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({ resolver: zodResolver(changePasswordSchema) })

  async function onSubmit(data: ChangePasswordFormData) {
    setFormError(null)
    setSuccessMessage(null)
    try {
      await configuracoesService.changePassword(data)
      setSuccessMessage('Senha alterada com sucesso.')
      reset()
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
      <FormError message={formError} />
      <SuccessMessage message={successMessage} />
      <Button type="submit" loading={isSubmitting}>
        Alterar senha
      </Button>
    </form>
  )
}
