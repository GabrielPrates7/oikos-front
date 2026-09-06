import { Edit2, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { centsToBRL } from '../../utils/currency'
import type { Category } from '../categorias/categorias.types'
import type { Budget } from './orcamentos.types'
import './OrcamentosList.css'

interface OrcamentosListProps {
  budgets: Budget[]
  categories: Category[]
  onEdit: (budget: Budget) => void
  onDelete: (budget: Budget) => void
}

// A partir de 70% de uso a barra fica na cor de despesa — mesmo tom usado quando o
// orçamento estoura de fato (>100%), só que já como aviso antecipado.
const WARNING_THRESHOLD = 70

export function OrcamentosList({ budgets, categories, onEdit, onDelete }: OrcamentosListProps) {
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

  function handleDeleteClick(budget: Budget) {
    if (confirmingId === budget.id) {
      setConfirmingId(null)
      onDelete(budget)
    } else {
      setConfirmingId(budget.id)
    }
  }

  if (budgets.length === 0) {
    return (
      <div className="orcamentos-list__empty">
        <p>Nenhum orçamento cadastrado nesse mês.</p>
        <p>Crie um orçamento pra acompanhar quanto você já gastou em cada categoria.</p>
      </div>
    )
  }

  return (
    <ul className="orcamentos-list__rows" ref={rowsRef}>
      {budgets.map((budget) => {
        const category = categories.find((item) => item.id === budget.category_id)
        const isConfirming = confirmingId === budget.id
        const barPercent = Math.min(100, budget.percentageUsed)
        const isWarning = budget.percentageUsed >= WARNING_THRESHOLD

        return (
          <li key={budget.id} className="orcamentos-list__row">
            <div className="orcamentos-list__info">
              <span className="orcamentos-list__category">
                <span aria-hidden="true">{category?.icon ?? '📁'}</span>{' '}
                {category?.name ?? 'Categoria removida'}
              </span>
              <div className="orcamentos-list__bar-track">
                <div
                  className={`orcamentos-list__bar-fill${isWarning ? ' orcamentos-list__bar-fill--warning' : ''}`}
                  style={{ width: `${barPercent}%` }}
                />
              </div>
              <span className="orcamentos-list__amounts">
                {centsToBRL(budget.spentCents)} de {centsToBRL(budget.limit_amount_cents)} (
                {budget.percentageUsed}%)
              </span>
            </div>
            <div className="orcamentos-list__actions">
              {isConfirming ? (
                <>
                  <button
                    type="button"
                    className="orcamentos-list__confirm-delete"
                    onClick={() => handleDeleteClick(budget)}
                  >
                    Confirmar exclusão?
                  </button>
                  <button
                    type="button"
                    className="orcamentos-list__cancel-delete"
                    onClick={() => setConfirmingId(null)}
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    aria-label={`Editar orçamento de ${category?.name ?? 'categoria removida'}`}
                    onClick={() => onEdit(budget)}
                  >
                    <Edit2 size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Excluir orçamento de ${category?.name ?? 'categoria removida'}`}
                    onClick={() => handleDeleteClick(budget)}
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
