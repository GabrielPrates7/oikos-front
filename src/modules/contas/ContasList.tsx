import { Archive, Edit2, Receipt, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ListTotal } from '../../components/ui/ListTotal'
import { getBankColor } from '../../utils/bankColors'
import { centsToBRL } from '../../utils/currency'
import { ACCOUNT_TYPE_LABELS } from './contas.types'
import type { Account, AccountStatusFilter } from './contas.types'
import './ContasList.css'

interface ContasListProps {
  accounts: Account[]
  statusFilter: AccountStatusFilter
  onStatusFilterChange: (status: AccountStatusFilter) => void
  onEdit: (account: Account) => void
  onArchive: (account: Account) => void
  onActivate: (account: Account) => void
}

const STATUS_FILTERS: { value: AccountStatusFilter; label: string }[] = [
  { value: 'active', label: 'Ativas' },
  { value: 'archived', label: 'Arquivadas' },
  { value: 'all', label: 'Todas' },
]

export function ContasList({
  accounts,
  statusFilter,
  onStatusFilterChange,
  onEdit,
  onArchive,
  onActivate,
}: ContasListProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const rowsRef = useRef<HTMLUListElement>(null)

  // Clicar fora da linha em confirmação cancela o arquivamento sem chamar a API.
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

  function handleFilterChange(status: AccountStatusFilter) {
    setConfirmingId(null)
    onStatusFilterChange(status)
  }

  function handleArchiveClick(account: Account) {
    if (confirmingId === account.id) {
      setConfirmingId(null)
      onArchive(account)
    } else {
      setConfirmingId(account.id)
    }
  }

  return (
    <div className="contas-list">
      <div className="contas-list__filters" role="group" aria-label="Filtrar por status">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={`contas-list__filter${statusFilter === value ? ' contas-list__filter--active' : ''}`}
            aria-pressed={statusFilter === value}
            onClick={() => handleFilterChange(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {accounts.length === 0 ? (
        <div className="contas-list__empty">
          {statusFilter === 'active' ? (
            <>
              <p>Você ainda não tem nenhuma conta cadastrada.</p>
              <p>Crie a primeira conta pra começar a acompanhar seu saldo.</p>
            </>
          ) : (
            <p>Nenhuma conta encontrada nesse filtro.</p>
          )}
        </div>
      ) : (
        <>
          <ListTotal
            items={[
              {
                label: 'Total exibido',
                valueCents: accounts.reduce((sum, account) => sum + account.balanceCents, 0),
              },
            ]}
          />
          <ul className="contas-list__rows" ref={rowsRef}>
          {accounts.map((account) => {
            const isConfirming = confirmingId === account.id
            return (
              <li key={account.id} className="contas-list__row">
                <span
                  className="contas-list__bank-indicator"
                  style={{ background: getBankColor(account.bank_name).base }}
                  aria-hidden="true"
                />
                <div className="contas-list__info">
                  <span className="contas-list__name">{account.name}</span>
                  <span className="contas-list__meta">
                    {account.bank_name ? `${account.bank_name} · ` : ''}
                    {ACCOUNT_TYPE_LABELS[account.type]}
                  </span>
                </div>
                <span
                  className={`contas-list__balance ${
                    account.balanceCents < 0
                      ? 'contas-list__balance--negative'
                      : 'contas-list__balance--positive'
                  }`}
                >
                  {centsToBRL(account.balanceCents)}
                </span>
                <div className="contas-list__actions">
                  {isConfirming ? (
                    <>
                      <button
                        type="button"
                        className="contas-list__confirm-archive"
                        onClick={() => handleArchiveClick(account)}
                      >
                        Confirmar arquivamento?
                      </button>
                      <button
                        type="button"
                        className="contas-list__cancel-archive"
                        onClick={() => setConfirmingId(null)}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to={`/contas/${account.id}/extrato`}
                        aria-label={`Ver extrato de ${account.name}`}
                      >
                        <Receipt size={16} aria-hidden="true" />
                      </Link>
                      <button
                        type="button"
                        aria-label={`Editar ${account.name}`}
                        onClick={() => onEdit(account)}
                      >
                        <Edit2 size={16} aria-hidden="true" />
                      </button>
                      {account.status === 'active' && (
                        <button
                          type="button"
                          aria-label={`Arquivar ${account.name}`}
                          onClick={() => handleArchiveClick(account)}
                        >
                          <Archive size={16} aria-hidden="true" />
                        </button>
                      )}
                      {account.status === 'archived' && (
                        <button
                          type="button"
                          className="contas-list__reactivate"
                          aria-label={`Reativar ${account.name}`}
                          onClick={() => onActivate(account)}
                        >
                          <RotateCcw size={16} aria-hidden="true" />
                          Reativar
                        </button>
                      )}
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
