import { Edit2, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Pagination } from '../../components/ui/Pagination'
import { centsToBRL } from '../../utils/currency'
import type { Category } from '../categorias/categorias.types'
import { BUDGET_STATUS_LABELS, getBudgetStatus } from './budgetStatus'
import type { Budget } from './orcamentos.types'
import './OrcamentosList.css'

interface OrcamentosListProps {
  budgets: Budget[]
  categories: Category[]
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onEdit: (budget: Budget) => void
  onDelete: (budget: Budget) => void
}

const STATUS_LABELS = BUDGET_STATUS_LABELS

export function OrcamentosList({
  budgets,
  categories,
  page,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
}: OrcamentosListProps) {
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
    <>
      <div className="orcamentos-list__wrap">
        <ul className="orcamentos-list__rows" ref={rowsRef}>
          {budgets.map((budget) => {
            const category = categories.find((item) => item.id === budget.category_id)
            const isConfirming = confirmingId === budget.id
            const barPercent = Math.min(100, budget.percentageUsed)
            const status = getBudgetStatus(budget.percentageUsed)

            return (
              <li key={budget.id} className="orcamentos-list__row">
                <div className="orcamentos-list__info">
                  <div className="orcamentos-list__heading">
                    <span className="orcamentos-list__category">
                      <span aria-hidden="true">{category?.icon ?? '📁'}</span>{' '}
                      {category?.name ?? 'Categoria removida'}
                    </span>
                    <span className={`orcamentos-list__status orcamentos-list__status--${status}`}>
                      {STATUS_LABELS[status]}
                    </span>
                  </div>
                  <div className="orcamentos-list__bar-track">
                    <div
                      className={`orcamentos-list__bar-fill orcamentos-list__bar-fill--${status}`}
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
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </>
  )
}
