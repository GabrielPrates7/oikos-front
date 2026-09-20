import { useSyncExternalStore } from 'react'
import {
  Bar,
  Cell,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  CHART_COLOR_EXPENSE,
  CHART_COLOR_INCOME,
  CHART_COLOR_TEXT_MUTED,
  CHART_COLOR_TEXT_PRIMARY,
} from '../../utils/chartColors'
import { centsToBRL } from '../../utils/currency'
import { formatMonthShort } from '../../utils/date'
import {
  formatCompactBRL,
  formatMonthLong,
  formatSignedBRL,
  niceTicks,
} from './evolucaoMensal.utils'
import type { EvolutionPoint, EvolutionSummary } from './evolucaoMensal.utils'
import { TERRACOTTA_TEXT } from './visaoGeral.utils'
import './EvolucaoChart.css'

const RESULT_COLOR = CHART_COLOR_TEXT_PRIMARY // #edeae2
const INCOME_TEXT = '#6baf82'

function subscribeMedia(query: string, callback: () => void) {
  const media = window.matchMedia(query)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => subscribeMedia(query, callback),
    () => window.matchMedia(query).matches,
    () => false,
  )
}

function resultColor(cents: number): string {
  if (cents > 0) return INCOME_TEXT
  if (cents < 0) return TERRACOTTA_TEXT
  return CHART_COLOR_TEXT_PRIMARY
}

interface EvolutionTooltipProps {
  active?: boolean
  point?: EvolutionPoint
}

function EvolutionTooltip({ active, point }: EvolutionTooltipProps) {
  if (!active || !point) return null
  return (
    <div className="evolucao-tooltip">
      <div className="evolucao-tooltip__head">
        <span className="evolucao-tooltip__month">{formatMonthLong(point.month)}</span>
        {point.isCurrent && <span className="evolucao-tooltip__badge">Mês em andamento</span>}
      </div>
      {point.hasMovement ? (
        <dl className="evolucao-tooltip__list">
          <div className="evolucao-tooltip__row">
            <dt>Entradas</dt>
            <dd>{centsToBRL(point.incomeCents)}</dd>
          </div>
          <div className="evolucao-tooltip__row">
            <dt>Despesas</dt>
            <dd>{centsToBRL(point.expenseCents)}</dd>
          </div>
          <div className="evolucao-tooltip__row evolucao-tooltip__row--result">
            <dt>Resultado</dt>
            <dd style={{ color: resultColor(point.netCents ?? 0) }}>
              {formatSignedBRL(point.netCents ?? 0)}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="evolucao-tooltip__empty">Sem lançamentos</p>
      )}
    </div>
  )
}

interface EvolucaoChartProps {
  points: EvolutionPoint[]
  summary: EvolutionSummary
  periodMonths: number
}

// Rótulos do eixo X em intervalos pra não sobrepor: 12M mostra 1 a cada 2 meses, 24M 1 a cada
// 3 (1 a cada 4 em tela estreita). interval do XAxis = "quantos ticks pular".
function xInterval(periodMonths: number, narrow: boolean): number {
  if (periodMonths >= 24) return narrow ? 3 : 2
  if (periodMonths >= 12) return 1
  return 0
}

