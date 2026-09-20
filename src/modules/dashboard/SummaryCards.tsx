import { BarChart3, CheckCircle2, Coins, Landmark, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { centsToBRL } from '../../utils/currency'
import type { DashboardSummary } from './dashboard.types'
import './SummaryCards.css'

interface SummaryCardsProps {
  summary: DashboardSummary
}

// Barra de progresso sempre clampada em 0-100% pro preenchimento visual — o percentual em
// texto ao lado pode passar de 100% ou ser negativo (ex: Já pago 104%, Lucro -4%), só a
// largura da barra em si não.
function clampBarWidth(percent: number): number {
  return Math.max(0, Math.min(100, percent))
}

// 6 cards (não mais 7) — "Entradas" saiu: é insumo de cálculo de outros cards (Lucro,
// Falta Pagar, Taxa de Poupança), não uma métrica que alguém consulta isolada. Dos 6
// restantes, 3 ganham destaque em vidro fosco (mesmo tratamento validado nos cartões de
// crédito — backdrop-filter + borda clara sutil): Saldo Real (a métrica mais consultada,
// por isso também maior e menos "engaiolada" que os outros dois — ver .stat-card--hero),
// Lucro e Falta Pagar. Já Pago, Patrimônio Líquido e Taxa de Poupança continuam no
// tratamento padrão (fundo sólido tingido), sem o destaque extra — ver SummaryCards.css
// pra a estrutura de grid que acomoda os dois grupos.
export function SummaryCards({ summary }: SummaryCardsProps) {
  const lucroPositivo = summary.lucroCents >= 0
  const LucroIcon = lucroPositivo ? TrendingUp : TrendingDown

  return (
    <div className="summary-cards">
      <div className="summary-cards__stat-card summary-cards__stat-card--hero summary-cards__stat-card--saldo">
        <div className="summary-cards__stat-icon">
          <Landmark size={28} aria-hidden="true" />
        </div>
        <div className="summary-cards__hero-body">
          <span className="summary-cards__stat-label">Saldo Real</span>
          <span className="summary-cards__stat-value summary-cards__stat-value--hero">
            {centsToBRL(summary.totalBalanceCents)}
          </span>
        </div>
      </div>

      <div
        className={`summary-cards__stat-card summary-cards__stat-card--glass ${lucroPositivo ? 'summary-cards__stat-card--lucro-positivo' : 'summary-cards__stat-card--lucro-negativo'}`}
      >
        <div className="summary-cards__stat-icon">
          <LucroIcon size={18} aria-hidden="true" />
        </div>
        <span className="summary-cards__stat-label">Lucro</span>
        <span className="summary-cards__stat-value">{centsToBRL(summary.lucroCents)}</span>
        <span className="summary-cards__stat-sub summary-cards__stat-sub--inline-icon">
          Margem: ≈{summary.lucroMargemPercent}%
          <LucroIcon size={12} aria-hidden="true" />
        </span>
        <div className="summary-cards__stat-bar-track">
          <div
            className="summary-cards__stat-bar-fill"
            style={{ width: `${clampBarWidth(summary.lucroMargemPercent)}%` }}
          />
        </div>
        {/* Lucro (caixa: entradas - Já Pago) e o Resultado de Evolução Mensal (entradas -
            despesas categorizadas, inclui pendentes) partem de bases de despesa diferentes
            de propósito — ver decisão registrada no backlog do documento técnico. Essa
            legenda existe só pra deixar isso visível, não pra mudar o cálculo. */}
        <span className="summary-cards__stat-caption">
          Baseado em despesas pagas, inclui fatura de cartão
        </span>
      </div>

      <div className="summary-cards__stat-card summary-cards__stat-card--glass summary-cards__stat-card--falta-pagar">
        <div className="summary-cards__stat-icon">
          <Wallet size={18} aria-hidden="true" />
        </div>
        <span className="summary-cards__stat-label">Falta Pagar</span>
        <span className="summary-cards__stat-value">{centsToBRL(summary.faltaPagarCents)}</span>
        <span className="summary-cards__stat-sub">≈{summary.faltaPagarPercent}%</span>
        <div className="summary-cards__stat-bar-track">
          <div
            className="summary-cards__stat-bar-fill"
            style={{ width: `${clampBarWidth(summary.faltaPagarPercent)}%` }}
          />
        </div>
      </div>

      <div className="summary-cards__stat-card summary-cards__stat-card--ja-pago">
        <div className="summary-cards__stat-icon">
          <CheckCircle2 size={18} aria-hidden="true" />
        </div>
        <span className="summary-cards__stat-label">Já Pago</span>
        <span className="summary-cards__stat-value">{centsToBRL(summary.jaPagoCents)}</span>
        <span className="summary-cards__stat-sub">≈{summary.jaPagoPercent}%</span>
        <div className="summary-cards__stat-bar-track">
          <div
            className="summary-cards__stat-bar-fill"
            style={{ width: `${clampBarWidth(summary.jaPagoPercent)}%` }}
          />
        </div>
      </div>

      <div className="summary-cards__stat-card summary-cards__stat-card--patrimonio">
        <div className="summary-cards__stat-icon">
          <BarChart3 size={18} aria-hidden="true" />
        </div>
        <span className="summary-cards__stat-label">Patrimônio Líquido</span>
        <span className="summary-cards__stat-value">
          {centsToBRL(summary.patrimonioLiquidoCents)}
        </span>
        <span className="summary-cards__stat-sub">≈{summary.patrimonioLiquidoPercent}%</span>
        <div className="summary-cards__stat-bar-track">
          <div
            className="summary-cards__stat-bar-fill"
            style={{ width: `${clampBarWidth(summary.patrimonioLiquidoPercent)}%` }}
          />
        </div>
        {/* Escopo reduzido de propósito por enquanto — ver item de backlog no documento
            técnico (não modela investimentos nem empréstimo com saldo devedor, só
            saldo real - dívida em aberto de cartão). */}
        <span className="summary-cards__stat-caption">
          Saldo e faturas de cartão, sem investimentos ou financiamentos
        </span>
      </div>

      <div className="summary-cards__stat-card summary-cards__stat-card--poupanca">
        <div className="summary-cards__stat-icon">
          <Coins size={18} aria-hidden="true" />
        </div>
        <span className="summary-cards__stat-label">Taxa de Poupança</span>
        <span className="summary-cards__stat-value">{centsToBRL(summary.poupancaCents)}</span>
        <span className="summary-cards__stat-sub">≈{summary.taxaPoupancaPercent}%</span>
        <div className="summary-cards__stat-bar-track">
          <div
            className="summary-cards__stat-bar-fill"
            style={{ width: `${clampBarWidth(summary.taxaPoupancaPercent)}%` }}
          />
        </div>
        {/* Escopo mais amplo que o pretendido de propósito por enquanto — ver item de
            backlog no documento técnico (soma aporte de QUALQUER meta, não só metas de
            investimento, porque financial_goals não distingue o propósito da meta). */}
        <span className="summary-cards__stat-caption">
          Inclui todas as metas, não só investimentos
        </span>
      </div>
    </div>
  )
}
