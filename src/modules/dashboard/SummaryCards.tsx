import { centsToBRL } from '../../utils/currency'
import type { DashboardTotals } from './dashboard.types'
import './SummaryCards.css'

interface SummaryCardsProps {
  totalBalanceCents: number
  totalPendingInvoicesCents: number
  totals: DashboardTotals
}

export function SummaryCards({
  totalBalanceCents,
  totalPendingInvoicesCents,
  totals,
}: SummaryCardsProps) {
  return (
    <div className="summary-cards">
      <div className="summary-cards__balance">
        <span className="summary-cards__balance-label">Saldo total</span>
        <span className="summary-cards__balance-value">{centsToBRL(totalBalanceCents)}</span>
      </div>
      <div className="summary-cards__month">
        <div className="summary-cards__stat">
          <span className="summary-cards__stat-label">Entradas</span>
          <span className="summary-cards__stat-value summary-cards__stat-value--income">
            {centsToBRL(totals.incomeCents)}
          </span>
        </div>
        <div className="summary-cards__stat">
          <span className="summary-cards__stat-label">Despesas</span>
          <span className="summary-cards__stat-value summary-cards__stat-value--expense">
            {centsToBRL(totals.expenseCents)}
          </span>
        </div>
        <div className="summary-cards__stat">
          <span className="summary-cards__stat-label">Resultado</span>
          <span
            className={`summary-cards__stat-value ${
              totals.netCents >= 0
                ? 'summary-cards__stat-value--income'
                : 'summary-cards__stat-value--expense'
            }`}
          >
            {centsToBRL(totals.netCents)}
          </span>
        </div>
        <div className="summary-cards__stat">
          <span className="summary-cards__stat-label">A pagar</span>
          {/* Obrigação futura (faturas ainda não pagas), não uma perda já realizada — por
              isso um terracota mais discreto que o de Despesas, não o mesmo peso visual. */}
          <span className="summary-cards__stat-value summary-cards__stat-value--pending">
            {centsToBRL(totalPendingInvoicesCents)}
          </span>
        </div>
      </div>
    </div>
  )
}
