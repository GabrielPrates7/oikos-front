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
      {/* max-height cabe ~11 linhas (11 × 52px de rowHeight) — o título fica FORA dessa
          div, só a lista de barras rola. Com poucas categorias (a maioria dos meses) o
          conteúdo nem chega a essa altura e a barra de rolagem não aparece; a partir de
          ~12 categorias no mês, rola em vez de esticar o painel (e o resto do dashboard)
          indefinidamente. Já vem ordenado do maior pro menor (CategoryBarChart.tsx) —
          rolar pra baixo só revela valores menores, nunca esconde os maiores. */}
      <div className="category-breakdown-chart__scroll">
        <CategoryBarChart
          data={data}
          color={CHART_COLOR_ACCENT}
          emptyMessage="Nenhuma despesa categorizada nesse mês."
          barSize={22}
          rowHeight={52}
          showAxis={false}
          categorical
        />
      </div>
    </div>
  )
}
