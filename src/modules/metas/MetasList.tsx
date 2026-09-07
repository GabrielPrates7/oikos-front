import { Edit2, Flag, Trash2 } from 'lucide-react'
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
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!confirmingId) return

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
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
    <div className="metas-grid" ref={containerRef}>
      {goals.map((goal) => {
        const isConfirming = confirmingId === goal.id
        const percent =
          goal.target_amount_cents > 0
            ? Math.min(100, Math.round((goal.currentAmountCents / goal.target_amount_cents) * 100))
            : 0

        return (
          <div key={goal.id} className="metas-grid__card">
            <div className="metas-grid__target-date">
              <Flag size={14} aria-hidden="true" />
              Até {formatDateBR(goal.target_date)}
            </div>
            <Link to={`/metas/${goal.id}`} className="metas-grid__name">
              {goal.name}
            </Link>
            <div className="metas-grid__progress">
              <div className="metas-grid__bar-track">
                <div className="metas-grid__bar-fill" style={{ width: `${percent}%` }} />
              </div>
              <span className="metas-grid__progress-text">
                {centsToBRL(goal.currentAmountCents)} de {centsToBRL(goal.target_amount_cents)}
                <span className="metas-grid__percent"> ({percent}%)</span>
              </span>
            </div>

            {isConfirming ? (
              <div className="metas-grid__confirm">
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
              </div>
            ) : (
              <div className="metas-grid__actions">
                <button type="button" aria-label={`Editar ${goal.name}`} onClick={() => onEdit(goal)}>
                  <Edit2 size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Excluir ${goal.name}`}
                  onClick={() => handleDeleteClick(goal)}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
