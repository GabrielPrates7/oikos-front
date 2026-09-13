import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { centsToBRL } from '../../utils/currency'
import {
  CHART_COLOR_ACCENT,
  CHART_COLOR_BG_ELEVATED,
  CHART_COLOR_BG_SURFACE,
  CHART_COLOR_EXPENSE,
  CHART_COLOR_INCOME,
  CHART_COLOR_TEXT_MUTED,
  CHART_COLOR_TEXT_PRIMARY,
  CHART_COLOR_WARNING,
} from '../../utils/chartColors'
import { formatMonthShort } from '../../utils/date'
import type { SpendingTrendCategoryItem } from '../../modules/relatorios/relatorios.types'

interface SpendingTrendsChartProps {
  months: string[]
  categories: SpendingTrendCategoryItem[]
  emptyMessage: string
}

// Só 4 cores — o backend já manda no máximo 4 categorias (as de maior variância), mesma
// paleta de linha já usada em MonthlyEvolutionChart/BudgetComparisonChart.
const LINE_COLORS = [CHART_COLOR_ACCENT, CHART_COLOR_EXPENSE, CHART_COLOR_WARNING, CHART_COLOR_INCOME]

// Média móvel de 3 meses por categoria (não o valor bruto do mês) — suaviza pico isolado
// pra destacar a TENDÊNCIA de quem mais varia, que é o ponto desse card (o valor bruto já
// aparece em "Despesas por categoria", logo acima na mesma tela).
export function SpendingTrendsChart({ months, categories, emptyMessage }: SpendingTrendsChartProps) {
  if (categories.length === 0) {
    return <p className="spending-trends-chart__empty">{emptyMessage}</p>
  }

  const chartData = months.map((month, index) => {
    const row: Record<string, string | number> = { month: formatMonthShort(month) }
    for (const category of categories) {
      row[category.name] = category.points[index]?.movingAvgCents ?? 0
    }
    return row
  })

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
        <CartesianGrid stroke={CHART_COLOR_BG_ELEVATED} vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: CHART_COLOR_TEXT_MUTED, fontSize: 11 }}
          axisLine={{ stroke: CHART_COLOR_BG_ELEVATED }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(value: number) => centsToBRL(value)}
          width={64}
          tick={{ fill: CHART_COLOR_TEXT_MUTED, fontSize: 10 }}
          axisLine={{ stroke: CHART_COLOR_BG_ELEVATED }}
          tickLine={false}
        />
        <Tooltip
          formatter={(value) => centsToBRL(typeof value === 'number' ? value : 0)}
          contentStyle={{
            background: CHART_COLOR_BG_SURFACE,
            border: `1px solid ${CHART_COLOR_BG_ELEVATED}`,
            borderRadius: 8,
            color: CHART_COLOR_TEXT_PRIMARY,
          }}
          labelStyle={{ color: CHART_COLOR_TEXT_PRIMARY }}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: CHART_COLOR_TEXT_MUTED }} />
        {categories.map((category, index) => (
          <Line
            key={category.categoryId}
            type="monotone"
            dataKey={category.name}
            name={`${category.icon ?? '📁'} ${category.name}`}
            stroke={LINE_COLORS[index % LINE_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
