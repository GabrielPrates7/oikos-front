import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, ApiError, refreshSession, setOnUnauthorized } from '../services/api'
import { clearToken, setToken } from '../services/tokenStore'
import type { User } from '../types/auth.types'
import { AuthContext } from './authContextInstance'

interface AuthResponse {
  user: User
  accessToken: string
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }
  return 'Não foi possível completar a operação. Tente novamente.'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    setOnUnauthorized(() => {
      setUser(null)
      navigate('/login')
    })
  }, [navigate])

  useEffect(() => {
    let active = true

    async function trySilentRefresh(): Promise<void> {
      const token = await refreshSession()
      if (!token) {
        if (active) {
          setUser(null)
          setLoading(false)
        }
        return
      }

      try {
        const me = await apiFetch<{ user: User }>('/auth/me')
        if (active) {
          setUser(me.user)
        }
      } catch {
        if (active) {
          setUser(null)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void trySilentRefresh()

    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setToken(data.accessToken)
      setUser(data.user)
    } catch (error) {
      throw new Error(extractErrorMessage(error), { cause: error })
    }
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      const data = await apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      })
      setToken(data.accessToken)
      setUser(data.user)
    } catch (error) {
      throw new Error(extractErrorMessage(error), { cause: error })
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' })
    } catch {
      // mesmo se a chamada falhar (ex: token já expirado), limpamos o estado local.
    } finally {
      clearToken()
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
