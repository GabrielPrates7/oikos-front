import { createContext } from 'react'
import type { User } from '../types/auth.types'

export interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  // Atualiza o user em memória sem chamar a API — quem chama já fez o PUT /api/users/me
  // e passa o retorno pra cá, só pra manter o Header (e o resto do app) em sincronia.
  updateUser: (partialUser: Partial<User>) => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
