import { Outlet } from 'react-router-dom'
import { Tabs } from '../../components/layout/Tabs'
import './ConfiguracoesPage.css'

const TABS = [
  { path: '/configuracoes/perfil', label: 'Perfil' },
  { path: '/configuracoes/preferencias', label: 'Preferências' },
  { path: '/configuracoes/seguranca', label: 'Segurança' },
]

export function ConfiguracoesPage() {
  return (
    <div className="configuracoes-page">
      <h1 className="configuracoes-page__title">Configurações</h1>
      <Tabs items={TABS} />
      <div className="configuracoes-page__content">
        <Outlet />
      </div>
    </div>
  )
}
