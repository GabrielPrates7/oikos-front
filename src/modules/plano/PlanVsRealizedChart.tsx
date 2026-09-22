import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  usePlotArea,
  useXAxisScale,
  useYAxisScale,
  XAxis,
  YAxis,
} from 'recharts'
import { useIsMobile } from '../../components/layout/useIsMobile'
import { useReducedMotion } from '../../components/reports/useReducedMotion'
import {
  CHART_COLOR_BG_ELEVATED,
  CHART_COLOR_TEXT_MUTED,
  CHART_COLOR_TEXT_PRIMARY,
} from '../../utils/chartColors'
import { centsToBRL } from '../../utils/currency'
import type { PlanSummary } from './plano.types'
import { compactBRL, niceTicks } from './planoChartScale'
import { layoutBarLabels, type BarLabelInput } from './planoLabelPlacement'
import { PLAN_COLORS } from './planoFormat'

interface Row {
  name: string
  planned: number
  realized: number
  color: string
}

const BAR_GAP = 4
const LABEL_LINE = 15
const CHAR_WIDTH = 5.3

// Valor sobre a barra: curto (R$ 8,5 mil), centrado na PRÓPRIA barra; negativo em #cf6b52, com o sinal, e
// embaixo da barra. Cada barra do par mostra o seu valor. Se rótulos vizinhos (do mesmo par ou de grupos
// vizinhos) se tocariam, o mais longe do zero se afasta só o necessário (ver layoutBarLabels). O valor
// exato fica no tooltip e na tabela acessível. Posições a partir das escalas dos eixos (só apresentação).
function BarValueLabel(props: {
  rows: Row[]
  series: 'planned' | 'realized'
  showRealized: boolean
  x?: number
  width?: number
  value?: unknown
  index?: number
}) {
  const yScale = useYAxisScale()
  const xScale = useXAxisScale()
  const plot = usePlotArea()
  const { rows, series, showRealized, x = 0, width = 0, value, index = 0 } = props
  if (typeof value !== 'number' || !yScale) return null
  const ownCenter = x + width / 2
  // centro da barra "planejado" do grupo atual e passo entre grupos (a escala de bandas dá o início de cada grupo)
  const plannedCenter = series === 'planned' ? ownCenter : ownCenter - width - BAR_GAP
  const first = rows.length > 1 ? xScale?.(rows[0].name) : undefined
  const second = rows.length > 1 ? xScale?.(rows[1].name) : undefined
  const step = typeof first === 'number' && typeof second === 'number' ? second - first : 1e6

  const inputs: BarLabelInput[] = []
  const owner: { list: number } = { list: -1 }
  let ownX = ownCenter
  rows.forEach((row, group) => {
    const cents = showRealized ? [row.planned, row.realized] : [row.planned]
    cents.forEach((amount, side) => {
      const anchor = yScale(amount)
      if (typeof anchor !== 'number') return
      const negative = amount < 0
      if (group === index && (side === 0) === (series === 'planned')) owner.list = inputs.length
      const textWidth = compactBRL(amount).length * CHAR_WIDTH
      let cx = plannedCenter + (group - index) * step + side * (width + BAR_GAP)
      // o rótulo nunca invade a coluna dos valores do eixo Y nem sai pela direita: desliza só o necessário
      if (plot) {
        cx = Math.min(
          Math.max(cx, plot.x + textWidth / 2 + 1),
          plot.x + plot.width - textWidth / 2 - 1,
        )
      }
      if (group === index && (side === 0) === (series === 'planned')) ownX = cx
      inputs.push({
        cx,
        width: textWidth,
        y: negative ? anchor + 14 : anchor - 5,
        negative,
      })
    })
  })
  const ys = layoutBarLabels(inputs, LABEL_LINE)
  const y = owner.list >= 0 ? ys[owner.list] : undefined
  if (y === undefined) return null
  return (
    <text
      x={ownX}
      y={y}
      textAnchor="middle"
      fontSize={11}
      fontWeight={600}
      fill={value < 0 ? PLAN_COLORS.red : CHART_COLOR_TEXT_PRIMARY}
    >
      {compactBRL(value)}
    </text>
  )
}

function ChartTooltip(props: {
  active?: boolean
  payload?: readonly { payload?: Row }[]
  showRealized: boolean
}) {
  const row = props.payload?.[0]?.payload
  if (!props.active || !row) return null
  return (
    <div className="plano-tooltip">
      <strong>{row.name}</strong>
      <span style={{ color: row.planned < 0 ? PLAN_COLORS.red : undefined }}>
        Planejado {centsToBRL(row.planned)}
      </span>
      {props.showRealized && (
        <span style={{ color: row.realized < 0 ? PLAN_COLORS.red : undefined }}>
          Realizado {centsToBRL(row.realized)}
        </span>
      )}
    </div>
  )
}

