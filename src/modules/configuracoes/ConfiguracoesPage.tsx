import { NavLink, Outlet } from 'react-router-dom'
import './ConfiguracoesPage.css'

const TABS = [
  { path: '/configuracoes/perfil', label: 'Perfil' },
  { path: '/configuracoes/seguranca', label: 'Segurança' },
]

export function ConfiguracoesPage() {
  return (
    <div className="configuracoes-page">
      <h1 className="configuracoes-page__title">Configurações</h1>
      <div className="configuracoes-page__layout">
        <nav className="configuracoes-page__tabs" aria-label="Seções de configurações">
          {TABS.map(({ path, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `configuracoes-page__tab${isActive ? ' configuracoes-page__tab--active' : ''}`
              }
            >
              <span className="configuracoes-page__tab-dot" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="configuracoes-page__content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
