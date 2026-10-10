import { Settings } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { Tabs } from '../../components/layout/Tabs'
import './ConfiguracoesPage.css'

const TABS = [
  { path: '/configuracoes/perfil', label: 'Perfil' },
  { path: '/configuracoes/seguranca', label: 'Segurança' },
]

export function ConfiguracoesPage() {
  return (
    <div className="configuracoes-page">
      <PageHeader title="Configurações" icon={<Settings size={22} aria-hidden="true" />} />
      <Tabs items={TABS} />
      <div className="configuracoes-page__content">
        <Outlet />
      </div>
    </div>
  )
}
