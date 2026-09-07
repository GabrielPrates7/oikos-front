import { Link } from 'react-router-dom'
import { CartaoMiniVisual } from '../cartoes/CartaoMiniVisual'
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
          {cards.map((card) => (
            <li key={card.id} className="credit-cards-summary__row">
              <Link to={`/cartoes/${card.id}`} className="credit-cards-summary__link">
                <CartaoMiniVisual
                  name={card.name}
                  creditLimitCents={card.creditLimitCents}
                  availableLimitCents={card.availableLimitCents}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
