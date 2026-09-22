import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useReducedMotion } from '../reports/useReducedMotion'
import { Button } from './Button'
import './Sheet.css'
import './FilterSheet.css'

interface FilterSheetProps {
  open: boolean
  onClose: () => void
  // "Aplicar" só fecha a folha: os campos são controlados e já aplicam ao digitar/selecionar
  // (mesmo estado usado no painel de desktop), então fechar É "rodar a busca" pro usuário.
  onApply: () => void
  onClear?: () => void
  hasFilters?: boolean
  triggerRef: React.RefObject<HTMLButtonElement | null>
  children: ReactNode
}

const ANIMATION_MS = 220

// Folha de filtros do mobile de Entradas/Despesas — mesmo padrão de MoreSheet.tsx: portal no
// <body>, fundo do app `inert` (trava o foco dentro da folha sem precisar de handler de Tab),
// rolagem do fundo travada, Escape fecha. Casca visual compartilhada via ../ui/Sheet.css.
export function FilterSheet({
  open,
  onClose,
  onApply,
  onClear,
  hasFilters,
  triggerRef,
  children,
}: FilterSheetProps) {
  const reducedMotion = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(open)

  if (open && !mounted) setMounted(true)
  useEffect(() => {
    if (open || !mounted) return
    const timer = window.setTimeout(() => setMounted(false), reducedMotion ? 0 : ANIMATION_MS)
    return () => window.clearTimeout(timer)
  }, [open, mounted, reducedMotion])

  useEffect(() => {
    if (!open) return
    const appRoot = document.getElementById('root')
    const html = document.documentElement
    const returnFocusEl = triggerRef.current
    const previousOverflow = html.style.overflow
    appRoot?.setAttribute('inert', '')
    html.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      appRoot?.removeAttribute('inert')
      html.style.overflow = previousOverflow
      returnFocusEl?.focus()
    }
  }, [open, onClose, triggerRef])

  useEffect(() => {
    if (open && mounted) {
      // Primeiro campo de verdade (não o "Fechar" do cabeçalho, que vem antes no DOM).
      panelRef.current
        ?.querySelector('.filter-sheet__fields')
        ?.querySelector<HTMLElement>('input, select, button')
        ?.focus()
    }
  }, [open, mounted])

  if (!mounted) return null

  return createPortal(
    <div className={`mobile-sheet${open ? '' : ' mobile-sheet--closing'}`}>
      <button
        type="button"
        className="mobile-sheet__backdrop"
        aria-label="Fechar"
        tabIndex={-1}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="mobile-sheet__panel filter-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Filtros"
      >
        <div className="mobile-sheet__header">
          <span className="mobile-sheet__title">Filtros</span>
          <button type="button" className="mobile-sheet__close" onClick={onClose}>
            <X size={18} aria-hidden="true" />
            Fechar
          </button>
        </div>
        <div className="mobile-sheet__scroll filter-sheet__fields">{children}</div>
        <div className="filter-sheet__footer">
          {hasFilters && onClear && (
            <Button type="button" variant="secondary" onClick={onClear}>
              Limpar filtros
            </Button>
          )}
          <Button type="button" variant="primary" onClick={onApply}>
            Aplicar
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
