import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FormError } from '../../components/feedback/FormError'
import { PageHeader } from '../../components/layout/PageHeader'
import { DropdownMenu } from '../../components/ui/DropdownMenu'
import type { BudgetComparisonItem } from '../../components/charts/BudgetComparisonChart'
import { ApiError } from '../../services/api'
import { currentMonthString } from '../../utils/date'
import { categoriasService } from '../categorias/categorias.service'
import type { Category } from '../categorias/categorias.types'
import { orcamentosService } from '../orcamentos/orcamentos.service'
import type { Budget } from '../orcamentos/orcamentos.types'
import { relatoriosService } from '../relatorios/relatorios.service'
import type { MonthlyEvolutionItem, SpendingTrendsResult } from '../relatorios/relatorios.types'
import { CategoryBreakdownChart } from './CategoryBreakdownChart'
import { CreditCardsSummary } from './CreditCardsSummary'
import { FinancialHealthSection } from './FinancialHealthSection'
import { MonthSwitcher } from './MonthSwitcher'
import { RecentTransactionsList } from './RecentTransactionsList'
import { SummaryCards } from './SummaryCards'
import { dashboardService } from './dashboard.service'
import type { DashboardSummary } from './dashboard.types'
import './DashboardPage.css'

const EMPTY_SPENDING_TRENDS: SpendingTrendsResult = { months: [], categories: [] }
const MONTHLY_EVOLUTION_MONTHS_BACK = 6

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

export function DashboardPage() {
  const [month, setMonth] = useState(() => currentMonthString())
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([])
  const [spendingTrends, setSpendingTrends] = useState<SpendingTrendsResult>(EMPTY_SPENDING_TRENDS)
  const [monthlyEvolution, setMonthlyEvolution] = useState<MonthlyEvolutionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const [summaryResult, budgetsResult, categoriesResult, spendingTrendsResult, monthlyEvolutionResult] =
          await Promise.all([
            dashboardService.getSummary(month),
            orcamentosService.list(month),
            categoriasService.list('expense'),
            relatoriosService.getSpendingTrends(month),
            relatoriosService.getMonthlyEvolution(MONTHLY_EVOLUTION_MONTHS_BACK),
          ])
        if (active) {
          setSummary(summaryResult)
          setBudgets(budgetsResult)
          setExpenseCategories(categoriesResult)
          setSpendingTrends(spendingTrendsResult)
          setMonthlyEvolution(monthlyEvolutionResult.months)
        }
      } catch (error) {
        if (active) {
          setLoadError(errorMessage(error, 'Não foi possível carregar o dashboard.'))
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
  }, [month])

  // Mesmo mapeamento de PorCategoriaTab — orçamentos não vêm com nome/ícone de categoria
  // embutido, só category_id.
  const budgetComparisonData: BudgetComparisonItem[] = budgets.map((budget) => {
    const category = expenseCategories.find((item) => item.id === budget.category_id)
    return {
      name: category?.name ?? 'Categoria removida',
      icon: category?.icon ?? null,
      plannedCents: budget.limit_amount_cents,
      spentCents: budget.spentCents,
    }
  })

  return (
    <div className="dashboard-page">
      <PageHeader
        title="Dashboard"
        action={
          <div className="dashboard-page__header-actions">
            <DropdownMenu
              label="Nova transação"
              align="right"
              trigger={
                <span className="dashboard-page__nova-transacao-trigger">
                  <Plus size={16} aria-hidden="true" />
                  Nova Transação
                </span>
              }
              triggerClassName="dashboard-page__nova-transacao-button"
            >
              {(close) => (
                <>
                  <Link
                    to="/despesas?nova=1"
                    className="dropdown-menu__item"
                    role="menuitem"
                    onClick={close}
                  >
                    Despesa
                  </Link>
                  <Link
                    to="/entradas?nova=1"
                    className="dropdown-menu__item"
                    role="menuitem"
                    onClick={close}
                  >
                    Entrada
                  </Link>
                  <Link
                    to="/transferencias?nova=1"
                    className="dropdown-menu__item"
                    role="menuitem"
                    onClick={close}
                  >
                    Transferência
                  </Link>
                </>
              )}
            </DropdownMenu>
            <MonthSwitcher month={month} onChange={setMonth} />
          </div>
        }
      />
      <FormError message={loadError} />
      {!loading && summary && (
        <div className="dashboard-page__panels">
          <SummaryCards summary={summary} />
          <div className="dashboard-page__grid">
            <div className="dashboard-panel dashboard-panel--category-breakdown">
              <CategoryBreakdownChart data={summary.expensesByCategory} />
            </div>
            <div className="dashboard-panel dashboard-panel--credit-cards">
              <CreditCardsSummary cards={summary.creditCards} />
            </div>
          </div>
          <div className="dashboard-page__bottom-grid">
            <div className="dashboard-panel dashboard-panel--glass">
              <RecentTransactionsList transactions={summary.recentTransactions} />
            </div>
            <div className="dashboard-panel dashboard-panel--glass">
              <FinancialHealthSection
                budgetComparisonData={budgetComparisonData}
                spendingTrends={spendingTrends}
                monthlyEvolution={monthlyEvolution}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
