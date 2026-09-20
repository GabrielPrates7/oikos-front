import { centsToBRL } from '../../utils/currency'
import { barColor, formatItemTitle, formatShare } from './visaoGeral.utils'
import type { RankedRow } from './visaoGeral.utils'
import './RankedBarsCard.css'

interface RankedBarsCardProps {
  title: string
  rows: RankedRow[]
  emptyMessage: string
}

// Barras horizontais ranqueadas (substitui a rosca): lista semântica, uma linha por item —
// marcador (ícone ou bolinha), nome, barra proporcional à participação no TOTAL do card e,
// à direita, valor e percentual em texto. Sem drill-down: só tooltip nativo (title).
export function RankedBarsCard({ title, rows, emptyMessage }: RankedBarsCardProps) {
  const totalCents = rows.reduce((sum, row) => sum + row.valueCents, 0)

  return (
    <section className="ranked-card">
      <h3 className="ranked-card__title">{title}</h3>
      {rows.length === 0 ? (
        <p className="ranked-card__empty">{emptyMessage}</p>
      ) : (
        <ul className="ranked-card__list">
          {rows.map((row) => {
            const share = formatShare(row.valueCents, totalCents)
            const widthPercent = totalCents > 0 ? (row.valueCents / totalCents) * 100 : 0
            return (
              <li
                key={row.key}
                className="ranked-card__row"
                title={formatItemTitle(row.label, row.valueCents, share)}
              >
                <span className="ranked-card__marker" aria-hidden="true">
                  {row.icon ? (
                    row.icon
                  ) : (
                    <span
                      className="ranked-card__dot"
                      style={{ background: barColor(row.color) }}
                    />
                  )}
                </span>
                <span className="ranked-card__name">{row.label}</span>
                <span className="ranked-card__figures">
                  <span className="ranked-card__value">{centsToBRL(row.valueCents)}</span>
                  <span className="ranked-card__share">{share}</span>
                </span>
                <span className="ranked-card__track" aria-hidden="true">
                  <span
                    className="ranked-card__fill"
                    style={{
                      width: `${widthPercent}%`,
                      minWidth: row.valueCents > 0 ? 4 : 0,
                      background: barColor(row.color),
                    }}
                  />
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
