import { Nfc } from 'lucide-react'
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
  // Ver comentário equivalente em CartaoVisual.tsx — mesma prop, mesmo motivo.
  hasContactless?: boolean
}

// Versão compacta do CartaoVisual pro widget de Cartões do Dashboard — mesmo gradiente na
// cor do banco (getBankColor), mesmos elementos de "cartão físico" (chip, contactless,
// wordmark, selo de bandeira genérico), só num tamanho menor e sem os detalhes que só fazem
// sentido na tela de Cartões/detalhe (bandeira por extenso, "usado de X").
//
// Arquitetura de DUAS CAMADAS dentro do contêiner relativo (.wrap):
// - Camada 1 (.card): o retângulo colorido do cartão, absolute, MENOR que o wrap (margem
//   nos 4 lados) e inclinado (transform:rotate) — a margem é o que garante que a rotação
//   não empurre nenhum canto pra fora do wrap (ver cálculo geométrico no CSS).
// - Camada 2 (.footer): o "bolso" de vidro (glassmorphism) com a barra e o saldo, absolute,
//   colado no bottom:0, width:100% (mais largo que o cartão inclinado), SEM rotação —
//   fica sempre horizontal, por cima da Camada 1, com backdrop-filter borrando o que
//   está atrás dela (incluindo o selo de bandeira, que mora dentro da Camada 1).
export function CartaoMiniVisual({
  name,
  creditLimitCents,
  availableLimitCents,
  hasContactless = true,
}: CartaoMiniVisualProps) {
  const { base, muted } = getBankColor(name)
  const usedCents = Math.max(0, creditLimitCents - availableLimitCents)
  const usedPercent = creditLimitCents > 0 ? (usedCents / creditLimitCents) * 100 : 0
  const barPercent = Math.min(100, usedPercent)
  const level = usageLevel(usedPercent)
  const cardGradient = `linear-gradient(135deg, ${base}, ${muted})`
  // Selo de bandeira genérico (dois círculos sobrepostos, não uma marca real) — pedido
  // explícito de simetria visual: agora aparece em Nubank E PicPay (antes só Nubank).
  const bankKey = name.trim().toLowerCase()
  const showBadge = bankKey === 'nubank' || bankKey === 'picpay'

  return (
    <div className="cartao-mini-visual-wrap">
      {/* CAMADA 1 — cartão colorido, inclinado (ver CSS: margem + rotate). */}
      <div className="cartao-mini-visual__card" style={{ background: cardGradient }}>
        <div className="cartao-mini-visual__top-row">
          <div className="cartao-mini-visual__chip" aria-hidden="true">
            <div className="cartao-mini-visual__chip-lines" />
          </div>
          {hasContactless && (
            <Nfc className="cartao-mini-visual__contactless" size={18} aria-hidden="true" />
          )}
          {/* Nome real do cartão (dado do próprio usuário, ex: como ele nomeou o cartão no
              banco dele) — não é um logo/fonte de marca copiado, é texto simples numa
              tipografia genérica em itálico. Trocar por um nome fixo tipo "PurpleBank"
              mostraria uma informação ERRADA sobre o cartão de verdade do usuário, então
              mantive o dado real aqui (ver observação na resposta). */}
          <span className="cartao-mini-visual__logo">{name}</span>
        </div>

        {/* Selo de bandeira genérico — canto inferior direito da Camada 1, posicionado de
            propósito pra cair dentro da faixa que a Camada 2 (vidro) cobre por cima, então
            o backdrop-filter borra ele naturalmente (ver CSS). Nenhum blur é aplicado
            diretamente aqui. */}
        {showBadge && (
          <div className="cartao-mini-visual__badge" aria-hidden="true">
            <span className="cartao-mini-visual__badge-circle cartao-mini-visual__badge-circle--red" />
            <span className="cartao-mini-visual__badge-circle cartao-mini-visual__badge-circle--orange" />
          </div>
        )}
      </div>

      {/* CAMADA 2 — "bolso" de vidro: bottom:0, width:100%, sem rotação, backdrop-filter
          desfocando a Camada 1 por trás (ver CSS). */}
      <div className="cartao-mini-visual__footer">
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
        <span className="cartao-mini-visual__available">
          {centsToBRL(availableLimitCents)} disponível
        </span>
      </div>
    </div>
  )
}
