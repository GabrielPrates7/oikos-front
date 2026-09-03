import { NavLink } from 'react-router-dom'
import './Tabs.css'

export interface TabItem {
  path: string
  label: string
}

interface TabsProps {
  items: TabItem[]
}

export function Tabs({ items }: TabsProps) {
  return (
    <nav className="tabs" aria-label="Seções">
      <ul className="tabs__list">
        {items.map(({ path, label }) => (
          <li key={path}>
            <NavLink
              to={path}
              className={({ isActive }) => `tabs__link${isActive ? ' tabs__link--active' : ''}`}
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
