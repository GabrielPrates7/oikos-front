import { Link } from 'react-router-dom'
import { ListTotal } from '../../components/ui/ListTotal'
import { centsToBRL } from '../../utils/currency'
import { formatReferenceMonth } from '../../utils/date'
import type { CreditCard } from '../cartoes/cartoes.types'
import { InvoiceStatusBadge } from './InvoiceStatusBadge'
import type { InvoiceListItem } from './faturas.types'
import './FaturasList.css'

interface FaturasListProps {
  invoices: InvoiceListItem[]
  cards: CreditCard[]
  selectedCardId: string
  onCardFilterChange: (cardId: string) => void
}

export function FaturasList({
  invoices,
  cards,
  selectedCardId,
  onCardFilterChange,
}: FaturasListProps) {
  const cardsById = new Map(cards.map((card) => [card.id, card]))

  return (
    <div className="faturas-list">
      <div className="faturas-list__filters">
        <div className="faturas-list__filter-field">
          <label htmlFor="filter-card">Cartão</label>
          <select
            id="filter-card"
            value={selectedCardId}
            onChange={(event) => onCardFilterChange(event.target.value)}
          >
            <option value="">Todos</option>
            {cards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="faturas-list__empty">
          {selectedCardId ? (
            <p>Nenhuma fatura encontrada pra esse cartão.</p>
          ) : (
            <>
              <p>Você ainda não tem nenhuma fatura.</p>
              <p>Faturas aparecem aqui assim que você registrar uma compra num cartão.</p>
            </>
          )}
        </div>
      ) : (
        <>
          <ListTotal
            items={[
              {
                label: 'Total exibido',
                valueCents: invoices.reduce((sum, invoice) => sum + invoice.totalCents, 0),
              },
            ]}
          />
          <ul className="faturas-list__rows">
            {invoices.map((invoice) => {
              const card = cardsById.get(invoice.credit_card_id)
              return (
                <li key={invoice.id} className="faturas-list__row">
                  <Link to={`/faturas/${invoice.id}`} className="faturas-list__link">
                    <div className="faturas-list__info">
                      <span className="faturas-list__card-name">
                        {card?.name ?? 'Cartão removido'}
                      </span>
                      <span className="faturas-list__reference">
                        {formatReferenceMonth(invoice.reference_month)}
                      </span>
                    </div>
                    <InvoiceStatusBadge status={invoice.displayStatus} />
                    <span className="faturas-list__total">{centsToBRL(invoice.totalCents)}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
