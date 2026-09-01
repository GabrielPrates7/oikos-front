import { NavLink } from 'react-router-dom'
import { SIDEBAR_NAV_ITEMS } from './navItems'
import './Sidebar.css'

export function Sidebar() {
  return (
    <nav className="sidebar" aria-label="Navegação principal">
      <div className="sidebar__brand">Oikos</div>
      <ul className="sidebar__list">
        {SIDEBAR_NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <li key={path}>
            <NavLink
              to={path}
              className={({ isActive }) =>
                `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
              }
            >
              <Icon size={20} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
