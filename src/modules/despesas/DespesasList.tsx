import { CircleDollarSign, Copy, Edit2, Receipt, Search, Tag, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ListTotal } from '../../components/ui/ListTotal'
import { Pagination } from '../../components/ui/Pagination'
import { centsToBRL } from '../../utils/currency'
import { formatDateBR } from '../../utils/date'
import type { Account } from '../contas/contas.types'
import type { Category } from '../categorias/categorias.types'
import { PAYMENT_METHOD_LABELS } from './despesas.types'
import type {
  DespesaListEntry,
  Expense,
  ExpenseFilters,
  MonthlySummary,
  PaymentMethod,
} from './despesas.types'
import './DespesasList.css'

interface DespesasListProps {
  entries: DespesaListEntry[]
  accounts: Account[]
  categories: Category[]
  filters: ExpenseFilters
  onFiltersChange: (filters: ExpenseFilters) => void
  summary: MonthlySummary
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onEdit: (entry: Expense) => void
  onDelete: (entry: Expense) => void
  onMarkAsPaid: (entry: Expense) => void
  onDuplicate: (entry: Expense) => void
}

// Valor do <select> de mês na UI: 'default' (mês atual) vira undefined na chamada da API;
// 'all' (sem filtro de mês) passa direto. Mesmo padrão de FaturasPage.monthFilterToApiParam,
// só sem a lista de meses específicos (não pedida aqui).
function monthFilterToApiParam(monthFilter: string): string | undefined {
  return monthFilter === 'default' ? undefined : monthFilter
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
  filters,
  onFiltersChange,
  summary,
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
  const hasFilters = !!(
    filters.accountId ||
    filters.categoryId ||
    filters.paymentMethod ||
    filters.from ||
    filters.to ||
    filters.month === 'all'
  )

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
          <select
            id="filter-account"
            value={filters.accountId ?? ''}
            onChange={(event) => handleFilterChange({ accountId: event.target.value || undefined })}
          >
            <option value="">Todas</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>
        <div className="despesas-list__filter-field">
          <label htmlFor="filter-category">Categoria</label>
          <select
            id="filter-category"
            value={filters.categoryId ?? ''}
            onChange={(event) =>
              handleFilterChange({ categoryId: event.target.value || undefined })
            }
          >
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon ?? '📁'} {category.name}
              </option>
            ))}
          </select>
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
            value={filters.month ?? 'default'}
            onChange={(event) => handleFilterChange({ month: monthFilterToApiParam(event.target.value) })}
          >
            <option value="default">Mês atual</option>
            <option value="all">Todos os meses</option>
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
            onClick={() =>
              handleFilterChange({
                accountId: undefined,
                categoryId: undefined,
                paymentMethod: undefined,
                from: undefined,
                to: undefined,
                month: undefined,
              })
            }
          >
            Limpar filtros
          </button>
        )}
      </div>

      {visibleEntries.length === 0 ? (
        <div className="despesas-list__empty">
          {hasFilters || search ? (
            <p>Nenhuma despesa encontrada com esses filtros.</p>
          ) : (
            <>
              <p>Você ainda não tem nenhuma despesa cadastrada.</p>
              <p>Crie a primeira despesa pra começar a acompanhar seus gastos.</p>
            </>
          )}
        </div>
      ) : (
        <>
          <ListTotal
            items={[
              { label: 'Geral', valueCents: summary.totalGeralCents },
              { label: 'Já pago', valueCents: summary.totalPagoCents },
              { label: 'Falta pagar', valueCents: summary.totalFaltaPagarCents },
            ]}
          />
          <div className="despesas-list__table-wrap">
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
                      <td className="despesas-list__meta">
                        {account?.name ?? 'Conta removida'}
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
          <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        </>
      )}
    </div>
  )
}
