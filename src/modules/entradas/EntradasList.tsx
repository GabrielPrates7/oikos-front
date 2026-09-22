import { CircleDollarSign, Copy, Edit2, SlidersHorizontal, Search, Trash2 } from 'lucide-react'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Combobox } from '../../components/ui/Combobox'
import { AccountBadge } from '../../components/ui/AccountBadge'
import { CategoryBadge } from '../../components/ui/CategoryBadge'
import { SegmentedControl } from '../../components/reports/SegmentedControl'
import { ListFilterRow } from '../../components/ui/ListFilterRow'
import { FilterSheet } from '../../components/ui/FilterSheet'
import { FixedBadge } from '../../components/ui/FixedBadge'
import { ListItemCard } from '../../components/ui/ListItemCard'
import { Pagination } from '../../components/ui/Pagination'
import { NotesText, NotesToggle } from '../../components/ui/RowNotes'
import { useOpenNotes } from '../../components/ui/useOpenNotes'
import { useIsMobile } from '../../components/layout/useIsMobile'
import { assignCategoryColors } from '../../utils/chartColors'
import { centsToBRL } from '../../utils/currency'
import { currentMonthString, formatDateBR, MONTH_NAMES_PT } from '../../utils/date'
import { DEFAULT_PAGE_SIZE } from '../../utils/pagination'
import {
  ALL_MONTHS,
  describePeriod,
  isAllPeriods,
  periodFiltersOffDefault,
  splitPeriod,
  withMonthSelected,
  withYearSelected,
} from '../../utils/period'
import type { Account } from '../contas/contas.types'
import type { Category } from '../categorias/categorias.types'
import { EntradasTotalCard } from './EntradasTotalCard'
import type {
  FixedFilter,
  IncomeEntry,
  IncomeEntryFilters,
  IncomeStatusFilter,
} from './entradas.types'
import './EntradasList.css'

interface EntradasListProps {
  entries: IncomeEntry[]
  accounts: Account[]
  categories: Category[]
  years: number[]
  filters: IncomeEntryFilters
  onFiltersChange: (filters: IncomeEntryFilters) => void
  sumCents: number
  // 'pending' = a lista está filtrada por Situação = Pendentes e sumCents é a soma dos pendentes.
  sumMode: 'pending' | 'default'
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
  sumMode,
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
  const notes = useOpenNotes()
  const rowsRef = useRef<HTMLTableSectionElement>(null)
  const isMobile = useIsMobile()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const filtersButtonRef = useRef<HTMLButtonElement>(null)

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
  const { year: selectedYear, monthNum: selectedMonthNum } = splitPeriod(filters.month)
  // Contador de filtros ativos: os filtros de sempre + Situação + Mês/Ano FORA do padrão (mês e
  // ano correntes; "Todos" conta). "Limpar filtros" volta tudo ao padrão.
  const activeFilterCount =
    [
      filters.accountId,
      filters.categoryId,
      filters.from,
      filters.to,
      filters.status,
      filters.fixed,
    ].filter(Boolean).length + periodFiltersOffDefault(filters.month)
  const hasFilters = activeFilterCount > 0
  const isPendingMode = sumMode === 'pending'
  // Pendentes com Mês/Ano (sem De/Até) mostra só aquele período — avisa, com atalho pra ampliar.
  const showPeriodHint = filters.status === 'pending' && !filters.from && !filters.to

  function handleClearFilters() {
    handleFilterChange({
      accountId: undefined,
      categoryId: undefined,
      status: undefined,
      fixed: undefined,
      from: undefined,
      to: undefined,
      month: currentMonthString(),
    })
  }