export function EvolucaoChart({ points, summary, periodMonths }: EvolucaoChartProps) {
  const narrow = useMediaQuery('(max-width: 639px)')
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  const values = points.flatMap((point) => [
    point.incomeCents,
    point.expenseCents,
    point.netCents ?? 0,
  ])
  const scale = niceTicks(Math.min(...values), Math.max(...values), 5)

  const chartData = points.map((point) => ({
    ...point,
    axisLabel: narrow ? point.labelShort : point.label,
  }))

  const first = points[0]
  const last = points[points.length - 1]
  const peak = summary.peakExpense
  const ariaLabel = [
    `Evolução mensal de ${first ? formatMonthShort(first.month) : ''} a ${last ? formatMonthShort(last.month) : ''}.`,
    `Entradas no período: ${centsToBRL(summary.incomeCents)}.`,
    `Despesas no período: ${centsToBRL(summary.expenseCents)}.`,
    `Resultado no período: ${formatSignedBRL(summary.netCents)}.`,
    peak
      ? `Mês de maior despesa: ${formatMonthLong(peak.month)}, ${centsToBRL(peak.expenseCents)}.`
      : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="evolucao-chart">
      <ul className="evolucao-legend" aria-label="Legenda">
        <li className="evolucao-legend__item">
          <span className="evolucao-legend__square" style={{ background: CHART_COLOR_INCOME }} />
          Entradas
        </li>
        <li className="evolucao-legend__item">
          <span className="evolucao-legend__square" style={{ background: CHART_COLOR_EXPENSE }} />
          Despesas
        </li>
        <li className="evolucao-legend__item">
          <span className="evolucao-legend__dash" style={{ background: RESULT_COLOR }} />
          Resultado
        </li>
      </ul>

      <div role="img" aria-label={ariaLabel} className="evolucao-chart__canvas">
        <ResponsiveContainer width="100%" height={narrow ? 260 : 340}>
          <ComposedChart
            data={chartData}
            barGap={4}
            barCategoryGap="20%"
            margin={{ top: 8, right: 8, bottom: 4, left: 0 }}
          >
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis
              dataKey="axisLabel"
              interval={xInterval(periodMonths, narrow)}
              height={36}
              tickMargin={12}
              tick={{ fill: CHART_COLOR_TEXT_MUTED, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="number"
              domain={scale.domain}
              ticks={scale.ticks}
              interval={0}
              tickFormatter={(value: number) => formatCompactBRL(value)}
              width={narrow ? 56 : 68}
              tick={{ fill: CHART_COLOR_TEXT_MUTED, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.25)" />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              isAnimationActive={false}
              // Mês sem lançamentos tem todas as séries null; sem isso o Recharts descarta o
              // payload e esconde o tooltip, e "Sem lançamentos" nunca apareceria.
              filterNull={false}
              content={(props) => (
                <EvolutionTooltip
                  active={props.active}
                  // Pelo índice ativo (e não pelo payload): mês sem lançamentos tem todas as
                  // séries null e o payload vem vazio, mas o tooltip precisa dizer "Sem lançamentos".
                  point={
                    props.activeIndex === undefined || props.activeIndex === null
                      ? undefined
                      : chartData[Number(props.activeIndex)]
                  }
                />
              )}
            />
            <Bar
              dataKey="incomeBar"
              name="Entradas"
              fill={CHART_COLOR_INCOME}
              radius={[4, 4, 0, 0]}
              isAnimationActive={!reducedMotion}
            >
              {chartData.map((point) => (
                <Cell key={point.month} fillOpacity={point.isCurrent ? 0.7 : 1} />
              ))}
            </Bar>
            <Bar
              dataKey="expenseBar"
              name="Despesas"
              fill={CHART_COLOR_EXPENSE}
              radius={[4, 4, 0, 0]}
              isAnimationActive={!reducedMotion}
            >
              {chartData.map((point) => (
                <Cell key={point.month} fillOpacity={point.isCurrent ? 0.7 : 1} />
              ))}
            </Bar>
            <Line
              type="linear"
              dataKey="netCents"
              name="Resultado"
              stroke={RESULT_COLOR}
              strokeWidth={2}
              dot={{ r: 3, fill: RESULT_COLOR, stroke: RESULT_COLOR }}
              activeDot={{ r: 4 }}
              connectNulls={false}
              isAnimationActive={!reducedMotion}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="evolucao-sr-only">
        <table>
          <caption>Evolução mensal: entradas, despesas e resultado por mês</caption>
          <thead>
            <tr>
              <th scope="col">Mês</th>
              <th scope="col">Entradas</th>
              <th scope="col">Despesas</th>
              <th scope="col">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.month}>
                <th scope="row">{formatMonthLong(point.month)}</th>
                <td>{centsToBRL(point.incomeCents)}</td>
                <td>{centsToBRL(point.expenseCents)}</td>
                <td>
                  {point.hasMovement ? formatSignedBRL(point.netCents ?? 0) : 'Sem lançamentos'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
