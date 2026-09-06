import { Edit2, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { centsToBRL } from '../../utils/currency'
import { formatDateBR } from '../../utils/date'
import type { FinancialGoal } from './metas.types'
import './MetasList.css'

interface MetasListProps {
  goals: FinancialGoal[]
  onEdit: (goal: FinancialGoal) => void
  onDelete: (goal: FinancialGoal) => void
}

export function MetasList({ goals, onEdit, onDelete }: MetasListProps) {
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

  function handleDeleteClick(goal: FinancialGoal) {
    if (confirmingId === goal.id) {
      setConfirmingId(null)
      onDelete(goal)
    } else {
      setConfirmingId(goal.id)
    }
  }

  if (goals.length === 0) {
    return (
      <div className="metas-list__empty">
        <p>Você ainda não tem nenhuma meta cadastrada.</p>
        <p>Crie uma meta pra acompanhar quanto falta juntar pro seu objetivo.</p>
      </div>
    )
  }

  return (
    <ul className="metas-list__rows" ref={rowsRef}>
      {goals.map((goal) => {
        const isConfirming = confirmingId === goal.id
        const percent =
          goal.target_amount_cents > 0
            ? Math.min(100, Math.round((goal.currentAmountCents / goal.target_amount_cents) * 100))
            : 0

        return (
          <li key={goal.id} className="metas-list__row">
            <div className="metas-list__info">
              <Link to={`/metas/${goal.id}`} className="metas-list__name">
                {goal.name}
              </Link>
              <div className="metas-list__bar-track">
                <div className="metas-list__bar-fill" style={{ width: `${percent}%` }} />
              </div>
              <span className="metas-list__meta">
                {centsToBRL(goal.currentAmountCents)} de {centsToBRL(goal.target_amount_cents)} ·
                até {formatDateBR(goal.target_date)}
              </span>
            </div>
            <div className="metas-list__actions">
              {isConfirming ? (
                <>
                  <button
                    type="button"
                    className="metas-list__confirm-delete"
                    onClick={() => handleDeleteClick(goal)}
                  >
                    Confirmar exclusão?
                  </button>
                  <button
                    type="button"
                    className="metas-list__cancel-delete"
                    onClick={() => setConfirmingId(null)}
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    aria-label={`Editar ${goal.name}`}
                    onClick={() => onEdit(goal)}
                  >
                    <Edit2 size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Excluir ${goal.name}`}
                    onClick={() => handleDeleteClick(goal)}
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
  )
}
