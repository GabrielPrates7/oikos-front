import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ReferenceLine,
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
import { CHART_COLOR_BG_ELEVATED, CHART_COLOR_TEXT_MUTED } from '../../utils/chartColors'
import { centsToBRL } from '../../utils/currency'
import { monthRange } from '../../utils/date'
import type { PlanSummary } from './plano.types'
import { compactBRL, niceTicks } from './planoChartScale'
import { placeMinLabel, stepSegments, type Box } from './planoLabelPlacement'
import { PLAN_COLORS, formatDayMonth } from './planoFormat'

interface Point {
  day: number
  date: string
  planned: number
  realized: number | null
}

function CashTooltip(props: {
  active?: boolean
  payload?: readonly { payload?: Point }[]
  showRealized: boolean
}) {
  const point = props.payload?.[0]?.payload
  if (!props.active || !point) return null
  return (
    <div className="plano-tooltip">
      <strong>{formatDayMonth(point.date)}</strong>
      <span style={{ color: point.planned < 0 ? PLAN_COLORS.red : undefined }}>
        Planejado {centsToBRL(point.planned)}
      </span>
      {props.showRealized && point.realized !== null && (
        <span style={{ color: point.realized < 0 ? PLAN_COLORS.red : undefined }}>
          Realizado {centsToBRL(point.realized)}
        </span>
      )}
    </div>
  )
}

const MIN_LABEL = { w: 66, h: 12 }

// Rótulo "Menor saldo": fica ao lado do ponto, na primeira posição que não cruza nenhuma linha do gráfico
// (saldo planejado/realizado, zero, "Hoje") nem sai da área do gráfico; para caixa negativo a primeira
// candidata é ABAIXO do ponto. Só geometria (pixels); os valores vêm prontos do summary.
function MinBalanceLabel(props: {
  points: Point[]
  minDay: number
  minCents: number
  todayDay: number | null
  showRealized: boolean
}) {
  const xScale = useXAxisScale()
  const yScale = useYAxisScale()
  const plot = usePlotArea()
  if (!xScale || !yScale || !plot) return null
  const px = (day: number) => xScale(day) as number | undefined
  const py = (cents: number) => yScale(cents) as number | undefined
  const dotX = px(props.minDay)
  const dotY = py(props.minCents)
  if (dotX === undefined || dotY === undefined) return null

  const toPixels = (pick: (point: Point) => number | null) =>
    props.points.flatMap((point) => {
      const value = pick(point)
      const x = px(point.day)
      const y = value === null ? undefined : py(value)
      return x === undefined || y === undefined ? [] : [{ x, y }]
    })
  const segments = stepSegments(toPixels((point) => point.planned))
  if (props.showRealized) segments.push(...stepSegments(toPixels((point) => point.realized)))
  const plotBox: Box = {
    left: plot.x,
    top: plot.y,
    right: plot.x + plot.width,
    bottom: plot.y + plot.height,
  }
  const zeroY = py(0)
  if (zeroY !== undefined) {
    segments.push({ x1: plotBox.left, y1: zeroY, x2: plotBox.right, y2: zeroY })
  }
  const blocked: Box[] = []
  const todayX = props.todayDay === null ? undefined : px(props.todayDay)
  if (todayX !== undefined) {
    segments.push({ x1: todayX, y1: plotBox.top, x2: todayX, y2: plotBox.bottom })
    // rótulo "Hoje" (canto superior direito da linha)
    blocked.push({ left: todayX - 36, top: plotBox.top, right: todayX, bottom: plotBox.top + 18 })
  }
  const placement = placeMinLabel({
    dot: { x: dotX, y: dotY },
    radius: 5,
    size: MIN_LABEL,
    plot: plotBox,
    segments,
    blocked,
  })
  return (
    <text
      x={placement.x}
      y={placement.y}
      textAnchor={placement.anchor}
      fill={CHART_COLOR_TEXT_MUTED}
      fontSize={11}
      stroke="#0d1310"
      strokeWidth={3}
      paintOrder="stroke"
    >
      Menor saldo
    </text>
  )
}

