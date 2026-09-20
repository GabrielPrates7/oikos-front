import { Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { DropdownMenu } from '../../components/ui/DropdownMenu'
import { Pagination } from '../../components/ui/Pagination'
import { FALLBACK_COLOR, getBankColor } from '../../utils/bankColors'
import { centsToBRL } from '../../utils/currency'
import { formatDateBR, formatReferenceMonth, MONTH_NAMES_PT } from '../../utils/date'
import { DEFAULT_PAGE_SIZE } from '../../utils/pagination'
import type { InvoiceSort } from './faturas.service'
import type { CreditCard } from '../cartoes/cartoes.types'
import { EntradasTotalCard } from '../entradas/EntradasTotalCard'
import { InvoiceStatusBadge } from './InvoiceStatusBadge'
import type { InvoiceListItem } from './faturas.types'
import './FaturasList.css'

interface FaturasListProps {
  invoices: InvoiceListItem[]
  cards: CreditCard[]
  selectedCardId: string
  onCardFilterChange: (cardId: string) => void
  search: string
  onSearchChange: (search: string) => void
  monthFilter: string
  onMonthFilterChange: (month: string) => void
  yearFilter: string
  onYearFilterChange: (year: string) => void
  availableYears: string[]
  dueFrom: string
  onDueFromChange: (date: string) => void
  dueTo: string
  onDueToChange: (date: string) => void
  statusFilter: '' | 'unpaid' | 'paid'
  onStatusFilterChange: (status: '' | 'unpaid' | 'paid') => void
  sortOrder: InvoiceSort
  onSortOrderChange: (sort: InvoiceSort) => void
  sumCents: number
  total: number
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  selectedInvoiceIds: Set<string>
  onToggleInvoiceSelected: (invoiceId: string) => void
  onToggleSelectAll: () => void
  onRequestBatchPay: () => void
  onQuickPay: (invoiceId: string) => void
}

export function FaturasList({
  invoices,
  cards,
  selectedCardId,
  onCardFilterChange,
  search,
  onSearchChange,
  monthFilter,
  onMonthFilterChange,
  yearFilter,
  onYearFilterChange,
  availableYears,
  dueFrom,
  onDueFromChange,
  dueTo,
  onDueToChange,
  statusFilter,
  onStatusFilterChange,
  sortOrder,
  onSortOrderChange,
  sumCents,
  total,
  page,
  totalPages,
  onPageChange,
  selectedInvoiceIds,
  onToggleInvoiceSelected,
  onToggleSelectAll,
  onRequestBatchPay,
  onQuickPay,
}: FaturasListProps) {
  const cardsById = new Map(cards.map((card) => [card.id, card]))
  // Filtro de mês, ordenação e paginação são todos resolvidos no servidor agora (mesmo
  // WHERE/ORDER BY, LIMIT/OFFSET por cima) — invoices já chega filtrada, ordenada e paginada,
  // sem reprocessamento client-side.

  // Só faturas ainda não pagas entram no lote — pagar de novo não faz sentido.
  const payableInvoices = invoices.filter((invoice) => invoice.displayStatus !== 'paid')
  const allSelected =
    payableInvoices.length > 0 &&
    payableInvoices.every((invoice) => selectedInvoiceIds.has(invoice.id))

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
            onChange={(event) => onMonthFilterChange(event.target.value)}
          >
            <option value="">Todos</option>
            {MONTH_NAMES_PT.map((name, index) => (
              <option key={name} value={String(index + 1).padStart(2, '0')}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="faturas-list__filter-field">
          <label htmlFor="filter-status">Status</label>
          <select
            id="filter-status"
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value as '' | 'unpaid' | 'paid')}
          >
            <option value="">Todas</option>
            <option value="unpaid">Não pagas</option>
            <option value="paid">Pagas</option>
          </select>
        </div>
        <div className="faturas-list__filter-field">
          <label htmlFor="filter-year">Ano</label>
          <select
            id="filter-year"
            value={yearFilter}
            onChange={(event) => onYearFilterChange(event.target.value)}
          >
            <option value="">Todos</option>
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div className="faturas-list__filter-field">
          <label htmlFor="filter-due-from">Vencimento de</label>
          <input
            id="filter-due-from"
            type="date"
            value={dueFrom}
            onChange={(event) => onDueFromChange(event.target.value)}
          />
        </div>
        <div className="faturas-list__filter-field">
          <label htmlFor="filter-due-to">Vencimento até</label>
          <input
            id="filter-due-to"
            type="date"
            value={dueTo}
            onChange={(event) => onDueToChange(event.target.value)}
          />
        </div>
        <div className="faturas-list__filter-field">
          <label htmlFor="filter-sort">Ordenar por</label>
          <select
            id="filter-sort"
            value={sortOrder}
            onChange={(event) => onSortOrderChange(event.target.value as InvoiceSort)}
          >
            <option value="value_desc">Maior valor primeiro</option>
            <option value="value_asc">Menor valor primeiro</option>
          </select>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="faturas-list__empty">
          {!selectedCardId &&
          !search &&
          !monthFilter &&
          !yearFilter &&
          !statusFilter &&
          !dueFrom &&
          !dueTo ? (
            <>
              <p>Você ainda não tem nenhuma fatura.</p>
              <p>Faturas aparecem aqui assim que você registrar uma compra num cartão.</p>
            </>
          ) : (
            <p>Nenhuma fatura encontrada com esses filtros.</p>
          )}
        </div>
      ) : (
        <>
          <EntradasTotalCard
            tone="red"
            showSparkline={false}
            sumCents={sumCents}
            points={invoices.map((invoice) => ({
              date: invoice.reference_month,
              amountCents: invoice.totalCents,
            }))}
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
            {invoices.map((invoice) => {
              const card = cardsById.get(invoice.credit_card_id)
              const isPayable = invoice.displayStatus !== 'paid'
              // Cor do banco (nome do cartão = nome do banco, ver CartaoVisual) na borda esquerda
              // e no nome; banco desconhecido cai no cinza neutro, mesma regra do AccountBadge.
              const resolvedColor = getBankColor(card?.name)
              const bankColor =
                resolvedColor === FALLBACK_COLOR ? 'var(--color-text-muted)' : resolvedColor.base
              return (
                <div
                  key={invoice.id}
                  className="faturas-grid__card"
                  style={{ '--bank-color': bankColor } as React.CSSProperties}
                >
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
                  <DropdownMenu
                    label={`Mais opções da fatura de ${formatReferenceMonth(invoice.reference_month)}`}
                  >
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
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            totalItems={total}
            pageSize={DEFAULT_PAGE_SIZE}
            itemLabel="faturas"
            alwaysShow
          />
        </>
      )}
    </div>
  )
}
