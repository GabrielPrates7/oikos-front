import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Lê uma mensagem de erro vinda de um redirect (ex: navigate('/cartoes', { state: {
 * error: '...' } }) depois de um 404), mostra ela uma vez e limpa o state da navegação
 * em seguida — histórico (voltar/avançar) não reexibe a mensagem.
 *
 * Captura o state com o padrão de "ajustar state durante o render" (comparando com o
 * valor anterior via sentinel) em vez de um useEffect: se fosse setState dentro do
 * efeito que limpa o location.state, o próprio efeito dispararia um re-render no mesmo
 * tick e a mensagem desapareceria antes de ser vista.
 */
export function useNavRedirectError(): string | null {
  const location = useLocation()
  const navigate = useNavigate()

  const [navError, setNavError] = useState<string | null>(null)
  const [lastHandledState, setLastHandledState] = useState<unknown>(() => Symbol('unhandled'))
  if (location.state !== lastHandledState) {
    setLastHandledState(location.state)
    const state = location.state as { error?: string } | null
    if (state?.error) {
      setNavError(state.error)
    }
  }

  useEffect(() => {
    if ((location.state as { error?: string } | null)?.error) {
      navigate('.', { replace: true, state: null })
    }
  }, [location.state, navigate])

  return navError
}
