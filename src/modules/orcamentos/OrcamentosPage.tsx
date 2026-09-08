import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FormError } from '../../components/feedback/FormError'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { ApiError } from '../../services/api'
import { currentMonthString } from '../../utils/date'
import { DEFAULT_PAGE_SIZE, totalPages } from '../../utils/pagination'
import { categoriasService } from '../categorias/categorias.service'
import type { Category } from '../categorias/categorias.types'
import { MonthSwitcher } from '../dashboard/MonthSwitcher'
import { OrcamentoForm } from './OrcamentoForm'
import { OrcamentosList } from './OrcamentosList'
import { orcamentosService } from './orcamentos.service'
import type { CreateOrcamentoFormData } from './orcamentos.schemas'
import type { Budget } from './orcamentos.types'
import './OrcamentosPage.css'

type Mode = { type: 'list' } | { type: 'create' } | { type: 'edit'; budget: Budget }

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

export function OrcamentosPage() {
  const [month, setMonth] = useState(() => currentMonthString())
  const [budgets, setBudgets] = useState<Budget[]>([])
  // Lista COMPLETA (não paginada) dos orçamentos do mês, só pra saber quais categorias já
  // têm orçamento — usada pelo formulário de criação (availableCategories abaixo). Usar a
  // página atual de `budgets` faria categorias já orçadas em outra página reaparecerem como
  // disponíveis.
  const [allBudgetedCategoryIds, setAllBudgetedCategoryIds] = useState<Set<string>>(new Set())
  const [categories, setCategories] = useState<Category[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
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
        const [budgetsResult, allBudgets, categoriesResult] = await Promise.all([
          orcamentosService.listPaginated(month, { page, pageSize: DEFAULT_PAGE_SIZE }),
          orcamentosService.list(month),
          categoriasService.list('expense'),
        ])
        if (active) {
          setBudgets(budgetsResult.items)
          setTotal(budgetsResult.total)
          setAllBudgetedCategoryIds(new Set(allBudgets.map((budget) => budget.category_id)))
          setCategories(categoriesResult)
        }
      } catch (error) {
        if (active) {
          setLoadError(errorMessage(error, 'Não foi possível carregar os orçamentos.'))
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
  }, [month, page, refreshKey])

  function handleMonthChange(next: string) {
    setPage(1)
    setMonth(next)
  }

  async function handleCreate(data: CreateOrcamentoFormData) {
    setSubmitting(true)
    setFormError(null)
    try {
      await orcamentosService.create(month, data)
      setMode({ type: 'list' })
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setFormError(errorMessage(error, 'Erro inesperado. Tente novamente.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate(id: string, data: CreateOrcamentoFormData) {
    setSubmitting(true)
    setFormError(null)
    try {
      await orcamentosService.update(id, data)
      setMode({ type: 'list' })
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setFormError(errorMessage(error, 'Erro inesperado. Tente novamente.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(budget: Budget) {
    try {
      await orcamentosService.remove(budget.id)
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setLoadError(errorMessage(error, 'Não foi possível excluir o orçamento.'))
    }
  }

  function handleCancelForm() {
    setFormError(null)
    setMode({ type: 'list' })
  }

  // Categorias sem orçamento cadastrado neste mês — evita duplicar sem depender só do 409
  // do backend. Em edição, a própria categoria do orçamento continua disponível na lista.
  const availableCategories =
    mode.type === 'edit'
      ? categories.filter(
          (category) =>
            !allBudgetedCategoryIds.has(category.id) || category.id === mode.budget.category_id,
        )
      : categories.filter((category) => !allBudgetedCategoryIds.has(category.id))

  if (mode.type === 'create' || mode.type === 'edit') {
    return (
      <div className="orcamentos-page">
        <PageHeader title={mode.type === 'create' ? 'Novo orçamento' : 'Editar orçamento'} />
        <OrcamentoForm
          categories={availableCategories}
          initialData={mode.type === 'edit' ? mode.budget : undefined}
          error={formError}
          submitting={submitting}
          onCancel={handleCancelForm}
          onSubmit={(data) =>
            mode.type === 'edit' ? handleUpdate(mode.budget.id, data) : handleCreate(data)
          }
        />
      </div>
    )
  }

  return (
    <div className="orcamentos-page">
      <PageHeader
        title="Orçamentos"
        action={
          <div className="orcamentos-page__header-actions">
            <MonthSwitcher month={month} onChange={handleMonthChange} />
            {availableCategories.length > 0 && (
              <Button type="button" onClick={() => setMode({ type: 'create' })}>
                <Plus size={16} aria-hidden="true" />
                Novo orçamento
              </Button>
            )}
          </div>
        }
      />
      <FormError message={loadError} />
      {!loading && (
        <OrcamentosList
          budgets={budgets}
          categories={categories}
          page={page}
          totalPages={totalPages(total, DEFAULT_PAGE_SIZE)}
          onPageChange={setPage}
          onEdit={(budget) => setMode({ type: 'edit', budget })}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
