import { Edit2, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Pagination } from '../../components/ui/Pagination'
import type { Category } from './categorias.types'
import './CategoriasList.css'

interface CategoriasListProps {
  expenseCategories: Category[]
  expensePage: number
  expenseTotalPages: number
  onExpensePageChange: (page: number) => void
  incomeCategories: Category[]
  incomePage: number
  incomeTotalPages: number
  onIncomePageChange: (page: number) => void
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

function usageLabel(count: number): string {
  return count === 1 ? '1 movimentação' : `${count} movimentações`
}

interface CategoriaSectionProps {
  title: string
  // Cor semantica so do texto do titulo da coluna (nao da coluna inteira).
  tone: 'expense' | 'income'
  categories: Category[]
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

// Despesas e Receitas são renderizadas como duas instâncias independentes desse componente
// — cada uma com sua própria confirmação de exclusão e sua própria paginação, sem afetar a
// outra seção.
function CategoriaSection({
  title,
  tone,
  categories,
  page,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
}: CategoriaSectionProps) {
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

  function handleDeleteClick(category: Category) {
    if (confirmingId === category.id) {
      setConfirmingId(null)
      onDelete(category)
    } else {
      setConfirmingId(category.id)
    }
  }

  return (
    <section className="categorias-list__section" ref={containerRef}>
      <h2 className={`categorias-list__title categorias-list__title--${tone}`}>{title}</h2>
      <ul className="categorias-list__rows">
        {categories.map((category) => {
          const isConfirming = confirmingId === category.id
          return (
            <li key={category.id} className="categorias-list__row">
              <span className="categorias-list__icon" aria-hidden="true">
                {category.icon ?? '📁'}
              </span>
              <div className="categorias-list__info">
                <span className="categorias-list__name">{category.name}</span>
                <span className="categorias-list__usage">{usageLabel(category.usageCount)}</span>
              </div>
              <div className="categorias-list__actions">
                {isConfirming ? (
                  <>
                    <button
                      type="button"
                      className="categorias-list__confirm-delete"
                      onClick={() => handleDeleteClick(category)}
                    >
                      Confirmar exclusão?
                    </button>
                    <button
                      type="button"
                      className="categorias-list__cancel-delete"
                      onClick={() => setConfirmingId(null)}
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      aria-label={`Editar ${category.name}`}
                      onClick={() => onEdit(category)}
                    >
                      <Edit2 size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Excluir ${category.name}`}
                      onClick={() => handleDeleteClick(category)}
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
      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </section>
  )
}

export function CategoriasList({
  expenseCategories,
  expensePage,
  expenseTotalPages,
  onExpensePageChange,
  incomeCategories,
  incomePage,
  incomeTotalPages,
  onIncomePageChange,
  onEdit,
  onDelete,
}: CategoriasListProps) {
  return (
    <div className="categorias-list">
      <CategoriaSection
        title="Despesas"
        tone="expense"
        categories={expenseCategories}
        page={expensePage}
        totalPages={expenseTotalPages}
        onPageChange={onExpensePageChange}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      <CategoriaSection
        title="Entradas"
        tone="income"
        categories={incomeCategories}
        page={incomePage}
        totalPages={incomeTotalPages}
        onPageChange={onIncomePageChange}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  )
}
