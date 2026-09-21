import { CircleDollarSign, Copy, Edit2, Receipt, Search, Tag, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AccountBadge } from '../../components/ui/AccountBadge'
import { Combobox } from '../../components/ui/Combobox'
import { SegmentedControl } from '../../components/reports/SegmentedControl'
import { ListFilterRow } from '../../components/ui/ListFilterRow'
import { Pagination } from '../../components/ui/Pagination'
import { centsToBRL } from '../../utils/currency'
import { DEFAULT_PAGE_SIZE } from '../../utils/pagination'
import {
  ALL_MONTHS,
  describePeriod,
  isAllMonths,
  isAllPeriods,
  periodFiltersOffDefault,
  splitPeriod,
  withMonthSelected,
  withYearSelected,
} from '../../utils/period'
import { currentMonthString, formatDateBR, MONTH_NAMES_PT } from '../../utils/date'
import type { Account } from '../contas/contas.types'
import type { Category } from '../categorias/categorias.types'
import { PAYMENT_METHOD_LABELS } from './despesas.types'
import type {
  DespesaListEntry,
  Expense,
  ExpenseEssentialFilter,
  ExpenseFilters,
  ExpensePlannedFilter,
  ExpenseStatusFilter,
  MonthlySummary,
  PaymentMethod,
} from './despesas.types'
import { DespesasTotalCards } from './DespesasTotalCards'
import './DespesasList.css'

interface DespesasListProps {
  entries: DespesaListEntry[]
  accounts: Account[]
  categories: Category[]
  years: number[]
  filters: ExpenseFilters
  onFiltersChange: (filters: ExpenseFilters) => void
  summary: MonthlySummary
  // Soma da LISTA (resposta de /expenses): pagas que contam no total — ou, com Situação =
  // Pendentes (sumMode 'pending'), as pendentes. Independente de `summary`, que é do mês.
  sumCents: number
  sumMode: 'pending' | 'default'
  total: number
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onEdit: (entry: Expense) => void
  onDelete: (entry: Expense) => void
  onMarkAsPaid: (entry: Expense) => void
  onDuplicate: (entry: Expense) => void
}

const PAYMENT_METHOD_OPTIONS = (
  Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]
).map(([value, label]) => ({ value, label }))

function entryDescription(entry: DespesaListEntry): string {
  return entry.type === 'expense' ? entry.data.description : entry.description
}

