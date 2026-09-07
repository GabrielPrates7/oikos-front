import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import type { FocusEvent, MouseEvent } from 'react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { SETTINGS_NAV_ITEM, SIDEBAR_NAV_GROUPS } from './navItems'
import './Sidebar.css'

const SettingsIcon = SETTINGS_NAV_ITEM.icon

interface SidebarProps {
  collapsed: boolean
  onToggleCollapsed: () => void
}

interface TooltipState {
  label: string
  top: number
  left: number
}

export function Sidebar({ collapsed, onToggleCollapsed }: SidebarProps) {
  const { user, logout } = useAuth()
  // O tooltip é renderizado via portal em document.body (position: fixed calculado a
  // partir do elemento) em vez de um ::after posicionado relativo ao próprio link — a
  // sidebar recolhida é uma coluna com overflow-y: auto, e por regra do próprio CSS
  // (overflow-x vira 'auto' quando overflow-y não é 'visible'), qualquer coisa que
  // ultrapassasse a largura da coluna via position:absolute simplesmente ficava cortada,
  // invisível mesmo com opacity:1 e o :hover disparando de verdade.
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  function showTooltip(event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>, label: string) {
    if (!collapsed) return
    const rect = event.currentTarget.getBoundingClientRect()
    setTooltip({ label, top: rect.top + rect.height / 2, left: rect.right + 10 })
  }

  function hideTooltip() {
    setTooltip(null)
  }

  return (
    <nav
      className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}
      aria-label="Navegação principal"
    >
      <div className="sidebar__brand">
        <span className="sidebar__avatar" aria-hidden="true">
          O
        </span>
        {!collapsed && (
          <div className="sidebar__brand-text">
            <span className="sidebar__brand-name">Oikos</span>
            <span className="sidebar__brand-subtitle">Finanças pessoais</span>
          </div>
        )}
        <button
          type="button"
          className="sidebar__collapse-toggle"
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-pressed={collapsed}
          onClick={onToggleCollapsed}
        >
          {collapsed ? (
            <ChevronRight size={16} aria-hidden="true" />
          ) : (
            <ChevronLeft size={16} aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="sidebar__scroll">
        {SIDEBAR_NAV_GROUPS.map((group) => (
          <div key={group.label} className="sidebar__group">
            {!collapsed && <span className="sidebar__group-label">{group.label}</span>}
            <ul className="sidebar__list">
              {group.items.map(({ path, label, icon: Icon }) => (
                <li key={path}>
                  <NavLink
                    to={path}
                    className={({ isActive }) =>
                      `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
                    }
                    onMouseEnter={(event) => showTooltip(event, label)}
                    onMouseLeave={hideTooltip}
                    onFocus={(event) => showTooltip(event, label)}
                    onBlur={hideTooltip}
                  >
                    <Icon size={20} aria-hidden="true" />
                    {!collapsed && <span>{label}</span>}
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
          onMouseEnter={(event) => showTooltip(event, SETTINGS_NAV_ITEM.label)}
          onMouseLeave={hideTooltip}
          onFocus={(event) => showTooltip(event, SETTINGS_NAV_ITEM.label)}
          onBlur={hideTooltip}
        >
          <SettingsIcon size={20} aria-hidden="true" />
          {!collapsed && <span>{SETTINGS_NAV_ITEM.label}</span>}
        </NavLink>
        <div className="sidebar__user">
          {!collapsed && <span className="sidebar__user-name">{user?.name}</span>}
          <button
            type="button"
            className="sidebar__logout"
            aria-label="Sair"
            onMouseEnter={(event) => showTooltip(event, 'Sair')}
            onMouseLeave={hideTooltip}
            onFocus={(event) => showTooltip(event, 'Sair')}
            onBlur={hideTooltip}
            onClick={() => void logout()}
          >
            <LogOut size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {tooltip &&
        createPortal(
          <div
            className="sidebar-tooltip"
            style={{ top: tooltip.top, left: tooltip.left }}
            role="tooltip"
          >
            {tooltip.label}
          </div>,
          document.body,
        )}
    </nav>
  )
}
