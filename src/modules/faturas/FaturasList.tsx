import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { DropdownMenu } from '../../components/ui/DropdownMenu'
import { ListTotal } from '../../components/ui/ListTotal'
import { centsToBRL } from '../../utils/currency'
import { currentMonthString, formatDateBR, formatReferenceMonth } from '../../utils/date'
import type { CreditCard } from '../cartoes/cartoes.types'
import { InvoiceStatusBadge } from './InvoiceStatusBadge'
import type { InvoiceListItem } from './faturas.types'
import './FaturasList.css'

type SortOrder = 'highest' | 'lowest'

interface FaturasListProps {
  invoices: InvoiceListItem[]
  cards: CreditCard[]
  selectedCardId: string
  onCardFilterChange: (cardId: string) => void
  search: string
  onSearchChange: (search: string) => void
  selectedInvoiceIds: Set<string>
  onToggleInvoiceSelected: (invoiceId: string) => void
  onToggleSelectAll: () => void
  onRequestBatchPay: () => void
  onQuickPay: (invoiceId: string) => void
}

// reference_month vem como 'YYYY-MM-01' — reduz pra 'YYYY-MM' pra comparar com
// currentMonthString() e com o valor do <select>.
function monthKey(referenceMonth: string): string {
  return referenceMonth.slice(0, 7)
}

export function FaturasList({
  invoices,
  cards,
  selectedCardId,
  onCardFilterChange,
  search,
  onSearchChange,
  selectedInvoiceIds,
  onToggleInvoiceSelected,
  onToggleSelectAll,
  onRequestBatchPay,
  onQuickPay,
}: FaturasListProps) {
  const cardsById = new Map(cards.map((card) => [card.id, card]))
  // Padrão não é só "mês corrente": fatura não paga de mês anterior nunca deveria sumir
  // sozinha por causa do filtro de mês (só some quando é paga, aí sim é passado). 'all'
  // mostra tudo, um mês específico filtra só aquele mês (sem esse bônus de não-pagas).
  const [monthFilter, setMonthFilter] = useState('default')
  const [sortOrder, setSortOrder] = useState<SortOrder>('highest')

  const availableMonths = useMemo(() => {
    const months = new Set(invoices.map((invoice) => monthKey(invoice.reference_month)))
    return Array.from(months).sort((a, b) => b.localeCompare(a))
  }, [invoices])

  const visibleInvoices = useMemo(() => {
    const filtered = invoices.filter((invoice) => {
      if (monthFilter === 'all') return true
      if (monthFilter === 'default') {
        return (
          monthKey(invoice.reference_month) === currentMonthString() ||
          invoice.displayStatus !== 'paid'
        )
      }
      return monthKey(invoice.reference_month) === monthFilter
    })
    const sorted = [...filtered].sort((a, b) =>
      sortOrder === 'highest' ? b.totalCents - a.totalCents : a.totalCents - b.totalCents,
    )
    return sorted
  }, [invoices, monthFilter, sortOrder])

  // Só faturas ainda não pagas entram no lote — pagar de novo não faz sentido.
  const payableInvoices = visibleInvoices.filter((invoice) => invoice.displayStatus !== 'paid')
  const allSelected =
    payableInvoices.length > 0 && payableInvoices.every((invoice) => selectedInvoiceIds.has(invoice.id))

  return (
    <div className="faturas-list">
      <div className="faturas-list__filters">
        <div className="faturas-list__filter-field faturas-list__filter-field--search">
          <label htmlFor="filter-search">Buscar</label>
          <div className="faturas-list__search-input">
            <Search size={14} aria-hidden="true" />
            <input
              id="filter-search"
              type="text"
              placeholder="Buscar por descrição da compra..."
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
        </div>
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
        <div className="faturas-list__filter-field">
          <label htmlFor="filter-month">Mês</label>
          <select
            id="filter-month"
            value={monthFilter}
            onChange={(event) => setMonthFilter(event.target.value)}
          >
            <option value="default">Mês atual + não pagas</option>
            <option value="all">Todos os meses</option>
            {availableMonths.map((month) => (
              <option key={month} value={month}>
                {formatReferenceMonth(`${month}-01`)}
              </option>
            ))}
          </select>
        </div>
        <div className="faturas-list__filter-field">
          <label htmlFor="filter-sort">Ordenar por</label>
          <select
            id="filter-sort"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value as SortOrder)}
          >
            <option value="highest">Maior valor primeiro</option>
            <option value="lowest">Menor valor primeiro</option>
          </select>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="faturas-list__empty">
          {selectedCardId || search ? (
            <p>Nenhuma fatura encontrada pra esse filtro.</p>
          ) : (
            <>
              <p>Você ainda não tem nenhuma fatura.</p>
              <p>Faturas aparecem aqui assim que você registrar uma compra num cartão.</p>
            </>
          )}
        </div>
      ) : visibleInvoices.length === 0 ? (
        <div className="faturas-list__empty">
          <p>Nenhuma fatura encontrada com esses filtros.</p>
        </div>
      ) : (
        <>
          <ListTotal
            items={[
              {
                label: 'Total exibido',
                valueCents: visibleInvoices.reduce((sum, invoice) => sum + invoice.totalCents, 0),
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
          <div className="faturas-grid">
            {visibleInvoices.map((invoice) => {
              const card = cardsById.get(invoice.credit_card_id)
              const isPayable = invoice.displayStatus !== 'paid'
              return (
                <div key={invoice.id} className="faturas-grid__card">
                  {isPayable ? (
                    <input
                      type="checkbox"
                      className="faturas-grid__checkbox"
                      checked={selectedInvoiceIds.has(invoice.id)}
                      onChange={() => onToggleInvoiceSelected(invoice.id)}
                      aria-label={`Selecionar fatura ${card?.name ?? 'cartão removido'} de ${formatReferenceMonth(invoice.reference_month)}`}
                    />
                  ) : (
                    <span className="faturas-grid__checkbox-spacer" aria-hidden="true" />
                  )}
                  <Link to={`/faturas/${invoice.id}`} className="faturas-grid__body">
                    <div className="faturas-grid__header">
                      <span className="faturas-grid__card-name">
                        {card?.name ?? 'Cartão removido'}
                      </span>
                      <span className="faturas-grid__reference">
                        {formatReferenceMonth(invoice.reference_month)}
                      </span>
                    </div>
                    <span className="faturas-grid__total">{centsToBRL(invoice.totalCents)}</span>
                    <div className="faturas-grid__meta">
                      <InvoiceStatusBadge status={invoice.displayStatus} />
                      <span className="faturas-grid__due">
                        Vence {formatDateBR(invoice.due_date)}
                      </span>
                    </div>
                  </Link>
                  <DropdownMenu label={`Mais opções da fatura de ${formatReferenceMonth(invoice.reference_month)}`}>
                    {(close) => (
                      <>
                        <Link
                          to={`/faturas/${invoice.id}`}
                          className="dropdown-menu__item"
                          role="menuitem"
                          onClick={close}
                        >
                          Ver detalhe
                        </Link>
                        {isPayable && (
                          <button
                            type="button"
                            className="dropdown-menu__item"
                            role="menuitem"
                            onClick={() => {
                              close()
                              onQuickPay(invoice.id)
                            }}
                          >
                            Pagar
                          </button>
                        )}
                      </>
                    )}
                  </DropdownMenu>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
