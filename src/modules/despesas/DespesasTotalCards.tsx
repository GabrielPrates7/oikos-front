import { CheckCircle2, CircleDollarSign, Wallet } from 'lucide-react'
import { centsToBRL } from '../../utils/currency'
import type { MonthlySummary } from './despesas.types'
import './DespesasTotalCards.css'

interface DespesasTotalCardsProps {
  summary: MonthlySummary
  // Tooltip dos três cards: eles vêm de /expenses/monthly-summary, que só conhece o mês, então
  // NÃO mudam com os filtros da lista.
  title?: string
}

// Substitui o ListTotal (texto solto) só em Despesas — ListTotal continua compartilhado
// com Contas/Cartões/Faturas/Transferências, que não pediram card. "Geral" ganha o destaque
// extra (borda/glow vermelho), mesmo princípio do Saldo Real no Dashboard: a métrica mais
// consultada se separa das outras duas, que ficam no estilo padrão de card.
export function DespesasTotalCards({
  summary,
  title = 'Resumo do mês; não muda com os filtros da lista',
}: DespesasTotalCardsProps) {
  return (
    <div className="despesas-total-cards">
      <div className="despesas-total-card despesas-total-card--geral" title={title}>
        <div className="despesas-total-card__icon">
          <CircleDollarSign size={18} aria-hidden="true" />
        </div>
        <span className="despesas-total-card__label">Geral</span>
        <span className="despesas-total-card__value">{centsToBRL(summary.totalGeralCents)}</span>
      </div>
      <div className="despesas-total-card" title={title}>
        <div className="despesas-total-card__icon">
          <CheckCircle2 size={18} aria-hidden="true" />
        </div>
        <span className="despesas-total-card__label">Já pago</span>
        <span className="despesas-total-card__value">{centsToBRL(summary.totalPagoCents)}</span>
      </div>
      <div className="despesas-total-card" title={title}>
        <div className="despesas-total-card__icon">
          <Wallet size={18} aria-hidden="true" />
        </div>
        <span className="despesas-total-card__label">Falta pagar</span>
        <span className="despesas-total-card__value">
          {centsToBRL(summary.totalFaltaPagarCents)}
        </span>
      </div>
    </div>
  )
}
