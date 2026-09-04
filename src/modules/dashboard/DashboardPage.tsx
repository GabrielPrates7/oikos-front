import { useEffect, useState } from 'react'
import { FormError } from '../../components/feedback/FormError'
import { PageHeader } from '../../components/layout/PageHeader'
import { ApiError } from '../../services/api'
import { currentMonthString } from '../../utils/date'
import { cartoesService } from '../cartoes/cartoes.service'
import type { CreditCard } from '../cartoes/cartoes.types'
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
  const [cards, setCards] = useState<CreditCard[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const [summaryResult, cardsResult] = await Promise.all([
          dashboardService.getSummary(month),
          cartoesService.list('active'),
        ])
        if (active) {
          setSummary(summaryResult)
          setCards(cardsResult)
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
        <>
          <SummaryCards totalBalanceCents={summary.totalBalanceCents} totals={summary.totals} />
          <div className="dashboard-page__grid">
            <CategoryBreakdownChart data={summary.expensesByCategory} />
            <CreditCardsSummary cards={cards} />
          </div>
          <RecentTransactionsList transactions={summary.recentTransactions} />
        </>
      )}
    </div>
  )
}
