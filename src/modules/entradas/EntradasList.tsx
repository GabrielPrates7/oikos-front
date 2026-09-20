import { CircleDollarSign, Copy, Edit2, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Combobox } from '../../components/ui/Combobox'
import { AccountBadge } from '../../components/ui/AccountBadge'
import { CategoryBadge } from '../../components/ui/CategoryBadge'
import { Pagination } from '../../components/ui/Pagination'
import { assignCategoryColors } from '../../utils/chartColors'
import { centsToBRL } from '../../utils/currency'
import { currentMonthString, formatDateBR, MONTH_NAMES_PT, splitMonthString } from '../../utils/date'
import { DEFAULT_PAGE_SIZE } from '../../utils/pagination'
import type { Account } from '../contas/contas.types'
import type { Category } from '../categorias/categorias.types'
import { EntradasTotalCard } from './EntradasTotalCard'
import type { IncomeEntry, IncomeEntryFilters } from './entradas.types'
import './EntradasList.css'

interface EntradasListProps {
  entries: IncomeEntry[]
  accounts: Account[]
  categories: Category[]
  years: number[]
  filters: IncomeEntryFilters
  onFiltersChange: (filters: IncomeEntryFilters) => void
  sumCents: number
  page: number
  total: number
  totalPages: number
  onPageChange: (page: number) => void
  onEdit: (entry: IncomeEntry) => void
  onDelete: (entry: IncomeEntry) => void
  onMarkAsReceived: (entry: IncomeEntry) => void
  onDuplicate: (entry: IncomeEntry) => void
}

export function EntradasList({
  entries,
  accounts,
  categories,
  years,
  filters,
  onFiltersChange,
  sumCents,
  page,
  total,
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
  // Em LOTE com a lista completa de categorias — mesma correção aplicada em
  // SpendingTrendsChart.tsx pro mesmo tipo de bug (cor por item isolado permite colisão
  // que assignCategoryColors só evita vendo o conjunto inteiro de uma vez).
  const categoryColors = assignCategoryColors(categories.map((category) => category.name))
  // month não entra aqui — agora é sempre um valor concreto (navegação normal, tipo o
  // MonthSwitcher do Dashboard), não um "filtro ativo" que precise do botão de limpar.
  const hasFilters = !!(filters.accountId || filters.categoryId || filters.from || filters.to)
  const { year: selectedYear, monthNum: selectedMonthNum } = splitMonthString(
    filters.month ?? currentMonthString(),
  )

  const visibleEntries = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return entries
    return entries.filter((entry) => entry.description.toLowerCase().includes(query))
  }, [entries, search])

  return (
    <div className="entradas-list">
      <div className="entradas-list__filters-panel">
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
        <div className="entradas-list__filter-field">
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
        <div className="entradas-list__filter-field">
          <label htmlFor="filter-month">Mês</label>
          <select
            id="filter-month"
            value={selectedMonthNum}
            onChange={(event) =>
              handleFilterChange({ month: `${selectedYear}-${event.target.value}` })
            }
          >
            {MONTH_NAMES_PT.map((name, index) => (
              <option key={name} value={String(index + 1).padStart(2, '0')}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="entradas-list__filter-field">
          <label htmlFor="filter-year">Ano</label>
          <select
            id="filter-year"
            value={selectedYear}
            onChange={(event) =>
              handleFilterChange({ month: `${event.target.value}-${selectedMonthNum}` })
            }
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
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
            onClick={() =>
              handleFilterChange({
                accountId: undefined,
                categoryId: undefined,
                from: undefined,
                to: undefined,
                month: currentMonthString(),
              })
            }
          >
            Limpar filtros
          </button>
        )}
      </div>
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
          <EntradasTotalCard
            sumCents={sumCents}
            points={visibleEntries.map((entry) => ({
              date: entry.entry_date,
              amountCents: entry.amount_cents,
            }))}
          />
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
                        {category ? (
                          <CategoryBadge
                            name={category.name}
                            icon={category.icon}
                            color={categoryColors.get(category.name) ?? 'var(--color-text-muted)'}
                          />
                        ) : (
                          'Categoria removida'
                        )}
                      </td>
                      <td className="entradas-list__meta">{formatDateBR(entry.entry_date)}</td>
                      <td className="entradas-list__meta">
                        {account ? (
                          <AccountBadge
                            name={account.name}
                            bankName={account.bank_name}
                            color={account.color}
                          />
                        ) : (
                          'Conta removida'
                        )}
                      </td>
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
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            totalItems={total}
            pageSize={DEFAULT_PAGE_SIZE}
            itemLabel="entradas"
            alwaysShow
          />
        </>
      )}
    </div>
  )
}
