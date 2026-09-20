import { centsToBRL } from '../../utils/currency'
import { barColor, formatItemTitle, formatShare } from './visaoGeral.utils'
import './RankedBarsCard.css'
import './SegmentedBarCard.css'

export interface Segment {
  key: string
  label: string
  valueCents: number
  color: string
}

interface SegmentedBarCardProps {
  title: string
  segments: Segment[]
  emptyMessage: string
}

// Barra única de 10px dividida em segmentos (Essencial x Supérfluo, Fixo x Não fixo).
// Rótulo, valor e percentual de cada lado em TEXTO acima da barra; segmento zerado não é
// renderizado (mas o rótulo dele continua na linha de cima); segmento pequeno tem 4px mínimos.
export function SegmentedBarCard({ title, segments, emptyMessage }: SegmentedBarCardProps) {
  const totalCents = segments.reduce((sum, segment) => sum + segment.valueCents, 0)
  const ariaLabel = segments
    .map((s) => `${s.label} ${centsToBRL(s.valueCents)} (${formatShare(s.valueCents, totalCents)})`)
    .join(', ')

  return (
    <section className="segmented-card">
      <h3 className="segmented-card__title">{title}</h3>
      {totalCents === 0 ? (
        <p className="segmented-card__empty">{emptyMessage}</p>
      ) : (
        <>
          <div className="segmented-card__labels">
            {segments.map((segment) => (
              <div
                key={segment.key}
                className="segmented-card__label"
                title={formatItemTitle(
                  segment.label,
                  segment.valueCents,
                  formatShare(segment.valueCents, totalCents),
                )}
              >
                <span className="segmented-card__label-name">
                  <span
                    className="segmented-card__dot"
                    style={{ background: barColor(segment.color) }}
                    aria-hidden="true"
                  />
                  {segment.label}
                </span>
                <span className="segmented-card__label-value">
                  {centsToBRL(segment.valueCents)}
                </span>
                <span className="segmented-card__label-share">
                  {formatShare(segment.valueCents, totalCents)}
                </span>
              </div>
            ))}
          </div>
          <div className="segmented-card__bar" role="img" aria-label={ariaLabel}>
            {segments
              .filter((segment) => segment.valueCents > 0)
              .map((segment) => (
                <span
                  key={segment.key}
                  className="segmented-card__segment"
                  style={{
                    flexGrow: segment.valueCents,
                    flexBasis: 0,
                    minWidth: 4,
                    background: barColor(segment.color),
                  }}
                  title={formatItemTitle(
                    segment.label,
                    segment.valueCents,
                    formatShare(segment.valueCents, totalCents),
                  )}
                />
              ))}
          </div>
        </>
      )}
    </section>
  )
}
