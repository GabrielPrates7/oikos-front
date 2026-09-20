import { useCallback, useState } from 'react'

// Booleano persistido em localStorage. Qualquer falha (storage indisponível, valor inválido)
// cai em `false`. `changedInSession` diz se o usuário mexeu neste carregamento — quem restaurou
// o valor salvo (`false`) não deve animar a entrada.
export function usePersistedFlag(key: string) {
  const [value, setValue] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(key) === '1'
    } catch {
      return false
    }
  })
  const [changedInSession, setChangedInSession] = useState(false)

  const update = useCallback(
    (next: boolean) => {
      setValue(next)
      setChangedInSession(true)
      try {
        window.localStorage.setItem(key, next ? '1' : '0')
      } catch {
        // storage indisponível: a preferência só vale nesta sessão.
      }
    },
    [key],
  )

  return { value, update, changedInSession }
}
