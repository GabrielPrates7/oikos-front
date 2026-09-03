import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FormError } from '../../components/feedback/FormError'
import { SuccessMessage } from '../../components/feedback/SuccessMessage'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../hooks/useAuth'
import { ApiError } from '../../services/api'
import { configuracoesService } from './configuracoes.service'
import { profileSchema, type ProfileFormData } from './configuracoes.schemas'

export function ProfileForm() {
  const { user, updateUser } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name, email: user?.email },
  })

  async function onSubmit(data: ProfileFormData) {
    setFormError(null)
    setSuccessMessage(null)
    try {
      const updated = await configuracoesService.updateProfile(data)
      updateUser(updated)
      setSuccessMessage('Perfil atualizado com sucesso.')
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Erro inesperado. Tente novamente.')
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate>
      <Input label="Nome" type="text" error={errors.name?.message} {...register('name')} />
      <Input label="E-mail" type="email" error={errors.email?.message} {...register('email')} />
      <FormError message={formError} />
      <SuccessMessage message={successMessage} />
      <Button type="submit" loading={isSubmitting}>
        Salvar alterações
      </Button>
    </form>
  )
}
