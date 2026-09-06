import { Edit2, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ListTotal } from '../../components/ui/ListTotal'
import { centsToBRL } from '../../utils/currency'
import { formatDateBR } from '../../utils/date'
import type { Account } from '../contas/contas.types'
import type { Category } from '../categorias/categorias.types'
import type { IncomeEntry, IncomeEntryFilters } from './entradas.types'
import './EntradasList.css'

interface EntradasListProps {
  entries: IncomeEntry[]
  accounts: Account[]
  categories: Category[]
  filters: IncomeEntryFilters
  onFiltersChange: (filters: IncomeEntryFilters) => void
  onEdit: (entry: IncomeEntry) => void
  onDelete: (entry: IncomeEntry) => void
}

export function EntradasList({
  entries,
  accounts,
  categories,
  filters,
  onFiltersChange,
  onEdit,
  onDelete,
}: EntradasListProps) {
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

  function handleFilterChange(patch: Partial<IncomeEntryFilters>) {
    setConfirmingId(null)
    onFiltersChange({ ...filters, ...patch })
  }

  function handleDeleteClick(entry: IncomeEntry) {
    if (confirmingId === entry.id) {
      setConfirmingId(null)
      onDelete(entry)
    } else {
      setConfirmingId(entry.id)
    }
  }

  const accountsById = new Map(accounts.map((account) => [account.id, account]))
  const categoriesById = new Map(categories.map((category) => [category.id, category]))
  const hasFilters = !!(filters.accountId || filters.categoryId || filters.from || filters.to)

  return (
    <div className="entradas-list">
      <div className="entradas-list__filters">
        <div className="entradas-list__filter-field">
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
        <div className="entradas-list__filter-field">
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
        <div className="entradas-list__filter-field">
          <label htmlFor="filter-from">De</label>
          <input
            id="filter-from"
            type="date"
            value={filters.from ?? ''}
            onChange={(event) => handleFilterChange({ from: event.target.value || undefined })}
          />
        </div>
        <div className="entradas-list__filter-field">
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
            className="entradas-list__clear-filters"
            onClick={() => handleFilterChange({ accountId: undefined, categoryId: undefined, from: undefined, to: undefined })}
          >
            Limpar filtros
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="entradas-list__empty">
          {hasFilters ? (
            <p>Nenhuma entrada encontrada com esses filtros.</p>
          ) : (
            <>
              <p>Você ainda não tem nenhuma entrada cadastrada.</p>
              <p>Crie a primeira entrada pra começar a acompanhar seus ganhos.</p>
            </>
          )}
        </div>
      ) : (
        <>
          <ListTotal
            items={[
              {
                label: 'Total exibido',
                valueCents: entries.reduce((sum, entry) => sum + entry.amount_cents, 0),
              },
            ]}
          />
          <ul className="entradas-list__rows" ref={rowsRef}>
          {entries.map((entry) => {
            const account = accountsById.get(entry.account_id)
            const category = categoriesById.get(entry.category_id)
            const isConfirming = confirmingId === entry.id
            return (
              <li key={entry.id} className="entradas-list__row">
                <span className="entradas-list__date">{formatDateBR(entry.entry_date)}</span>
                <div className="entradas-list__info">
                  <span className="entradas-list__description">{entry.description}</span>
                  <span className="entradas-list__meta">
                    {category ? `${category.icon ?? '📁'} ${category.name}` : 'Categoria removida'}
                    {' · '}
                    {account?.name ?? 'Conta removida'}
                  </span>
                </div>
                <span className="entradas-list__amount">{centsToBRL(entry.amount_cents)}</span>
                <div className="entradas-list__actions">
                  {isConfirming ? (
                    <>
                      <button
                        type="button"
                        className="entradas-list__confirm-delete"
                        onClick={() => handleDeleteClick(entry)}
                      >
                        Confirmar exclusão?
                      </button>
                      <button
                        type="button"
                        className="entradas-list__cancel-delete"
                        onClick={() => setConfirmingId(null)}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        aria-label={`Editar ${entry.description}`}
                        onClick={() => onEdit(entry)}
                      >
                        <Edit2 size={16} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Excluir ${entry.description}`}
                        onClick={() => handleDeleteClick(entry)}
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
