import { centsToBRL } from '../../utils/currency'
import { barColor } from '../../modules/relatorios/visaoGeral.utils'
import type { RankedRow } from '../../modules/relatorios/visaoGeral.utils'
import { formatPercent1 } from './reportFormat'
import './RankedBars.css'

interface RankedBarsProps {
  rows: RankedRow[]
  totalCents: number
  // Nome acessível da lista (ex.: "Despesas por categoria").
  label: string
}

// Barras ranqueadas SEM Recharts: div com largura em %, dentro de ul/li semântico. Escala pelo
// MAIOR item (a barra do topo ocupa 100% da trilha — scale='max'); o percentual em texto à
// direita continua sendo a participação no TOTAL. Largura mínima de 4px, sem eixo X. Sem
// drill-down: só tooltip nativo (title).
export function RankedBars({ rows, totalCents, label }: RankedBarsProps) {
  const maxCents = rows.reduce((max, row) => Math.max(max, row.valueCents), 0)

  return (
    <ul className="ranked-bars" aria-label={label}>
      {rows.map((row) => {
        const share = formatPercent1(row.valueCents, totalCents)
        const widthPercent = maxCents > 0 ? (row.valueCents / maxCents) * 100 : 0
        return (
          <li
            key={row.key}
            className="ranked-bars__row"
            title={`${row.label}: ${centsToBRL(row.valueCents)} (${share})`}
          >
            <span className="ranked-bars__name">
              <span className="ranked-bars__marker" aria-hidden="true">
                {row.icon ?? (
                  <span className="ranked-bars__dot" style={{ background: barColor(row.color) }} />
                )}
              </span>
              <span className="ranked-bars__label">{row.label}</span>
            </span>
            <span className="ranked-bars__track" aria-hidden="true">
              <span
                className="ranked-bars__fill"
                style={{
                  width: `${widthPercent}%`,
                  minWidth: row.valueCents > 0 ? 4 : 0,
                  background: barColor(row.color),
                }}
              />
            </span>
            <span className="ranked-bars__figures">
              <span className="ranked-bars__value">{centsToBRL(row.valueCents)}</span>
              <span className="ranked-bars__share">{share}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
