import { useEffect, useState } from 'react'
import { FormError } from '../../components/feedback/FormError'
import { PageHeader } from '../../components/layout/PageHeader'
import { ApiError } from '../../services/api'
import { currentMonthString } from '../../utils/date'
import { CategoryBreakdownChart } from './CategoryBreakdownChart'
import { CreditCardsSummary } from './CreditCardsSummary'
import { MonthSwitcher } from './MonthSwitcher'
import { RecentTransactionsList } from './RecentTransactionsList'
import { SummaryCards } from './SummaryCards'
import { dashboardService } from './dashboard.service'
import type { DashboardSummary } from './dashboard.types'
import './DashboardPage.css'

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

export function DashboardPage() {
  const [month, setMonth] = useState(() => currentMonthString())
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const result = await dashboardService.getSummary(month)
        if (active) {
          setSummary(result)
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

  return (
    <div className="dashboard-page">
      <PageHeader title="Dashboard" action={<MonthSwitcher month={month} onChange={setMonth} />} />
      <FormError message={loadError} />
      {!loading && summary && (
        <div className="dashboard-page__panels">
          <div className="dashboard-panel">
            <SummaryCards totalBalanceCents={summary.totalBalanceCents} totals={summary.totals} />
          </div>
          <div className="dashboard-page__grid">
            <div className="dashboard-panel">
              <CategoryBreakdownChart data={summary.expensesByCategory} />
            </div>
            <div className="dashboard-panel">
              <CreditCardsSummary cards={summary.creditCards} />
            </div>
          </div>
          <div className="dashboard-panel">
            <RecentTransactionsList transactions={summary.recentTransactions} />
          </div>
        </div>
      )}
    </div>
  )
}
