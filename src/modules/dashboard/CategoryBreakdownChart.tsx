import { CategoryBarChart } from '../../components/charts/CategoryBarChart'
import { CHART_COLOR_ACCENT } from '../../utils/chartColors'
import type { DashboardCategoryExpense } from './dashboard.types'
import './CategoryBreakdownChart.css'

interface CategoryBreakdownChartProps {
  data: DashboardCategoryExpense[]
}

export function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  return (
    <div className="category-breakdown-chart">
      <h2 className="category-breakdown-chart__title">Despesas por categoria</h2>
      <CategoryBarChart
        data={data}
        color={CHART_COLOR_ACCENT}
        emptyMessage="Nenhuma despesa categorizada nesse mês."
      />
    </div>
  )
}
