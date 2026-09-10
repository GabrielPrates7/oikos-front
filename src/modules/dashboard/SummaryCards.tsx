import { centsToBRL } from '../../utils/currency'
import type { DashboardTotals } from './dashboard.types'
import './SummaryCards.css'

interface SummaryCardsProps {
  totalBalanceCents: number
  jaPagoCents: number
  faltaPagarCents: number
  totals: DashboardTotals
}

// Mesmo conceito de Despesas: Resultado = Entradas - Já pago (não Entradas - despesas
// totais, que incluiria despesas ainda pendentes como se já tivessem saído da conta).
export function SummaryCards({
  totalBalanceCents,
  jaPagoCents,
  faltaPagarCents,
  totals,
}: SummaryCardsProps) {
  const netCents = totals.incomeCents - jaPagoCents

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
          <span className="summary-cards__stat-label">Já pago</span>
          <span className="summary-cards__stat-value summary-cards__stat-value--expense">
            {centsToBRL(jaPagoCents)}
          </span>
        </div>
        <div className="summary-cards__stat">
          <span className="summary-cards__stat-label">Resultado</span>
          <span
            className={`summary-cards__stat-value ${
              netCents >= 0
                ? 'summary-cards__stat-value--income'
                : 'summary-cards__stat-value--expense'
            }`}
          >
            {centsToBRL(netCents)}
          </span>
        </div>
        <div className="summary-cards__stat">
          <span className="summary-cards__stat-label">Falta pagar</span>
          {/* Obrigação futura (despesas pendentes + faturas ainda não pagas do mês), não
              uma perda já realizada — por isso um terracota mais discreto que o de Já
              pago, não o mesmo peso visual. */}
          <span className="summary-cards__stat-value summary-cards__stat-value--pending">
            {centsToBRL(faltaPagarCents)}
          </span>
        </div>
      </div>
    </div>
  )
}
