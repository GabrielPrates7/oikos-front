import { NavLink } from 'react-router-dom'
import { OVERFLOW_NAV_ITEMS } from './navItems'
import './MobileMenu.css'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="mobile-menu">
      <button
        type="button"
        className="mobile-menu__backdrop"
        aria-label="Fechar menu"
        onClick={onClose}
      />
      <nav className="mobile-menu__panel" aria-label="Mais opções de navegação">
        <ul className="mobile-menu__list">
          {OVERFLOW_NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <li key={path}>
              <NavLink
                to={path}
                onClick={onClose}
                className={({ isActive }) =>
                  `mobile-menu__link${isActive ? ' mobile-menu__link--active' : ''}`
                }
              >
                <Icon size={20} aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
