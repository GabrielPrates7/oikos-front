import { Edit2, Receipt, Tag, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ListTotal } from '../../components/ui/ListTotal'
import { centsToBRL } from '../../utils/currency'
import { formatDateBR } from '../../utils/date'
import type { Account } from '../contas/contas.types'
import type { Category } from '../categorias/categorias.types'
import { PAYMENT_METHOD_LABELS } from './despesas.types'
import type { DespesaListEntry, Expense, ExpenseFilters, PaymentMethod } from './despesas.types'
import './DespesasList.css'

interface DespesasListProps {
  entries: DespesaListEntry[]
  accounts: Account[]
  categories: Category[]
  filters: ExpenseFilters
  onFiltersChange: (filters: ExpenseFilters) => void
  onEdit: (entry: Expense) => void
  onDelete: (entry: Expense) => void
}

const PAYMENT_METHOD_OPTIONS = (
  Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]
).map(([value, label]) => ({ value, label }))

export function DespesasList({
  entries,
  accounts,
  categories,
  filters,
  onFiltersChange,
  onEdit,
  onDelete,
}: DespesasListProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const rowsRef = useRef<HTMLUListElement>(null)

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
    filters.to
  )

  return (
    <div className="despesas-list">
      <div className="despesas-list__filters">
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
              })
            }
          >
            Limpar filtros
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="despesas-list__empty">
          {hasFilters ? (
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
              {
                label: 'Total exibido',
                valueCents: entries.reduce(
                  (sum, entry) => sum + (entry.type === 'expense' ? entry.data.amount_cents : 0),
                  0,
                ),
              },
            ]}
          />
          <ul className="despesas-list__rows" ref={rowsRef}>
            {entries.map((entry) => {
              if (entry.type === 'invoice_payment') {
                return (
                  <li key={`invoice-${entry.id}`} className="despesas-list__row">
                    <span className="despesas-list__date">{formatDateBR(entry.date)}</span>
                    <div className="despesas-list__info">
                      <div className="despesas-list__description-row">
                        <span className="despesas-list__description">{entry.description}</span>
                        <span className="despesas-list__invoice-payment-badge">
                          <Receipt size={12} aria-hidden="true" />
                          Pagamento de fatura
                        </span>
                      </div>
                    </div>
                    <span className="despesas-list__amount">{centsToBRL(entry.amountCents)}</span>
                  </li>
                )
              }

              const expense = entry.data
              const account = accountsById.get(expense.account_id)
              const category = categoriesById.get(expense.category_id)
              const isConfirming = confirmingId === expense.id
              return (
                <li key={expense.id} className="despesas-list__row">
                  <span className="despesas-list__date">{formatDateBR(expense.expense_date)}</span>
                  <div className="despesas-list__info">
                    <div className="despesas-list__description-row">
                      <span className="despesas-list__description">{expense.description}</span>
                      <span className="despesas-list__essential-badge">
                        <Tag size={12} aria-hidden="true" />
                        {expense.is_essential ? 'Essencial' : 'Supérfluo'}
                      </span>
                    </div>
                    <span className="despesas-list__meta">
                      {category ? `${category.icon ?? '📁'} ${category.name}` : 'Categoria removida'}
                      {' · '}
                      {account?.name ?? 'Conta removida'}
                      {' · '}
                      {PAYMENT_METHOD_LABELS[expense.payment_method]}
                    </span>
                  </div>
                  <span className="despesas-list__amount">{centsToBRL(expense.amount_cents)}</span>
                  <div className="despesas-list__actions">
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
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
