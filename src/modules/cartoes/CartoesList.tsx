import { Archive, Edit2, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
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
}

const STATUS_FILTERS: { value: CreditCardStatusFilter; label: string }[] = [
  { value: 'active', label: 'Ativos' },
  { value: 'archived', label: 'Arquivados' },
  { value: 'all', label: 'Todos' },
]

export function CartoesList({
  cards,
  statusFilter,
  onStatusFilterChange,
  onEdit,
  onArchive,
  onActivate,
}: CartoesListProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const rowsRef = useRef<HTMLUListElement>(null)

  // Mesmo padrão de confirmação em dois cliques usado em ContasList: clicar fora cancela
  // o arquivamento sem chamar a API.
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

  function handleFilterChange(status: CreditCardStatusFilter) {
    setConfirmingId(null)
    onStatusFilterChange(status)
  }

  function handleArchiveClick(card: CreditCard) {
    if (confirmingId === card.id) {
      setConfirmingId(null)
      onArchive(card)
    } else {
      setConfirmingId(card.id)
    }
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
        <ul className="cartoes-list__rows" ref={rowsRef}>
          {cards.map((card) => {
            const isConfirming = confirmingId === card.id
            return (
              <li key={card.id} className="cartoes-list__row">
                <Link to={`/cartoes/${card.id}`} className="cartoes-list__link">
                  <div className="cartoes-list__info">
                    <span className="cartoes-list__name">{card.name}</span>
                    <span className="cartoes-list__meta">{card.brand ?? 'Sem bandeira'}</span>
                  </div>
                  <span className="cartoes-list__limit">
                    {centsToBRL(card.availableLimitCents)}
                    <span className="cartoes-list__limit-total">
                      {' '}
                      / {centsToBRL(card.credit_limit_cents)}
                    </span>
                  </span>
                </Link>
                <div className="cartoes-list__actions">
                  {isConfirming ? (
                    <>
                      <button
                        type="button"
                        className="cartoes-list__confirm-archive"
                        onClick={() => handleArchiveClick(card)}
                      >
                        Confirmar arquivamento?
                      </button>
                      <button
                        type="button"
                        className="cartoes-list__cancel-archive"
                        onClick={() => setConfirmingId(null)}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        aria-label={`Editar ${card.name}`}
                        onClick={() => onEdit(card)}
                      >
                        <Edit2 size={16} aria-hidden="true" />
                      </button>
                      {card.status === 'active' && (
                        <button
                          type="button"
                          aria-label={`Arquivar ${card.name}`}
                          onClick={() => handleArchiveClick(card)}
                        >
                          <Archive size={16} aria-hidden="true" />
                        </button>
                      )}
                      {card.status === 'archived' && (
                        <button
                          type="button"
                          className="cartoes-list__reactivate"
                          aria-label={`Reativar ${card.name}`}
                          onClick={() => onActivate(card)}
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
      )}
    </div>
  )
}
