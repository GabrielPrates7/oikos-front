import { Link } from 'react-router-dom'
import { centsToBRL } from '../../utils/currency'
import type { DashboardCreditCardSummary } from './dashboard.types'
import './CreditCardsSummary.css'

interface CreditCardsSummaryProps {
  cards: DashboardCreditCardSummary[]
}

export function CreditCardsSummary({ cards }: CreditCardsSummaryProps) {
  return (
    <div className="credit-cards-summary">
      <h2 className="credit-cards-summary__title">Cartões</h2>
      {cards.length === 0 ? (
        <p className="credit-cards-summary__empty">Nenhum cartão ativo.</p>
      ) : (
        <ul className="credit-cards-summary__rows">
          {cards.map((card) => {
            const usedCents = Math.max(0, card.creditLimitCents - card.availableLimitCents)
            const usedPercent =
              card.creditLimitCents > 0
                ? Math.min(100, (usedCents / card.creditLimitCents) * 100)
                : 0
            return (
              <li key={card.id} className="credit-cards-summary__row">
                <Link to={`/cartoes/${card.id}`} className="credit-cards-summary__link">
                  <div className="credit-cards-summary__info">
                    <span className="credit-cards-summary__name">{card.name}</span>
                    <div className="credit-cards-summary__bar-track">
                      <div
                        className="credit-cards-summary__bar-fill"
                        style={{ width: `${usedPercent}%` }}
                      />
                    </div>
                  </div>
                  <span className="credit-cards-summary__available">
                    {centsToBRL(card.availableLimitCents)}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
