import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { centsToBRL } from '../../utils/currency'
import {
  CHART_COLOR_BG_ELEVATED,
  CHART_COLOR_BG_SURFACE,
  CHART_COLOR_TEXT_MUTED,
  CHART_COLOR_TEXT_PRIMARY,
} from '../../utils/chartColors'
import './CategoryBarChart.css'

const MIN_OPACITY = 0.35

export interface CategoryBarChartItem {
  name: string
  icon: string | null
  totalCents: number
}

interface CategoryBarChartProps {
  data: CategoryBarChartItem[]
  color: string
  emptyMessage: string
  // Opcionais, default preserva o visual original (usado em Relatórios) — o Dashboard
  // passa valores mais densos (barra mais grossa, mais espaço entre categorias, sem eixo).
  barSize?: number
  rowHeight?: number
  showAxis?: boolean
}

// Barras horizontais, uma cor só variando opacidade (mais escura = maior valor),
// ordenado do maior pro menor. Reusado em Dashboard (Despesas por categoria, sempre
// verde) e Relatórios (Por categoria, cor muda com o toggle Despesas/Entradas).
export function CategoryBarChart({
  data,
  color,
  emptyMessage,
  barSize,
  rowHeight = 40,
  showAxis = true,
}: CategoryBarChartProps) {
  if (data.length === 0) {
    return <p className="category-bar-chart__empty">{emptyMessage}</p>
  }

  const chartData = [...data]
    .sort((a, b) => b.totalCents - a.totalCents)
    .map((item) => ({
      name: `${item.icon ?? '📁'} ${item.name}`,
      valueCents: item.totalCents,
    }))

  const height = Math.max(140, chartData.length * rowHeight)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 72, bottom: showAxis ? 4 : 0, left: 4 }}
      >
        <XAxis
          type="number"
          hide={!showAxis}
          tickFormatter={(value: number) => centsToBRL(value)}
          tick={{ fill: CHART_COLOR_TEXT_MUTED, fontSize: 12 }}
          axisLine={{ stroke: CHART_COLOR_BG_ELEVATED }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
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
        {/* Valor escrito ao lado de cada barra: em telas estreitas as barras menores
            ficam curtas demais pra comparar visualmente — o rótulo garante que o valor
            continua legível independente do comprimento.
            isAnimationActive=false: LabelList só renderiza quando a barra não está mais
            "animando" (showLabels = !isAnimating na Bar do recharts v3) — sem isso os
            rótulos nunca aparecem, porque o estado de animação nunca resolve pra false
            nesse fluxo. */}
        <Bar dataKey="valueCents" radius={[0, 4, 4, 0]} isAnimationActive={false} barSize={barSize}>
          {chartData.map((entry, index) => (
            <Cell key={entry.name} fill={color} fillOpacity={Math.max(MIN_OPACITY, 1 - index * 0.12)} />
          ))}
          <LabelList
            dataKey="valueCents"
            position="right"
            formatter={(value: unknown) => centsToBRL(typeof value === 'number' ? value : 0)}
            style={{ fill: CHART_COLOR_TEXT_PRIMARY, fontSize: 12, fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
