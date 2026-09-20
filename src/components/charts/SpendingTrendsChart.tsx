import { useEffect, useRef, useState } from 'react'
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
  assignCategoryColors,
  CHART_COLOR_BG_ELEVATED,
  CHART_COLOR_BG_SURFACE,
  CHART_COLOR_TEXT_MUTED,
  CHART_COLOR_TEXT_PRIMARY,
} from '../../utils/chartColors'
import { formatMonthShort } from '../../utils/date'
import type { SpendingTrendCategoryItem } from '../../modules/relatorios/relatorios.types'

interface SpendingTrendsChartProps {
  months: string[]
  categories: SpendingTrendCategoryItem[]
  emptyMessage: string
}

// Medido via getBoundingClientRect com 6 meses (formato "Abr/26", ~35px cada a
// fontSize:11): os rótulos colidem abaixo de ~260px de largura do plot (a 242px de wrap,
// sobreposição de 4px; a 262px, já não sobrepõe) — esse número é o limiar abaixo do qual
// os rótulos horizontais não cabem, não um breakpoint de tela (a largura do gráfico
// depende do layout ao redor, não só do viewport).
const HORIZONTAL_LABEL_MIN_WIDTH = 280

// Média móvel de 3 meses por categoria (não o valor bruto do mês) — suaviza pico isolado
// pra destacar a TENDÊNCIA de quem mais varia, que é o ponto desse card (o valor bruto já
// aparece em "Despesas por categoria", logo acima na mesma tela).
export function SpendingTrendsChart({ months, categories, emptyMessage }: SpendingTrendsChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // Começa true (rótulo angulado) — é o estado seguro: NUNCA esconde/sobrepõe rótulo
  // enquanto o ResizeObserver ainda não mediu a largura real na primeira renderização.
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

  if (categories.length === 0) {
    return <p className="spending-trends-chart__empty">{emptyMessage}</p>
  }

  // Mesma função central de CategoryBarChart.tsx (chartColors.ts), chamada em LOTE com
  // todas as categorias do gráfico de uma vez — é o que permite detectar colisão entre
  // duas categorias do MESMO gráfico. Antes este componente tinha sua própria lógica
  // posicional (LINE_COLORS[index % 4]), desincronizada dos overrides fixos (ex.:
  // Empréstimo e Outros têm cor própria definida ali, mas aqui caíam em slots de índice
  // que coincidiam em tons de verde parecidos) — bug real encontrado e corrigido.
  const categoryColors = assignCategoryColors(categories.map((category) => category.name))

  const chartData = months.map((month, index) => {
    const row: Record<string, string | number> = { month: formatMonthShort(month) }
    for (const category of categories) {
      row[category.name] = category.points[index]?.movingAvgCents ?? 0
    }
    return row
  })

  return (
    <div ref={containerRef}>
      <ResponsiveContainer width="100%" height={needsAngle ? 240 : 220}>
        <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
          <CartesianGrid stroke={CHART_COLOR_BG_ELEVATED} vertical={false} />
          {/* interval={0} força os 6 rótulos a aparecerem sempre — por padrão o Recharts
              esconde rótulos alternados quando não cabem, silenciosamente (sem indicar
              que há mais dado), dando a impressão errada de só 3 meses disponíveis.
              Quando não cabem na horizontal (needsAngle, ver ResizeObserver acima),
              angula em vez de deixar sobrepor — nunca os dois ao mesmo tempo. */}
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
          />
          <Legend wrapperStyle={{ fontSize: 11, color: CHART_COLOR_TEXT_MUTED }} />
          {categories.map((category) => (
            <Line
              key={category.categoryId}
              type="monotone"
              dataKey={category.name}
              name={`${category.icon ?? '📁'} ${category.name}`}
              stroke={categoryColors.get(category.name)}
              strokeWidth={2}
              dot={{ r: 3 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
