import { NavLink } from 'react-router-dom'
import { BOTTOM_NAV_ITEMS } from './navItems'
import './BottomNav.css'

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      {BOTTOM_NAV_ITEMS.map(({ path, label, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `bottom-nav__link${isActive ? ' bottom-nav__link--active' : ''}`
          }
        >
          <Icon size={22} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
