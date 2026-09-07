import { ArrowLeftRight, Receipt, TrendingDown, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { DropdownMenu } from '../../components/ui/DropdownMenu'
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
  onDelete: (account: Account) => void
}

const STATUS_FILTERS: { value: AccountStatusFilter; label: string }[] = [
  { value: 'active', label: 'Ativas' },
  { value: 'archived', label: 'Arquivadas' },
  { value: 'all', label: 'Todas' },
]

interface ConfirmingState {
  id: string
  action: 'archive' | 'delete'
}

export function ContasList({
  accounts,
  statusFilter,
  onStatusFilterChange,
  onEdit,
  onArchive,
  onActivate,
  onDelete,
}: ContasListProps) {
  const [confirming, setConfirming] = useState<ConfirmingState | null>(null)

  function handleFilterChange(status: AccountStatusFilter) {
    setConfirming(null)
    onStatusFilterChange(status)
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
          <div className="contas-grid">
            {accounts.map((account) => {
              const isConfirmingArchive =
                confirming?.id === account.id && confirming.action === 'archive'
              const isConfirmingDelete =
                confirming?.id === account.id && confirming.action === 'delete'
              const { base } = getBankColor(account.bank_name)
              const initial = (account.bank_name ?? account.name).trim().charAt(0).toUpperCase()

              return (
                <div key={account.id} className="contas-grid__card">
                  <div className="contas-grid__header">
                    <span
                      className="contas-grid__avatar"
                      style={{ background: base }}
                      aria-hidden="true"
                    >
                      {initial}
                    </span>
                    <div className="contas-grid__info">
                      <span className="contas-grid__name">{account.name}</span>
                      <span className="contas-grid__type">
                        {account.bank_name ? `${account.bank_name} · ` : ''}
                        {ACCOUNT_TYPE_LABELS[account.type]}
                      </span>
                    </div>
                    <DropdownMenu label={`Mais opções de ${account.name}`}>
                      {(close) => (
                        <>
                          <Link
                            to={`/contas/${account.id}/extrato`}
                            className="dropdown-menu__item"
                            role="menuitem"
                            onClick={close}
                          >
                            <Receipt size={14} aria-hidden="true" />
                            Ver extrato
                          </Link>
                          {account.status === 'active' ? (
                            <button
                              type="button"
                              className="dropdown-menu__item"
                              role="menuitem"
                              onClick={() => {
                                close()
                                setConfirming({ id: account.id, action: 'archive' })
                              }}
                            >
                              Arquivar
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="dropdown-menu__item"
                              role="menuitem"
                              onClick={() => {
                                close()
                                onActivate(account)
                              }}
                            >
                              Reativar
                            </button>
                          )}
                          <button
                            type="button"
                            className="dropdown-menu__item dropdown-menu__item--danger"
                            role="menuitem"
                            onClick={() => {
                              close()
                              setConfirming({ id: account.id, action: 'delete' })
                            }}
                          >
                            Excluir
                          </button>
                        </>
                      )}
                    </DropdownMenu>
                  </div>

                  <span
                    className={`contas-grid__balance ${
                      account.balanceCents < 0
                        ? 'contas-grid__balance--negative'
                        : 'contas-grid__balance--positive'
                    }`}
                  >
                    {centsToBRL(account.balanceCents)}
                  </span>

                  {isConfirmingArchive ? (
                    <div className="contas-grid__confirm">
                      <span>Arquivar essa conta?</span>
                      <div className="contas-grid__confirm-actions">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setConfirming(null)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            setConfirming(null)
                            onArchive(account)
                          }}
                        >
                          Confirmar
                        </Button>
                      </div>
                    </div>
                  ) : isConfirmingDelete ? (
                    <div className="contas-grid__confirm">
                      <span>Excluir essa conta de vez?</span>
                      <div className="contas-grid__confirm-actions">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setConfirming(null)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            setConfirming(null)
                            onDelete(account)
                          }}
                        >
                          Excluir de vez
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="contas-grid__actions">
                      <Button type="button" variant="secondary" onClick={() => onEdit(account)}>
                        Editar
                      </Button>
                      <DropdownMenu
                        label={`Movimentar ${account.name}`}
                        trigger={
                          <span className="contas-grid__move-trigger">
                            <ArrowLeftRight size={14} aria-hidden="true" />
                            Movimentar
                          </span>
                        }
                        triggerClassName="contas-grid__move-button"
                      >
                        {(close) => (
                          <>
                            <Link
                              to={`/entradas?conta=${account.id}`}
                              className="dropdown-menu__item"
                              role="menuitem"
                              onClick={close}
                            >
                              <TrendingUp size={14} aria-hidden="true" />
                              Nova entrada
                            </Link>
                            <Link
                              to={`/despesas?conta=${account.id}`}
                              className="dropdown-menu__item"
                              role="menuitem"
                              onClick={close}
                            >
                              <TrendingDown size={14} aria-hidden="true" />
                              Nova despesa
                            </Link>
                            <Link
                              to={`/transferencias?conta=${account.id}`}
                              className="dropdown-menu__item"
                              role="menuitem"
                              onClick={close}
                            >
                              <ArrowLeftRight size={14} aria-hidden="true" />
                              Transferência
                            </Link>
                          </>
                        )}
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
