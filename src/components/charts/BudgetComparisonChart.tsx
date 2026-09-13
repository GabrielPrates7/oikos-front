import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
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
}

interface BudgetComparisonChartProps {
  data: BudgetComparisonItem[]
  emptyMessage: string
}

// Barra dupla horizontal por categoria orçada — mesma orientação de CategoryBarChart, só
// que com duas séries lado a lado. Realizado é SEMPRE terracota sólido, cor fixa — já
// tentamos variar por severidade (verde/âmbar/terracota, os 3 níveis de OrcamentosList),
// mas sempre que o gasto ficava abaixo de 70% do planejado a cor calculada colidia com o
// verde do Planejado, deixando as duas barras idênticas no gráfico (o objetivo aqui é só
// comparar as duas barras visualmente, severidade por categoria já existe em
// OrcamentosList).
export function BudgetComparisonChart({ data, emptyMessage }: BudgetComparisonChartProps) {
  if (data.length === 0) {
    return <p className="budget-comparison-chart__empty">{emptyMessage}</p>
  }

  const chartData = data.map((item) => ({
    name: `${item.icon ?? '📁'} ${item.name}`,
    Planejado: item.plannedCents,
    Realizado: item.spentCents,
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
        <Bar dataKey="Realizado" fill={CHART_COLOR_EXPENSE} radius={[0, 4, 4, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  )
}
