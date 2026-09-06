import { useEffect, useState } from 'react'
import { BudgetComparisonChart } from '../../components/charts/BudgetComparisonChart'
import type { BudgetComparisonItem } from '../../components/charts/BudgetComparisonChart'
import { CategoryBarChart } from '../../components/charts/CategoryBarChart'
import { FormError } from '../../components/feedback/FormError'
import { ApiError } from '../../services/api'
import { CHART_COLOR_EXPENSE, CHART_COLOR_INCOME } from '../../utils/chartColors'
import { currentMonthString } from '../../utils/date'
import { categoriasService } from '../categorias/categorias.service'
import type { Category } from '../categorias/categorias.types'
import { MonthSwitcher } from '../dashboard/MonthSwitcher'
import { orcamentosService } from '../orcamentos/orcamentos.service'
import type { Budget } from '../orcamentos/orcamentos.types'
import { relatoriosService } from './relatorios.service'
import type { ByCategoryResult, ReportCategoryType } from './relatorios.types'
import './PorCategoriaTab.css'

type Mode = 'real' | 'planned'

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

export function PorCategoriaTab() {
  const [month, setMonth] = useState(() => currentMonthString())
  const [type, setType] = useState<ReportCategoryType>('expense')
  const [mode, setMode] = useState<Mode>('real')
  const [result, setResult] = useState<ByCategoryResult | null>(null)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (mode !== 'real') return
    let active = true

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const data = await relatoriosService.getByCategory(month, type)
        if (active) {
          setResult(data)
        }
      } catch (error) {
        if (active) {
          setLoadError(errorMessage(error, 'Não foi possível carregar o relatório.'))
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
  }, [month, type, mode])

  useEffect(() => {
    if (mode !== 'planned') return
    let active = true

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const [budgetsResult, categoriesResult] = await Promise.all([
          orcamentosService.list(month),
          categoriasService.list('expense'),
        ])
        if (active) {
          setBudgets(budgetsResult)
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
  }, [month, mode])

  const color = type === 'expense' ? CHART_COLOR_EXPENSE : CHART_COLOR_INCOME
  const emptyMessage =
    type === 'expense'
      ? 'Nenhuma despesa categorizada nesse mês.'
      : 'Nenhuma entrada categorizada nesse mês.'

  const budgetComparisonData: BudgetComparisonItem[] = budgets.map((budget) => {
    const category = categories.find((item) => item.id === budget.category_id)
    return {
      name: category?.name ?? 'Categoria removida',
      icon: category?.icon ?? null,
      plannedCents: budget.limit_amount_cents,
      spentCents: budget.spentCents,
      isOverBudget: budget.spentCents > budget.limit_amount_cents,
    }
  })

  return (
    <div className="por-categoria-tab">
      <div className="por-categoria-tab__controls">
        <MonthSwitcher month={month} onChange={setMonth} />
        <div className="type-toggle" role="group" aria-label="Modo de visualização">
          <button
            type="button"
            className={`type-toggle__button${mode === 'real' ? ' type-toggle__button--active-neutral' : ''}`}
            aria-pressed={mode === 'real'}
            onClick={() => setMode('real')}
          >
            Gasto real
          </button>
          <button
            type="button"
            className={`type-toggle__button${mode === 'planned' ? ' type-toggle__button--active-neutral' : ''}`}
            aria-pressed={mode === 'planned'}
            onClick={() => setMode('planned')}
          >
            Planejado x Realizado
          </button>
        </div>
        {mode === 'real' && (
          <div className="type-toggle" role="group" aria-label="Tipo de lançamento">
            <button
              type="button"
              className={`type-toggle__button${type === 'expense' ? ' type-toggle__button--active-expense' : ''}`}
              aria-pressed={type === 'expense'}
              onClick={() => setType('expense')}
            >
              Despesas
            </button>
            <button
              type="button"
              className={`type-toggle__button${type === 'income' ? ' type-toggle__button--active-income' : ''}`}
              aria-pressed={type === 'income'}
              onClick={() => setType('income')}
            >
              Entradas
            </button>
          </div>
        )}
      </div>
      <FormError message={loadError} />
      {!loading && mode === 'real' && result && (
        <CategoryBarChart data={result.categories} color={color} emptyMessage={emptyMessage} />
      )}
      {!loading && mode === 'planned' && (
        <BudgetComparisonChart
          data={budgetComparisonData}
          emptyMessage="Nenhum orçamento cadastrado nesse mês. Crie um em Orçamentos pra acompanhar planejado x realizado aqui."
        />
      )}
    </div>
  )
}
