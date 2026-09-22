import { Copy, Edit2, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AccountBadge } from '../../components/ui/AccountBadge'
import { Pagination } from '../../components/ui/Pagination'
import { centsToBRL } from '../../utils/currency'
import { formatDateBR } from '../../utils/date'
import { DEFAULT_PAGE_SIZE } from '../../utils/pagination'
import type { Account } from '../contas/contas.types'
import { EntradasTotalCard } from '../entradas/EntradasTotalCard'
import type { Transfer, TransferFilters } from './transferencias.types'
import './TransferenciasList.css'

interface TransferenciasListProps {
  transfers: Transfer[]
  accounts: Account[]
  filters: TransferFilters
  onFiltersChange: (filters: TransferFilters) => void
  sumCents: number
  total: number
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onDelete: (transfer: Transfer) => void
  onDuplicate: (transfer: Transfer) => void
  onEdit: (transfer: Transfer) => void
}

export function TransferenciasList({
  transfers,
  accounts,
  filters,
  onFiltersChange,
  sumCents,
  total,
  page,
  totalPages,
  onPageChange,
  onDelete,
  onDuplicate,
  onEdit,
}: TransferenciasListProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  // Busca client-side, só dentro da página atual — mesma decisão e mesma limitação de
  // Entradas/Despesas (a API de transferências não tem parâmetro de busca; a soma/contagem
  // ("Total exibido") continua vindo do backend, sem levar a busca em conta, igual lá).
  const [search, setSearch] = useState('')
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

  function handleFilterChange(patch: Partial<TransferFilters>) {
    setConfirmingId(null)
    onFiltersChange({ ...filters, ...patch })
  }

  function handleDeleteClick(transfer: Transfer) {
    if (confirmingId === transfer.id) {
      setConfirmingId(null)
      onDelete(transfer)
    } else {
      setConfirmingId(transfer.id)
    }
  }

  const accountsById = new Map(accounts.map((account) => [account.id, account]))
  // Contador de filtros ativos, mesmo padrão de Entradas/Despesas (Limpar filtros (N)).
  const activeFilterCount = [filters.accountId, filters.from, filters.to].filter(Boolean).length
  const hasFilters = activeFilterCount > 0

  const visibleTransfers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return transfers
    return transfers.filter((transfer) => (transfer.description ?? '').toLowerCase().includes(query))
  }, [transfers, search])

  return (
    <div className="transferencias-list">
      <div className="transferencias-list__filters">
        <div className="transferencias-list__filter-field transferencias-list__filter-field--search">
          <label htmlFor="filter-search">Buscar</label>
          <div className="transferencias-list__search-input">
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
        <div className="transferencias-list__filter-field">
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
        <div className="transferencias-list__filter-field">
          <label htmlFor="filter-from">De</label>
          <input
            id="filter-from"
            type="date"
            value={filters.from ?? ''}
            onChange={(event) => handleFilterChange({ from: event.target.value || undefined })}
          />
        </div>
        <div className="transferencias-list__filter-field">
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
            className="transferencias-list__clear-filters"
            onClick={() =>
              handleFilterChange({ accountId: undefined, from: undefined, to: undefined })
            }
          >
            Limpar filtros ({activeFilterCount})
          </button>
        )}
      </div>

      {visibleTransfers.length === 0 ? (
        <div className="transferencias-list__empty">
          {hasFilters || search ? (
            <>
              <p>Nenhuma transferência encontrada com esses filtros.</p>
              <button
                type="button"
                className="transferencias-list__clear-filters"
                onClick={() => {
                  setSearch('')
                  handleFilterChange({ accountId: undefined, from: undefined, to: undefined })
                }}
              >
                Limpar filtros
              </button>
            </>
          ) : (
            <>
              <p>Você ainda não tem nenhuma transferência cadastrada.</p>
              <p>Crie a primeira transferência pra mover saldo entre suas contas.</p>
            </>
          )}
        </div>
      ) : (
        <>
          <EntradasTotalCard
            sumCents={sumCents}
            points={visibleTransfers.map((transfer) => ({
              date: transfer.transfer_date,
              amountCents: transfer.amount_cents,
            }))}
          />
          <div className="transferencias-list__table-wrap">
            <ul className="transferencias-list__rows" ref={rowsRef}>
              {visibleTransfers.map((transfer) => {
                const fromAccount = accountsById.get(transfer.from_account_id)
                const toAccount = accountsById.get(transfer.to_account_id)
                const isConfirming = confirmingId === transfer.id
                return (
                  <li key={transfer.id} className="transferencias-list__row">
                    <span className="transferencias-list__date">
                      {formatDateBR(transfer.transfer_date)}
                    </span>
                    <div className="transferencias-list__info">
                      {transfer.description && (
                        <span className="transferencias-list__description">
                          {transfer.description}
                        </span>
                      )}
                      <span className="transferencias-list__accounts">
                        De:{' '}
                        {fromAccount ? (
                          <AccountBadge
                            name={fromAccount.name}
                            bankName={fromAccount.bank_name}
                            color={fromAccount.color}
                          />
                        ) : (
                          'Conta removida'
                        )}{' '}
                        → Para:{' '}
                        {toAccount ? (
                          <AccountBadge
                            name={toAccount.name}
                            bankName={toAccount.bank_name}
                            color={toAccount.color}
                          />
                        ) : (
                          'Conta removida'
                        )}
                      </span>
                    </div>
                    <span className="transferencias-list__amount">
                      {centsToBRL(transfer.amount_cents)}
                    </span>
                    <div className="transferencias-list__actions">
                      {isConfirming ? (
                        <>
                          <button
                            type="button"
                            className="transferencias-list__confirm-delete"
                            onClick={() => handleDeleteClick(transfer)}
                          >
                            Confirmar exclusão?
                          </button>
                          <button
                            type="button"
                            className="transferencias-list__cancel-delete"
                            onClick={() => setConfirmingId(null)}
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            aria-label={`Duplicar transferência de ${fromAccount?.name ?? 'conta removida'} para ${toAccount?.name ?? 'conta removida'}`}
                            onClick={() => onDuplicate(transfer)}
                          >
                            <Copy size={16} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Editar transferência de ${fromAccount?.name ?? 'conta removida'} para ${toAccount?.name ?? 'conta removida'}`}
                            onClick={() => onEdit(transfer)}
                          >
                            <Edit2 size={16} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Excluir transferência de ${fromAccount?.name ?? 'conta removida'} para ${toAccount?.name ?? 'conta removida'}`}
                            onClick={() => handleDeleteClick(transfer)}
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
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            totalItems={total}
            pageSize={DEFAULT_PAGE_SIZE}
            itemLabel="transferências"
            alwaysShow
          />
        </>
      )}
    </div>
  )
}
