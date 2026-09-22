import { ArrowDownRight, ArrowUpRight, Landmark, Scale } from 'lucide-react'
import { InfoTip } from '../../components/ui/InfoTip'
import { GlassStatCards } from '../../components/ui/GlassStatCards'
import { centsToBRL } from '../../utils/currency'
import type { PlanSummary } from './plano.types'
import { PLAN_COLORS, bpsToPercent } from './planoFormat'
import './PlanKpis.css'

interface PlanKpisProps {
  summary: PlanSummary
}

function Progress({ label, bps, detail }: { label: string; bps: number; detail: string }) {
  // Só apresentação: os pontos-base vêm do servidor; aqui viram % para exibir e para a largura.
  const percent = bpsToPercent(bps)
  return (
    <div className="plan-kpi__progress">
      <div
        className="plan-kpi__bar"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(percent, 100)}
        aria-valuetext={`${percent}%`}
      >
        <div className="plan-kpi__bar-fill" style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
      <span className="plan-kpi__progress-text">
        {detail} ({percent}%)
      </span>
    </div>
  )
}

// Quatro KPIs em vidro (GlassStatCards): Fraunces nos valores, tabular-nums. Todos os números vêm
// do summary; o "Resultado realizado" explica, em um "?", por que difere do Lucro do Dashboard.
export function PlanKpis({ summary }: PlanKpisProps) {
  const { planned, realized, today_balance, opening_balance } = summary
  return (
    <GlassStatCards
      items={[
        {
          label: 'Entradas planejadas',
          valueCents: planned.inflow,
          icon: <ArrowUpRight size={16} />,
          iconColor: PLAN_COLORS.green,
          footer: (
            <Progress
              label="Recebido em relação ao planejado"
              bps={realized.progress.received_bps}
              detail={`Recebido ${centsToBRL(realized.received)}`}
            />
          ),
        },
        {
          label: 'Saídas planejadas',
          valueCents: planned.outflow,
          icon: <ArrowDownRight size={16} />,
          iconColor: PLAN_COLORS.red,
          footer: (
            <Progress
              label="Pago em relação ao planejado"
              bps={realized.progress.paid_bps}
              detail={`Pago ${centsToBRL(realized.paid)}`}
            />
          ),
        },
        {
          label: 'Resultado realizado (caixa)',
          valueCents: realized.result,
          valueColor: realized.result < 0 ? PLAN_COLORS.red : undefined,
          icon: <Scale size={16} />,
          iconColor: 'var(--color-accent-bright)',
          labelAccessory: (
            <InfoTip label="Por que difere do Lucro do Dashboard?">
              <ol>
                <li>usa a data do pagamento ou do recebimento;</li>
                <li>só conta o que já foi recebido ou pago;</li>
                <li>só vai até hoje;</li>
                <li>mostra os aportes em metas à parte.</li>
              </ol>
            </InfoTip>
          ),
          footer: (
            <span className="plan-kpi__note">
              Aportes em metas: {centsToBRL(realized.other_outflows)}
            </span>
          ),
        },
        {
          label: 'Saldo hoje',
          valueCents: today_balance,
          valueColor: today_balance < 0 ? PLAN_COLORS.red : undefined,
          icon: <Landmark size={16} />,
          iconColor: 'var(--color-accent-info)',
          footer: (
            <span className="plan-kpi__note">Abertura do mês {centsToBRL(opening_balance)}</span>
          ),
        },
      ]}
    />
  )
}
