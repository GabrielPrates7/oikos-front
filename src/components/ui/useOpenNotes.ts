import { useCallback, useState } from 'react'

// Vários abertos ao mesmo tempo: guarda o conjunto de ids abertos.
export function useOpenNotes() {
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set())
  const toggle = useCallback((id: string) => {
    setOpen((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])
  return { isOpen: (id: string) => open.has(id), toggle }
}
