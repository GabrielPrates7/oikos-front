import { useEffect, useRef, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { centsToBRL } from '../../utils/currency'
import {
  CHART_COLOR_BG_ELEVATED,
  CHART_COLOR_BG_SURFACE,
  CHART_COLOR_EXPENSE,
  CHART_COLOR_INCOME,
  CHART_COLOR_TEXT_MUTED,
  CHART_COLOR_TEXT_PRIMARY,
  lightenHex,
} from '../../utils/chartColors'
import { formatMonthShort } from '../../utils/date'
import type { MonthlyEvolutionItem } from '../../modules/relatorios/relatorios.types'

interface CashFlowBarChartProps {
  months: MonthlyEvolutionItem[]
  emptyMessage: string
}

// Índice do maior valor de uma série — mesmo critério de BudgetComparisonChart.tsx: só o
// pico de cada série ganha o glow, pra marcar sem competir com as demais barras.
function indexOfMax(values: number[]): number {
  let maxIndex = 0
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[maxIndex]) maxIndex = i
  }
  return maxIndex
}

// Mesmo limiar medido em SpendingTrendsChart.tsx (getBoundingClientRect com rótulos
// "Abr/26" a fontSize 11) — mesmo formatMonthShort, mesma fonte, mesma lógica de colisão,
// então o número medido lá vale aqui também.
const HORIZONTAL_LABEL_MIN_WIDTH = 280

// Barras agrupadas (Entradas x Despesas) por mês — visual em vez do resumo em texto
// anterior, porque o texto só mostrava o mês selecionado (redundante com os cards do
// topo); o gráfico mostra a tendência dos últimos meses, que os cards não mostram.
export function CashFlowBarChart({ months, emptyMessage }: CashFlowBarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [needsAngle, setNeedsAngle] = useState(true)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0
      setNeedsAngle(width > 0 && width < HORIZONTAL_LABEL_MIN_WIDTH)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (months.length === 0) {
    return <p className="cash-flow-bar-chart__empty">{emptyMessage}</p>
  }

  const chartData = months.map((item) => ({
    month: formatMonthShort(item.month),
    Entradas: item.incomeCents,
    Despesas: item.expenseCents,
  }))
  const maxEntradasIndex = indexOfMax(chartData.map((item) => item.Entradas))
  const maxDespesasIndex = indexOfMax(chartData.map((item) => item.Despesas))

  return (
    <div ref={containerRef}>
      <ResponsiveContainer width="100%" height={needsAngle ? 240 : 220}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 4, left: 4 }} barGap={2}>
          <defs>
            {/* Mesmo princípio de BudgetComparisonChart.tsx — gradiente vertical, claro no
                topo (ponta) escurecendo pra base (eixo); glow via feDropShadow só no pico
                de cada série. */}
            <linearGradient id="cashFlowEntradasGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lightenHex(CHART_COLOR_INCOME, 0.35)} />
              <stop offset="100%" stopColor={CHART_COLOR_INCOME} />
            </linearGradient>
            <linearGradient id="cashFlowDespesasGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lightenHex(CHART_COLOR_EXPENSE, 0.35)} />
              <stop offset="100%" stopColor={CHART_COLOR_EXPENSE} />
            </linearGradient>
            <filter id="cashFlowEntradasGlow" x="-60%" y="-60%" width="220%" height="220%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={CHART_COLOR_INCOME} floodOpacity="0.55" />
            </filter>
            <filter id="cashFlowDespesasGlow" x="-60%" y="-60%" width="220%" height="220%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={CHART_COLOR_EXPENSE} floodOpacity="0.55" />
            </filter>
          </defs>
          <CartesianGrid stroke={CHART_COLOR_BG_ELEVATED} vertical={false} />
          <XAxis
            dataKey="month"
            interval={0}
            angle={needsAngle ? -35 : 0}
            textAnchor={needsAngle ? 'end' : 'middle'}
            height={needsAngle ? 40 : 30}
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
            cursor={{ fill: CHART_COLOR_BG_ELEVATED }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: CHART_COLOR_TEXT_MUTED }} />
          {/* fill na <Bar> continua a cor sólida original — mesma razão de
              BudgetComparisonChart.tsx: a <Legend> do Recharts lê esse fill pra desenhar o
              quadradinho e não resolve url(#gradiente), saindo preta. Gradiente só nas
              <Cell> individuais. */}
          <Bar dataKey="Entradas" fill={CHART_COLOR_INCOME} radius={[6, 6, 0, 0]} isAnimationActive={false}>
            {chartData.map((_, index) => (
              <Cell
                key={`entradas-${index}`}
                fill="url(#cashFlowEntradasGradient)"
                filter={index === maxEntradasIndex ? 'url(#cashFlowEntradasGlow)' : undefined}
              />
            ))}
          </Bar>
          <Bar dataKey="Despesas" fill={CHART_COLOR_EXPENSE} radius={[6, 6, 0, 0]} isAnimationActive={false}>
            {chartData.map((_, index) => (
              <Cell
                key={`despesas-${index}`}
                fill="url(#cashFlowDespesasGradient)"
                filter={index === maxDespesasIndex ? 'url(#cashFlowDespesasGlow)' : undefined}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
