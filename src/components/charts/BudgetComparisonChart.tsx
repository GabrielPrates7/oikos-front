import { useEffect, useRef, useState } from 'react'
import { Bar, BarChart, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { centsToBRL } from '../../utils/currency'
import {
  CHART_COLOR_ACCENT,
  CHART_COLOR_BG_ELEVATED,
  CHART_COLOR_BG_SURFACE,
  CHART_COLOR_EXPENSE,
  CHART_COLOR_TEXT_MUTED,
  CHART_COLOR_TEXT_PRIMARY,
  lightenHex,
} from '../../utils/chartColors'
import './BudgetComparisonChart.css'

// Índice do maior valor de uma série — só essa barra ganha o glow sutil (destaque no pico,
// não em todas: "berrante" era o risco explícito do pedido).
function indexOfMax(values: number[]): number {
  let maxIndex = 0
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[maxIndex]) maxIndex = i
  }
  return maxIndex
}

export interface BudgetComparisonItem {
  name: string
  icon: string | null
  plannedCents: number
  spentCents: number
}

interface BudgetComparisonChartProps {
  data: BudgetComparisonItem[]
  emptyMessage: string
  // Default 'horizontal' preserva o comportamento exato de antes — Relatórios → Por
  // Categoria usa esse componente sem passar a prop, então continua idêntico. 'vertical'
  // é usado só pelo Dashboard (ver DashboardPage/FinancialHealthSection), que pediu
  // barras verticais pra bater com a imagem de referência.
  orientation?: 'horizontal' | 'vertical'
}

// Medido via getBBox nos <text> do XAxis com os nomes reais (o mais longo do conjunto de
// teste, "🍽️ Alimentação", ~87px sem rotação): a -35°, a caixa rotacionada ocupa ~80px de
// largura — com centros de categoria a 82px de distância (min-width 110px/categoria) já
// fica no limite do encostar. Abaixo disso o rótulo -35° colide com o vizinho.
const COMFORTABLE_CATEGORY_WIDTH = 110

// Modo compacto (rótulo quase vertical, -80°) — a rotação passa a consumir ALTURA em vez
// de LARGURA (a mesma caixa de ~87px de texto, girada quase 90°, ocupa só ~15px de largura
// na base). É o que permite o painel real (~234px em telas largas, 3 colunas dentro da
// coluna mais estreita do dashboard) caber as categorias de hoje sem scroll — só cai pro
// modo confortável quando sobra espaço de verdade.
const COMPACT_CATEGORY_WIDTH = 56
const COMPACT_ANGLE = -80

// YAxis (width=72) + margens (left 4 + right 8) — espaço FIXO que não escala com o número
// de categorias, mas fica DENTRO do wrapper com scroll (a área toda, eixo incluso, rola
// junto). Sem somar isso ao min-width no modo com scroll, o último grupo de barra "cabia"
// matematicamente na borda visível mas o PIXEL da barra em si (depois do padding interno
// de categoria) ficava sempre alguns px depois da borda — medido via
// getBoundingClientRect com 5 categorias: grupo começava a 232px (dentro dos 234px
// visíveis) mas a barra em si só em 236px (fora). Somar esse offset ao min-width garante
// que cada categoria recebe sua largura nominal de verdade, sobrando fatia visível real.
const VERTICAL_AXIS_OVERHEAD = 84

interface VerticalLayoutMode {
  categoryWidth: number
  angle: number
  axisHeight: number
  needsScroll: boolean
}

