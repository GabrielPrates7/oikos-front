import { BarChart3, CheckCircle2, Coins, Landmark, TrendingDown, TrendingUp, Vault, Wallet } from 'lucide-react'
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

// 7 cards na mesma fileira, seguindo a imagem de referência do redesign: Saldo Real e
// Entradas são valores "base" (sem percentual, nada pra comparar); os outros cinco vêm
// com um percentual relativo às entradas do mês (ou ao saldo, no caso de Patrimônio
// Líquido — ver comentário em dashboard.service) e uma barrinha de progresso.
export function SummaryCards({ summary }: SummaryCardsProps) {
  const lucroPositivo = summary.lucroCents >= 0
  const LucroIcon = lucroPositivo ? TrendingUp : TrendingDown

  return (
    <div className="summary-cards">
      <div className="summary-cards__stat-card summary-cards__stat-card--saldo">
        <div className="summary-cards__stat-icon">
          <Landmark size={18} aria-hidden="true" />
        </div>
        <span className="summary-cards__stat-label">Saldo Real</span>
        <span className="summary-cards__stat-value">{centsToBRL(summary.totalBalanceCents)}</span>
      </div>

      <div className="summary-cards__stat-card summary-cards__stat-card--entradas">
        <div className="summary-cards__stat-icon">
          <Vault size={18} aria-hidden="true" />
        </div>
        <span className="summary-cards__stat-label">Entradas</span>
        <span className="summary-cards__stat-value">{centsToBRL(summary.totals.incomeCents)}</span>
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

      <div
        className={`summary-cards__stat-card ${lucroPositivo ? 'summary-cards__stat-card--lucro-positivo' : 'summary-cards__stat-card--lucro-negativo'}`}
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

      <div className="summary-cards__stat-card summary-cards__stat-card--falta-pagar">
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
