import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { centsToBRL } from '../../utils/currency'
import {
  CHART_COLOR_BG_ELEVATED,
  CHART_COLOR_BG_SURFACE,
  CHART_COLOR_TEXT_PRIMARY,
} from '../../utils/chartColors'
import './PieChartCard.css'

export interface PieChartSlice {
  label: string
  valueCents: number
  color: string
}

interface PieChartCardProps {
  title: string
  data: PieChartSlice[]
  emptyMessage: string
}

// Genérico o bastante pra virar qualquer um dos 6 gráficos de pizza de Visão Geral — quem
// chama decide os slices e as cores (sempre variações de --color-accent/income/expense,
// nunca a paleta arco-íris padrão do recharts). Legenda lateral própria (não a Legend do
// recharts) pra controlar o formato "valor (percentual)" exigido.
export function PieChartCard({ title, data, emptyMessage }: PieChartCardProps) {
  const totalCents = data.reduce((sum, slice) => sum + slice.valueCents, 0)
  const hasData = data.length > 0 && totalCents > 0

  return (
    <div className="pie-chart-card">
      <h3 className="pie-chart-card__title">{title}</h3>
      {!hasData ? (
        <p className="pie-chart-card__empty">{emptyMessage}</p>
      ) : (
        <div className="pie-chart-card__body">
          <ResponsiveContainer width="100%" height={160} className="pie-chart-card__chart">
            <PieChart>
              <Pie
                data={data}
                dataKey="valueCents"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={68}
                paddingAngle={data.length > 1 ? 2 : 0}
                stroke="none"
                isAnimationActive={false}
              >
                {data.map((slice) => (
                  <Cell key={slice.label} fill={slice.color} />
                ))}
              </Pie>
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
            </PieChart>
          </ResponsiveContainer>
          <ul className="pie-chart-card__legend">
            {data.map((slice) => {
              const percent = totalCents > 0 ? Math.round((slice.valueCents / totalCents) * 100) : 0
              return (
                <li key={slice.label} className="pie-chart-card__legend-item">
                  <span
                    className="pie-chart-card__legend-dot"
                    style={{ background: slice.color }}
                    aria-hidden="true"
                  />
                  <span className="pie-chart-card__legend-label">{slice.label}</span>
                  <span className="pie-chart-card__legend-value">
                    {centsToBRL(slice.valueCents)} ({percent}%)
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
