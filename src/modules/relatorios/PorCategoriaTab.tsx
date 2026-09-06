import { useEffect, useState } from 'react'
import { CategoryBarChart } from '../../components/charts/CategoryBarChart'
import { FormError } from '../../components/feedback/FormError'
import { ApiError } from '../../services/api'
import { CHART_COLOR_EXPENSE, CHART_COLOR_INCOME } from '../../utils/chartColors'
import { currentMonthString } from '../../utils/date'
import { MonthSwitcher } from '../dashboard/MonthSwitcher'
import { relatoriosService } from './relatorios.service'
import type { ByCategoryResult, ReportCategoryType } from './relatorios.types'
import './PorCategoriaTab.css'

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

export function PorCategoriaTab() {
  const [month, setMonth] = useState(() => currentMonthString())
  const [type, setType] = useState<ReportCategoryType>('expense')
  const [result, setResult] = useState<ByCategoryResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
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
  }, [month, type])

  const color = type === 'expense' ? CHART_COLOR_EXPENSE : CHART_COLOR_INCOME
  const emptyMessage =
    type === 'expense'
      ? 'Nenhuma despesa categorizada nesse mês.'
      : 'Nenhuma entrada categorizada nesse mês.'

  return (
    <div className="por-categoria-tab">
      <div className="por-categoria-tab__controls">
        <MonthSwitcher month={month} onChange={setMonth} />
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
      </div>
      <FormError message={loadError} />
      {!loading && result && (
        <CategoryBarChart data={result.categories} color={color} emptyMessage={emptyMessage} />
      )}
    </div>
  )
}
