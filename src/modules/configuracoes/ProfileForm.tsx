import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FormError } from '../../components/feedback/FormError'
import { SuccessMessage } from '../../components/feedback/SuccessMessage'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { UserAvatar } from '../../components/ui/UserAvatar'
import { useAuth } from '../../hooks/useAuth'
import { ApiError } from '../../services/api'
import { configuracoesService } from './configuracoes.service'
import { profileSchema, type ProfileFormData } from './configuracoes.schemas'
import './ProfileForm.css'

// Dispara o download do CSV a partir do Blob já recebido (sem navegar/abrir aba nova) — mesma
// técnica de sempre: URL de objeto + <a download> temporário, revogada logo depois.
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function ProfileForm() {
  const { user, updateUser } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name, email: user?.email },
  })

  // Só pede a senha atual quando o valor do e-mail no formulário difere do e-mail já salvo —
  // trocar só o nome (ou reenviar o mesmo e-mail) não pede nada. O backend também exige isso
  // (é quem decide de verdade); aqui é só pra mostrar o campo na hora certa.
  const watchedEmail = watch('email')
  const emailChanged = watchedEmail !== undefined && watchedEmail !== user?.email

  async function onSubmit(data: ProfileFormData) {
    setFormError(null)
    setSuccessMessage(null)
    try {
      const updated = await configuracoesService.updateProfile(data)
      updateUser(updated)
      setSuccessMessage('Perfil atualizado com sucesso.')
      reset({ name: updated.name, email: updated.email, currentPassword: '' })
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Erro inesperado. Tente novamente.')
    }
  }

  function handleCancel() {
    setFormError(null)
    setSuccessMessage(null)
    reset({ name: user?.name, email: user?.email, currentPassword: '' })
  }

  async function handleExport() {
    setExportError(null)
    setExporting(true)
    try {
      const blob = await configuracoesService.exportData()
      downloadBlob(blob, 'oikos-meus-dados.csv')
    } catch (error) {
      setExportError(
        error instanceof ApiError ? error.message : 'Não foi possível exportar seus dados.',
      )
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="profile-form">
      <div className="profile-form__header">
        <UserAvatar name={user?.name ?? ''} />
        <div className="profile-form__header-text">
          <span className="profile-form__header-name">{user?.name}</span>
          <span className="profile-form__header-email">{user?.email}</span>
        </div>
      </div>
      <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate>
        <div className="profile-form__row">
          <Input label="Nome" type="text" error={errors.name?.message} {...register('name')} />
          <Input label="E-mail" type="email" error={errors.email?.message} {...register('email')} />
        </div>
        {emailChanged && (
          <Input
            label="Senha atual"
            type="password"
            error={errors.currentPassword?.message}
            {...register('currentPassword')}
          />
        )}
        <FormError message={formError} />
        <SuccessMessage message={successMessage} />
        <div className="profile-form__actions">
          <Button type="button" variant="secondary" onClick={handleCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Salvar alterações
          </Button>
        </div>
      </form>
      <div className="profile-form__export">
        <div>
          <span className="profile-form__export-title">Exportar meus dados</span>
          <p className="profile-form__export-description">
            Baixe um CSV com todas as suas entradas, despesas e transferências.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={() => void handleExport()} loading={exporting}>
          Exportar meus dados
        </Button>
      </div>
      <FormError message={exportError} />
    </div>
  )
}
