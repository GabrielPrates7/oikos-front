import { useCallback, useEffect, useState } from 'react'

// Atributo que marca os controles de "sair sem salvar" (Cancelar e o link do cabeçalho): clicar
// fora deles desfaz o pedido de confirmação.
export const DISCARD_CONTROL_ATTR = 'data-discard-control'

// Confirmação em duas etapas pra sair de um formulário com alterações não salvas — mesmo padrão do
// "Excluir" das listas: o 1º clique no controle pede confirmação (o texto dele vira "Descartar
// alterações?"), o 2º clique no MESMO controle descarta; clicar fora ou apertar Esc cancela o
// pedido. Sem alterações, sai direto. \`source\` identifica qual controle está pedindo (o link do
// cabeçalho e o botão Cancelar têm o mesmo comportamento, cada um com a própria confirmação).
export function useDiscardConfirm(dirty: boolean, onDiscard: () => void) {
  const [source, setSource] = useState<string | null>(null)
  // Sem alterações não há o que confirmar (ex.: o usuário desfez tudo antes do 2º clique).
  const confirmingSource = dirty ? source : null

  useEffect(() => {
    if (confirmingSource === null) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Element | null
      if (!target?.closest(`[${DISCARD_CONTROL_ATTR}]`)) setSource(null)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setSource(null)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [confirmingSource])

  const request = useCallback(
    (id: string) => {
      if (!dirty) {
        onDiscard()
      } else if (confirmingSource === id) {
        setSource(null)
        onDiscard()
      } else {
        setSource(id)
      }
    },
    [dirty, confirmingSource, onDiscard],
  )

  return { confirmingSource, request }
}
