import { Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ListTotal } from '../../components/ui/ListTotal'
import { Pagination } from '../../components/ui/Pagination'
import { centsToBRL } from '../../utils/currency'
import { formatDateBR } from '../../utils/date'
import type { Account } from '../contas/contas.types'
import type { Transfer, TransferFilters } from './transferencias.types'
import './TransferenciasList.css'

interface TransferenciasListProps {
  transfers: Transfer[]
  accounts: Account[]
  filters: TransferFilters
  onFiltersChange: (filters: TransferFilters) => void
  sumCents: number
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onDelete: (transfer: Transfer) => void
}

export function TransferenciasList({
  transfers,
  accounts,
  filters,
  onFiltersChange,
  sumCents,
  page,
  totalPages,
  onPageChange,
  onDelete,
}: TransferenciasListProps) {
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
  const hasFilters = !!(filters.accountId || filters.from || filters.to)

  return (
    <div className="transferencias-list">
      <div className="transferencias-list__filters">
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
            onClick={() => handleFilterChange({ accountId: undefined, from: undefined, to: undefined })}
          >
            Limpar filtros
          </button>
        )}
      </div>

      {transfers.length === 0 ? (
        <div className="transferencias-list__empty">
          {hasFilters ? (
            <p>Nenhuma transferência encontrada com esses filtros.</p>
          ) : (
            <>
              <p>Você ainda não tem nenhuma transferência cadastrada.</p>
              <p>Crie a primeira transferência pra mover saldo entre suas contas.</p>
            </>
          )}
        </div>
      ) : (
        <>
          <ListTotal items={[{ label: 'Total exibido', valueCents: sumCents }]} />
          <ul className="transferencias-list__rows" ref={rowsRef}>
            {transfers.map((transfer) => {
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
                      De: {fromAccount?.name ?? 'Conta removida'} → Para:{' '}
                      {toAccount?.name ?? 'Conta removida'}
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
                      <button
                        type="button"
                        aria-label={`Excluir transferência de ${fromAccount?.name ?? 'conta removida'} para ${toAccount?.name ?? 'conta removida'}`}
                        onClick={() => handleDeleteClick(transfer)}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
          <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        </>
      )}
    </div>
  )
}
