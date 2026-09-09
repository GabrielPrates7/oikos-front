import { CircleDollarSign, Copy, Edit2, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ListTotal } from '../../components/ui/ListTotal'
import { Pagination } from '../../components/ui/Pagination'
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
  sumCents: number
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onEdit: (entry: IncomeEntry) => void
  onDelete: (entry: IncomeEntry) => void
  onMarkAsReceived: (entry: IncomeEntry) => void
  onDuplicate: (entry: IncomeEntry) => void
}

// Mesmo padrão de DespesasList.monthFilterToApiParam — 'default' (mês atual) vira undefined
// na chamada da API, 'all' passa direto.
function monthFilterToApiParam(monthFilter: string): string | undefined {
  return monthFilter === 'default' ? undefined : monthFilter
}

export function EntradasList({
  entries,
  accounts,
  categories,
  filters,
  onFiltersChange,
  sumCents,
  page,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
  onMarkAsReceived,
  onDuplicate,
}: EntradasListProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  // Busca client-side, só dentro da página atual — igual antes da paginação em volume
  // (mesma decisão em DespesasList), mas agora restrita aos 20 itens já carregados, já que
  // a busca nunca foi enviada ao servidor.
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
  const hasFilters = !!(
    filters.accountId ||
    filters.categoryId ||
    filters.from ||
    filters.to ||
    filters.month === 'all'
  )

  const visibleEntries = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return entries
    return entries.filter((entry) => entry.description.toLowerCase().includes(query))
  }, [entries, search])

  return (
    <div className="entradas-list">
      <div className="entradas-list__filters">
        <div className="entradas-list__filter-field entradas-list__filter-field--search">
          <label htmlFor="filter-search">Buscar</label>
          <div className="entradas-list__search-input">
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
            onClick={() =>
              handleFilterChange({
                accountId: undefined,
                categoryId: undefined,
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
        <div className="entradas-list__empty">
          {hasFilters || search ? (
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
          <ListTotal items={[{ label: 'Total exibido', valueCents: sumCents }]} />
          <div className="entradas-list__table-wrap">
            <table className="entradas-list__table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Data</th>
                  <th>Conta</th>
                  <th className="entradas-list__col-value">Valor</th>
                  <th className="entradas-list__col-actions">Ações</th>
                </tr>
              </thead>
              <tbody ref={rowsRef}>
                {visibleEntries.map((entry) => {
                  const account = accountsById.get(entry.account_id)
                  const category = categoriesById.get(entry.category_id)
                  const isConfirming = confirmingId === entry.id
                  return (
                    <tr
                      key={entry.id}
                      className={entry.is_received ? undefined : 'entradas-list__row--pending'}
                    >
                      <td className="entradas-list__description">
                        <div className="entradas-list__description-row">
                          <span>{entry.description}</span>
                          {!entry.is_received && (
                            <span className="entradas-list__pending-badge">Pendente</span>
                          )}
                        </div>
                      </td>
                      <td className="entradas-list__meta">
                        {category ? `${category.icon ?? '📁'} ${category.name}` : 'Categoria removida'}
                      </td>
                      <td className="entradas-list__meta">{formatDateBR(entry.entry_date)}</td>
                      <td className="entradas-list__meta">{account?.name ?? 'Conta removida'}</td>
                      <td className="entradas-list__amount">{centsToBRL(entry.amount_cents)}</td>
                      <td className="entradas-list__actions">
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
                            {!entry.is_received && (
                              <button
                                type="button"
                                className="entradas-list__mark-received"
                                aria-label={`Marcar ${entry.description} como recebida`}
                                onClick={() => onMarkAsReceived(entry)}
                              >
                                <CircleDollarSign size={14} aria-hidden="true" />
                                Marcar como recebida
                              </button>
                            )}
                            <button
                              type="button"
                              aria-label={`Duplicar ${entry.description}`}
                              onClick={() => onDuplicate(entry)}
                            >
                              <Copy size={16} aria-hidden="true" />
                            </button>
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