export function DespesasList({
  entries,
  accounts,
  categories,
  years,
  filters,
  onFiltersChange,
  summary,
  sumCents,
  sumMode,
  total,
  page,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
  onMarkAsPaid,
  onDuplicate,
}: DespesasListProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  // Busca client-side — o volume de despesas de um usuário não justifica ida ao servidor
  // (mesma decisão em EntradasList).
  const [search, setSearch] = useState('')
  const rowsRef = useRef<HTMLTableSectionElement>(null)

  useEffect(() => {
    if (!confirmingId) return

    function handlePointerDown(event: MouseEvent) {
      if (!rowsRef.current?.contains(event.target as Node)) {
        setConfirmingId(null)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [confirmingId])

  function handleFilterChange(patch: Partial<ExpenseFilters>) {
    setConfirmingId(null)
    onFiltersChange({ ...filters, ...patch })
  }

  function handleDeleteClick(entry: Expense) {
    if (confirmingId === entry.id) {
      setConfirmingId(null)
      onDelete(entry)
    } else {
      setConfirmingId(entry.id)
    }
  }

  const accountsById = new Map(accounts.map((account) => [account.id, account]))
  const categoriesById = new Map(categories.map((category) => [category.id, category]))
  const { year: selectedYear, monthNum: selectedMonthNum } = splitPeriod(filters.month)
  // Filtros que restringem a LISTA (Mês/Ano isolados não contam): ligam o "Total filtrado".
  const listFilterCount = [
    filters.status,
    filters.essential,
    filters.planned,
    filters.accountId,
    filters.categoryId,
    filters.paymentMethod,
    filters.from,
    filters.to,
  ].filter(Boolean).length
  // Contador de filtros ativos: os de cima + Mês/Ano FORA do padrão (mês e ano correntes;
  // "Todos" conta). "Limpar filtros" volta tudo ao padrão.
  const activeFilterCount = listFilterCount + periodFiltersOffDefault(filters.month)
  const hasFilters = activeFilterCount > 0
  const isPendingMode = sumMode === 'pending'
  // Pendentes com Mês/Ano (sem De/Até) mostra só aquele período — avisa, com atalho pra ampliar.
  const showPeriodHint = filters.status === 'pending' && !filters.from && !filters.to

  function handleClearFilters() {
    handleFilterChange({
      accountId: undefined,
      categoryId: undefined,
      paymentMethod: undefined,
      status: undefined,
      essential: undefined,
      planned: undefined,
      from: undefined,
      to: undefined,
      month: currentMonthString(),
    })
  }

  const visibleEntries = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return entries
    return entries.filter((entry) => entryDescription(entry).toLowerCase().includes(query))
  }, [entries, search])

  return (
    <div className="despesas-list">
      <div className="despesas-list__filters">
        <div className="despesas-list__filter-field despesas-list__filter-field--search">
          <label htmlFor="filter-search">Buscar</label>
          <div className="despesas-list__search-input">
            <Search size={14} aria-hidden="true" />
            <input
              id="filter-search"
              type="text"
              placeholder="Buscar por descrição..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
        <div className="despesas-list__filter-field">
          <label htmlFor="filter-account">Conta</label>
          <Combobox
            id="filter-account"
            value={filters.accountId ?? ''}
            onChange={(value) => handleFilterChange({ accountId: value || undefined })}
            options={[
              { value: '', label: 'Todas' },
              ...accounts.map((account) => ({ value: account.id, label: account.name })),
            ]}
          />
        </div>
        <div className="despesas-list__filter-field">
          <label htmlFor="filter-category">Categoria</label>
          <Combobox
            id="filter-category"
            value={filters.categoryId ?? ''}
            onChange={(value) => handleFilterChange({ categoryId: value || undefined })}
            options={[
              { value: '', label: 'Todas' },
              ...categories.map((category) => ({
                value: category.id,
                label: `${category.icon ?? '📁'} ${category.name}`,
              })),
            ]}
          />
        </div>
        <div className="despesas-list__filter-field">
          <label htmlFor="filter-payment-method">Forma de pagamento</label>
          <select
            id="filter-payment-method"
            value={filters.paymentMethod ?? ''}
            onChange={(event) =>
              handleFilterChange({
                paymentMethod: (event.target.value || undefined) as PaymentMethod | undefined,
              })
            }
          >
            <option value="">Todas</option>
            {PAYMENT_METHOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="despesas-list__filter-field">
          <label htmlFor="filter-month">Mês</label>
          <select
            id="filter-month"
            value={selectedMonthNum}
            onChange={(event) =>
              handleFilterChange({ month: withMonthSelected(filters.month, event.target.value) })
            }
          >
            <option value={ALL_MONTHS}>Todos</option>
            {MONTH_NAMES_PT.map((name, index) => (
              <option key={name} value={String(index + 1).padStart(2, '0')}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="despesas-list__filter-field">
          <label htmlFor="filter-year">Ano</label>
          <select
            id="filter-year"
            value={selectedYear}
            onChange={(event) =>
              handleFilterChange({ month: withYearSelected(filters.month, event.target.value) })
            }
          >
            <option value={ALL_MONTHS}>Todos</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div className="despesas-list__filter-field">
          <label htmlFor="filter-from">De</label>
          <input
            id="filter-from"
            type="date"
            value={filters.from ?? ''}
            onChange={(event) => handleFilterChange({ from: event.target.value || undefined })}
          />
        </div>
        <div className="despesas-list__filter-field">
          <label htmlFor="filter-to">Até</label>
          <input
            id="filter-to"
            type="date"
            value={filters.to ?? ''}
            onChange={(event) => handleFilterChange({ to: event.target.value || undefined })}
          />
        </div>
        {hasFilters && (
          <button
            type="button"
            className="despesas-list__clear-filters"
            onClick={handleClearFilters}
          >
            Limpar filtros ({activeFilterCount})
          </button>
        )}
        <ListFilterRow label="Situação e classificação">
          <SegmentedControl<ExpenseStatusFilter | 'all'>
            label="Situação"
            tone="red"
            stretch
            value={filters.status ?? 'all'}
            options={[
              { value: 'all', label: 'Todas' },
              { value: 'pending', label: 'Pendentes', accent: 'red' },
              { value: 'paid', label: 'Pagas' },
            ]}
            onChange={(value) =>
              handleFilterChange({ status: value === 'all' ? undefined : value })
            }
          />
          <SegmentedControl<ExpenseEssentialFilter | 'all'>
            label="Tipo"
            tone="red"
            stretch
            value={filters.essential ?? 'all'}
            options={[
              { value: 'all', label: 'Todas' },
              { value: 'essential', label: 'Essencial' },
              { value: 'superfluous', label: 'Supérfluo' },
            ]}
            onChange={(value) =>
              handleFilterChange({ essential: value === 'all' ? undefined : value })
            }
          />
          <SegmentedControl<ExpensePlannedFilter | 'all'>
            label="Planejamento"
            tone="red"
            stretch
            value={filters.planned ?? 'all'}
            options={[
              { value: 'all', label: 'Todas' },
              { value: 'planned', label: 'Planejada' },
              { value: 'unplanned', label: 'Não planejada' },
            ]}
            onChange={(value) =>
              handleFilterChange({ planned: value === 'all' ? undefined : value })
            }
          />
          {showPeriodHint && (
            <p className="despesas-list__period-hint" role="status">
              Mostrando pendentes de {describePeriod(filters.month)}.
              {!isAllPeriods(filters.month) && (
                <>
                  {' '}
                  <button type="button" onClick={() => handleFilterChange({ month: ALL_MONTHS })}>
                    Ver de todos os meses
                  </button>
                </>
              )}
            </p>
          )}
        </ListFilterRow>
      </div>

      {visibleEntries.length === 0 ? (
        <div className="despesas-list__empty">
          {hasFilters || search ? (
            <>
              <p>Nenhum lançamento corresponde aos filtros.</p>
              <button
                type="button"
                className="despesas-list__clear-filters"
                onClick={() => {
                  setSearch('')
                  handleClearFilters()
                }}
              >
                Limpar filtros
              </button>
            </>
          ) : (
            <>
              <p>Você ainda não tem nenhuma despesa cadastrada.</p>
              <p>Crie a primeira despesa pra começar a acompanhar seus gastos.</p>
            </>
          )}
        </div>
      ) : (
        <>
          <DespesasTotalCards
            summary={summary}
            title={
              isAllPeriods(filters.month)
                ? 'Resumo de todos os períodos'
                : isAllMonths(filters.month)
                  ? `Resumo de todos os períodos (a lista mostra só ${selectedYear})`
                  : undefined
            }
          />
          <div className="despesas-list__table-wrap">
            {listFilterCount > 0 && (
              <p
                className="despesas-list__filtered-total"
                title={
                  isPendingMode
                    ? 'Soma das despesas ainda não pagas que aparecem com os filtros atuais (respeita "Contar no total").'
                    : 'Soma apenas das despesas pagas que contam no total; pendentes não entram'
                }
              >
                {isPendingMode ? (
                  <>
                    {total} {total === 1 ? 'pendente' : 'pendentes'} ·{' '}
                    <strong>{centsToBRL(sumCents)}</strong>
                  </>
                ) : (
                  <>
                    {total} {total === 1 ? 'despesa' : 'despesas'} ·{' '}
                    <strong>{centsToBRL(sumCents)}</strong> pagas
                  </>
                )}
              </p>
            )}
            <table className="despesas-list__table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Data</th>
                  <th>Conta</th>
                  <th className="despesas-list__col-value">Valor</th>
                  <th className="despesas-list__col-actions">Ações</th>
                </tr>
              </thead>
              <tbody ref={rowsRef}>
                {visibleEntries.map((entry) => {
                  if (entry.type === 'invoice_payment') {
                    return (
                      <tr key={`invoice-${entry.id}`}>
                        <td className="despesas-list__description">
                          <div className="despesas-list__description-row">
                            <span>{entry.description}</span>
                            <span className="despesas-list__invoice-payment-badge">
                              <Receipt size={12} aria-hidden="true" />
                              Pagamento de fatura
                            </span>
                          </div>
                        </td>
                        <td className="despesas-list__meta">—</td>
                        <td className="despesas-list__meta">{formatDateBR(entry.date)}</td>
                        <td className="despesas-list__meta">—</td>
                        <td className="despesas-list__amount">{centsToBRL(entry.amountCents)}</td>
                        <td className="despesas-list__actions" />
                      </tr>
                    )
                  }

                  if (entry.type === 'unpaid_invoice') {
                    return (
                      <tr
                        key={`unpaid-invoice-${entry.id}`}
                        className="despesas-list__row--pending"
                      >
                        <td className="despesas-list__description">
                          <div className="despesas-list__description-row">
                            <span>{entry.description}</span>
                            <span className="despesas-list__invoice-open-badge">
                              <Receipt size={12} aria-hidden="true" />
                              Fatura em aberto
                            </span>
                          </div>
                        </td>
                        <td className="despesas-list__meta">—</td>
                        <td className="despesas-list__meta">{formatDateBR(entry.date)}</td>
                        <td className="despesas-list__meta">—</td>
                        <td className="despesas-list__amount">{centsToBRL(entry.amountCents)}</td>
                        <td className="despesas-list__actions">
                          <Link to={`/faturas/${entry.id}`} className="despesas-list__view-invoice">
                            Ver fatura
                          </Link>
                        </td>
                      </tr>
                    )
                  }

                  const expense = entry.data
                  const account = accountsById.get(expense.account_id)
                  const category = categoriesById.get(expense.category_id)
                  const isConfirming = confirmingId === expense.id
                  return (
                    <tr
                      key={expense.id}
                      className={
                        expense.is_paid ? undefined : 'despesas-list__row--pending'
                      }
                    >
                      <td className="despesas-list__description">
                        <div className="despesas-list__description-row">
                          <span>{expense.description}</span>
                          <span className="despesas-list__essential-badge">
                            <Tag size={12} aria-hidden="true" />
                            {expense.is_essential ? 'Essencial' : 'Supérfluo'}
                          </span>
                          {!expense.is_paid && (
                            <span className="despesas-list__pending-badge">Pendente</span>
                          )}
                        </div>
                      </td>
                      <td className="despesas-list__meta">
                        {category ? `${category.icon ?? '📁'} ${category.name}` : 'Categoria removida'}
                      </td>
                      <td className="despesas-list__meta">{formatDateBR(expense.expense_date)}</td>
                      <td className="despesas-list__meta despesas-list__account">
                        {account ? (
                          <AccountBadge
                            name={account.name}
                            bankName={account.bank_name}
                            color={account.color}
                          />
                        ) : (
                          'Conta removida'
                        )}
                        {' · '}
                        {PAYMENT_METHOD_LABELS[expense.payment_method]}
                      </td>
                      <td className="despesas-list__amount">{centsToBRL(expense.amount_cents)}</td>
                      <td className="despesas-list__actions">
                        {isConfirming ? (
                          <>
                            <button
                              type="button"
                              className="despesas-list__confirm-delete"
                              onClick={() => handleDeleteClick(expense)}
                            >
                              Confirmar exclusão?
                            </button>
                            <button
                              type="button"
                              className="despesas-list__cancel-delete"
                              onClick={() => setConfirmingId(null)}
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            {!expense.is_paid && (
                              <button
                                type="button"
                                className="despesas-list__mark-paid"
                                aria-label={`Marcar ${expense.description} como pago`}
                                onClick={() => onMarkAsPaid(expense)}
                              >
                                <CircleDollarSign size={14} aria-hidden="true" />
                                Marcar como pago
                              </button>
                            )}
                            <button
                              type="button"
                              aria-label={`Duplicar ${expense.description}`}
                              onClick={() => onDuplicate(expense)}
                            >
                              <Copy size={16} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Editar ${expense.description}`}
                              onClick={() => onEdit(expense)}
                            >
                              <Edit2 size={16} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Excluir ${expense.description}`}
                              onClick={() => handleDeleteClick(expense)}
                            >
                              <Trash2 size={16} aria-hidden="true" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            totalItems={total}
            pageSize={DEFAULT_PAGE_SIZE}
            itemLabel="despesas"
            alwaysShow
          />
        </>
      )}
    </div>
  )
}
