import { LogOut } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { SETTINGS_NAV_ITEM, SIDEBAR_NAV_GROUPS } from './navItems'
import './Sidebar.css'

const SettingsIcon = SETTINGS_NAV_ITEM.icon

export function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <nav className="sidebar" aria-label="Navegação principal">
      <div className="sidebar__brand">
        <span className="sidebar__avatar" aria-hidden="true">
          O
        </span>
        <div className="sidebar__brand-text">
          <span className="sidebar__brand-name">Oikos</span>
          <span className="sidebar__brand-subtitle">Finanças pessoais</span>
        </div>
      </div>

      <div className="sidebar__scroll">
        {SIDEBAR_NAV_GROUPS.map((group) => (
          <div key={group.label} className="sidebar__group">
            <span className="sidebar__group-label">{group.label}</span>
            <ul className="sidebar__list">
              {group.items.map(({ path, label, icon: Icon }) => (
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
          </div>
        ))}
      </div>

      <div className="sidebar__footer">
        <NavLink
          to={SETTINGS_NAV_ITEM.path}
          className={({ isActive }) =>
            `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
          }
        >
          <SettingsIcon size={20} aria-hidden="true" />
          <span>{SETTINGS_NAV_ITEM.label}</span>
        </NavLink>
        <div className="sidebar__user">
          <span className="sidebar__user-name">{user?.name}</span>
          <button
            type="button"
            className="sidebar__logout"
            aria-label="Sair"
            onClick={() => void logout()}
          >
            <LogOut size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </nav>
  )
}
