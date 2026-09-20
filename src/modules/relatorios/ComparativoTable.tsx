import { centsToBRL } from '../../utils/currency'
import { barColor } from './visaoGeral.utils'
import { formatDiff, formatPct, toneOf } from './comparativo.utils'
import type { ComparisonRow, Totals } from './comparativo.utils'
import type { Delta } from '../../components/reports/delta'
import './ComparativoTable.css'

interface ComparativoTableProps {
  rows: ComparisonRow[]
  // Total de TODAS as linhas (sem filtro de nome).
  totals: Totals
  // Soma só das linhas exibidas — só quando o filtro de nome está ativo.
  subtotal?: Totals
  baseLabel: string
  comparedLabel: string
}

// Cinza da barra do mês base (#9ca79e a ~50% de opacidade).
const BASE_BAR = 'rgba(156, 167, 158, 0.5)'

function DiffCell({ delta }: { delta: Delta }) {
  // Despesa: subiu = terracota, caiu = verde, zero = cinza. Sempre com sinal no texto.
  const tone = toneOf(delta.diff, false)
  return <span className={`cmp-diff cmp-diff--${tone}`}>{formatDiff(delta.diff)}</span>
}

function VariationCell({ delta }: { delta: Delta }) {
  if (delta.kind === 'novo') return <span className="cmp-chip">Novo</span>
  if (delta.kind === 'zerou') return <span className="cmp-chip cmp-chip--zerou">Zerou</span>
  if (delta.kind === 'igual' || delta.pct === null) return <span className="cmp-muted">-</span>
  const tone = toneOf(delta.diff, false)
  return <span className={`cmp-diff cmp-diff--${tone}`}>{formatPct(delta.pct)}</span>
}

// Tabela de verdade (<table> com th scope) — inclusive no mobile: lá o CSS reorganiza cada
// linha em grade de duas linhas, e os papéis ARIA explícitos (table/row/cell...) mantêm a
// semântica de tabela mesmo com `display` alterado (alguns navegadores a perdem nesse caso).
export function ComparativoTable({
  rows,
  totals,
  subtotal,
  baseLabel,
  comparedLabel,
}: ComparativoTableProps) {
  // Escala comum ao MAIOR valor entre todas as linhas dos dois meses.
  const maxCents = rows.reduce((max, row) => Math.max(max, row.baseCents, row.comparedCents), 0)
  const width = (cents: number) => (maxCents > 0 ? (Math.max(cents, 0) / maxCents) * 100 : 0)

  return (
    <table className="cmp-table" role="table">
      <caption className="cmp-sr-only">
        Despesas por categoria, {baseLabel} comparado a {comparedLabel}. Linhas ordenadas pela maior
        diferença absoluta.
      </caption>
      <thead role="rowgroup" className="cmp-table__head">
        <tr role="row">
          <th scope="col" role="columnheader" className="cmp-c-name">
            Categoria
          </th>
          <th scope="col" role="columnheader" className="cmp-c-base">
            {baseLabel}
          </th>
          <th scope="col" role="columnheader" className="cmp-c-compared">
            {comparedLabel}
          </th>
          <th scope="col" role="columnheader" className="cmp-c-diff">
            Diferença
          </th>
          <th scope="col" role="columnheader" className="cmp-c-var">
            Variação
          </th>
          <th scope="col" role="columnheader" className="cmp-c-bars">
            Comparação
          </th>
        </tr>
      </thead>
      <tbody role="rowgroup">
        {rows.map((row) => (
          <tr key={row.key} role="row">
            <th scope="row" role="rowheader" className="cmp-c-name">
              <span
                className="cmp-cat"
                title={row.name}
                style={{
                  color: row.color,
                  backgroundColor: `color-mix(in srgb, ${row.color} 18%, transparent)`,
                  borderColor: `color-mix(in srgb, ${row.color} 40%, transparent)`,
                }}
              >
                <span aria-hidden="true">{row.icon}</span>
                <span className="cmp-cat__name">{row.name}</span>
              </span>
            </th>
            <td role="cell" className="cmp-c-base">
              {centsToBRL(row.baseCents)}
            </td>
            <td role="cell" className="cmp-c-compared">
              {centsToBRL(row.comparedCents)}
            </td>
            <td role="cell" className="cmp-c-diff">
              <DiffCell delta={row.delta} />
            </td>
            <td role="cell" className="cmp-c-var">
              <VariationCell delta={row.delta} />
            </td>
            <td role="cell" className="cmp-c-bars">
              <span className="cmp-bars" aria-hidden="true">
                <span className="cmp-bars__track">
                  <span
                    className="cmp-bars__fill"
                    style={{
                      width: `${width(row.baseCents)}%`,
                      minWidth: row.baseCents > 0 ? 4 : 0,
                      background: BASE_BAR,
                    }}
                  />
                </span>
                <span className="cmp-bars__track">
                  <span
                    className="cmp-bars__fill"
                    style={{
                      width: `${width(row.comparedCents)}%`,
                      minWidth: row.comparedCents > 0 ? 4 : 0,
                      background: barColor(row.color),
                    }}
                  />
                </span>
              </span>
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot role="rowgroup">
        <tr role="row" className="cmp-table__total">
          <th scope="row" role="rowheader" className="cmp-c-name">
            Total
          </th>
          <td role="cell" className="cmp-c-base">
            {centsToBRL(totals.baseCents)}
          </td>
          <td role="cell" className="cmp-c-compared">
            {centsToBRL(totals.comparedCents)}
          </td>
          <td role="cell" className="cmp-c-diff">
            <DiffCell delta={totals.delta} />
          </td>
          <td role="cell" className="cmp-c-var">
            <VariationCell delta={totals.delta} />
          </td>
          <td role="cell" className="cmp-c-bars" />
        </tr>
        {subtotal && (
          <tr role="row" className="cmp-table__subtotal">
            <th scope="row" role="rowheader" className="cmp-c-name">
              Subtotal do filtro
            </th>
            <td role="cell" className="cmp-c-base">
              {centsToBRL(subtotal.baseCents)}
            </td>
            <td role="cell" className="cmp-c-compared">
              {centsToBRL(subtotal.comparedCents)}
            </td>
            <td role="cell" className="cmp-c-diff">
              <DiffCell delta={subtotal.delta} />
            </td>
            <td role="cell" className="cmp-c-var">
              <VariationCell delta={subtotal.delta} />
            </td>
            <td role="cell" className="cmp-c-bars" />
          </tr>
        )}
      </tfoot>
    </table>
  )
}
