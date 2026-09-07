import { getBankColor } from '../../utils/bankColors'
import { centsToBRL } from '../../utils/currency'
import './CartaoMiniVisual.css'

const WARNING_THRESHOLD = 70

interface CartaoMiniVisualProps {
  name: string
  creditLimitCents: number
  availableLimitCents: number
}

// Versão compacta do CartaoVisual pro widget de Cartões do Dashboard — mesmo gradiente na
// cor do banco (getBankColor), mas sem o tamanho de cartão de tela cheia nem os detalhes
// (bandeira, "usado de X") que fazem sentido só na tela de Cartões/detalhe.
export function CartaoMiniVisual({
  name,
  creditLimitCents,
  availableLimitCents,
}: CartaoMiniVisualProps) {
  const { base, muted } = getBankColor(name)
  const usedCents = Math.max(0, creditLimitCents - availableLimitCents)
  const usedPercent = creditLimitCents > 0 ? (usedCents / creditLimitCents) * 100 : 0
  const barPercent = Math.min(100, usedPercent)
  const isWarning = usedPercent >= WARNING_THRESHOLD

  return (
    <div
      className="cartao-mini-visual"
      style={{ background: `linear-gradient(135deg, ${base}, ${muted})` }}
    >
      <span className="cartao-mini-visual__name">{name}</span>
      <div
        className="cartao-mini-visual__bar-track"
        role="progressbar"
        aria-valuenow={Math.round(usedPercent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${Math.round(usedPercent)}% do limite usado`}
      >
        <div
          className={`cartao-mini-visual__bar-fill${isWarning ? ' cartao-mini-visual__bar-fill--warning' : ''}`}
          style={{ width: `${barPercent}%` }}
        />
      </div>
      <span className="cartao-mini-visual__available">
        {centsToBRL(availableLimitCents)} disponível
      </span>
    </div>
  )
}
