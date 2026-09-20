import { LogOut, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { createPortal } from 'react-dom'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useReducedMotion } from '../reports/useReducedMotion'
import { MORE_SHEET_GROUPS } from './navItems'
import './MoreSheet.css'

interface MoreSheetProps {
  open: boolean
  onClose: () => void
  // Botão "Mais" da BottomNav — recebe o foco de volta ao fechar.
  returnFocusRef: RefObject<HTMLButtonElement | null>
}

const ANIMATION_MS = 220

// Folha "Mais" (bottom sheet) do mobile, em portal no <body>. Enquanto aberta: o app (#root, irmão
// do portal) fica `inert`, a rolagem do fundo é travada e o foco vai pro primeiro item; ao
// fechar tudo volta ao que era. Fecha por fundo, Escape, "Fechar" e troca de rota (Shell).
export function MoreSheet({ open, onClose, returnFocusRef }: MoreSheetProps) {
  const { user, logout } = useAuth()
  const reducedMotion = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(open)

  // Monta na abertura (ajuste durante a renderização); ao fechar, o CSS anima a saída
  // (só transform/opacity) e o timer desmonta depois.
  if (open && !mounted) setMounted(true)
  useEffect(() => {
    if (open || !mounted) return
    const timer = window.setTimeout(() => setMounted(false), reducedMotion ? 0 : ANIMATION_MS)
    return () => window.clearTimeout(timer)
  }, [open, mounted, reducedMotion])

  // Efeitos de "modal": inert no app, trava de rolagem, Escape. Limpam ao fechar/desmontar.
  useEffect(() => {
    if (!open) return
    const appRoot = document.getElementById('root')
    const html = document.documentElement
    const returnFocusEl = returnFocusRef.current
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
      // depois de tirar o inert, o foco volta ao botão "Mais"
      returnFocusEl?.focus()
    }
  }, [open, onClose, returnFocusRef])

  // Foco no primeiro item quando a folha aparece.
  useEffect(() => {
    if (open && mounted) panelRef.current?.querySelector<HTMLElement>('a')?.focus()
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
        className="mobile-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Mais opções"
      >
        <div className="mobile-sheet__header">
          <span className="mobile-sheet__title">Mais</span>
          <button type="button" className="mobile-sheet__close" onClick={onClose}>
            <X size={18} aria-hidden="true" />
            Fechar
          </button>
        </div>
        <div className="mobile-sheet__scroll">
          {MORE_SHEET_GROUPS.map((group) => (
            <section key={group.label} className="mobile-sheet__group" aria-label={group.label}>
              <h2 className="mobile-sheet__group-label">{group.label}</h2>
              <ul>
                {group.items.map(({ path, label, icon: Icon }) => (
                  <li key={path}>
                    <NavLink
                      to={path}
                      className={({ isActive }) =>
                        `mobile-sheet__link${isActive ? ' mobile-sheet__link--active' : ''}`
                      }
                    >
                      <Icon size={20} aria-hidden="true" />
                      <span>{label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <div className="mobile-sheet__user">
            <span className="mobile-sheet__user-name">{user?.name}</span>
            <button
              type="button"
              className="mobile-sheet__logout"
              onClick={() => {
                onClose()
                void logout()
              }}
            >
              <LogOut size={18} aria-hidden="true" />
              Sair
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
