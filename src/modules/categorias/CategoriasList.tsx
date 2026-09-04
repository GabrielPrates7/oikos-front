import { Edit2, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Category, CategoryType } from './categorias.types'
import './CategoriasList.css'

interface CategoriasListProps {
  categories: Category[]
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

const SECTIONS: { type: CategoryType; title: string }[] = [
  { type: 'expense', title: 'Despesas' },
  { type: 'income', title: 'Entradas' },
]

export function CategoriasList({ categories, onEdit, onDelete }: CategoriasListProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Mesmo padrão de confirmação em dois cliques usado em ContasList: clicar fora
  // cancela a exclusão sem chamar a API.
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
    <div className="categorias-list" ref={containerRef}>
      {SECTIONS.map(({ type, title }) => {
        const sectionCategories = categories.filter((category) => category.type === type)
        const ownCount = sectionCategories.filter((category) => category.user_id !== null).length

        return (
          <section key={type} className="categorias-list__section">
            <h2 className="categorias-list__title">{title}</h2>
            <ul className="categorias-list__rows">
              {sectionCategories.map((category) => {
                const isOwn = category.user_id !== null
                const isConfirming = confirmingId === category.id
                return (
                  <li key={category.id} className="categorias-list__row">
                    <span className="categorias-list__icon" aria-hidden="true">
                      {category.icon ?? '📁'}
                    </span>
                    <span className="categorias-list__name">{category.name}</span>
                    {isOwn && (
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
                    )}
                  </li>
                )
              })}
            </ul>
            {ownCount === 0 && (
              <p className="categorias-list__hint">
                Você ainda não tem categorias de {title.toLowerCase()} próprias. Crie uma pra
                personalizar seus lançamentos.
              </p>
            )}
          </section>
        )
      })}
    </div>
  )
}
