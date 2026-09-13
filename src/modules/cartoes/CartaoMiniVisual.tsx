import { Wifi } from 'lucide-react'
import { getBankColor } from '../../utils/bankColors'
import { centsToBRL } from '../../utils/currency'
import './CartaoMiniVisual.css'

// Alinhado ao relatório técnico-matemático do dashboard: amarelo a partir de 70% do limite
// usado, vermelho a partir de 85% (não 100% — o alerta é sobre aproximar do limite, não só
// sobre estourar).
const WARNING_THRESHOLD = 70
const DANGER_THRESHOLD = 85

function usageLevel(usedPercent: number): 'ok' | 'warning' | 'danger' {
  if (usedPercent >= DANGER_THRESHOLD) return 'danger'
  if (usedPercent >= WARNING_THRESHOLD) return 'warning'
  return 'ok'
}

interface CartaoMiniVisualProps {
  name: string
  creditLimitCents: number
  availableLimitCents: number
}

// Versão compacta do CartaoVisual pro widget de Cartões do Dashboard — mesmo gradiente na
// cor do banco (getBankColor), mesmos elementos de "cartão físico" (chip, contactless,
// wordmark, cartão decorativo por trás), só num tamanho menor e sem os detalhes que só
// fazem sentido na tela de Cartões/detalhe (bandeira, "usado de X").
export function CartaoMiniVisual({
  name,
  creditLimitCents,
  availableLimitCents,
}: CartaoMiniVisualProps) {
  const { base, muted } = getBankColor(name)
  const usedCents = Math.max(0, creditLimitCents - availableLimitCents)
  const usedPercent = creditLimitCents > 0 ? (usedCents / creditLimitCents) * 100 : 0
  const barPercent = Math.min(100, usedPercent)
  const level = usageLevel(usedPercent)
  const cardGradient = `linear-gradient(135deg, ${base}, ${muted})`

  return (
    <div className="cartao-mini-visual-wrap">
      {/* Cartão "de trás" puramente decorativo — só profundidade visual, mesma ideia do
          CartaoVisual de tela cheia. */}
      <div className="cartao-mini-visual__stack" aria-hidden="true" style={{ background: cardGradient }} />
      <div className="cartao-mini-visual" style={{ background: cardGradient }}>
        <div className="cartao-mini-visual__header">
          <span className="cartao-mini-visual__logo">{name}</span>
          <Wifi className="cartao-mini-visual__contactless" size={16} aria-hidden="true" />
        </div>
        <div className="cartao-mini-visual__chip" aria-hidden="true">
          <div className="cartao-mini-visual__chip-lines" />
        </div>
        {/* Fundo escuro/neutro independente da cor do cartão — sem isso, um cartão colorido
            (ex: PicPay verde) deixa a barra de aviso terracota com contraste ruim (~2:1
            WCAG), porque ela fica flutuando direto sobre o gradiente em vez de sobre um
            canal neutro. */}
        <div className="cartao-mini-visual__progress">
          <div
            className="cartao-mini-visual__bar-track"
            role="progressbar"
            aria-valuenow={Math.round(usedPercent)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${Math.round(usedPercent)}% do limite usado`}
          >
            <div
              className={`cartao-mini-visual__bar-fill cartao-mini-visual__bar-fill--${level}`}
              style={{ width: `${barPercent}%` }}
            />
          </div>
        </div>
        <span className="cartao-mini-visual__available">
          {centsToBRL(availableLimitCents)} disponível
        </span>
      </div>
    </div>
  )
}