// Decide largura/ângulo por categoria a partir da largura REAL do painel (medida via
// ResizeObserver, mesmo padrão de SpendingTrendsChart.tsx) — nunca do viewport, porque a
// largura do painel depende do layout ao redor (grid de 3 colunas dentro da coluna mais
// estreita do dashboard). Só ativa scroll quando nem o modo compacto cabe.
function computeVerticalLayout(containerWidth: number, categoryCount: number): VerticalLayoutMode {
  if (containerWidth <= 0) {
    return { categoryWidth: COMFORTABLE_CATEGORY_WIDTH, angle: -35, axisHeight: 70, needsScroll: false }
  }
  if (categoryCount * COMFORTABLE_CATEGORY_WIDTH <= containerWidth) {
    return { categoryWidth: COMFORTABLE_CATEGORY_WIDTH, angle: -35, axisHeight: 70, needsScroll: false }
  }
  if (categoryCount * COMPACT_CATEGORY_WIDTH <= containerWidth) {
    return {
      categoryWidth: containerWidth / categoryCount,
      angle: COMPACT_ANGLE,
      axisHeight: 96,
      needsScroll: false,
    }
  }
  return { categoryWidth: COMPACT_CATEGORY_WIDTH, angle: COMPACT_ANGLE, axisHeight: 96, needsScroll: true }
}

