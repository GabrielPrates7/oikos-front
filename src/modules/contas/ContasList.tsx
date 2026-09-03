import { Archive, Edit2 } from 'lucide-react'
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
}: ContasListProps) {
  return (
    <div className="contas-list">
      <div className="contas-list__filters" role="group" aria-label="Filtrar por status">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={`contas-list__filter${statusFilter === value ? ' contas-list__filter--active' : ''}`}
            aria-pressed={statusFilter === value}
            onClick={() => onStatusFilterChange(value)}
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
        <ul className="contas-list__rows">
          {accounts.map((account) => (
            <li key={account.id} className="contas-list__row">
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
                    onClick={() => onArchive(account)}
                  >
                    <Archive size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
