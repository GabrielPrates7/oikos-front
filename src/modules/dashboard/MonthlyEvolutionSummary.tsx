import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { centsToBRL } from '../../utils/currency'
import type { DashboardTotals } from './dashboard.types'
import './MonthlyEvolutionSummary.css'

interface MonthlyEvolutionSummaryProps {
  totals: DashboardTotals
}

// Resumo curto do mês selecionado, não um gráfico completo (que já existe em
// Relatórios > Evolução mensal) — só um lembrete rápido com link pra quem quiser o
// histórico de vários meses.
export function MonthlyEvolutionSummary({ totals }: MonthlyEvolutionSummaryProps) {
  return (
    <div className="monthly-evolution-summary">
      <h3 className="monthly-evolution-summary__title">Evolução mensal</h3>
      <div className="monthly-evolution-summary__rows">
        <div className="monthly-evolution-summary__row">
          <span className="monthly-evolution-summary__label">Entradas</span>
          <span className="monthly-evolution-summary__value monthly-evolution-summary__value--income">
            {centsToBRL(totals.incomeCents)}
          </span>
        </div>
        <div className="monthly-evolution-summary__row">
          <span className="monthly-evolution-summary__label">Despesas</span>
          <span className="monthly-evolution-summary__value monthly-evolution-summary__value--expense">
            {centsToBRL(totals.expenseCents)}
          </span>
        </div>
        <div className="monthly-evolution-summary__row monthly-evolution-summary__row--result">
          <div className="monthly-evolution-summary__row-main">
            <span className="monthly-evolution-summary__label">Resultado</span>
            <span
              className={`monthly-evolution-summary__value ${
                totals.netCents >= 0
                  ? 'monthly-evolution-summary__value--income'
                  : 'monthly-evolution-summary__value--expense'
              }`}
            >
              {centsToBRL(totals.netCents)}
            </span>
          </div>
          {/* Resultado (entradas - despesas por categoria, inclui pendentes) e o card
              "Lucro" do topo (entradas - Já Pago, só despesa PAGA + fatura) partem de bases
              de despesa diferentes de propósito — ver decisão registrada no backlog do
              documento técnico. Legenda só pra deixar isso visível. */}
          <span className="monthly-evolution-summary__caption">
            Baseado em despesas por categoria, inclui pendentes
          </span>
        </div>
      </div>
      <Link to="/relatorios/evolucao-mensal" className="monthly-evolution-summary__link">
        Ver completo
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </div>
  )
}
