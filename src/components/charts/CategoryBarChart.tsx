import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { centsToBRL } from '../../utils/currency'
import {
  assignCategoryColors,
  CATEGORY_GRADIENT_NAMES,
  CHART_COLOR_BG_ELEVATED,
  CHART_COLOR_TEXT_MUTED,
  CHART_COLOR_TEXT_PRIMARY,
  lightenHex,
} from '../../utils/chartColors'
import './CategoryBarChart.css'

const MIN_OPACITY = 0.35

export interface CategoryBarChartItem {
  name: string
  icon: string | null
  totalCents: number
  // Opcional — só o Dashboard calcula isso (percentOfTotal vem do backend, relativo ao
  // jaPagoCents do mês). Quando ausente, o rótulo mostra só o valor (comportamento
  // inalterado em Relatórios).
  percentOfTotal?: number
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
  // Uma cor por linha (CATEGORY_PALETTE, ciclando) em vez da mesma `color` variando
  // opacidade — só o Dashboard usa isso, pra bater com a imagem de referência do redesign.
  // Relatórios mantém o comportamento antigo (não passa esta prop).
  categorical?: boolean
}

// Barras horizontais. Por padrão, uma cor só variando opacidade (mais escura = maior
// valor) — usado em Relatórios (Por categoria, cor muda com o toggle Despesas/Entradas).
// Com categorical=true (Dashboard), cada linha ganha sua própria cor da CATEGORY_PALETTE.
// Sempre ordenado do maior pro menor.
export function CategoryBarChart({
  data,
  color,
  emptyMessage,
  barSize,
  rowHeight = 40,
  showAxis = true,
  categorical = false,
}: CategoryBarChartProps) {
  if (data.length === 0) {
    return <p className="category-bar-chart__empty">{emptyMessage}</p>
  }

  // Atribuída pro conjunto INTEIRO de uma vez (não item a item) — é o que permite detectar
  // e resolver colisão de hash entre duas categorias do mesmo gráfico (ver
  // assignCategoryColors em chartColors.ts).
  const categoryColors = categorical ? assignCategoryColors(data.map((item) => item.name)) : null

  const chartData = [...data]
    .sort((a, b) => b.totalCents - a.totalCents)
    .map((item) => ({
      name: `${item.icon ?? '📁'} ${item.name}`,
      rawName: item.name,
      valueCents: item.totalCents,
      displayLabel:
        item.percentOfTotal !== undefined
          ? `${item.percentOfTotal}% ${centsToBRL(item.totalCents)}`
          : centsToBRL(item.totalCents),
      categoryColor: categoryColors?.get(item.name),
    }))

  const height = Math.max(140, chartData.length * rowHeight)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 72, bottom: showAxis ? 4 : 0, left: 4 }}
      >
        {/* Só as categorias marcadas em CATEGORY_GRADIENT_NAMES (as de maior valor na
            imagem de referência) ganham um <linearGradient> aqui — as demais usam a cor
            sólida direto no Cell, sem def correspondente. */}
        <defs>
          {categorical &&
            chartData.map((entry, index) =>
              CATEGORY_GRADIENT_NAMES.has(entry.rawName) ? (
                <linearGradient
                  key={`gradient-${entry.name}`}
                  id={`category-gradient-${index}`}
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0"
                >
                  <stop offset="0%" stopColor={entry.categoryColor ?? color} />
                  <stop offset="100%" stopColor={lightenHex(entry.categoryColor ?? color, 0.4)} />
                </linearGradient>
              ) : null,
            )}
        </defs>
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
        {/* Sem <Tooltip>: cada barra já mostra % e valor permanentemente via LabelList
            abaixo — um tooltip aqui só repetiria a mesma informação (e o Recharts default
            vazava o nome interno do dataKey, "valueCents", sem um formatter de nome). Valor
            escrito ao lado de cada barra: em telas estreitas as barras menores
            ficam curtas demais pra comparar visualmente — o rótulo garante que o valor
            continua legível independente do comprimento.
            isAnimationActive=false: LabelList só renderiza quando a barra não está mais
            "animando" (showLabels = !isAnimating na Bar do recharts v3) — sem isso os
            rótulos nunca aparecem, porque o estado de animação nunca resolve pra false
            nesse fluxo. */}
        <Bar dataKey="valueCents" radius={[0, 4, 4, 0]} isAnimationActive={false} barSize={barSize}>
          {chartData.map((entry, index) =>
            categorical ? (
              <Cell
                key={entry.name}
                fill={
                  CATEGORY_GRADIENT_NAMES.has(entry.rawName)
                    ? `url(#category-gradient-${index})`
                    : (entry.categoryColor ?? color)
                }
              />
            ) : (
              <Cell key={entry.name} fill={color} fillOpacity={Math.max(MIN_OPACITY, 1 - index * 0.12)} />
            ),
          )}
          <LabelList
            dataKey="displayLabel"
            position="right"
            style={{ fill: CHART_COLOR_TEXT_PRIMARY, fontSize: 12, fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
