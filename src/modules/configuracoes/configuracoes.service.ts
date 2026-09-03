import { apiFetch } from '../../services/api'
import type { User } from '../../types/auth.types'
import type { ChangePasswordFormData, ProfileFormData } from './configuracoes.schemas'

export const configuracoesService = {
  async updateProfile(data: ProfileFormData): Promise<User> {
    const result = await apiFetch<{ user: User }>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return result.user
  },

  async changePassword(data: ChangePasswordFormData): Promise<void> {
    // O backend não conhece confirmNewPassword — manda só o que o schema dele espera.
    await apiFetch('/users/me/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    })
  },
}