// "Planejado x Realizado": barras agrupadas de Entradas, Saídas e Resultado. Planejado em tom
// translúcido, realizado sólido. Mês futuro: só o planejado. Lê o summary já carregado (não faz
// requisição). Animação desligada com prefers-reduced-motion.
export function PlanVsRealizedChart({ summary }: { summary: PlanSummary }) {
  const reduced = useReducedMotion()
  const mobile = useIsMobile()
  const showRealized = summary.period !== 'future'
  const { planned, realized } = summary

  const rows: Row[] = [
    {
      name: 'Entradas',
      planned: planned.inflow,
      realized: realized.received,
      color: PLAN_COLORS.green,
    },
    { name: 'Saídas', planned: planned.outflow, realized: realized.paid, color: PLAN_COLORS.red },
    {
      name: 'Resultado',
      planned: planned.result,
      realized: realized.result,
      color:
        planned.result < 0 || (showRealized && realized.result < 0) ? PLAN_COLORS.red : '#7fd9a0',
    },
  ]
  const values = rows.flatMap((row) => (showRealized ? [row.planned, row.realized] : [row.planned]))
  const { ticks, domain } = niceTicks(Math.min(...values), Math.max(...values), mobile ? 4 : 5)

  const description = rows
    .map(
      (row) =>
        `${row.name}: planejado ${centsToBRL(row.planned)}${showRealized ? `, realizado ${centsToBRL(row.realized)}` : ''}`,
    )
    .join('; ')

  return (
    <div>
      <div className="plano-chart" role="img" aria-label={`Planejado x realizado. ${description}.`}>
        <ResponsiveContainer width="100%" height={mobile ? 220 : 260}>
          <BarChart
            data={rows}
            margin={{ top: 40, right: mobile ? 24 : 8, bottom: 4, left: 0 }}
            barGap={4}
          >
            <CartesianGrid stroke={CHART_COLOR_BG_ELEVATED} vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: CHART_COLOR_TEXT_MUTED, fontSize: 12 }}
              axisLine={{ stroke: CHART_COLOR_BG_ELEVATED }}
              tickLine={false}
            />
            <YAxis
              ticks={ticks}
              domain={domain}
              tickFormatter={(value: number) => compactBRL(value)}
              width={mobile ? 58 : 66}
              tick={{ fill: CHART_COLOR_TEXT_MUTED, fontSize: 11 }}
              axisLine={{ stroke: CHART_COLOR_BG_ELEVATED }}
              tickLine={false}
            />
            <Tooltip
              content={<ChartTooltip showRealized={showRealized} />}
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            />
            <Bar
              dataKey="planned"
              name="Planejado"
              radius={[5, 5, 0, 0]}
              isAnimationActive={!reduced}
            >
              {rows.map((row) => (
                <Cell
                  key={row.name}
                  fill={row.color}
                  fillOpacity={0.3}
                  stroke={row.color}
                  strokeWidth={1.5}
                />
              ))}
              <LabelList
                dataKey="planned"
                content={<BarValueLabel rows={rows} series="planned" showRealized={showRealized} />}
              />
            </Bar>
            {showRealized && (
              <Bar
                dataKey="realized"
                name="Realizado"
                radius={[5, 5, 0, 0]}
                isAnimationActive={!reduced}
              >
                {rows.map((row) => (
                  <Cell
                    key={row.name}
                    fill={
                      row.name === 'Resultado' && realized.result < 0 ? PLAN_COLORS.red : row.color
                    }
                  />
                ))}
                <LabelList
                  dataKey="realized"
                  content={
                    <BarValueLabel rows={rows} series="realized" showRealized={showRealized} />
                  }
                />
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="plano-legend" aria-label="Legenda">
        <li>
          <span className="plano-legend__swatch plano-legend__swatch--planned" aria-hidden="true" />
          Planejado
        </li>
        {showRealized && (
          <li>
            <span
              className="plano-legend__swatch plano-legend__swatch--realized"
              aria-hidden="true"
            />
            Realizado
          </li>
        )}
      </ul>
      {!showRealized && <p className="plano-chart__note">Mês futuro: só o planejado.</p>}
      {/* equivalente em texto do gráfico, só para leitor de tela: a caixa de 1px vai no div (uma table ignora a largura) */}
      <div className="sr-only">
        <table>
          <caption>Planejado x realizado (valores exatos)</caption>
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Planejado</th>
              {showRealized && <th scope="col">Realizado</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <th scope="row">{row.name}</th>
                <td>{centsToBRL(row.planned)}</td>
                {showRealized && <td>{centsToBRL(row.realized)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
