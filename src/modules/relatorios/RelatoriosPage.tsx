import { BarChart3 } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { Tabs } from '../../components/layout/Tabs'
import { ReportsFilterProvider } from './ReportsFilterProvider'
import './RelatoriosPage.css'
import './ReportsTheme.css'

const TABS = [
  { path: '/relatorios/visao-geral', label: 'Visão Geral' },
  { path: '/relatorios/por-categoria', label: 'Por categoria' },
  { path: '/relatorios/evolucao-mensal', label: 'Evolução mensal' },
  { path: '/relatorios/comparativo', label: 'Comparativo' },
]

export function RelatoriosPage() {
  return (
    <div className="relatorios-page">
      <PageHeader title="Relatórios" icon={<BarChart3 size={22} aria-hidden="true" />} />
      <Tabs items={TABS} />
      <div className="relatorios-page__content">
        <ReportsFilterProvider>
          <Outlet />
        </ReportsFilterProvider>
      </div>
    </div>
  )
}
