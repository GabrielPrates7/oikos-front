import { Nfc } from 'lucide-react'
import { getBankColor } from '../../utils/bankColors'
import { centsToBRL } from '../../utils/currency'
import type { CreditCard } from './cartoes.types'
import './CartaoVisual.css'

interface CartaoVisualProps {
  card: CreditCard
  size?: 'compact' | 'large'
  // Na imagem de referência só o Nubank mostra o símbolo de contactless (PicPay não) — não
  // dá pra saber se é intencional ou só artefato do mockup, então fica como prop (default
  // true) em vez de hardcoded por nome aqui dentro, pra ligar/desligar por cartão depois
  // ser trivial. Quem decide o valor hoje é o componente que chama (ver CartaoDetalhePage).
  hasContactless?: boolean
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
//
// Arquitetura de DUAS CAMADAS dentro do contêiner relativo (.cartao-visual) — ver comentário
// completo em CartaoMiniVisual.tsx:
// - Camada 1 (.card-surface): retângulo colorido, absolute, MENOR que o contêiner e
//   inclinado (transform:rotate).
// - Camada 2 (.footer): "bolso" de vidro com barra e saldo, absolute, bottom:0,
//   width:100%, sem rotação, com backdrop-filter borrando a Camada 1 por trás.
export function CartaoVisual({ card, size = 'compact', hasContactless = true }: CartaoVisualProps) {
  const { base, muted } = getBankColor(card.name)
  const usedCents = Math.max(0, card.credit_limit_cents - card.availableLimitCents)
  const usedPercent =
    card.credit_limit_cents > 0 ? (usedCents / card.credit_limit_cents) * 100 : 0
  const barPercent = Math.min(100, usedPercent)
  const level = usageLevel(usedPercent)
  const roundedPercent = Math.round(usedPercent)
  const cardGradient = `linear-gradient(135deg, ${base}, ${muted})`
  // Selo de bandeira genérico (dois círculos sobrepostos, não uma marca real) — pedido
  // explícito de simetria visual: agora aparece em Nubank E PicPay (antes só Nubank).
  const bankKey = card.name.trim().toLowerCase()
  const showBadge = bankKey === 'nubank' || bankKey === 'picpay'

  return (
    <div className={`cartao-visual cartao-visual--${size}`}>
      {/* CAMADA 1 — cartão colorido, inclinado (ver CSS: margem + rotate). */}
      <div className="cartao-visual__card-surface" style={{ background: cardGradient }}>
        <div className="cartao-visual__top-row">
          <div className="cartao-visual__chip" aria-hidden="true">
            <div className="cartao-visual__chip-lines" />
          </div>
          {hasContactless && (
            <Nfc className="cartao-visual__contactless" size={26} aria-hidden="true" />
          )}
          <div className="cartao-visual__top-row-right">
            {card.status === 'archived' && (
              <span className="cartao-visual__archived-badge">Arquivado</span>
            )}
            {/* Nome real do cartão (dado do usuário) — ver observação equivalente em
                CartaoMiniVisual.tsx: não é logo/fonte de marca copiado, é texto simples. */}
            <span className="cartao-visual__logo">{card.name}</span>
          </div>
        </div>

        <span className="cartao-visual__brand">{card.brand ?? 'Sem bandeira'}</span>

        {/* Selo de bandeira genérico — canto inferior direito da Camada 1, dentro da faixa
            que a Camada 2 (vidro) cobre por cima, pra o backdrop-filter borrar ele. Sem
            blur próprio (ver CSS). */}
        {showBadge && (
          <div className="cartao-visual__badge" aria-hidden="true">
            <span className="cartao-visual__badge-circle cartao-visual__badge-circle--red" />
            <span className="cartao-visual__badge-circle cartao-visual__badge-circle--orange" />
          </div>
        )}
      </div>

      {/* CAMADA 2 — "bolso" de vidro: bottom:0, width:100%, sem rotação (ver CSS). */}
      <div className="cartao-visual__footer">
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
