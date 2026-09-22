import { InfoTip } from '../../components/ui/InfoTip'
import { centsToBRL } from '../../utils/currency'
import type { CategoryRow, CategoryStatus, PlanSummary } from './plano.types'
import { PLAN_COLORS } from './planoFormat'

const STATUS_LABELS: Record<CategoryStatus, string> = {
  ok: 'No plano',
  attention: 'Atenção',
  over: 'Estourou',
  unplanned: 'Não planejado',
  no_plan: 'Sem plano',
}

function signedBRL(cents: number): string {
  if (cents === 0) return centsToBRL(0)
  return `${cents > 0 ? '+' : '−'}${centsToBRL(Math.abs(cents))}`
}

// Larguras das barras: proporção entre os valores (só escala visual; os números vêm da API).
function barWidth(cents: number, scaleMax: number): number {
  if (cents <= 0 || scaleMax <= 0) return 0
  return Math.max(2, Math.min(100, (cents / scaleMax) * 100))
}

function Row({ row, scaleMax }: { row: CategoryRow; scaleMax: number }) {
  const varianceColor =
    row.variance > 0 ? PLAN_COLORS.red : row.variance < 0 ? PLAN_COLORS.green : undefined
  return (
    <tr className="plano-cat__row">
      <th scope="row" className="plano-cat__name">
        <span aria-hidden="true">{row.icon ?? '📁'}</span>
        <span className="plano-cat__label">{row.name}</span>
        {row.invoice_month_mismatch && (
          <span
            className="plano-cat__mismatch"
            title="Há fatura desta categoria incluída no plano cujo mês de referência é outro. O realizado desta tabela conta as parcelas no mês da fatura, então pode não bater com o planejado."
          >
            fatura em outro mês
          </span>
        )}
      </th>
      <td className="plano-cat__planned" data-label="Planejado">
        {centsToBRL(row.planned)}
      </td>
      <td className="plano-cat__bars" data-label="Realizado">
        <span className="plano-cat__pair" aria-hidden="true">
          <span
            className="plano-cat__bar plano-cat__bar--planned"
            style={{ width: `${barWidth(row.planned, scaleMax)}%` }}
          />
          <span
            className={`plano-cat__bar plano-cat__bar--realized plano-cat__bar--${row.status}`}
            style={{ width: `${barWidth(row.realized, scaleMax)}%` }}
          />
        </span>
        <span className="plano-cat__realized">
          {centsToBRL(row.realized)}
          {row.percent_used !== null && (
            <span className="plano-cat__percent"> ({row.percent_used}%)</span>
          )}
        </span>
      </td>
      <td className="plano-cat__variance" data-label="Variação" style={{ color: varianceColor }}>
        {signedBRL(row.variance)}
      </td>
      <td data-label="Situação">
        <span className={`plano-status plano-status--${row.status}`}>
          {STATUS_LABELS[row.status]}
        </span>
      </td>
    </tr>
  )
}

// "Por categoria (competência)": planejado (linhas do plano e parcelas das faturas incluídas) x
// realizado com a MESMA base de Orçamentos. Barras pareadas (planejado translúcido, realizado sólido)
// dentro de uma tabela com variação e situação. Lê o summary já carregado.
export function PlanByCategory({ summary }: { summary: PlanSummary }) {
  const rows = summary.by_category
  const scaleMax = Math.max(0, ...rows.flatMap((row) => [row.planned, row.realized]))
  return (
    <div>
      <div className="plano-cat__intro">
        <span className="plano-cat__basis">por categoria (competência)</span>
        <InfoTip label="O que é a base por categoria (competência)?">
          <ol>
            <li>A base é a mesma de Orçamentos.</li>
            <li>Conta as despesas diretas do mês e as parcelas de cartão no mês da fatura.</li>
            <li>Por isso difere do caixa dos totais, que segue a data do pagamento.</li>
          </ol>
        </InfoTip>
      </div>
      {rows.length === 0 ? (
        <p className="plano-chart__note">Nenhuma categoria com plano ou gasto neste mês.</p>
      ) : (
        <table className="plano-cat">
          <caption className="sr-only">Planejado x realizado por categoria (competência)</caption>
          <thead>
            <tr>
              <th scope="col">Categoria</th>
              <th scope="col">Planejado</th>
              <th scope="col">Realizado</th>
              <th scope="col">Variação</th>
              <th scope="col">Situação</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Row key={row.category_id} row={row} scaleMax={scaleMax} />
            ))}
          </tbody>
        </table>
      )}
      <ul className="plano-legend" aria-label="Legenda">
        <li>
          <span className="plano-legend__swatch plano-legend__swatch--planned" aria-hidden="true" />
          Planejado
        </li>
        <li>
          <span
            className="plano-legend__swatch plano-legend__swatch--realized"
            aria-hidden="true"
          />
          Realizado
        </li>
        <li>Variação = realizado − planejado</li>
      </ul>
    </div>
  )
}
