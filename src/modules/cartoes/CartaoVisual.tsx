import { Wifi } from 'lucide-react'
import { getBankColor } from '../../utils/bankColors'
import { centsToBRL } from '../../utils/currency'
import type { CreditCard } from './cartoes.types'
import './CartaoVisual.css'

interface CartaoVisualProps {
  card: CreditCard
  size?: 'compact' | 'large'
}

// Alinhado ao relatório técnico-matemático do dashboard e ao mesmo esquema de
// CartaoMiniVisual (o widget compacto do Dashboard) — os dois tinham threshold duplicado e
// tinham ficado dessincronizados (aqui só 2 níveis, lá 3): amarelo a partir de 70% do
// limite usado, vermelho a partir de 85%.
const WARNING_THRESHOLD = 70
const DANGER_THRESHOLD = 85

function usageLevel(usedPercent: number): 'ok' | 'warning' | 'danger' {
  if (usedPercent >= DANGER_THRESHOLD) return 'danger'
  if (usedPercent >= WARNING_THRESHOLD) return 'warning'
  return 'ok'
}

// Não existe bank_name em cartão (só em conta) — o nome do cartão já É o nome do banco na
// prática (usuário nomeia o cartão como "Nubank", "PicPay" etc.), então usamos card.name
// direto pra cor e pro rótulo, sem duplicar a mesma informação em duas linhas.
export function CartaoVisual({ card, size = 'compact' }: CartaoVisualProps) {
  const { base, muted } = getBankColor(card.name)
  const usedCents = Math.max(0, card.credit_limit_cents - card.availableLimitCents)
  const usedPercent =
    card.credit_limit_cents > 0 ? (usedCents / card.credit_limit_cents) * 100 : 0
  const barPercent = Math.min(100, usedPercent)
  const level = usageLevel(usedPercent)
  const roundedPercent = Math.round(usedPercent)
  const cardGradient = `linear-gradient(135deg, ${base}, ${muted})`

  return (
    <div className={`cartao-visual cartao-visual--${size}`}>
      {/* Cartão "de trás" puramente decorativo — mesmo gradiente do cartão real, girado e
          deslocado por baixo, pra dar a profundidade de pilha de cartões da imagem de
          referência (não representa um cartão de verdade, só CSS). */}
      <div className="cartao-visual__stack" aria-hidden="true" style={{ background: cardGradient }} />
      <div className="cartao-visual__card" style={{ background: cardGradient }}>
        <div className="cartao-visual__header">
          {card.status === 'archived' ? (
            <span className="cartao-visual__archived-badge">Arquivado</span>
          ) : (
            <span />
          )}
          <span className="cartao-visual__logo">{card.name}</span>
        </div>

        <div className="cartao-visual__chip-row">
          <div className="cartao-visual__chip" aria-hidden="true">
            <div className="cartao-visual__chip-lines" />
          </div>
          <Wifi className="cartao-visual__contactless" size={20} aria-hidden="true" />
        </div>

        <span className="cartao-visual__brand">{card.brand ?? 'Sem bandeira'}</span>
      </div>

      <div className="cartao-visual__progress">
        <div
          className="cartao-visual__bar-track"
          role="progressbar"
          aria-valuenow={roundedPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${roundedPercent}% do limite usado`}
        >
          <div
            className={`cartao-visual__bar-fill cartao-visual__bar-fill--${level}`}
            style={{ width: `${barPercent}%` }}
          />
        </div>
        <div className="cartao-visual__amounts">
          <span>
            {centsToBRL(usedCents)} usado de {centsToBRL(card.credit_limit_cents)}
          </span>
          <span>{centsToBRL(card.availableLimitCents)} disponível</span>
        </div>
      </div>
    </div>
  )
}
