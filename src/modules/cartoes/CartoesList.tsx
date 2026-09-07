import { ArrowLeftRight, Receipt } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { DropdownMenu } from '../../components/ui/DropdownMenu'
import { ListTotal } from '../../components/ui/ListTotal'
import { getBankColor } from '../../utils/bankColors'
import { centsToBRL } from '../../utils/currency'
import type { CreditCard, CreditCardStatusFilter } from './cartoes.types'
import './CartoesList.css'

interface CartoesListProps {
  cards: CreditCard[]
  statusFilter: CreditCardStatusFilter
  onStatusFilterChange: (status: CreditCardStatusFilter) => void
  onEdit: (card: CreditCard) => void
  onArchive: (card: CreditCard) => void
  onActivate: (card: CreditCard) => void
  onDelete: (card: CreditCard) => void
}

const STATUS_FILTERS: { value: CreditCardStatusFilter; label: string }[] = [
  { value: 'active', label: 'Ativos' },
  { value: 'archived', label: 'Arquivados' },
  { value: 'all', label: 'Todos' },
]

interface ConfirmingState {
  id: string
  action: 'archive' | 'delete'
}

const WARNING_THRESHOLD = 70

export function CartoesList({
  cards,
  statusFilter,
  onStatusFilterChange,
  onEdit,
  onArchive,
  onActivate,
  onDelete,
}: CartoesListProps) {
  const [confirming, setConfirming] = useState<ConfirmingState | null>(null)

  function handleFilterChange(status: CreditCardStatusFilter) {
    setConfirming(null)
    onStatusFilterChange(status)
  }

  return (
    <div className="cartoes-list">
      <div className="cartoes-list__filters" role="group" aria-label="Filtrar por status">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={`cartoes-list__filter${statusFilter === value ? ' cartoes-list__filter--active' : ''}`}
            aria-pressed={statusFilter === value}
            onClick={() => handleFilterChange(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {cards.length === 0 ? (
        <div className="cartoes-list__empty">
          {statusFilter === 'active' ? (
            <>
              <p>Você ainda não tem nenhum cartão cadastrado.</p>
              <p>Crie o primeiro cartão pra começar a acompanhar suas faturas.</p>
            </>
          ) : (
            <p>Nenhum cartão encontrado nesse filtro.</p>
          )}
        </div>
      ) : (
        <>
          <ListTotal
            items={[
              {
                label: 'Limite total',
                valueCents: cards.reduce((sum, card) => sum + card.credit_limit_cents, 0),
              },
              {
                label: 'Disponível total',
                valueCents: cards.reduce((sum, card) => sum + card.availableLimitCents, 0),
              },
              {
                label: 'Usado total (a pagar)',
                valueCents: cards.reduce(
                  (sum, card) => sum + (card.credit_limit_cents - card.availableLimitCents),
                  0,
                ),
              },
            ]}
          />
          <div className="cartoes-grid">
            {cards.map((card) => {
              const isConfirmingArchive =
                confirming?.id === card.id && confirming.action === 'archive'
              const isConfirmingDelete = confirming?.id === card.id && confirming.action === 'delete'
              const { base } = getBankColor(card.name)
              const initial = card.name.trim().charAt(0).toUpperCase()
              const usedCents = Math.max(0, card.credit_limit_cents - card.availableLimitCents)
              const usedPercent =
                card.credit_limit_cents > 0 ? (usedCents / card.credit_limit_cents) * 100 : 0
              const isWarning = usedPercent >= WARNING_THRESHOLD

              return (
                <div key={card.id} className="cartoes-grid__card">
                  <div className="cartoes-grid__header">
                    <span
                      className="cartoes-grid__avatar"
                      style={{ background: base }}
                      aria-hidden="true"
                    >
                      {initial}
                    </span>
                    <div className="cartoes-grid__info">
                      <span className="cartoes-grid__name">{card.name}</span>
                      <span className="cartoes-grid__type">{card.brand ?? 'Sem bandeira'}</span>
                    </div>
                    <DropdownMenu label={`Mais opções de ${card.name}`}>
                      {(close) => (
                        <>
                          <Link
                            to={`/faturas?cartao=${card.id}`}
                            className="dropdown-menu__item"
                            onClick={close}
                          >
                            <Receipt size={14} aria-hidden="true" />
                            Ver faturas
                          </Link>
                          {card.status === 'active' ? (
                            <button
                              type="button"
                              className="dropdown-menu__item"
                              onClick={() => {
                                close()
                                setConfirming({ id: card.id, action: 'archive' })
                              }}
                            >
                              Arquivar
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="dropdown-menu__item"
                              onClick={() => {
                                close()
                                onActivate(card)
                              }}
                            >
                              Reativar
                            </button>
                          )}
                          <button
                            type="button"
                            className="dropdown-menu__item dropdown-menu__item--danger"
                            onClick={() => {
                              close()
                              setConfirming({ id: card.id, action: 'delete' })
                            }}
                          >
                            Excluir
                          </button>
                        </>
                      )}
                    </DropdownMenu>
                  </div>

                  <span className="cartoes-grid__available">
                    {centsToBRL(card.availableLimitCents)}
                    <span className="cartoes-grid__available-label">disponível</span>
                  </span>
                  <div
                    className="cartoes-grid__bar-track"
                    role="progressbar"
                    aria-valuenow={Math.round(usedPercent)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${Math.round(usedPercent)}% do limite usado`}
                  >
                    <div
                      className={`cartoes-grid__bar-fill${isWarning ? ' cartoes-grid__bar-fill--warning' : ''}`}
                      style={{ width: `${Math.min(100, usedPercent)}%` }}
                    />
                  </div>
                  <span className="cartoes-grid__used">
                    {centsToBRL(usedCents)} usado de {centsToBRL(card.credit_limit_cents)}
                  </span>

                  {isConfirmingArchive ? (
                    <div className="cartoes-grid__confirm">
                      <span>Arquivar esse cartão?</span>
                      <div className="cartoes-grid__confirm-actions">
                        <Button type="button" variant="secondary" onClick={() => setConfirming(null)}>
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            setConfirming(null)
                            onArchive(card)
                          }}
                        >
                          Confirmar
                        </Button>
                      </div>
                    </div>
                  ) : isConfirmingDelete ? (
                    <div className="cartoes-grid__confirm">
                      <span>Excluir esse cartão de vez?</span>
                      <div className="cartoes-grid__confirm-actions">
                        <Button type="button" variant="secondary" onClick={() => setConfirming(null)}>
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            setConfirming(null)
                            onDelete(card)
                          }}
                        >
                          Excluir de vez
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="cartoes-grid__actions">
                      <Button type="button" variant="secondary" onClick={() => onEdit(card)}>
                        Editar
                      </Button>
                      <Link to={`/cartoes/${card.id}`} className="cartoes-grid__move-button">
                        <ArrowLeftRight size={14} aria-hidden="true" />
                        Movimentar
                      </Link>
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
