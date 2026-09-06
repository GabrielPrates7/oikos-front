import { Outlet } from 'react-router-dom'
import { Tabs } from '../../components/layout/Tabs'
import './RelatoriosPage.css'

const TABS = [
  { path: '/relatorios/por-categoria', label: 'Por categoria' },
  { path: '/relatorios/evolucao-mensal', label: 'Evolução mensal' },
  { path: '/relatorios/comparativo', label: 'Comparativo' },
]

export function RelatoriosPage() {
  return (
    <div className="relatorios-page">
      <h1 className="relatorios-page__title">Relatórios</h1>
      <Tabs items={TABS} />
      <div className="relatorios-page__content">
        <Outlet />
      </div>
    </div>
  )
}