// "Fluxo de caixa do mês": saldo planejado e realizado como DEGRAUS (type="stepAfter"; nunca curva
// suavizada, porque o saldo muda em saltos). O eixo X é o dia do mês (escala numérica), o eixo Y usa
// ticks 1-2-5. A linha realizada termina em "hoje" (a API manda nulo depois) e só existe no mês
// corrente e no passado; o marcador "Hoje" só aparece no mês corrente; mês futuro mostra só o
// planejado. Lê o summary já carregado.
export function PlanCashFlowChart({ summary }: { summary: PlanSummary }) {
  const reduced = useReducedMotion()
  const mobile = useIsMobile()
  const showRealized = summary.period !== 'future'
  const showToday = summary.period === 'current'
  const { monthEnd } = monthRange(summary.month)
  const lastDay = Number(monthEnd.slice(8))
  const withOpening = summary.settings.include_opening_balance

  const data: Point[] = summary.timeline.map((point) => ({
    day: Number(point.date.slice(8)),
    date: point.date,
    planned: point.planned_cents,
    realized: showRealized ? point.realized_cents : null,
  }))
  const allValues = data.flatMap((point) =>
    point.realized === null ? [point.planned] : [point.planned, point.realized],
  )
  const { ticks, domain } = niceTicks(
    Math.min(...allValues),
    Math.max(...allValues),
    mobile ? 4 : 5,
  )
  // posição do zero no gradiente (proporção da altura da PRÓPRIA área, que vai do maior saldo planejado ao menor,
  // sempre incluindo o zero), só apresentação
  const plannedValues = data.map((point) => point.planned)
  const areaTop = Math.max(0, ...plannedValues)
  const areaBottom = Math.min(0, ...plannedValues)
  const zeroOffset = areaBottom >= 0 ? 1 : areaTop <= 0 ? 0 : areaTop / (areaTop - areaBottom)
  const dayTicks = [1, 5, 10, 15, 20, 25, lastDay].filter(
    (day, index, list) => day <= lastDay && list.indexOf(day) === index,
  )
  const min = summary.planned.min_balance
  const minDay = Number(min.date.slice(8))
  const todayDay = Number(summary.today.slice(8))
  const gradientId = `plano-area-${summary.month}`

  const description = `Fluxo de caixa do mês ${summary.month}. Menor saldo planejado ${centsToBRL(min.cents)} em ${formatDayMonth(min.date)}. Saldo planejado final ${centsToBRL(summary.planned.projected_end_balance)}.`

  return (
    <div>
      <p className="plano-chart__axis">{withOpening ? 'Saldo (R$)' : 'Resultado acumulado (R$)'}</p>
      <div className="plano-chart" role="img" aria-label={description}>
        <ResponsiveContainer width="100%" height={mobile ? 240 : 290}>
          <ComposedChart data={data} margin={{ top: 14, right: 12, bottom: 4, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={PLAN_COLORS.green} stopOpacity={0.14} />
                <stop offset={zeroOffset} stopColor={PLAN_COLORS.green} stopOpacity={0.03} />
                <stop offset={zeroOffset} stopColor={PLAN_COLORS.red} stopOpacity={0.4} />
                <stop offset="1" stopColor={PLAN_COLORS.red} stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART_COLOR_BG_ELEVATED} vertical={false} />
            <XAxis
              dataKey="day"
              type="number"
              domain={[1, lastDay]}
              ticks={dayTicks}
              tick={{ fill: CHART_COLOR_TEXT_MUTED, fontSize: 11 }}
              axisLine={{ stroke: CHART_COLOR_BG_ELEVATED }}
              tickLine={false}
              allowDecimals={false}
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
            <Tooltip content={<CashTooltip showRealized={showRealized} />} />
            <ReferenceLine y={0} stroke={CHART_COLOR_TEXT_MUTED} strokeDasharray="4 3" />
            {showToday && (
              <ReferenceLine
                x={todayDay}
                stroke={PLAN_COLORS.amber}
                strokeDasharray="3 3"
                label={{
                  value: 'Hoje',
                  position: 'insideTopRight',
                  fill: PLAN_COLORS.amber,
                  fontSize: 11,
                }}
              />
            )}
            <Area
              type="stepAfter"
              dataKey="planned"
              stroke="none"
              fill={`url(#${gradientId})`}
              baseValue={0}
              isAnimationActive={!reduced}
              activeDot={false}
              legendType="none"
            />
            <Line
              type="stepAfter"
              dataKey="planned"
              name="Planejado"
              stroke="#b9c3bb"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              isAnimationActive={!reduced}
            />
            {showRealized && (
              <Line
                type="stepAfter"
                dataKey="realized"
                name="Realizado"
                stroke="#7fd9a0"
                strokeWidth={2.5}
                dot={false}
                connectNulls={false}
                isAnimationActive={!reduced}
              />
            )}
            <ReferenceDot
              x={minDay}
              y={min.cents}
              r={5}
              fill={min.cents < 0 ? PLAN_COLORS.red : PLAN_COLORS.amber}
              stroke="#0d1310"
              strokeWidth={1.5}
            />
            <MinBalanceLabel
              points={data}
              minDay={minDay}
              minCents={min.cents}
              todayDay={showToday ? todayDay : null}
              showRealized={showRealized}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ul className="plano-legend" aria-label="Legenda">
        <li>
          <span className="plano-legend__line plano-legend__line--planned" aria-hidden="true" />
          Planejado
        </li>
        {showRealized && (
          <li>
            <span className="plano-legend__line plano-legend__line--realized" aria-hidden="true" />
            Realizado
          </li>
        )}
        <li>
          <span
            className="plano-legend__dot"
            style={min.cents < 0 ? { backgroundColor: PLAN_COLORS.red } : undefined}
            aria-hidden="true"
          />
          Menor saldo
        </li>
      </ul>
      <p
        className="plano-chart__min"
        style={{ color: min.cents < 0 ? PLAN_COLORS.red : undefined }}
      >
        Menor saldo {centsToBRL(min.cents)} em {formatDayMonth(min.date)}
      </p>
      {summary.planned.undated_count > 0 && (
        <p className="plano-chart__note">
          {summary.planned.undated_count}{' '}
          {summary.planned.undated_count === 1
            ? 'item sem data foi colocado'
            : 'itens sem data foram colocados'}{' '}
          no fim do mês.
        </p>
      )}
      {summary.period === 'future' && (
        <p className="plano-chart__note">Mês futuro: só o planejado.</p>
      )}
      {/* equivalente em texto do gráfico, só para leitor de tela: a caixa de 1px vai no div (uma table ignora a largura) */}
      <div className="sr-only">
        <table>
          <caption>Fluxo de caixa do mês (valores exatos por data)</caption>
          <thead>
            <tr>
              <th scope="col">Data</th>
              <th scope="col">Planejado</th>
              {showRealized && <th scope="col">Realizado</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((point) => (
              <tr key={point.date}>
                <th scope="row">{formatDayMonth(point.date)}</th>
                <td>{centsToBRL(point.planned)}</td>
                {showRealized && (
                  <td>{point.realized === null ? '—' : centsToBRL(point.realized)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
