import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { centsToBRL } from '../../utils/currency'
import type { PlanSummary } from './plano.types'
import { PLAN_COLORS, formatDayMonth, healthColor, healthSentences } from './planoFormat'
import './PlanHealthCard.css'

interface PlanHealthCardProps {
  summary: PlanSummary
}

// Semáforo do plano (calculado no servidor; aqui só se traduzem os códigos em texto). A cor NUNCA é
// o único sinal: há ícone (check, alerta, X) e frase. Ao lado, o "Caixa projetado" com o menor
// saldo do mês. Não é renderizado com level 'none' (plano vazio): a tela mostra o guia no lugar.
export function PlanHealthCard({ summary }: PlanHealthCardProps) {
  const { health, planned, settings } = summary
  const color = healthColor(health.level)
  const { headline, details } = healthSentences(summary)
  const Icon =
    health.level === 'green' ? CheckCircle2 : health.level === 'amber' ? AlertTriangle : XCircle
  const projectedNegative = planned.projected_end_balance < 0
  const withOpening = settings.include_opening_balance

  return (
    <div className="plan-health">
      <section
        className={`plan-health__main plan-health__main--${health.level}`}
        aria-label="Resultado planejado"
      >
        <span className="plan-health__label">Resultado planejado</span>
        <span className="plan-health__value" style={{ color }}>
          {centsToBRL(planned.result)}
        </span>
        <p className="plan-health__headline" style={{ color }}>
          <Icon size={18} aria-hidden="true" />
          <span>{headline}</span>
        </p>
        {details.map((line) => (
          <p key={line} className="plan-health__detail">
            {line}
          </p>
        ))}
        <p className="plan-health__hint">Não inclui saldo: só entradas menos saídas do mês.</p>
      </section>

      <section className="plan-health__side" aria-label="Caixa projetado">
        <span className="plan-health__label">
          {withOpening ? 'Caixa projetado' : 'Resultado acumulado (sem abertura)'}
        </span>
        <span
          className="plan-health__side-value"
          style={{ color: projectedNegative ? PLAN_COLORS.red : undefined }}
        >
          {centsToBRL(planned.projected_end_balance)}
        </span>
        <p className="plan-health__detail">
          {withOpening
            ? 'No fim do mês, com o saldo de abertura.'
            : 'No fim do mês, só o resultado do plano.'}
        </p>
        <p
          className="plan-health__min"
          style={{ color: planned.min_balance.cents < 0 ? PLAN_COLORS.red : undefined }}
        >
          Menor saldo {centsToBRL(planned.min_balance.cents)} em{' '}
          {formatDayMonth(planned.min_balance.date)}
        </p>
      </section>
    </div>
  )
}
