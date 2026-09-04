import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { centsToBRL } from '../../utils/currency'
import type { DashboardCategoryExpense } from './dashboard.types'
import './CategoryBreakdownChart.css'

// Valores fixos espelhando tokens.css — o fill/tick do recharts precisa de cor resolvida,
// não aceita de forma confiável uma CSS custom property em todas as versões/navegadores.
const COLOR_ACCENT = '#4f8f63'
const COLOR_TEXT_MUTED = '#9ca79e'
const COLOR_TEXT_PRIMARY = '#edeae2'
const COLOR_BG_ELEVATED = '#1e2620'
const COLOR_BG_SURFACE = '#161d18'
const MIN_OPACITY = 0.35

interface CategoryBreakdownChartProps {
  data: DashboardCategoryExpense[]
}

export function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  if (data.length === 0) {
    return (
      <div className="category-breakdown-chart">
        <h2 className="category-breakdown-chart__title">Despesas por categoria</h2>
        <p className="category-breakdown-chart__empty">Nenhuma despesa categorizada nesse mês.</p>
      </div>
    )
  }

  const chartData = [...data]
    .sort((a, b) => b.totalCents - a.totalCents)
    .map((item) => ({
      name: `${item.icon ?? '📁'} ${item.name}`,
      valueCents: item.totalCents,
    }))

  const height = Math.max(140, chartData.length * 40)

  return (
    <div className="category-breakdown-chart">
      <h2 className="category-breakdown-chart__title">Despesas por categoria</h2>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 72, bottom: 4, left: 4 }}
        >
          <XAxis
            type="number"
            tickFormatter={(value: number) => centsToBRL(value)}
            tick={{ fill: COLOR_TEXT_MUTED, fontSize: 12 }}
            axisLine={{ stroke: COLOR_BG_ELEVATED }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fill: COLOR_TEXT_PRIMARY, fontSize: 13 }}
            axisLine={{ stroke: COLOR_BG_ELEVATED }}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => centsToBRL(typeof value === 'number' ? value : 0)}
            contentStyle={{
              background: COLOR_BG_SURFACE,
              border: `1px solid ${COLOR_BG_ELEVATED}`,
              borderRadius: 8,
              color: COLOR_TEXT_PRIMARY,
            }}
            labelStyle={{ color: COLOR_TEXT_PRIMARY }}
            cursor={{ fill: COLOR_BG_ELEVATED }}
          />
          {/* Valor escrito ao lado de cada barra: em telas estreitas as barras menores
              (categorias com pouco gasto) ficam curtas demais pra comparar visualmente —
              o rótulo garante que o valor continua legível independente do comprimento. */}
          {/* isAnimationActive=false: LabelList só renderiza quando a barra não está mais
              "animando" (showLabels = !isAnimating na Bar do recharts v3) — sem isso os
              rótulos nunca aparecem, porque o estado de animação nunca resolve pra false
              nesse fluxo. */}
          <Bar dataKey="valueCents" radius={[0, 4, 4, 0]} isAnimationActive={false}>
            {chartData.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={COLOR_ACCENT}
                fillOpacity={Math.max(MIN_OPACITY, 1 - index * 0.12)}
              />
            ))}
            <LabelList
              dataKey="valueCents"
              position="right"
              formatter={(value: unknown) => centsToBRL(typeof value === 'number' ? value : 0)}
              style={{ fill: COLOR_TEXT_PRIMARY, fontSize: 12, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
