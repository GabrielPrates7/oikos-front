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
  CHART_COLOR_BG_ELEVATED,
  CHART_COLOR_BG_SURFACE,
  CHART_COLOR_EXPENSE,
  CHART_COLOR_INCOME,
  CHART_COLOR_TEXT_MUTED,
  CHART_COLOR_TEXT_PRIMARY,
} from '../../utils/chartColors'
import { formatMonthShort } from '../../utils/date'
import type { MonthlyEvolutionItem } from '../../modules/relatorios/relatorios.types'

interface MonthlyEvolutionChartProps {
  data: MonthlyEvolutionItem[]
}

export function MonthlyEvolutionChart({ data }: MonthlyEvolutionChartProps) {
  const chartData = data.map((item) => ({
    month: formatMonthShort(item.month),
    incomeCents: item.incomeCents,
    expenseCents: item.expenseCents,
  }))

  // Com 24 pontos os rótulos do eixo X se sobrepõem em mobile — mostra no máximo ~6,
  // pulando os demais (interval é "mostra 1 a cada N ticks").
  const tickInterval = chartData.length > 8 ? Math.ceil(chartData.length / 6) - 1 : 0

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 8, right: 24, bottom: 4, left: 4 }}>
        <CartesianGrid stroke={CHART_COLOR_BG_ELEVATED} vertical={false} />
        <XAxis
          dataKey="month"
          interval={tickInterval}
          tick={{ fill: CHART_COLOR_TEXT_MUTED, fontSize: 12 }}
          axisLine={{ stroke: CHART_COLOR_BG_ELEVATED }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(value: number) => centsToBRL(value)}
          width={72}
          tick={{ fill: CHART_COLOR_TEXT_MUTED, fontSize: 11 }}
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
        <Legend wrapperStyle={{ fontSize: 12, color: CHART_COLOR_TEXT_MUTED }} />
        <Line
          type="monotone"
          dataKey="incomeCents"
          name="Entradas"
          stroke={CHART_COLOR_INCOME}
          strokeWidth={2}
          dot={{ r: 3 }}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="expenseCents"
          name="Despesas"
          stroke={CHART_COLOR_EXPENSE}
          strokeWidth={2}
          dot={{ r: 3 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
