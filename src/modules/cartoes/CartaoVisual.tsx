import { getBankColor } from '../../utils/bankColors'
import { centsToBRL } from '../../utils/currency'
import type { CreditCard } from './cartoes.types'
import './CartaoVisual.css'

interface CartaoVisualProps {
  card: CreditCard
  size?: 'compact' | 'large'
}

// A partir de 70% de uso a barra fica na cor de despesa — mesmo padrão de aviso antecipado
// já usado em OrcamentosList.
const WARNING_THRESHOLD = 70

// Não existe bank_name em cartão (só em conta) — o nome do cartão já É o nome do banco na
// prática (usuário nomeia o cartão como "Nubank", "PicPay" etc.), então usamos card.name
// direto pra cor e pro rótulo, sem duplicar a mesma informação em duas linhas.
export function CartaoVisual({ card, size = 'compact' }: CartaoVisualProps) {
  const { base, muted } = getBankColor(card.name)
  const usedCents = Math.max(0, card.credit_limit_cents - card.availableLimitCents)
  const usedPercent =
    card.credit_limit_cents > 0 ? (usedCents / card.credit_limit_cents) * 100 : 0
  const barPercent = Math.min(100, usedPercent)
  const isWarning = usedPercent >= WARNING_THRESHOLD
  const roundedPercent = Math.round(usedPercent)

  return (
    <div className={`cartao-visual cartao-visual--${size}`}>
      <div
        className="cartao-visual__card"
        style={{ background: `linear-gradient(135deg, ${base}, ${muted})` }}
      >
        <div className="cartao-visual__top">
          <span className="cartao-visual__name">{card.name}</span>
          {card.status === 'archived' && (
            <span className="cartao-visual__archived-badge">Arquivado</span>
          )}
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
            className={`cartao-visual__bar-fill${isWarning ? ' cartao-visual__bar-fill--warning' : ''}`}
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
