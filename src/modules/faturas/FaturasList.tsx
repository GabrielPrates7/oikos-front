import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
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
  selectedInvoiceIds: Set<string>
  onToggleInvoiceSelected: (invoiceId: string) => void
  onToggleSelectAll: () => void
  onRequestBatchPay: () => void
}

export function FaturasList({
  invoices,
  cards,
  selectedCardId,
  onCardFilterChange,
  selectedInvoiceIds,
  onToggleInvoiceSelected,
  onToggleSelectAll,
  onRequestBatchPay,
}: FaturasListProps) {
  const cardsById = new Map(cards.map((card) => [card.id, card]))
  // Só faturas ainda não pagas entram no lote — pagar de novo não faz sentido.
  const payableInvoices = invoices.filter((invoice) => invoice.displayStatus !== 'paid')
  const allSelected =
    payableInvoices.length > 0 && payableInvoices.every((invoice) => selectedInvoiceIds.has(invoice.id))

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
          {payableInvoices.length > 0 && (
            <div className="faturas-list__batch-bar">
              <label className="faturas-list__select-all">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  aria-label="Selecionar todas as faturas em aberto exibidas"
                />
                Selecionar todas
              </label>
              {selectedInvoiceIds.size > 0 && (
                <Button type="button" onClick={onRequestBatchPay}>
                  Pagar {selectedInvoiceIds.size}{' '}
                  {selectedInvoiceIds.size === 1 ? 'fatura selecionada' : 'faturas selecionadas'}
                </Button>
              )}
            </div>
          )}
          <ul className="faturas-list__rows">
            {invoices.map((invoice) => {
              const card = cardsById.get(invoice.credit_card_id)
              const isPayable = invoice.displayStatus !== 'paid'
              return (
                <li key={invoice.id} className="faturas-list__row">
                  {isPayable ? (
                    <input
                      type="checkbox"
                      className="faturas-list__checkbox"
                      checked={selectedInvoiceIds.has(invoice.id)}
                      onChange={() => onToggleInvoiceSelected(invoice.id)}
                      aria-label={`Selecionar fatura ${card?.name ?? 'cartão removido'} de ${formatReferenceMonth(invoice.reference_month)}`}
                    />
                  ) : (
                    <span className="faturas-list__checkbox-spacer" aria-hidden="true" />
                  )}
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
