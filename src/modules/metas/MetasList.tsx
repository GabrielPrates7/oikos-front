import { Check, ChevronRight, Edit2, Flag, Plus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { DropdownMenu } from '../../components/ui/DropdownMenu'
import { Pagination } from '../../components/ui/Pagination'
import { centsToBRL } from '../../utils/currency'
import { daysBetween, formatDateBR, formatDateLong, todayInSaoPaulo } from '../../utils/date'
import type { FinancialGoal } from './metas.types'
import './MetasList.css'

interface MetasListProps {
  goals: FinancialGoal[]
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onCreate: () => void
  onEdit: (goal: FinancialGoal) => void
  onDelete: (goal: FinancialGoal) => void
}

type GoalState = 'completed' | 'overdue' | 'active'

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many
}

// Texto relativo do prazo. daysLeft = dias de calendário até a data alvo (negativo = já
// passou), calculado por daysBetween sobre strings YYYY-MM-DD — nunca new Date("YYYY-MM-DD").
function deadlineText(daysLeft: number): string {
  if (daysLeft === 0) return 'Vence hoje'
  if (daysLeft > 0)
    return `${plural(daysLeft, 'Falta', 'Faltam')} ${daysLeft} ${plural(daysLeft, 'dia', 'dias')}`
  const late = Math.abs(daysLeft)
  return `Vencida há ${late} ${plural(late, 'dia', 'dias')}`
}

export function MetasList({
  goals,
  page,
  totalPages,
  onPageChange,
  onCreate,
  onEdit,
  onDelete,
}: MetasListProps) {
  const navigate = useNavigate()
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
        <Flag size={36} aria-hidden="true" />
        <p>Você ainda não tem nenhuma meta.</p>
        <p>Crie uma pra acompanhar quanto falta juntar pro seu objetivo.</p>
        <Button type="button" onClick={onCreate}>
          <Plus size={16} aria-hidden="true" />
          Nova meta
        </Button>
      </div>
    )
  }

  const today = todayInSaoPaulo()

  return (
    <>
      <div className="metas-grid" ref={containerRef}>
        {goals.map((goal) => {
          const isConfirming = confirmingId === goal.id
          const percent =
            goal.target_amount_cents > 0
              ? Math.min(
                  100,
                  Math.round((goal.currentAmountCents / goal.target_amount_cents) * 100),
                )
              : 0
          const daysLeft = daysBetween(today, goal.target_date)
          const state: GoalState =
            goal.currentAmountCents >= goal.target_amount_cents
              ? 'completed'
              : today > goal.target_date
                ? 'overdue'
                : 'active'

          return (
            <div key={goal.id} className={`metas-grid__card metas-grid__card--${state}`}>
              <div
                className="metas-grid__deadline"
                title={`Prazo: ${formatDateLong(goal.target_date)}`}
              >
                <Flag size={14} aria-hidden="true" />
                {state === 'completed'
                  ? `Prazo: ${formatDateBR(goal.target_date)}`
                  : deadlineText(daysLeft)}
              </div>

              <Link to={`/metas/${goal.id}`} className="metas-grid__name">
                {goal.name}
                <ChevronRight className="metas-grid__chevron" size={16} aria-hidden="true" />
              </Link>

              <div className="metas-grid__value-row">
                <div className="metas-grid__amounts">
                  <span className="metas-grid__current">{centsToBRL(goal.currentAmountCents)}</span>
                  <span className="metas-grid__target">
                    de {centsToBRL(goal.target_amount_cents)}
                  </span>
                </div>
                <span className="metas-grid__percent-chip">{percent}%</span>
              </div>

              <div
                className="metas-grid__bar-track"
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progresso da meta ${goal.name}`}
              >
                <div
                  className={`metas-grid__bar-fill metas-grid__bar-fill--${state}`}
                  style={{ width: `${percent}%`, minWidth: percent > 0 ? 4 : 0 }}
                />
              </div>

              <div className={`metas-grid__state metas-grid__state--${state}`}>
                {state === 'completed' && (
                  <>
                    <Check size={14} aria-hidden="true" />
                    Concluída
                  </>
                )}
                {state === 'overdue' && 'Vencida'}
                {state === 'active' && 'Em andamento'}
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
                <div className="metas-grid__footer">
                  <button
                    type="button"
                    className="metas-grid__aportar"
                    onClick={() => navigate(`/metas/${goal.id}?aportar=1`)}
                  >
                    <Plus size={14} aria-hidden="true" />
                    Aportar
                  </button>
                  <DropdownMenu label={`Mais opções da meta ${goal.name}`}>
                    {(close) => (
                      <>
                        <button
                          type="button"
                          className="dropdown-menu__item"
                          role="menuitem"
                          onClick={() => {
                            close()
                            onEdit(goal)
                          }}
                        >
                          <Edit2 size={14} aria-hidden="true" />
                          Editar
                        </button>
                        <button
                          type="button"
                          className="dropdown-menu__item dropdown-menu__item--danger"
                          role="menuitem"
                          onClick={() => {
                            close()
                            setConfirmingId(goal.id)
                          }}
                        >
                          <Trash2 size={14} aria-hidden="true" />
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

        {page >= totalPages && (
          <button type="button" className="metas-grid__ghost" onClick={onCreate}>
            <Plus size={20} aria-hidden="true" />
            Nova meta
          </button>
        )}
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </>
  )
}
