import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CashFlowBarChart } from '../../components/charts/CashFlowBarChart'
import type { MonthlyEvolutionItem } from '../relatorios/relatorios.types'
import './MonthlyCashFlowPanel.css'

interface MonthlyCashFlowPanelProps {
  months: MonthlyEvolutionItem[]
}

// Substitui o resumo em texto anterior (só o mês selecionado, redundante com os cards do
// topo) por um gráfico de barras dos últimos 6 meses — mostra tendência, não só um número.
// months vem de relatoriosService.getMonthlyEvolution(6): esse endpoint não aceita um mês
// de referência (sempre os últimos 6 a partir de hoje), diferente de "Tendências de Gastos
// Mensais" ao lado, que segue o MonthSwitcher — por isso os dois podem mostrar períodos
// diferentes se o usuário navegar pra um mês passado/futuro. Decisão do pedido original:
// reaproveitar o agregado existente em vez de criar endpoint novo.
export function MonthlyCashFlowPanel({ months }: MonthlyCashFlowPanelProps) {
  return (
    <div className="monthly-cash-flow-panel">
      <h3 className="monthly-cash-flow-panel__title">Comparativo de Fluxo de Caixa Mensal</h3>
      <CashFlowBarChart
        months={months}
        emptyMessage="Sem dados suficientes nos últimos meses pra comparar entradas e despesas."
      />
      <Link to="/relatorios/evolucao-mensal" className="monthly-cash-flow-panel__link">
        Ver completo
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </div>
  )
}
