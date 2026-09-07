import { MoreVertical } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import './DropdownMenu.css'

interface DropdownMenuProps {
  label: string
  // Conteúdo do botão que abre o menu — default é só o ícone "...", mas Contas/Cartões
  // usam isso pro botão "Movimentar" (ícone + texto).
  trigger?: ReactNode
  triggerClassName?: string
  align?: 'left' | 'right'
  children: (close: () => void) => ReactNode
}

// Primitivo compartilhado por ContasList, CartoesList e FaturasList — mesmo padrão de
// abrir/fechar e clicar fora fecha, usado nos três. Teclado é tratado explicitamente no
// onKeyDown (não confiado só no "ativar botão nativo com Enter/Espaço" do navegador),
// porque essa ativação padrão depende de uma ação de UA disparada por evento confiável e
// nem sempre se comporta de forma previsível vinda de automação/leitores de tela variados
// — melhor garantir o comportamento aqui do que depender disso.
export function DropdownMenu({
  label,
  trigger,
  triggerClassName,
  align = 'right',
  children,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  // Ao abrir (mouse ou teclado), o foco entra no menu — sem isso setas/Escape não têm
  // onde agir, e quem usa teclado fica preso no botão que abriu.
  useEffect(() => {
    if (!open) return
    getMenuItems()[0]?.focus()
  }, [open])

  function getMenuItems(): HTMLElement[] {
    return Array.from(panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
  }

  function closeAndRefocusTrigger() {
    setOpen(false)
    triggerRef.current?.focus()
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
    }
  }

  function handlePanelKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const items = getMenuItems()
    if (items.length === 0) return
    const currentIndex = items.indexOf(document.activeElement as HTMLElement)

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      items[(currentIndex + 1) % items.length]?.focus()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      items[(currentIndex - 1 + items.length) % items.length]?.focus()
    } else if (event.key === 'Enter' || event.key === ' ') {
      // Não confia só na ativação nativa de botão/link por Enter/Espaço (o mesmo motivo
      // do gatilho acima) — clica no item focado explicitamente. Bônus: Espaço em <a>
      // nativamente rola a página em vez de ativar o link; isso corrige esse caso também.
      event.preventDefault()
      items[currentIndex]?.click()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      closeAndRefocusTrigger()
    } else if (event.key === 'Tab') {
      // Deixa o Tab seguir seu destino normal (não prende o foco) — só garante que o
      // menu não fique aberto flutuando depois que o foco já saiu dele.
      setOpen(false)
    }
  }

  return (
    <div className="dropdown-menu" ref={rootRef}>
      <button
        type="button"
        ref={triggerRef}
        className={triggerClassName ?? 'dropdown-menu__trigger'}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
      >
        {trigger ?? <MoreVertical size={16} aria-hidden="true" />}
      </button>
      {open && (
        <div
          ref={panelRef}
          className={`dropdown-menu__panel dropdown-menu__panel--${align}`}
          role="menu"
          onKeyDown={handlePanelKeyDown}
        >
          {children(closeAndRefocusTrigger)}
        </div>
      )}
    </div>
  )
}
