import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FormError } from '../../components/feedback/FormError'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { ApiError } from '../../services/api'
import { DEFAULT_PAGE_SIZE, totalPages } from '../../utils/pagination'
import { CategoriaForm } from './CategoriaForm'
import { CategoriasList } from './CategoriasList'
import { categoriasService } from './categorias.service'
import type { CreateCategoriaFormData } from './categorias.schemas'
import type { Category } from './categorias.types'
import './CategoriasPage.css'

type Mode = { type: 'list' } | { type: 'create' } | { type: 'edit'; category: Category }

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

// Mensagem específica quando a categoria tem lançamentos vinculados (409), ao invés do
// texto genérico da API — pedido explícito, não é só reaproveitar error.message.
function deleteErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 409) {
    return 'Esta categoria já tem lançamentos vinculados e não pode ser excluída.'
  }
  return errorMessage(error, 'Não foi possível excluir a categoria.')
}

export function CategoriasPage() {
  // Despesas e Receitas são duas listas paginadas independentes na mesma tela — cada uma
  // com seu próprio estado de página, sem afetar a outra.
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([])
  const [expensePage, setExpensePage] = useState(1)
  const [expenseTotal, setExpenseTotal] = useState(0)
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([])
  const [incomePage, setIncomePage] = useState(1)
  const [incomeTotal, setIncomeTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<Mode>({ type: 'list' })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const [expenseResult, incomeResult] = await Promise.all([
          categoriasService.listPaginated('expense', { page: expensePage, pageSize: DEFAULT_PAGE_SIZE }),
          categoriasService.listPaginated('income', { page: incomePage, pageSize: DEFAULT_PAGE_SIZE }),
        ])
        if (active) {
          setExpenseCategories(expenseResult.items)
          setExpenseTotal(expenseResult.total)
          setIncomeCategories(incomeResult.items)
          setIncomeTotal(incomeResult.total)
        }
      } catch (error) {
        if (active) {
          setLoadError(errorMessage(error, 'Não foi possível carregar as categorias.'))
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [expensePage, incomePage, refreshKey])

  async function handleCreate(data: CreateCategoriaFormData) {
    setSubmitting(true)
    setFormError(null)
    try {
      await categoriasService.create(data)
      setMode({ type: 'list' })
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setFormError(errorMessage(error, 'Erro inesperado. Tente novamente.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate(id: string, data: CreateCategoriaFormData) {
    setSubmitting(true)
    setFormError(null)
    try {
      await categoriasService.update(id, data)
      setMode({ type: 'list' })
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setFormError(errorMessage(error, 'Erro inesperado. Tente novamente.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(category: Category) {
    setLoadError(null)
    try {
      await categoriasService.remove(category.id)
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setLoadError(deleteErrorMessage(error))
    }
  }

  function handleCancelForm() {
    setFormError(null)
    setMode({ type: 'list' })
  }

  if (mode.type === 'create' || mode.type === 'edit') {
    return (
      <div className="categorias-page">
        <PageHeader title={mode.type === 'create' ? 'Nova categoria' : 'Editar categoria'} />
        <CategoriaForm
          initialData={mode.type === 'edit' ? mode.category : undefined}
          error={formError}
          submitting={submitting}
          onCancel={handleCancelForm}
          onSubmit={(data) =>
            mode.type === 'edit' ? handleUpdate(mode.category.id, data) : handleCreate(data)
          }
        />
      </div>
    )
  }

  return (
    <div className="categorias-page">
      <PageHeader
        title="Categorias"
        action={
          <Button type="button" onClick={() => setMode({ type: 'create' })}>
            <Plus size={16} aria-hidden="true" />
            Nova categoria
          </Button>
        }
      />
      <FormError message={loadError} />
      {!loading && (
        <CategoriasList
          expenseCategories={expenseCategories}
          expensePage={expensePage}
          expenseTotalPages={totalPages(expenseTotal, DEFAULT_PAGE_SIZE)}
          onExpensePageChange={setExpensePage}
          incomeCategories={incomeCategories}
          incomePage={incomePage}
          incomeTotalPages={totalPages(incomeTotal, DEFAULT_PAGE_SIZE)}
          onIncomePageChange={setIncomePage}
          onEdit={(category) => setMode({ type: 'edit', category })}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
