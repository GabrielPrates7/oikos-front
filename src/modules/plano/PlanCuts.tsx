import { Scissors } from 'lucide-react'
import { centsToBRL } from '../../utils/currency'
import type { PlanSummary } from './plano.types'
import { PLAN_COLORS, SITUATION_LABELS, bpsToPercent, formatDayMonth } from './planoFormat'

// "Onde cortar": só aparece quando há buraco (gap_to_zero ou gap_to_cash_zero maior que 0). Mostra o
// total planejado em despesas supérfluas, as 5 maiores linhas e quanto do buraco isso cobre (em %,
// convertido dos pontos-base da API). Sem buraco: uma linha discreta, sem cards.
export function PlanCuts({ summary }: { summary: PlanSummary }) {
  const gapZero = summary.gap_to_zero
  const gapCash = summary.gap_to_cash_zero
  const cuts = summary.cut_suggestions

  if (gapZero <= 0 && gapCash <= 0) {
    return <p className="plano-cuts__none">Nenhum corte necessário neste mês.</p>
  }

  const coverageBps = gapZero > 0 ? cuts.covers_gap_to_zero_bps : cuts.covers_gap_to_cash_zero_bps
  return (
    <section className="plano-cuts" aria-labelledby="plano-cuts-title">
      <h2 id="plano-cuts-title" className="plano-cuts__title">
        <Scissors size={18} aria-hidden="true" />
        Onde cortar
      </h2>
      <p className="plano-cuts__lead">
        {gapZero > 0 && (
          <>
            Faltam <strong style={{ color: PLAN_COLORS.red }}>{centsToBRL(gapZero)}</strong> para o
            resultado do mês fechar em zero.{' '}
          </>
        )}
        {gapCash > 0 && (
          <>
            O caixa precisa de{' '}
            <strong style={{ color: PLAN_COLORS.red }}>{centsToBRL(gapCash)}</strong> a mais para
            não ficar negativo.
          </>
        )}
      </p>
      {cuts.total_cents === 0 ? (
        <p className="plano-cuts__empty">
          Não há despesas supérfluas no plano para cortar. Revise as essenciais ou antecipe
          entradas.
        </p>
      ) : (
        <>
          <p className="plano-cuts__summary">
            Despesas supérfluas no plano: <strong>{centsToBRL(cuts.total_cents)}</strong>
            {cuts.cuttable_cents !== cuts.total_cents && (
              <> (ainda dá para cortar {centsToBRL(cuts.cuttable_cents)})</>
            )}
            .
            {coverageBps !== null && (
              <> Cortar o que ainda dá cobre {bpsToPercent(coverageBps)}% do que falta.</>
            )}
          </p>
          <ol className="plano-cuts__list" aria-label="Maiores despesas supérfluas">
            {cuts.top.map((line) => (
              <li key={line.id}>
                <span className="plano-cuts__desc">{line.description}</span>
                <span className="plano-cuts__meta">
                  {line.planned_date ? formatDayMonth(line.planned_date) : 'sem data'} ·{' '}
                  {SITUATION_LABELS[line.situation]}
                </span>
                <span className="plano-cuts__amount">{centsToBRL(line.planned_amount_cents)}</span>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  )
}
