import { CreditCard, Ellipsis, LayoutDashboard, TrendingDown, TrendingUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { RefObject } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getActiveNavKey } from './mobileNav'
import type { MobileNavKey } from './mobileNav'
import './BottomNav.css'

interface BottomNavProps {
  moreOpen: boolean
  onToggleMore: () => void
  moreButtonRef: RefObject<HTMLButtonElement | null>
}

interface LinkItem {
  key: Exclude<MobileNavKey, 'mais'>
  label: string
  to: string
  icon: LucideIcon
}

// Mesmos ícones que o Sidebar usa para cada tela (navItems.ts).
const ITEMS: LinkItem[] = [
  { key: 'inicio', label: 'Início', to: '/dashboard', icon: LayoutDashboard },
  { key: 'entradas', label: 'Entradas', to: '/entradas', icon: TrendingUp },
  { key: 'despesas', label: 'Despesas', to: '/despesas', icon: TrendingDown },
  { key: 'cartoes', label: 'Cartões', to: '/cartoes', icon: CreditCard },
]

// Barra inferior do mobile (só < 768px; o Shell monta e o CSS esconde no MESMO ponto). Cinco
// posições; o ativo vem de getActiveNavKey (matchPath), sem lógica duplicada.
export function BottomNav({ moreOpen, onToggleMore, moreButtonRef }: BottomNavProps) {
  const { pathname } = useLocation()
  const active = getActiveNavKey(pathname)

  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      {ITEMS.map(({ key, label, to, icon: Icon }) => {
        const isActive = active === key
        return (
          <Link
            key={key}
            to={to}
            className={`bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={22} aria-hidden="true" />
            <span className="bottom-nav__label">{label}</span>
          </Link>
        )
      })}
      <button
        ref={moreButtonRef}
        type="button"
        className={`bottom-nav__item${active === 'mais' || moreOpen ? ' bottom-nav__item--active' : ''}`}
        aria-haspopup="dialog"
        aria-expanded={moreOpen}
        aria-current={active === 'mais' ? 'page' : undefined}
        onClick={onToggleMore}
      >
        <Ellipsis size={22} aria-hidden="true" />
        <span className="bottom-nav__label">Mais</span>
      </button>
    </nav>
  )
}