// Barra dupla — Realizado é SEMPRE terracota sólido, cor fixa — já tentamos variar por
// severidade (verde/âmbar/terracota, os 3 níveis de OrcamentosList), mas sempre que o
// gasto ficava abaixo de 70% do planejado a cor calculada colidia com o verde do
// Planejado, deixando as duas barras idênticas no gráfico (o objetivo aqui é só comparar
// as duas barras visualmente, severidade por categoria já existe em OrcamentosList).
export function BudgetComparisonChart({
  data,
  emptyMessage,
  orientation = 'horizontal',
}: BudgetComparisonChartProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    const el = scrollRef.current
    if (!el || orientation !== 'vertical') return
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0]?.contentRect.width ?? 0)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [orientation])

  if (data.length === 0) {
    return <p className="budget-comparison-chart__empty">{emptyMessage}</p>
  }

  const chartData = data.map((item) => ({
    name: `${item.icon ?? '📁'} ${item.name}`,
    Planejado: item.plannedCents,
    Realizado: item.spentCents,
  }))

  const tooltip = (
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
  )
  const legend = <Legend wrapperStyle={{ fontSize: 12, color: CHART_COLOR_TEXT_MUTED }} />

  if (orientation === 'vertical') {
    // A altura escalava com o número de categorias no modo horizontal
    // (chartData.length * 70) porque cada categoria é uma LINHA. No vertical cada
    // categoria é uma COLUNA — quem escala com a quantidade é a LARGURA, não a altura. A
    // largura/ângulo por categoria vêm de computeVerticalLayout, a partir da largura REAL
    // do painel (containerWidth, medida via ResizeObserver acima) — só ativa scroll
    // horizontal (needsScroll) quando nem o modo compacto (rótulo quase vertical) cabe.
    const layout = computeVerticalLayout(containerWidth, chartData.length)
    const minWidth = layout.needsScroll
      ? VERTICAL_AXIS_OVERHEAD + chartData.length * layout.categoryWidth
      : undefined
    const maxPlanejadoIndex = indexOfMax(chartData.map((item) => item.Planejado))
    const maxRealizadoIndex = indexOfMax(chartData.map((item) => item.Realizado))

    return (
      <div ref={scrollRef} className="budget-comparison-chart__scroll-x">
        <div style={minWidth ? { minWidth: `${minWidth}px` } : undefined}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 8, bottom: 4, left: 4 }}
              // Gap padrão do Recharts ('10%' categoria + 4px entre barras) deixa ~18px de
              // espaço morto no início/fim de cada grupo — largo o bastante pra, quando o
              // scroll corta bem na borda de um grupo, nenhum pixel de barra ficar visível
              // (medido via getBoundingClientRect: grupo "começava" dentro da área visível,
              // mas a barra em si só depois da borda). Reduzido pra garantir que a fatia
              // cortada do próximo grupo sempre inclua pixel de barra de verdade.
              barCategoryGap={4}
              barGap={2}
            >
              <defs>
                {/* Gradiente vertical — mesmo princípio de CategoryBarChart.tsx (cor sólida
                    no ponto de ancoragem, clareada na ponta), só que aqui a "ponta" é o
                    topo da barra (y=0%) e a "âncora" no eixo é a base (y=100%), porque a
                    barra cresce pra cima em vez de pra direita. */}
                <linearGradient id="budgetPlanejadoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lightenHex(CHART_COLOR_ACCENT, 0.35)} />
                  <stop offset="100%" stopColor={CHART_COLOR_ACCENT} />
                </linearGradient>
                <linearGradient id="budgetRealizadoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lightenHex(CHART_COLOR_EXPENSE, 0.35)} />
                  <stop offset="100%" stopColor={CHART_COLOR_EXPENSE} />
                </linearGradient>
                {/* feDropShadow em vez de feGaussianBlur simples — dá um halo colorido ao
                    redor da forma sem borrar a barra em si. Só a barra de maior valor de
                    cada série usa isso (via Cell abaixo), pra marcar o pico sem competir
                    visualmente com as demais. */}
                <filter id="budgetPlanejadoGlow" x="-60%" y="-60%" width="220%" height="220%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={CHART_COLOR_ACCENT} floodOpacity="0.55" />
                </filter>
                <filter id="budgetRealizadoGlow" x="-60%" y="-60%" width="220%" height="220%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={CHART_COLOR_EXPENSE} floodOpacity="0.55" />
                </filter>
              </defs>
              {/* interval={0} + angle — mesma razão de SpendingTrendsChart.tsx: nomes de
                  categoria (com emoji, às vezes 2 palavras) não cabem na horizontal sem
                  colidir, então angula em vez de deixar o Recharts esconder rótulo
                  alternado silenciosamente. Ângulo/altura vêm do layout calculado acima —
                  quase vertical (COMPACT_ANGLE) quando o painel é estreito demais pro
                  espaçamento confortável de -35°. */}
              <XAxis
                type="category"
                dataKey="name"
                interval={0}
                angle={layout.angle}
                textAnchor="end"
                height={layout.axisHeight}
                tick={{ fill: CHART_COLOR_TEXT_PRIMARY, fontSize: 12 }}
                axisLine={{ stroke: CHART_COLOR_BG_ELEVATED }}
                tickLine={false}
              />
              <YAxis
                type="number"
                tickFormatter={(value: number) => centsToBRL(value)}
                width={72}
                tick={{ fill: CHART_COLOR_TEXT_MUTED, fontSize: 12 }}
                axisLine={{ stroke: CHART_COLOR_BG_ELEVATED }}
                tickLine={false}
              />
              {tooltip}
              {legend}
              {/* fill na <Bar> continua a cor sólida original — é o que a <Legend> do
                  Recharts lê pra desenhar o quadradinho (ela não resolve url(#gradiente)
                  como cor, sai preta). O gradiente vai só nas <Cell> individuais, que
                  sobrescrevem o fill por barra sem afetar a legenda — mesma técnica já
                  usada aqui pra evitar Planejado/Realizado saindo com a cor igual. */}
              <Bar dataKey="Planejado" fill={CHART_COLOR_ACCENT} radius={[6, 6, 0, 0]} isAnimationActive={false}>
                {chartData.map((_, index) => (
                  <Cell
                    key={`planejado-${index}`}
                    fill="url(#budgetPlanejadoGradient)"
                    filter={index === maxPlanejadoIndex ? 'url(#budgetPlanejadoGlow)' : undefined}
                  />
                ))}
              </Bar>
              <Bar dataKey="Realizado" fill={CHART_COLOR_EXPENSE} radius={[6, 6, 0, 0]} isAnimationActive={false}>
                {chartData.map((_, index) => (
                  <Cell
                    key={`realizado-${index}`}
                    fill="url(#budgetRealizadoGradient)"
                    filter={index === maxRealizadoIndex ? 'url(#budgetRealizadoGlow)' : undefined}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

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
        {tooltip}
        {legend}
        <Bar dataKey="Planejado" fill={CHART_COLOR_ACCENT} radius={[0, 4, 4, 0]} isAnimationActive={false} />
        <Bar dataKey="Realizado" fill={CHART_COLOR_EXPENSE} radius={[0, 4, 4, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  )
}
