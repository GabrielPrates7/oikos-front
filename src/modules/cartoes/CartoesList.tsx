import {
  ArrowLeftRight,
  CheckCircle2,
  CreditCard as CreditCardIcon,
  Receipt,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { DropdownMenu } from '../../components/ui/DropdownMenu'
import { GlassStatCards } from '../../components/ui/GlassStatCards'
import { Pagination } from '../../components/ui/Pagination'
import { CartaoVisual } from './CartaoVisual'
import type { CreditCard, CreditCardStatusFilter } from './cartoes.types'
import './CartoesList.css'

interface CartoesListProps {
  cards: CreditCard[]
  statusFilter: CreditCardStatusFilter
  onStatusFilterChange: (status: CreditCardStatusFilter) => void
  sumCreditLimitCents: number
  sumAvailableLimitCents: number
  page: number
  totalPages: number
  onPageChange: (page: number) => void
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

export function CartoesList({
  cards,
  statusFilter,
  onStatusFilterChange,
  sumCreditLimitCents,
  sumAvailableLimitCents,
  page,
  totalPages,
  onPageChange,
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
          <GlassStatCards
            items={[
              {
                label: 'Limite total',
                valueCents: sumCreditLimitCents,
                icon: <CreditCardIcon size={18} aria-hidden="true" />,
              },
              {
                label: 'Disponível total',
                valueCents: sumAvailableLimitCents,
                icon: <CheckCircle2 size={18} aria-hidden="true" />,
              },
              {
                label: 'Usado total (a pagar)',
                valueCents: sumCreditLimitCents - sumAvailableLimitCents,
                icon: <Wallet size={18} aria-hidden="true" />,
              },
            ]}
          />
          <div className="cartoes-grid">
            {cards.map((card) => {
              const isConfirmingArchive =
                confirming?.id === card.id && confirming.action === 'archive'
              const isConfirmingDelete =
                confirming?.id === card.id && confirming.action === 'delete'

              return (
                <div key={card.id} className="cartoes-grid__card">
                  <CartaoVisual card={card} size="compact" />

                  {isConfirmingArchive ? (
                    <div className="cartoes-grid__confirm">
                      <span>Arquivar esse cartão?</span>
                      <div className="cartoes-grid__confirm-actions">
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
                      <DropdownMenu label={`Mais opções de ${card.name}`}>
                        {(close) => (
                          <>
                            <Link
                              to={`/faturas?cartao=${card.id}`}
                              className="dropdown-menu__item"
                              role="menuitem"
                              onClick={close}
                            >
                              <Receipt size={14} aria-hidden="true" />
                              Ver faturas
                            </Link>
                            {card.status === 'active' ? (
                              <button
                                type="button"
                                className="dropdown-menu__item"
                                role="menuitem"
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
                                role="menuitem"
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
                              role="menuitem"
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
                  )}
                </div>
              )
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        </>
      )}
    </div>
  )
}
