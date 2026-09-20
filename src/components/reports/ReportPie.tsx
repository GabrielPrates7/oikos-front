import { useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Sector } from 'recharts'
import { centsToBRL } from '../../utils/currency'
import { barColor } from '../../modules/relatorios/visaoGeral.utils'
import type { RankedRow } from '../../modules/relatorios/visaoGeral.utils'
import './ReportPie.css'

interface CenterOverride {
  valueCents: number
  caption: string
}

interface ReportPieProps {
  // Fatias já agrupadas (≤ 7). Itens com valor 0 ficam só na legenda (sem fatia).
  slices: RankedRow[]
  // Base dos percentuais em TEXTO (valor real / total) — nunca o ângulo, que o minAngle ajusta.
  totalCents: number
  formatShare: (valueCents: number, totalCents: number) => string
  // Altura do gráfico em px (220 na Visão Geral, 300 em Por categoria).
  height: number
  // Nome do conjunto (ex.: "Fonte de receita") pro aria-label.
  label: string
  // Animação de entrada (já considerando prefers-reduced-motion e valor restaurado).
  animate: boolean
  // Centro em repouso (ex.: subtotal do filtro); padrão: total + "Total".
  center?: CenterOverride
}

// Donut Recharts (sem libs novas). Cores = as do modo barras, só com o helper local de 3:1
// (barColor) aplicado à FATIA. A legenda é a alternativa textual: fatias com aria-hidden.
export function ReportPie({
  slices,
  totalCents,
  formatShare,
  height,
  label,
  animate,
  center,
}: ReportPieProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const drawn = slices.filter((slice) => slice.valueCents > 0)
  const active = slices.find((slice) => slice.key === activeKey) ?? null
  // "Maior item" é um item de verdade: "Demais (N)" / "Fora do filtro (N)" só entram se não houver outro.
  const named = drawn.filter((slice) => !slice.isRest)
  const largest = (named.length > 0 ? named : drawn).reduce<RankedRow | null>(
    (best, slice) => (!best || slice.valueCents > best.valueCents ? slice : best),
    null,
  )
  const ariaLabel = `${label}: total ${centsToBRL(totalCents)}${
    largest
      ? `; maior item ${largest.label}, ${centsToBRL(largest.valueCents)} (${formatShare(largest.valueCents, totalCents)})`
      : ''
  }`

  return (
    <div className="report-pie" style={{ '--pie-h': `${height}px` } as React.CSSProperties}>
      <div className="report-pie__layout">
        <div className="report-pie__chart" role="img" aria-label={ariaLabel}>
          <div className="report-pie__canvas" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={drawn.map((slice) => ({ key: slice.key, value: slice.valueCents }))}
                  dataKey="value"
                  nameKey="key"
                  innerRadius="58%"
                  outerRadius="88%"
                  paddingAngle={drawn.length > 1 ? 2 : 0}
                  cornerRadius={3}
                  minAngle={4}
                  startAngle={90}
                  endAngle={-270}
                  isAnimationActive={animate}
                  onMouseEnter={(_, index) => setActiveKey(drawn[index]?.key ?? null)}
                  onMouseLeave={() => setActiveKey(null)}
                  shape={(props) => {
                    const key = drawn[props.index ?? 0]?.key
                    const isActive = key !== undefined && key === activeKey
                    return (
                      <Sector
                        {...props}
                        outerRadius={(props.outerRadius ?? 0) + (isActive ? 5 : 0)}
                        fillOpacity={activeKey && !isActive ? 0.4 : 1}
                      />
                    )
                  }}
                >
                  {drawn.map((slice) => (
                    <Cell key={slice.key} fill={barColor(slice.color)} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="report-pie__center" aria-hidden="true">
            {active ? (
              <>
                <span className="report-pie__center-name" title={active.label}>
                  {active.label}
                </span>
                <span className="report-pie__center-value">{centsToBRL(active.valueCents)}</span>
                <span className="report-pie__center-caption">
                  {formatShare(active.valueCents, totalCents)}
                </span>
              </>
            ) : (
              <>
                <span className="report-pie__center-value">
                  {centsToBRL(center ? center.valueCents : totalCents)}
                </span>
                <span className="report-pie__center-caption">
                  {center ? center.caption : 'Total'}
                </span>
              </>
            )}
          </div>
        </div>

        <ul className="report-pie__legend" aria-label={`Legenda: ${label}`}>
          {slices.map((slice) => (
            <li
              key={slice.key}
              className={`report-pie__item${activeKey === slice.key ? ' report-pie__item--active' : ''}${slice.icon ? '' : ' report-pie__item--no-icon'}`}
              tabIndex={0}
              title={`${slice.label}: ${centsToBRL(slice.valueCents)} (${formatShare(slice.valueCents, totalCents)})`}
              onMouseEnter={() => setActiveKey(slice.key)}
              onMouseLeave={() => setActiveKey(null)}
              onFocus={() => setActiveKey(slice.key)}
              onBlur={() => setActiveKey(null)}
            >
              <span
                className="report-pie__swatch"
                style={{ background: barColor(slice.color) }}
                aria-hidden="true"
              />
              {slice.icon && (
                <span className="report-pie__icon" aria-hidden="true">
                  {slice.icon}
                </span>
              )}
              <span className="report-pie__name">{slice.label}</span>
              <span className="report-pie__value">{centsToBRL(slice.valueCents)}</span>
              <span className="report-pie__share">{formatShare(slice.valueCents, totalCents)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
