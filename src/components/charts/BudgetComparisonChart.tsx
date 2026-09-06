import { Bar, BarChart, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { centsToBRL } from '../../utils/currency'
import {
  CHART_COLOR_ACCENT,
  CHART_COLOR_BG_ELEVATED,
  CHART_COLOR_BG_SURFACE,
  CHART_COLOR_EXPENSE,
  CHART_COLOR_TEXT_MUTED,
  CHART_COLOR_TEXT_PRIMARY,
} from '../../utils/chartColors'
import './BudgetComparisonChart.css'

export interface BudgetComparisonItem {
  name: string
  icon: string | null
  plannedCents: number
  spentCents: number
  isOverBudget: boolean
}

interface BudgetComparisonChartProps {
  data: BudgetComparisonItem[]
  emptyMessage: string
}

// Barra dupla horizontal por categoria orçada — mesma orientação de CategoryBarChart, só
// que com duas séries lado a lado (planejado sempre verde, realizado muda de cor conforme
// estourou ou não o limite daquela categoria).
export function BudgetComparisonChart({ data, emptyMessage }: BudgetComparisonChartProps) {
  if (data.length === 0) {
    return <p className="budget-comparison-chart__empty">{emptyMessage}</p>
  }

  const chartData = data.map((item) => ({
    name: `${item.icon ?? '📁'} ${item.name}`,
    Planejado: item.plannedCents,
    Realizado: item.spentCents,
    isOverBudget: item.isOverBudget,
  }))

  const height = Math.max(160, chartData.length * 70)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
        <XAxis
          type="number"
          tickFormatter={(value: number) => centsToBRL(value)}
          tick={{ fill: CHART_COLOR_TEXT_MUTED, fontSize: 12 }}
          axisLine={{ stroke: CHART_COLOR_BG_ELEVATED }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={{ fill: CHART_COLOR_TEXT_PRIMARY, fontSize: 13 }}
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
          cursor={{ fill: CHART_COLOR_BG_ELEVATED }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: CHART_COLOR_TEXT_MUTED }} />
        <Bar dataKey="Planejado" fill={CHART_COLOR_ACCENT} radius={[0, 4, 4, 0]} isAnimationActive={false} />
        {/* fill aqui é só o fallback pro swatch da Legend (que lê a cor da Bar, não das
            Cell filhas) — a cor real de cada barra vem das Cell abaixo. */}
        <Bar
          dataKey="Realizado"
          fill={CHART_COLOR_ACCENT}
          radius={[0, 4, 4, 0]}
          isAnimationActive={false}
        >
          {chartData.map((entry) => (
            <Cell
              key={entry.name}
              fill={entry.isOverBudget ? CHART_COLOR_EXPENSE : CHART_COLOR_ACCENT}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