  const visibleEntries = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return entries
    // Busca no navegador, só na página atual: descrição OU observação.
    return entries.filter(
      (entry) =>
        entry.description.toLowerCase().includes(query) ||
        (entry.notes ?? '').toLowerCase().includes(query),
    )
  }, [entries, search])

  const searchField = (
    <div className="entradas-list__filter-field entradas-list__filter-field--search">
      <label htmlFor="filter-search">Buscar</label>
      <div className="entradas-list__search-input">
        <Search size={14} aria-hidden="true" />
        <input
          id="filter-search"
          type="text"
          placeholder="Buscar por descrição ou observação..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
    </div>
  )

  const otherFilterFields = (
    <>
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
      <div className="entradas-list__filter-field">
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
    </>
  )

  const situationFields = (
    <ListFilterRow label="Situação e classificação">
      <SegmentedControl<IncomeStatusFilter | 'all'>
        label="Situação"
        stretch
        value={filters.status ?? 'all'}
        options={[
          { value: 'all', label: 'Todas' },
          { value: 'pending', label: 'Pendentes', accent: 'gold' },
          { value: 'received', label: 'Recebidas' },
        ]}
        onChange={(value) => handleFilterChange({ status: value === 'all' ? undefined : value })}
      />
      <SegmentedControl<FixedFilter | 'all'>
        label="Recorrência"
        stretch
        value={filters.fixed ?? 'all'}
        options={[
          { value: 'all', label: 'Todas' },
          { value: 'fixed', label: 'Fixas' },
          { value: 'unfixed', label: 'Não fixas' },
        ]}
        onChange={(value) => handleFilterChange({ fixed: value === 'all' ? undefined : value })}
      />
      {showPeriodHint && (
        <p className="entradas-list__period-hint" role="status">
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
  )

  return (
    <div className="entradas-list">
      {isMobile ? (
        <div className="entradas-list__mobile-toolbar">
          {searchField}
          <button
            type="button"
            ref={filtersButtonRef}
            className="entradas-list__filters-trigger"
            onClick={() => setFiltersOpen(true)}
          >
            <SlidersHorizontal size={16} aria-hidden="true" />
            Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>
        </div>
      ) : (
        <div className="entradas-list__filters-panel">
          <div className="entradas-list__filters">
            {searchField}
            {otherFilterFields}
            {hasFilters && (
              <button
                type="button"
                className="entradas-list__clear-filters"
                onClick={handleClearFilters}
              >
                Limpar filtros ({activeFilterCount})
              </button>
            )}
          </div>
          {situationFields}
        </div>
      )}

      <FilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onApply={() => setFiltersOpen(false)}
        onClear={handleClearFilters}
        hasFilters={hasFilters}
        triggerRef={filtersButtonRef}
      >
        <div className="entradas-list__filters">{otherFilterFields}</div>
        {situationFields}
      </FilterSheet>

      {visibleEntries.length === 0 ? (
        <div className="entradas-list__empty">
          {hasFilters || search ? (
            <>
              <p>Nenhum lançamento corresponde aos filtros.</p>
              <button
                type="button"
                className="entradas-list__clear-filters"
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
              <p>Você ainda não tem nenhuma entrada cadastrada.</p>
              <p>Crie a primeira entrada pra começar a acompanhar seus ganhos.</p>
            </>
          )}
        </div>
      ) : (
        <>
          <EntradasTotalCard
            sumCents={sumCents}
            label={isPendingMode ? 'Total pendente' : undefined}
            title={
              isPendingMode
                ? 'Soma das entradas ainda não recebidas que aparecem com os filtros atuais (respeita "Contar no total").'
                : undefined
            }
            showTrend={!isPendingMode}
            points={visibleEntries.map((entry) => ({
              date: entry.entry_date,
              amountCents: entry.amount_cents,
            }))}
          />
          {isMobile ? (
            <div className="entradas-list__cards-wrap">
              <ul className="list-item-card-list">
                {visibleEntries.map((entry) => {
                  const account = accountsById.get(entry.account_id)
                  const category = categoriesById.get(entry.category_id)
                  const isConfirming = confirmingId === entry.id
                  return (
                    <ListItemCard
                      key={entry.id}
                      date={formatDateBR(entry.entry_date)}
                      title={entry.description}
                      badges={
                        <>
                          {entry.notes && (
                            <NotesToggle
                              panelId={`notes-${entry.id}`}
                              open={notes.isOpen(entry.id)}
                              onToggle={() => notes.toggle(entry.id)}
                            />
                          )}
                          {entry.is_fixed && <FixedBadge />}
                          {!entry.is_received && (
                            <span className="entradas-list__pending-badge">Pendente</span>
                          )}
                        </>
                      }
                      meta={
                        <>
                          {category ? (
                            <CategoryBadge
                              name={category.name}
                              icon={category.icon}
                              color={categoryColors.get(category.name) ?? 'var(--color-text-muted)'}
                            />
                          ) : (
                            <span>Categoria removida</span>
                          )}
                          {account ? (
                            <AccountBadge
                              name={account.name}
                              bankName={account.bank_name}
                              color={account.color}
                            />
                          ) : (
                            <span>Conta removida</span>
                          )}
                        </>
                      }
                      amount={centsToBRL(entry.amount_cents)}
                      amountTone="income"
                      tint={entry.is_received ? undefined : 'gold'}
                      actions={
                        isConfirming ? (
                          <>
                            <button
                              type="button"
                              className="list-item-card__action-confirm"
                              onClick={() => handleDeleteClick(entry)}
                            >
                              Confirmar exclusão?
                            </button>
                            <button
                              type="button"
                              className="list-item-card__action-cancel"
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
                                className="list-item-card__action-mark"
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
                        )
                      }
                      notesPanel={
                        entry.notes && (
                          <div
                            id={`notes-${entry.id}`}
                            className="notes-panel"
                            hidden={!notes.isOpen(entry.id)}
                          >
                            <NotesText notes={entry.notes} />
                          </div>
                        )
                      }
                    />
                  )
                })}
              </ul>
            </div>
          ) : (
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
                    <Fragment key={entry.id}>
                    <tr
                      className={entry.is_received ? undefined : 'entradas-list__row--pending'}
                    >
                      <td className="entradas-list__description">
                        <div className="entradas-list__description-row">
                          <span>{entry.description}</span>
                          {entry.notes && (
                            <NotesToggle
                              panelId={`notes-${entry.id}`}
                              open={notes.isOpen(entry.id)}
                              onToggle={() => notes.toggle(entry.id)}
                            />
                          )}
                          {entry.is_fixed && <FixedBadge />}
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
                    {entry.notes && (
                      <tr
                        id={`notes-${entry.id}`}
                        className="notes-row"
                        hidden={!notes.isOpen(entry.id)}
                      >
                        <td colSpan={6}>
                          <NotesText notes={entry.notes} />
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
          )}
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
