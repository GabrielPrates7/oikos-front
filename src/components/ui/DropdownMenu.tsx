import { MoreVertical } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
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
// abrir/fechar e clicar fora fecha, usado nos três.
export function DropdownMenu({
  label,
  trigger,
  triggerClassName,
  align = 'right',
  children,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  return (
    <div className="dropdown-menu" ref={ref}>
      <button
        type="button"
        className={triggerClassName ?? 'dropdown-menu__trigger'}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {trigger ?? <MoreVertical size={16} aria-hidden="true" />}
      </button>
      {open && (
        <div className={`dropdown-menu__panel dropdown-menu__panel--${align}`} role="menu">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}
